/**
 * Database reset + light seed.
 * Run with:  npx tsx server/reset-seed.ts
 *
 * Produces a small, clean dataset:
 *   - 1 admin
 *   - 4 teachers (one per grade 9–12), each teaching one course for that grade
 *   - 10 students per grade (40 total), each enrolled in their grade's course
 *   - a few assignments per course, plus marks and ~10 days of attendance
 *
 * Logins:  admin/admin123 · <first>_teacher/teacher123 · <STU-ID>/student123
 */
import 'dotenv/config';
import { db } from './db';
import {
  users, students, teachers, courses, courseEnrollments,
  assignments, attendance, marks, notifications, calendarEvents,
  assignmentSubmissions,
} from '@shared/schema';
import bcrypt from 'bcryptjs';

const GRADES = [9, 10, 11, 12];
const STUDENTS_PER_GRADE = 10;

const TEACHERS = [
  { firstName: 'Ram', lastName: 'Prasad', subject: 'Mathematics', grade: 9 },
  { firstName: 'Shyam', lastName: 'Kumar', subject: 'English', grade: 10 },
  { firstName: 'Hari', lastName: 'Sharma', subject: 'Science', grade: 11 },
  { firstName: 'Gopal', lastName: 'Dahal', subject: 'Social Studies', grade: 12 },
];

const FIRST_NAMES = [
  'Aarav', 'Aanya', 'Arjun', 'Ananya', 'Vihaan', 'Saanvi', 'Ishaan', 'Diya',
  'Krishna', 'Pihu', 'Rohan', 'Meera', 'Kiran', 'Nisha', 'Deepak', 'Barsha',
  'Suresh', 'Kamala', 'Bishnu', 'Asha',
];
const LAST_NAMES = [
  'Sharma', 'Poudel', 'Maharjan', 'Rana', 'Thapa', 'Gurung', 'Dahal', 'Bhatt',
  'Karki', 'Adhikari', 'Shrestha', 'Bhandari',
];
const SECTIONS = ['A', 'B'];

const pad = (n: number, w = 4) => String(n).padStart(w, '0');
const today = () => new Date().toISOString().split('T')[0];
const generatePhone = () => `984${Math.floor(1000000 + Math.random() * 9000000)}`;
const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const hash = (p: string) => bcrypt.hash(p, 12);

async function run() {
  console.log('🔄 Resetting database and seeding a light dataset...\n');

  // 1. Wipe existing data (order respects foreign keys).
  for (const table of [
    assignmentSubmissions, attendance, marks, assignments,
    courseEnrollments, students, courses, teachers,
    notifications, calendarEvents, users,
  ]) {
    try { await db.delete(table); } catch { /* ignore */ }
  }
  console.log('🗑️  Cleared existing data.');

  // 2. Admin.
  await db.insert(users).values({
    username: 'admin',
    email: 'admin@pathshala.local',
    password: await hash('admin123'),
    role: 'admin',
    status: 'active',
  });

  // 3. Teachers — one per grade, each with one course.
  const teacherCourses: { teacherId: string; courseId: string; grade: number; subject: string }[] = [];
  let tnum = 1;
  for (const t of TEACHERS) {
    const teacherId = `TCH-${pad(tnum++)}`;
    const email = `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@pathshala.local`;
    const [teacher] = await db.insert(teachers).values({
      teacherId,
      firstName: t.firstName,
      lastName: t.lastName,
      email,
      phoneNumber: generatePhone(),
      address: 'Kathmandu, Nepal',
      subject: t.subject,
      qualification: 'M.Ed',
      experience: 5,
      salary: '60000',
      joinDate: '2020-01-15',
      status: 'active',
    }).returning();

    await db.insert(users).values({
      username: `${t.firstName.toLowerCase()}_teacher`,
      email,
      password: await hash('teacher123'),
      role: 'teacher',
      profileId: teacher.id,
      status: 'active',
    });

    const subjPrefix = t.subject.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    const [course] = await db.insert(courses).values({
      courseCode: `${subjPrefix}-G${t.grade}`,
      name: `${t.subject} — Grade ${t.grade}`,
      description: `${t.subject} for Grade ${t.grade}`,
      grade: t.grade,
      subject: t.subject,
      teacherId: teacher.id,
      credits: 4,
      status: 'active',
    }).returning();

    teacherCourses.push({ teacherId: teacher.id, courseId: course.id, grade: t.grade, subject: t.subject });
    console.log(`  ✅ ${t.firstName} ${t.lastName} — ${t.subject} (Grade ${t.grade})`);
  }

  // 4. Students — 10 per grade, enrolled in their grade's course, with marks + attendance.
  const examTypes: string[] = ['midterm', 'final', 'quiz'];
  let snum = 1;
  for (const grade of GRADES) {
    const gradeCourses = teacherCourses.filter(tc => tc.grade === grade);
    for (let i = 0; i < STUDENTS_PER_GRADE; i++) {
      const studentId = `STU-${pad(snum++)}`;
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${studentId.toLowerCase()}@student.pathshala.local`;

      const [student] = await db.insert(students).values({
        studentId,
        firstName,
        lastName,
        email,
        grade,
        section: randomElement(SECTIONS),
        dateOfBirth: '2008-05-15',
        address: 'Kathmandu, Nepal',
        phoneNumber: generatePhone(),
        guardianName: `${randomElement(FIRST_NAMES)} ${lastName}`,
        guardianPhone: generatePhone(),
        status: 'active',
        enrollmentDate: today(),
      }).returning();

      await db.insert(users).values({
        username: studentId,
        email,
        password: await hash('student123'),
        role: 'student',
        profileId: student.id,
        status: 'active',
      });

      for (const tc of gradeCourses) {
        await db.insert(courseEnrollments).values({
          studentId: student.id,
          courseId: tc.courseId,
          enrollmentDate: today(),
          status: 'active',
        });

        // Marks
        for (const et of examTypes) {
          const m = 60 + Math.floor(Math.random() * 40);
          await db.insert(marks).values({
            studentId: student.id,
            courseId: tc.courseId,
            examType: et,
            marks: String(m),
            totalMarks: '100',
            examDate: today(),
            remarks: m >= 75 ? 'Good' : 'Satisfactory',
          });
        }

        // Attendance — last 10 weekdays
        let day = 1;
        let added = 0;
        while (added < 10) {
          const d = new Date();
          d.setDate(d.getDate() - day);
          day++;
          const dow = d.getDay();
          if (dow === 0 || dow === 6) continue;
          const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          await db.insert(attendance).values({
            studentId: student.id,
            courseId: tc.courseId,
            date: d.toISOString().split('T')[0],
            status,
            remarks: null,
          });
          added++;
        }
      }
    }
    console.log(`  ✅ Grade ${grade}: ${STUDENTS_PER_GRADE} students`);
  }

  // 5. A few assignments per course.
  const titles = ['Homework 1', 'Quiz 1', 'Project 1'];
  const types = ['homework', 'quiz', 'project'];
  for (const tc of teacherCourses) {
    for (let i = 0; i < titles.length; i++) {
      await db.insert(assignments).values({
        title: `${titles[i]} — ${tc.subject}`,
        description: `${titles[i]} for ${tc.subject}`,
        courseId: tc.courseId,
        teacherId: tc.teacherId,
        dueDate: '2026-10-15',
        totalPoints: 100,
        type: types[i],
        status: 'active',
        createdAt: today(),
      });
    }
  }

  const finalStudents = await db.select().from(students);
  const finalCourses = await db.select().from(courses);
  console.log('\n✨ Done.');
  console.log(`   Teachers: ${TEACHERS.length} · Courses: ${finalCourses.length} · Students: ${finalStudents.length} (10 per grade)`);
  console.log('\n🔐 Logins:');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: ram_teacher / teacher123 (also shyam_/hari_/gopal_)');
  console.log('   Student: STU-0001 / student123');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
