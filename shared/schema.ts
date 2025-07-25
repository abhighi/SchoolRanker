import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  grade: integer("grade").notNull(),
  section: varchar("section", { length: 10 }).notNull(),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  guardianName: text("guardian_name"),
  guardianPhone: varchar("guardian_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  enrollmentDate: text("enrollment_date").notNull(),
  profileImage: text("profile_image"),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: text("address"),
  subject: text("subject").notNull(),
  qualification: text("qualification"),
  experience: integer("experience"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  joinDate: text("join_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  profileImage: text("profile_image"),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseCode: varchar("course_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  teacherId: varchar("teacher_id").references(() => teachers.id),
  credits: integer("credits").notNull().default(1),
  schedule: jsonb("schedule"), // {day: string, startTime: string, endTime: string}[]
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

// Marks table
export const marks = pgTable("marks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  examType: varchar("exam_type", { length: 50 }).notNull(), // midterm, final, quiz, assignment
  marks: decimal("marks", { precision: 5, scale: 2 }).notNull(),
  totalMarks: decimal("total_marks", { precision: 5, scale: 2 }).notNull(),
  examDate: text("exam_date").notNull(),
  remarks: text("remarks"),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  date: text("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // present, absent, late
  remarks: text("remarks"),
});

// Course Enrollments table
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // admin, teacher, student
  profileId: varchar("profile_id"), // references to students.id or teachers.id
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  teacherId: varchar("teacher_id").references(() => teachers.id).notNull(),
  dueDate: text("due_date").notNull(),
  totalPoints: integer("total_points").notNull().default(100),
  type: varchar("type", { length: 20 }).notNull().default("assignment"), // assignment, homework, project
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

// Assignment Submissions table
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  submissionText: text("submission_text"),
  fileUrl: text("file_url"),
  submittedAt: text("submitted_at"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, submitted, graded, late
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedAt: text("graded_at"),
  gradedBy: varchar("graded_by").references(() => teachers.id),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
}).extend({
  grade: z.number().min(1).max(12),
  section: z.string().min(1).max(10),
  email: z.string().email(),
  status: z.enum(["active", "inactive", "graduated"]).default("active"),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
}).extend({
  email: z.string().email(),
  experience: z.number().min(0).optional(),
  salary: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
}).extend({
  grade: z.number().min(1).max(12),
  credits: z.number().min(1).max(10).default(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertMarkSchema = createInsertSchema(marks).omit({
  id: true,
}).extend({
  marks: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0),
  totalMarks: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  examType: z.enum(["midterm", "final", "quiz", "assignment", "project"]),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
}).extend({
  status: z.enum(["present", "absent", "late"]),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
}).extend({
  status: z.enum(["active", "completed", "dropped"]).default("active"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
}).extend({
  totalPoints: z.number().min(1).default(100),
  type: z.enum(["assignment", "homework", "project"]).default("assignment"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({
  id: true,
}).extend({
  status: z.enum(["pending", "submitted", "graded", "late"]).default("pending"),
  grade: z.number().min(0).optional(),
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Mark = typeof marks.$inferSelect;
export type InsertMark = z.infer<typeof insertMarkSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = z.infer<typeof insertAssignmentSubmissionSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"), // info, success, warning, error
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  read: z.boolean().default(false),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Additional types for rankings
export type StudentWithGPA = Student & {
  gpa: number;
  totalMarks: number;
  rank?: number;
};

export type SubjectTopper = {
  subject: string;
  studentName: string;
  studentId: string;
  percentage: number;
};
