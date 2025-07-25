import { 
  type Student, type InsertStudent,
  type Teacher, type InsertTeacher,
  type Course, type InsertCourse,
  type Mark, type InsertMark,
  type Attendance, type InsertAttendance,
  type CourseEnrollment, type InsertCourseEnrollment,
  type StudentWithGPA, type SubjectTopper
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  // Analytics operations
  getStudentsWithGPA(): Promise<StudentWithGPA[]>;
  getSubjectToppers(): Promise<SubjectTopper[]>;
  getAttendanceStats(): Promise<{ totalClasses: number; presentClasses: number; percentage: number }>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student> = new Map();
  private teachers: Map<string, Teacher> = new Map();
  private courses: Map<string, Course> = new Map();
  private marks: Map<string, Mark> = new Map();
  private attendance: Map<string, Attendance> = new Map();
  private courseEnrollments: Map<string, CourseEnrollment> = new Map();

  constructor() {
    // Initialize with empty data
  }

  // Student operations
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(student => student.studentId === studentId);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...updateData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  // Teacher operations
  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacherByTeacherId(teacherId: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(teacher => teacher.teacherId === teacherId);
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const teacher: Teacher = { ...insertTeacher, id };
    this.teachers.set(id, teacher);
    return teacher;
  }

  async updateTeacher(id: string, updateData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const teacher = this.teachers.get(id);
    if (!teacher) return undefined;
    
    const updatedTeacher = { ...teacher, ...updateData };
    this.teachers.set(id, updatedTeacher);
    return updatedTeacher;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    return this.teachers.delete(id);
  }

  // Course operations
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourseByCourseCode(courseCode: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(course => course.courseCode === courseCode);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { ...insertCourse, id };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: string, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...updateData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
  }

  async getCoursesByGrade(grade: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.grade === grade);
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.teacherId === teacherId);
  }

  // Mark operations
  async getMark(id: string): Promise<Mark | undefined> {
    return this.marks.get(id);
  }

  async getAllMarks(): Promise<Mark[]> {
    return Array.from(this.marks.values());
  }

  async createMark(insertMark: InsertMark): Promise<Mark> {
    const id = randomUUID();
    const mark: Mark = { ...insertMark, id };
    this.marks.set(id, mark);
    return mark;
  }

  async updateMark(id: string, updateData: Partial<InsertMark>): Promise<Mark | undefined> {
    const mark = this.marks.get(id);
    if (!mark) return undefined;
    
    const updatedMark = { ...mark, ...updateData };
    this.marks.set(id, updatedMark);
    return updatedMark;
  }

  async deleteMark(id: string): Promise<boolean> {
    return this.marks.delete(id);
  }

  async getMarksByStudent(studentId: string): Promise<Mark[]> {
    return Array.from(this.marks.values()).filter(mark => mark.studentId === studentId);
  }

  async getMarksByCourse(courseId: string): Promise<Mark[]> {
    return Array.from(this.marks.values()).filter(mark => mark.courseId === courseId);
  }

  // Attendance operations
  async getAttendance(id: string): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: string, updateData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...updateData };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    return this.attendance.delete(id);
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.studentId === studentId);
  }

  async getAttendanceByCourse(courseId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.courseId === courseId);
  }

  // Course Enrollment operations
  async getCourseEnrollment(id: string): Promise<CourseEnrollment | undefined> {
    return this.courseEnrollments.get(id);
  }

  async getAllCourseEnrollments(): Promise<CourseEnrollment[]> {
    return Array.from(this.courseEnrollments.values());
  }

  async createCourseEnrollment(insertEnrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const id = randomUUID();
    const enrollment: CourseEnrollment = { ...insertEnrollment, id };
    this.courseEnrollments.set(id, enrollment);
    return enrollment;
  }

  async updateCourseEnrollment(id: string, updateData: Partial<InsertCourseEnrollment>): Promise<CourseEnrollment | undefined> {
    const enrollment = this.courseEnrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...updateData };
    this.courseEnrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteCourseEnrollment(id: string): Promise<boolean> {
    return this.courseEnrollments.delete(id);
  }

  async getEnrollmentsByStudent(studentId: string): Promise<CourseEnrollment[]> {
    return Array.from(this.courseEnrollments.values()).filter(enrollment => enrollment.studentId === studentId);
  }

  async getEnrollmentsByCourse(courseId: string): Promise<CourseEnrollment[]> {
    return Array.from(this.courseEnrollments.values()).filter(enrollment => enrollment.courseId === courseId);
  }

  // Analytics operations
  async getStudentsWithGPA(): Promise<StudentWithGPA[]> {
    const students = await this.getAllStudents();
    const studentsWithGPA: StudentWithGPA[] = [];

    for (const student of students) {
      const studentMarks = await this.getMarksByStudent(student.id);
      
      if (studentMarks.length === 0) {
        studentsWithGPA.push({
          ...student,
          gpa: 0,
          totalMarks: 0,
        });
        continue;
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

      const gpa = (totalPercentage / studentMarks.length) / 25; // Convert to 4.0 scale
      
      studentsWithGPA.push({
        ...student,
        gpa: Math.round(gpa * 100) / 100,
        totalMarks: Math.round(totalMarksSum * 100) / 100,
      });
    }

    return studentsWithGPA;
  }

  async getSubjectToppers(): Promise<SubjectTopper[]> {
    const courses = await this.getAllCourses();
    const toppers: SubjectTopper[] = [];

    for (const course of courses) {
      const courseMarks = await this.getMarksByCourse(course.id);
      
      if (courseMarks.length === 0) continue;

      const studentPerformance = new Map<string, { totalMarks: number; totalPossible: number; student?: Student }>();

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

      for (const [studentId, performance] of studentPerformance) {
        const percentage = (performance.totalMarks / performance.totalPossible) * 100;
        if (percentage > bestPercentage) {
          bestPercentage = percentage;
          bestStudentId = studentId;
        }
      }

      if (bestStudentId) {
        const student = await this.getStudent(bestStudentId);
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

  async getAttendanceStats(): Promise<{ totalClasses: number; presentClasses: number; percentage: number }> {
    const allAttendance = await this.getAllAttendance();
    const totalClasses = allAttendance.length;
    const presentClasses = allAttendance.filter(att => att.status === 'present').length;
    const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return {
      totalClasses,
      presentClasses,
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}

export const storage = new MemStorage();
