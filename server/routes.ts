import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentSchema, insertTeacherSchema, insertCourseSchema, 
  insertMarkSchema, insertAttendanceSchema, insertCourseEnrollmentSchema,
  insertUserSchema, insertAssignmentSchema, insertAssignmentSubmissionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
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

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
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

  app.delete("/api/students/:id", async (req, res) => {
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

  // Teacher routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers/:id", async (req, res) => {
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

  app.post("/api/teachers", async (req, res) => {
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

  app.put("/api/teachers/:id", async (req, res) => {
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

  app.delete("/api/teachers/:id", async (req, res) => {
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

  // Course routes
  app.get("/api/courses", async (req, res) => {
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

  app.get("/api/courses/:id", async (req, res) => {
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

  app.post("/api/courses", async (req, res) => {
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

  app.put("/api/courses/:id", async (req, res) => {
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

  app.delete("/api/courses/:id", async (req, res) => {
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

  // Mark routes
  app.get("/api/marks", async (req, res) => {
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

  app.post("/api/marks", async (req, res) => {
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

  app.put("/api/marks/:id", async (req, res) => {
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

  app.delete("/api/marks/:id", async (req, res) => {
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

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
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

  app.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendance" });
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(req.params.id, validatedData);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance not found" });
      }
      res.json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Course Enrollment routes
  app.get("/api/enrollments", async (req, res) => {
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

  app.post("/api/enrollments", async (req, res) => {
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

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined }))); // Don't send passwords
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json({ ...user, password: undefined }); // Don't send password
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/teacher/:teacherId", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByTeacher(req.params.teacherId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher assignments" });
    }
  });

  app.get("/api/assignments/course/:courseId", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByCourse(req.params.courseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
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

  app.put("/api/assignments/:id", async (req, res) => {
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

  app.delete("/api/assignments/:id", async (req, res) => {
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

  // Assignment Submission routes
  app.get("/api/assignment-submissions/student/:studentId", async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByStudent(req.params.studentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student submissions" });
    }
  });

  app.get("/api/assignment-submissions/assignment/:assignmentId", async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByAssignment(req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment submissions" });
    }
  });

  app.post("/api/assignment-submissions", async (req, res) => {
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

  app.put("/api/assignment-submissions/:id", async (req, res) => {
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

  // Analytics routes
  app.get("/api/analytics/students-gpa", async (req, res) => {
    try {
      const studentsWithGPA = await storage.getStudentsWithGPA();
      res.json(studentsWithGPA);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student GPA data" });
    }
  });

  app.get("/api/analytics/subject-toppers", async (req, res) => {
    try {
      const subjectToppers = await storage.getSubjectToppers();
      res.json(subjectToppers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject toppers" });
    }
  });

  app.get("/api/analytics/attendance-stats", async (req, res) => {
    try {
      const attendanceStats = await storage.getAttendanceStats();
      res.json(attendanceStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance stats" });
    }
  });

  app.get("/api/analytics/dashboard-stats", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
