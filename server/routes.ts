import express from "express";
import { createServer } from "http";
import { storage } from "./storage";
import type {
  InsertStudent,
  InsertTeacher,
  InsertCourse,
  InsertMark,
  InsertAttendance,
  InsertAssignment,
  InsertAssignmentSubmission,
  InsertUser,
} from "@shared/schema";

export async function registerRoutes(app: express.Express) {
  const api = express.Router();

  api.get("/students", async (_req, res, next) => {
    try {
      const data = await storage.getAllStudents();
      res.json(data);
    } catch (e) { next(e); }
  });

  // Marks
  api.get("/marks", async (_req, res, next) => {
    try {
      const data = await storage.getAllMarks();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/marks", async (req, res, next) => {
    try {
      const created = await storage.createMark(req.body as InsertMark);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.put("/marks/:id", async (req, res, next) => {
    try {
      const updated = await storage.updateMark(req.params.id, req.body as Partial<InsertMark>);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/marks/:id", async (req, res, next) => {
    try {
      const ok = await storage.deleteMark(req.params.id);
      res.json({ success: ok });
    } catch (e) { next(e); }
  });

  // Notifications
  api.get("/notifications/:userId", async (req, res, next) => {
    try {
      const data = await storage.getNotificationsByUser(req.params.userId);
      // Map DB fields to component's expected shape (timestamp as Date-compatible string)
      res.json(
        data.map(n => ({
          ...n,
          timestamp: n.createdAt,
        }))
      );
    } catch (e) { next(e); }
  });

  api.patch("/notifications/:id/read", async (req, res, next) => {
    try {
      const updated = await storage.markNotificationAsRead(req.params.id);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/notifications/:id", async (req, res, next) => {
    try {
      const ok = await storage.deleteNotification(req.params.id);
      res.json({ success: ok });
    } catch (e) { next(e); }
  });

  api.post("/students", async (req, res, next) => {
    try {
      const created = await storage.createStudent(req.body as InsertStudent);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.put("/students/:id", async (req, res, next) => {
    try {
      const updated = await storage.updateStudent(req.params.id, req.body as Partial<InsertStudent>);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/students/:id", async (req, res, next) => {
    try {
      const ok = await storage.deleteStudent(req.params.id);
      res.json({ success: ok });
    } catch (e) { next(e); }
  });

  api.get("/teachers", async (_req, res, next) => {
    try {
      const data = await storage.getAllTeachers();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/teachers", async (req, res, next) => {
    try {
      const created = await storage.createTeacher(req.body as InsertTeacher);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.put("/teachers/:id", async (req, res, next) => {
    try {
      const updated = await storage.updateTeacher(req.params.id, req.body as Partial<InsertTeacher>);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/teachers/:id", async (req, res, next) => {
    try {
      const ok = await storage.deleteTeacher(req.params.id);
      res.json({ success: ok });
    } catch (e) { next(e); }
  });

  api.get("/courses", async (_req, res, next) => {
    try {
      const data = await storage.getAllCourses();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/courses", async (req, res, next) => {
    try {
      const created = await storage.createCourse(req.body as InsertCourse);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.put("/courses/:id", async (req, res, next) => {
    try {
      const updated = await storage.updateCourse(req.params.id, req.body as Partial<InsertCourse>);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/courses/:id", async (req, res, next) => {
    try {
      const ok = await storage.deleteCourse(req.params.id);
      res.json({ success: ok });
    } catch (e) { next(e); }
  });

  api.get("/attendance", async (_req, res, next) => {
    try {
      const data = await storage.getAllAttendance();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/attendance", async (req, res, next) => {
    try {
      const created = await storage.createAttendance(req.body as InsertAttendance);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.get("/assignments", async (_req, res, next) => {
    try {
      const data = await storage.getAllAssignments();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/assignments", async (req, res, next) => {
    try {
      const created = await storage.createAssignment(req.body as InsertAssignment);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.patch("/assignments/:id", async (req, res, next) => {
    try {
      const updated = await storage.updateAssignment(req.params.id, req.body as Partial<InsertAssignment>);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.get("/assignment-submissions", async (_req, res, next) => {
    try {
      const data = await storage.getAllAssignmentSubmissions();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.post("/assignment-submissions", async (req, res, next) => {
    try {
      const created = await storage.createAssignmentSubmission(req.body as InsertAssignmentSubmission);
      res.status(201).json(created);
    } catch (e) { next(e); }
  });

  api.get("/analytics/students-gpa", async (_req, res, next) => {
    try {
      const data = await storage.getStudentsWithGPA();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.get("/analytics/subject-toppers", async (_req, res, next) => {
    try {
      const data = await storage.getSubjectToppers();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.get("/analytics/attendance-stats", async (_req, res, next) => {
    try {
      const data = await storage.getAttendanceStats();
      res.json(data);
    } catch (e) { next(e); }
  });

  api.get("/analytics/dashboard-stats", async (_req, res, next) => {
    try {
      const [students, teachers, courses, attendance] = await Promise.all([
        storage.getAllStudents(),
        storage.getAllTeachers(),
        storage.getAllCourses(),
        storage.getAttendanceStats(),
      ]);
      res.json({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        avgAttendance: attendance.percentage,
      });
    } catch (e) { next(e); }
  });

  api.post("/auth/signup", async (req, res, next) => {
    try {
      const { email, password, role } = req.body as { email: string; password: string; role: string };
      const username = email.split("@")[0];
      const user = await storage.createUser({
        username,
        email,
        password,
        role: role as InsertUser["role"],
        status: "active",
      } as InsertUser);
      res.status(201).json({ id: user.id, role: user.role });
    } catch (e) { next(e); }
  });

  app.use("/api", api);

  const server = createServer(app);
  return server;
}
