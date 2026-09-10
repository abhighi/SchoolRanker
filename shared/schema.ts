import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ───────────────────── Tables ─────────────────────

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

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseCode: varchar("course_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  grade: integer("grade").notNull(),
  subject: text("subject").notNull(),
  teacherId: varchar("teacher_id").references(() => teachers.id),
  credits: integer("credits").notNull().default(1),
  schedule: jsonb("schedule"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
}, (table) => [
  index("courses_teacher_id_idx").on(table.teacherId),
  index("courses_grade_idx").on(table.grade),
]);

export const marks = pgTable("marks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  examType: varchar("exam_type", { length: 50 }).notNull(),
  marks: decimal("marks", { precision: 5, scale: 2 }).notNull(),
  totalMarks: decimal("total_marks", { precision: 5, scale: 2 }).notNull(),
  examDate: text("exam_date").notNull(),
  remarks: text("remarks"),
}, (table) => [
  index("marks_student_id_idx").on(table.studentId),
  index("marks_course_id_idx").on(table.courseId),
]);

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  date: text("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  remarks: text("remarks"),
}, (table) => [
  index("attendance_student_id_idx").on(table.studentId),
  index("attendance_course_id_idx").on(table.courseId),
]);

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
}, (table) => [
  index("enrollments_student_id_idx").on(table.studentId),
  index("enrollments_course_id_idx").on(table.courseId),
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  profileId: varchar("profile_id"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("users_role_idx").on(table.role),
]);

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  teacherId: varchar("teacher_id").references(() => teachers.id).notNull(),
  dueDate: text("due_date").notNull(),
  totalPoints: integer("total_points").notNull().default(100),
  type: varchar("type", { length: 20 }).notNull().default("assignment"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("assignments_course_id_idx").on(table.courseId),
  index("assignments_teacher_id_idx").on(table.teacherId),
]);

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  submissionText: text("submission_text"),
  fileUrl: text("file_url"),
  submittedAt: text("submitted_at"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedAt: text("graded_at"),
  gradedBy: varchar("graded_by").references(() => teachers.id),
}, (table) => [
  index("submissions_assignment_id_idx").on(table.assignmentId),
  index("submissions_student_id_idx").on(table.studentId),
]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
]);

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),          // users.id of poster
  authorName: text("author_name").notNull(),         // resolved display name
  authorRole: varchar("author_role", { length: 20 }).notNull(), // admin | teacher
  targetGrade: integer("target_grade"),              // null = everyone
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("announcements_target_grade_idx").on(table.targetGrade),
  index("announcements_author_id_idx").on(table.authorId),
]);

export const announcementComments = pgTable("announcement_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").references(() => announcements.id).notNull(),
  authorId: varchar("author_id").notNull(),          // users.id of commenter
  authorName: text("author_name").notNull(),
  authorRole: varchar("author_role", { length: 20 }).notNull(), // admin | teacher | student
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("announcement_comments_announcement_id_idx").on(table.announcementId),
]);

// ───────────────────── Insert Schemas ─────────────────────

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
  type: z.enum(["assignment", "homework", "project", "quiz", "test"]).default("assignment"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({
  id: true,
}).extend({
  status: z.enum(["pending", "submitted", "graded", "late"]).default("pending"),
  grade: z.number().min(0).optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  read: z.boolean().default(false),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  authorId: true,
  authorName: true,
  authorRole: true,
}).extend({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  // Accept a grade 1-12, or null/undefined for "everyone".
  targetGrade: z.number().int().min(1).max(12).nullable().optional(),
});

export const insertAnnouncementCommentSchema = createInsertSchema(announcementComments).omit({
  id: true,
  createdAt: true,
  announcementId: true,
  authorId: true,
  authorName: true,
  authorRole: true,
}).extend({
  content: z.string().min(1).max(2000),
});

// ───────────────────── Types ─────────────────────

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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementComment = typeof announcementComments.$inferSelect;
export type InsertAnnouncementComment = z.infer<typeof insertAnnouncementCommentSchema>;

// Announcement with embedded comments (for API responses).
export type AnnouncementWithComments = Announcement & {
  comments: AnnouncementComment[];
};

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  startTime: varchar("start_time"),
  endTime: varchar("end_time"),
  eventType: varchar("event_type").notNull().default("event"), // event, holiday, exam, meeting
  grade: integer("grade"), // applicable for specific grade, null for all
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  title: true,
  description: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  eventType: true,
  grade: true,
  createdBy: true,
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

// Analytics types
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
