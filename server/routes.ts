import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./auth";
import {
  insertStudentSchema, insertTeacherSchema, insertCourseSchema,
  insertMarkSchema, insertAttendanceSchema, insertCourseEnrollmentSchema,
  insertUserSchema, insertAssignmentSchema, insertAssignmentSubmissionSchema,
  insertNotificationSchema, insertCalendarEventSchema
} from "@shared/schema";
import { z } from "zod";

// Validation schemas for auth
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"]),
});

export async function registerRoutes(app: Express): Promise<Server> {

  // ───────────────────── Authentication Routes ─────────────────────

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, role } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Validate role if provided (for demo purposes, we allow login with selected role)
      // In production, this would be determined by the user's actual role
      if (role && role !== user.role) {
        // Allow demo login with different role for testing purposes
        // In production, this check should be removed or made more restrictive
        console.log(`[AUTH] Demo login: user '${username}' (role: ${user.role}) attempting to login as '${role}'`);
      }

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role as 'admin' | 'teacher' | 'student';
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileId: user.profileId || undefined,
      };
      
      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('[AUTH] Session save error:', err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileId: user.profileId,
          success: true,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, role } = signupSchema.parse(req.body);

      // Check for existing user
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role,
        status: "active",
      });

      // Set session
      req.session.userId = newUser.id;
      req.session.userRole = newUser.role as 'admin' | 'teacher' | 'student';

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        success: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("[AUTH] Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // Clear all session data
    req.session.userId = undefined;
    req.session.userRole = undefined;
    req.session.user = undefined;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      id: req.session.userId,
      role: req.session.userRole,
      profileId: req.session.user?.profileId,
    });
  });

  // ───────────────────── Student Routes ─────────────────────

  // Get all students - Admin sees all, Teacher sees enrolled students
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      const profileId = req.session.user?.profileId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let students;

      // If teacher, filter by courses they teach
      if (userRole === 'teacher') {
        // First try to find teacher by profileId (this is the correct way)
        let teacher = profileId ? await storage.getTeacher(profileId) : null;
        
        // If not found by profileId, try by userId directly
        if (!teacher) {
          teacher = await storage.getTeacher(userId);
        }
        
        // If still not found, try to find teacher by teacherId (e.g., TCH-0001)
        if (!teacher) {
          teacher = await storage.getTeacherByTeacherId(userId);
        }
        
        // Last resort: find by matching with user profile
        if (!teacher) {
          const allTeachers = await storage.getAllTeachers();
          const allUsers = await storage.getAllUsers();
          const user = allUsers.find(u => u.id === userId || u.username === userId);
          if (user?.profileId) {
            teacher = allTeachers.find(t => t.id === user.profileId);
          }
        }

        if (!teacher) {
          return res.json([]);
        }

        const teacherIdToUse = teacher.id;
        const teacherCourses = await storage.getCoursesByTeacher(teacherIdToUse);
        const courseIds = teacherCourses.map(c => c.id);

        if (courseIds.length === 0) {
          // Teacher has no courses, return empty
          return res.json([]);
        }

        // Get enrollments for these courses
        const enrollments = await Promise.all(
          courseIds.map(cid => storage.getEnrollmentsByCourse(cid))
        );
        const studentIds = new Set(enrollments.flat().map(e => e.studentId));

        // Get only those students
        const allStudents = await storage.getAllStudents();
        students = allStudents.filter(s => studentIds.has(s.id));
      } else if (userRole === 'student') {
        // Students can only see their own profile
        const student = await storage.getStudentByStudentId(userId)
          || await storage.getStudent(userId);
        students = student ? [student] : [];
      } else {
        // Admin sees all
        students = await storage.getAllStudents();
      }

      res.json(students);
    } catch (error) {
      console.error("[API] Fetch students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[API] Student validation error:", error.errors);
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("[API] Create student error:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validatedData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteStudent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Get teachers for a specific student (based on course enrollment)
  app.get("/api/students/:studentId/teachers", requireAuth, async (req, res) => {
    try {
      const { studentId } = req.params;
      const userId = req.session.userId;
      const userRole = req.session.userRole;

      // Only allow students to view their own teachers, or admin
      if (userRole === 'student' && userId !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get student's enrollments
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      const courseIds = enrollments.map(e => e.courseId);

      if (courseIds.length === 0) {
        return res.json([]);
      }

      // Get courses and their teachers
      const allCourses = await storage.getAllCourses();
      const studentCourses = allCourses.filter(c => courseIds.includes(c.id));
      const teacherIdsArray = studentCourses.map(c => c.teacherId).filter((id): id is string => id !== null && id !== undefined);
      // Get unique teacher IDs without Set spread
      const uniqueTeacherIds: string[] = [];
      teacherIdsArray.forEach(id => {
        if (!uniqueTeacherIds.includes(id)) uniqueTeacherIds.push(id);
      });

      // Get teacher details
      const allTeachers = await storage.getAllTeachers();
      const studentTeachers = allTeachers.filter(t => uniqueTeacherIds.includes(t.id));

      res.json(studentTeachers);
    } catch (error) {
      console.error("[API] Fetch student teachers error:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // ───────────────────── Teacher Routes ─────────────────────

  app.get("/api/teachers", requireAuth, async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers/:id", requireAuth, async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  app.post("/api/teachers", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });

  app.put("/api/teachers/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.partial().parse(req.body);
      const teacher = await storage.updateTeacher(req.params.id, validatedData);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  app.delete("/api/teachers/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteTeacher(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  // ───────────────────── Course Routes ─────────────────────

  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const { grade, teacherId } = req.query;
      let courses;

      if (grade) {
        courses = await storage.getCoursesByGrade(parseInt(grade as string));
      } else if (teacherId) {
        courses = await storage.getCoursesByTeacher(teacherId as string);
      } else {
        courses = await storage.getAllCourses();
      }

      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(req.params.id, validatedData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteCourse(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // ───────────────────── Mark Routes ─────────────────────

  app.get("/api/marks", requireAuth, async (req, res) => {
    try {
      const { studentId, courseId } = req.query;
      let marks;

      if (studentId) {
        marks = await storage.getMarksByStudent(studentId as string);
      } else if (courseId) {
        marks = await storage.getMarksByCourse(courseId as string);
      } else {
        marks = await storage.getAllMarks();
      }

      res.json(marks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch marks" });
    }
  });

  app.post("/api/marks", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertMarkSchema.parse(req.body);
      const mark = await storage.createMark(validatedData);
      res.status(201).json(mark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mark" });
    }
  });

  app.put("/api/marks/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertMarkSchema.partial().parse(req.body);
      const mark = await storage.updateMark(req.params.id, validatedData);
      if (!mark) {
        return res.status(404).json({ message: "Mark not found" });
      }
      res.json(mark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update mark" });
    }
  });

  app.delete("/api/marks/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const success = await storage.deleteMark(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Mark not found" });
      }
      res.json({ message: "Mark deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mark" });
    }
  });

  // ───────────────────── Attendance Routes ─────────────────────

  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { studentId, courseId } = req.query;
      let attendance;

      if (studentId) {
        attendance = await storage.getAttendanceByStudent(studentId as string);
      } else if (courseId) {
        attendance = await storage.getAttendanceByCourse(courseId as string);
      } else {
        attendance = await storage.getAllAttendance();
      }

      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Get students for attendance - with proper filtering (not fetching all at once)
  app.get("/api/attendance/students", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId || '';
      const userRole = req.session.userRole;
      const profileId = req.session.user?.profileId;
      const grade = req.query.grade ? parseInt(req.query.grade as string) : null;
      const courseId = req.query.courseId as string | undefined;
      
      let students;
      
      if (userRole === 'admin') {
        // Admin can see all students filtered by grade/course
        students = await storage.getAllStudents();
        if (grade) {
          students = students.filter(s => s.grade === grade);
        }
        if (courseId) {
          const enrollments = await storage.getEnrollmentsByCourse(courseId);
          const studentIds = enrollments.map(e => e.studentId);
          students = students.filter(s => studentIds.includes(s.id));
        }
      } else if (userRole === 'teacher') {
        // Teacher sees students in their courses only
        const searchId = profileId || userId;
        let teacher = await storage.getTeacher(searchId);
        if (!teacher) teacher = await storage.getTeacherByTeacherId(searchId);
        
        if (teacher) {
          const teacherCourses = await storage.getCoursesByTeacher(teacher.id);
          let courseIds = teacherCourses.map(c => c.id);
          
          // If specific course selected, only that course
          if (courseId && courseIds.includes(courseId)) {
            courseIds = [courseId];
          }
          
          // Get enrollments for these courses
          const enrollments = await Promise.all(
            courseIds.map(cid => storage.getEnrollmentsByCourse(cid))
          );
          const studentIds = [...new Set(enrollments.flat().map(e => e.studentId))];
          
          students = await storage.getAllStudents();
          students = students.filter(s => studentIds.includes(s.id));
          
          // Filter by grade if specified
          if (grade) {
            students = students.filter(s => s.grade === grade);
          }
        } else {
          students = [];
        }
      } else if (userRole === 'student') {
        // Students can only see themselves
        const searchId = profileId || userId;
        let student = await storage.getStudent(searchId);
        if (!student) student = await storage.getStudentByStudentId(searchId);
        students = student ? [student] : [];
      } else {
        students = [];
      }
      
      res.json(students);
    } catch (error) {
      console.error("[API] Fetch attendance students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/attendance", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const att = await storage.createAttendance(validatedData);
      res.status(201).json(att);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendance" });
    }
  });

  app.put("/api/attendance/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const att = await storage.updateAttendance(req.params.id, validatedData);
      if (!att) {
        return res.status(404).json({ message: "Attendance not found" });
      }
      res.json(att);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // ───────────────────── Enrollment Routes ─────────────────────

  app.get("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const { studentId, courseId } = req.query;
      let enrollments;

      if (studentId) {
        enrollments = await storage.getEnrollmentsByStudent(studentId as string);
      } else if (courseId) {
        enrollments = await storage.getEnrollmentsByCourse(courseId as string);
      } else {
        enrollments = await storage.getAllCourseEnrollments();
      }

      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertCourseEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createCourseEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // ───────────────────── User Routes (Admin Only) ─────────────────────

  app.get("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Never send passwords to the client
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const user = await storage.createUser({ ...validatedData, password: hashedPassword });
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // ───────────────────── Assignment Routes ─────────────────────

  app.get("/api/assignments", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      const profileId = req.session.user?.profileId;
      
      const allAssignments = await storage.getAllAssignments();
      
      // Filter based on role
      let assignments;
      
      if (userRole === 'admin') {
        // Admin sees all
        assignments = allAssignments;
      } else if (userRole === 'teacher') {
        // Teacher sees their own assignments
        let teacher = profileId ? await storage.getTeacher(profileId) : null;
        if (!teacher) teacher = await storage.getTeacher(userId);
        if (!teacher) teacher = await storage.getTeacherByTeacherId(userId);
        
        if (teacher) {
          assignments = allAssignments.filter(a => a.teacherId === teacher!.id);
        } else {
          assignments = [];
        }
      } else if (userRole === 'student') {
        // Student sees assignments for courses they're enrolled in
        let student = profileId ? await storage.getStudent(profileId) : null;
        if (!student) student = await storage.getStudent(userId);
        if (!student) student = await storage.getStudentByStudentId(userId);
        
        if (student) {
          // Get enrolled courses
          const enrollments = await storage.getEnrollmentsByStudent(student.id);
          const courseIds = enrollments.map(e => e.courseId);
          
          // Filter assignments for enrolled courses
          assignments = allAssignments.filter(a => courseIds.includes(a.courseId));
        } else {
          assignments = [];
        }
      } else {
        assignments = [];
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("[API] Fetch assignments error:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/teacher/:teacherId", requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByTeacher(req.params.teacherId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher assignments" });
    }
  });

  app.get("/api/assignments/course/:courseId", requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByCourse(req.params.courseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course assignments" });
    }
  });

  app.post("/api/assignments", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateAssignment(req.params.id, validatedData);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const success = await storage.deleteAssignment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // ───────────────────── Assignment Submission Routes ─────────────────────

  // Get all submissions (filtered by role)
  app.get("/api/assignment-submissions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId || '';
      const userRole = req.session.userRole;
      const profileId = req.session.user?.profileId;
      
      const allSubmissions = await storage.getAllAssignmentSubmissions();
      let submissions: typeof allSubmissions = [];
      
      if (userRole === 'admin') {
        // Admin sees all
        submissions = allSubmissions;
      } else if (userRole === 'teacher') {
        // Teacher sees submissions for their courses' assignments
        const searchId = profileId || userId;
        let teacher = await storage.getTeacher(searchId);
        if (!teacher) teacher = await storage.getTeacherByTeacherId(searchId);
        
        if (teacher) {
          const teacherCourses = await storage.getCoursesByTeacher(teacher.id);
          const courseIds = teacherCourses.map(c => c.id);
          submissions = allSubmissions.filter(s => 
            courseIds.includes(s.assignmentId || '')
          );
        }
      } else if (userRole === 'student') {
        // Student sees their own submissions
        const searchId = profileId || userId;
        let student = await storage.getStudent(searchId);
        if (!student) student = await storage.getStudentByStudentId(searchId);
        
        if (student) {
          submissions = allSubmissions.filter(s => s.studentId === student!.id);
        }
      }
      
      res.json(submissions);
    } catch (error) {
      console.error("[API] Fetch submissions error:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/assignment-submissions/student/:studentId", requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByStudent(req.params.studentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student submissions" });
    }
  });

  app.get("/api/assignment-submissions/assignment/:assignmentId", requireAuth, async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByAssignment(req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment submissions" });
    }
  });

  app.post("/api/assignment-submissions", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAssignmentSubmissionSchema.parse(req.body);
      const submission = await storage.createAssignmentSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.put("/api/assignment-submissions/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertAssignmentSubmissionSchema.partial().parse(req.body);
      const submission = await storage.updateAssignmentSubmission(req.params.id, validatedData);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  // ───────────────────── Analytics Routes ─────────────────────

  app.get("/api/analytics/students-gpa", requireAuth, async (req, res) => {
    try {
      const studentsWithGPA = await storage.getStudentsWithGPA();
      res.json(studentsWithGPA);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student GPA data" });
    }
  });

  app.get("/api/analytics/subject-toppers", requireAuth, async (req, res) => {
    try {
      const subjectToppers = await storage.getSubjectToppers();
      res.json(subjectToppers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject toppers" });
    }
  });

  app.get("/api/analytics/attendance-stats", requireAuth, async (req, res) => {
    try {
      const attendanceStats = await storage.getAttendanceStats();
      res.json(attendanceStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance stats" });
    }
  });

  app.get("/api/analytics/dashboard-stats", requireAuth, async (req, res) => {
    try {
      const [students, teachers, courses, attendanceStats] = await Promise.all([
        storage.getAllStudents(),
        storage.getAllTeachers(),
        storage.getAllCourses(),
        storage.getAttendanceStats()
      ]);

      const stats = {
        totalStudents: students.length,
        activeTeachers: teachers.filter(t => t.status === 'active').length,
        totalCourses: courses.filter(c => c.status === 'active').length,
        avgAttendance: attendanceStats.percentage
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ───────────────────── Notification Routes ─────────────────────

  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteNotification(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Calendar Routes

  // Get calendar events with role-based filtering
  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      const { year, month } = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      let events;

      if (year && month) {
        events = await storage.getCalendarEventsByMonth(
          parseInt(year as string),
          parseInt(month as string)
        );
      } else {
        events = await storage.getAllCalendarEvents();
      }

      // Filter events based on role
      let filteredEvents = events;
      
      if (userRole === 'teacher') {
        // Teachers see: global events (no grade) + events for their courses
        const teacherCourses = await storage.getCoursesByTeacher(userId || '');
        const teacherGradesArray = teacherCourses.map(c => c.grade);
        // Get unique grades without using Set spread
        const teacherGrades: number[] = [];
        teacherGradesArray.forEach(g => {
          if (!teacherGrades.includes(g)) teacherGrades.push(g);
        });

        filteredEvents = events.filter(event => {
          // Include global events (no grade specified)
          if (!event.grade) return true;
          // Include events for teacher's grades
          if (teacherGrades.includes(event.grade)) return true;
          return false;
        });
      } else if (userRole === 'student') {
        // Students see: global events + events for their enrolled courses
        // First get student's enrollments
        const enrollments = await storage.getEnrollmentsByStudent(userId || '');
        const studentCourseIds = enrollments.map(e => e.courseId);
        const allCourses = await storage.getAllCourses();
        const studentCourses = allCourses.filter(c => studentCourseIds.includes(c.id));
        const studentGradesArray = studentCourses.map(c => c.grade);
        // Get unique grades without using Set spread
        const studentGrades: number[] = [];
        studentGradesArray.forEach(g => {
          if (!studentGrades.includes(g)) studentGrades.push(g);
        });

        filteredEvents = events.filter(event => {
          // Include global events (no grade specified)
          if (!event.grade) return true;
          // Include events for student's grades
          if (studentGrades.includes(event.grade)) return true;
          return false;
        });
      }
      // Admin sees all events

      res.json(filteredEvents);
    } catch (error) {
      console.error("[API] Fetch calendar events error:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/calendar/events", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      const validatedData = insertCalendarEventSchema.parse(req.body);

      // If teacher, they can only create events for their courses or grades
      if (userRole === 'teacher') {
        const teacherCourses = await storage.getCoursesByTeacher(userId || '');
        const teacherGradesArray = teacherCourses.map(c => c.grade);
        // Get unique grades without using Set spread
        const teacherGrades: number[] = [];
        teacherGradesArray.forEach(g => {
          if (!teacherGrades.includes(g)) teacherGrades.push(g);
        });

        // If grade is specified, must be one of teacher's grades
        // If no grade (global event), deny for teachers
        if (validatedData.grade && !teacherGrades.includes(validatedData.grade)) {
          return res.status(403).json({ message: "You can only create events for your assigned grades" });
        }
        if (!validatedData.grade) {
          return res.status(403).json({ message: "Teachers cannot create global events. Please specify a grade." });
        }
      }

      const event = await storage.createCalendarEvent({
        ...validatedData,
        createdBy: userId,
      });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("[API] Create calendar event error:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/calendar/events/:id", requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/calendar/events/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const success = await storage.deleteCalendarEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
