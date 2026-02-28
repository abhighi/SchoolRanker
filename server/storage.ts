import {
  type Student, type InsertStudent,
  type Teacher, type InsertTeacher,
  type Course, type InsertCourse,
  type Mark, type InsertMark,
  type Attendance, type InsertAttendance,
  type CourseEnrollment, type InsertCourseEnrollment,
  type User, type InsertUser,
  type Assignment, type InsertAssignment,
  type AssignmentSubmission, type InsertAssignmentSubmission,
  type Notification, type InsertNotification,
  type CalendarEvent, type InsertCalendarEvent,
  type StudentWithGPA, type SubjectTopper,
  students, teachers, courses, marks, attendance, courseEnrollments,
  users, assignments, assignmentSubmissions, notifications, calendarEvents
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Teacher operations
  getTeacher(id: string): Promise<Teacher | undefined>;
  getAllTeachers(): Promise<Teacher[]>;
  getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;

  // Course operations
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCourseByCourseCode(courseCode: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  getCoursesByGrade(grade: number): Promise<Course[]>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;

  // Mark operations
  getMark(id: string): Promise<Mark | undefined>;
  getAllMarks(): Promise<Mark[]>;
  createMark(mark: InsertMark): Promise<Mark>;
  updateMark(id: string, mark: Partial<InsertMark>): Promise<Mark | undefined>;
  deleteMark(id: string): Promise<boolean>;
  getMarksByStudent(studentId: string): Promise<Mark[]>;
  getMarksByCourse(courseId: string): Promise<Mark[]>;

  // Attendance operations
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAllAttendance(): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: string): Promise<boolean>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  getAttendanceByCourse(courseId: string): Promise<Attendance[]>;

  // Course Enrollment operations
  getCourseEnrollment(id: string): Promise<CourseEnrollment | undefined>;
  getAllCourseEnrollments(): Promise<CourseEnrollment[]>;
  createCourseEnrollment(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateCourseEnrollment(id: string, enrollment: Partial<InsertCourseEnrollment>): Promise<CourseEnrollment | undefined>;
  deleteCourseEnrollment(id: string): Promise<boolean>;
  getEnrollmentsByStudent(studentId: string): Promise<CourseEnrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<CourseEnrollment[]>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: string): Promise<boolean>;
  getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;

  // Assignment Submission operations
  getAssignmentSubmission(id: string): Promise<AssignmentSubmission | undefined>;
  getAllAssignmentSubmissions(): Promise<AssignmentSubmission[]>;
  createAssignmentSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  updateAssignmentSubmission(id: string, submission: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission | undefined>;
  deleteAssignmentSubmission(id: string): Promise<boolean>;
  getSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]>;
  getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]>;

  // Analytics operations
  getStudentsWithGPA(): Promise<StudentWithGPA[]>;
  getSubjectToppers(): Promise<SubjectTopper[]>;
  getAttendanceStats(): Promise<{ totalClasses: number; presentClasses: number; percentage: number }>;

  // Notification operations
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;

  // Calendar operations
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEventsByMonth(year: number, month: number): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
}

// MemStorage removed - using DatabaseStorage only

export class DatabaseStorage implements IStorage {
  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db.update(students).set(updateData).where(eq(students.id, id)).returning();
    return student || undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Teacher operations
  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.teacherId, teacherId));
    return teacher || undefined;
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(insertTeacher).returning();
    return teacher;
  }

  async updateTeacher(id: string, updateData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [teacher] = await db.update(teachers).set(updateData).where(eq(teachers.id, id)).returning();
    return teacher || undefined;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourseByCourseCode(courseCode: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.courseCode, courseCode));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: string, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set(updateData).where(eq(courses.id, id)).returning();
    return course || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCoursesByGrade(grade: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.grade, grade));
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  // Mark operations
  async getMark(id: string): Promise<Mark | undefined> {
    const [mark] = await db.select().from(marks).where(eq(marks.id, id));
    return mark || undefined;
  }

  async getAllMarks(): Promise<Mark[]> {
    return await db.select().from(marks);
  }

  async createMark(insertMark: InsertMark): Promise<Mark> {
    const [mark] = await db.insert(marks).values(insertMark).returning();
    return mark;
  }

  async updateMark(id: string, updateData: Partial<InsertMark>): Promise<Mark | undefined> {
    const [mark] = await db.update(marks).set(updateData).where(eq(marks.id, id)).returning();
    return mark || undefined;
  }

  async deleteMark(id: string): Promise<boolean> {
    const result = await db.delete(marks).where(eq(marks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMarksByStudent(studentId: string): Promise<Mark[]> {
    return await db.select().from(marks).where(eq(marks.studentId, studentId));
  }

  async getMarksByCourse(courseId: string): Promise<Mark[]> {
    return await db.select().from(marks).where(eq(marks.courseId, courseId));
  }

  // Attendance operations
  async getAttendance(id: string): Promise<Attendance | undefined> {
    const [att] = await db.select().from(attendance).where(eq(attendance.id, id));
    return att || undefined;
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [att] = await db.insert(attendance).values(insertAttendance).returning();
    return att;
  }

  async updateAttendance(id: string, updateData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [att] = await db.update(attendance).set(updateData).where(eq(attendance.id, id)).returning();
    return att || undefined;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceByCourse(courseId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.courseId, courseId));
  }

  // Course Enrollment operations
  async getCourseEnrollment(id: string): Promise<CourseEnrollment | undefined> {
    const [enrollment] = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id));
    return enrollment || undefined;
  }

  async getAllCourseEnrollments(): Promise<CourseEnrollment[]> {
    return await db.select().from(courseEnrollments);
  }

  async createCourseEnrollment(insertEnrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [enrollment] = await db.insert(courseEnrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async updateCourseEnrollment(id: string, updateData: Partial<InsertCourseEnrollment>): Promise<CourseEnrollment | undefined> {
    const [enrollment] = await db.update(courseEnrollments).set(updateData).where(eq(courseEnrollments.id, id)).returning();
    return enrollment || undefined;
  }

  async deleteCourseEnrollment(id: string): Promise<boolean> {
    const result = await db.delete(courseEnrollments).where(eq(courseEnrollments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEnrollmentsByStudent(studentId: string): Promise<CourseEnrollment[]> {
    return await db.select().from(courseEnrollments).where(eq(courseEnrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<CourseEnrollment[]> {
    return await db.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, courseId));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).orderBy(desc(assignments.createdAt));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db.insert(assignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateAssignment(id: string, updateData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [assignment] = await db.update(assignments).set(updateData).where(eq(assignments.id, id)).returning();
    return assignment || undefined;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.teacherId, teacherId)).orderBy(desc(assignments.createdAt));
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId)).orderBy(desc(assignments.createdAt));
  }

  // Assignment Submission operations
  async getAssignmentSubmission(id: string): Promise<AssignmentSubmission | undefined> {
    const [submission] = await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.id, id));
    return submission || undefined;
  }

  async getAllAssignmentSubmissions(): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions);
  }

  async createAssignmentSubmission(insertSubmission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const [submission] = await db.insert(assignmentSubmissions).values(insertSubmission).returning();
    return submission;
  }

  async updateAssignmentSubmission(id: string, updateData: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission | undefined> {
    const [submission] = await db.update(assignmentSubmissions).set(updateData).where(eq(assignmentSubmissions.id, id)).returning();
    return submission || undefined;
  }

  async deleteAssignmentSubmission(id: string): Promise<boolean> {
    const result = await db.delete(assignmentSubmissions).where(eq(assignmentSubmissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getSubmissionsByStudent(studentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.studentId, studentId));
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    return await db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId, assignmentId));
  }

  // Analytics operations - Optimized to avoid N+1 queries
  async getStudentsWithGPA(): Promise<StudentWithGPA[]> {
    // Get all students and marks in a single query using join
    const allMarks = await db.select({
      studentId: marks.studentId,
      marks: marks.marks,
      totalMarks: marks.totalMarks,
    }).from(marks);

    const allStudents = await db.select().from(students);

    // Create a map of student marks for O(1) lookup
    const marksByStudent = new Map<string, typeof allMarks>();
    for (const mark of allMarks) {
      if (!marksByStudent.has(mark.studentId)) {
        marksByStudent.set(mark.studentId, []);
      }
      marksByStudent.get(mark.studentId)!.push(mark);
    }

    const studentsWithGPA: StudentWithGPA[] = allStudents.map(student => {
      const studentMarks = marksByStudent.get(student.id) || [];

      if (studentMarks.length === 0) {
        return {
          ...student,
          gpa: 0,
          totalMarks: 0,
        };
      }

      let totalPercentage = 0;
      let totalMarksSum = 0;

      for (const mark of studentMarks) {
        const marksNum = parseFloat(mark.marks);
        const totalMarksNum = parseFloat(mark.totalMarks);
        const percentage = (marksNum / totalMarksNum) * 100;
        totalPercentage += percentage;
        totalMarksSum += marksNum;
      }

      const gpa = (totalPercentage / studentMarks.length) / 25;

      return {
        ...student,
        gpa: Math.round(gpa * 100) / 100,
        totalMarks: Math.round(totalMarksSum * 100) / 100,
      };
    });

    return studentsWithGPA;
  }

  // Get subject toppers - Optimized to avoid N+1 queries
  async getSubjectToppers(): Promise<SubjectTopper[]> {
    // Get all courses and marks in bulk
    const allCourses = await db.select().from(courses);
    const allMarks = await db.select({
      studentId: marks.studentId,
      courseId: marks.courseId,
      marks: marks.marks,
      totalMarks: marks.totalMarks,
    }).from(marks);
    const allStudents = await db.select().from(students);

    // Create a map of students for O(1) lookup
    const studentMap = new Map<string, typeof allStudents[0]>();
    for (const student of allStudents) {
      studentMap.set(student.id, student);
    }

    // Create a map of marks by course
    const marksByCourse = new Map<string, typeof allMarks>();
    for (const mark of allMarks) {
      if (!marksByCourse.has(mark.courseId)) {
        marksByCourse.set(mark.courseId, []);
      }
      marksByCourse.get(mark.courseId)!.push(mark);
    }

    const toppers: SubjectTopper[] = [];

    for (const course of allCourses) {
      const courseMarks = marksByCourse.get(course.id) || [];

      if (courseMarks.length === 0) continue;

      const studentPerformance = new Map<string, { totalMarks: number; totalPossible: number }>();

      for (const mark of courseMarks) {
        const marksNum = parseFloat(mark.marks);
        const totalMarksNum = parseFloat(mark.totalMarks);

        if (!studentPerformance.has(mark.studentId)) {
          studentPerformance.set(mark.studentId, { totalMarks: 0, totalPossible: 0 });
        }

        const current = studentPerformance.get(mark.studentId)!;
        current.totalMarks += marksNum;
        current.totalPossible += totalMarksNum;
      }

      let bestStudentId = '';
      let bestPercentage = 0;

      for (const [studentId, performance] of Array.from(studentPerformance.entries())) {
        const percentage = (performance.totalMarks / performance.totalPossible) * 100;
        if (percentage > bestPercentage) {
          bestPercentage = percentage;
          bestStudentId = studentId;
        }
      }

      if (bestStudentId) {
        const student = studentMap.get(bestStudentId);
        if (student) {
          toppers.push({
            subject: course.subject,
            studentName: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            percentage: Math.round(bestPercentage * 100) / 100,
          });
        }
      }
    }

    return toppers;
  }

  // Get attendance stats - Optimized with single query
  async getAttendanceStats(): Promise<{ totalClasses: number; presentClasses: number; percentage: number }> {
    const result = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where ${attendance.status} = 'present')`,
    }).from(attendance);

    const totalClasses = result[0]?.total || 0;
    const presentClasses = result[0]?.present || 0;
    const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return {
      totalClasses,
      presentClasses,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  // Notification operations
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Calendar operations
  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).orderBy(calendarEvents.eventDate);
  }

  async getCalendarEventsByMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return await db.select().from(calendarEvents)
      .where(sql`${calendarEvents.eventDate} >= ${startDate.toISOString().split('T')[0]} AND ${calendarEvents.eventDate} <= ${endDate.toISOString().split('T')[0]}`)
      .orderBy(calendarEvents.eventDate);
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event || undefined;
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [created] = await db.insert(calendarEvents).values({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
      grade: event.grade,
      createdBy: event.createdBy,
    }).returning();
    return created;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const updateData: Partial<typeof calendarEvents.$inferInsert> = {};
    if (event.title !== undefined) updateData.title = event.title;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.eventDate !== undefined) updateData.eventDate = event.eventDate;
    if (event.startTime !== undefined) updateData.startTime = event.startTime;
    if (event.endTime !== undefined) updateData.endTime = event.endTime;
    if (event.eventType !== undefined) updateData.eventType = event.eventType;
    if (event.grade !== undefined) updateData.grade = event.grade;

    const [updated] = await db.update(calendarEvents).set(updateData).where(eq(calendarEvents.id, id)).returning();
    return updated || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
