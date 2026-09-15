/**
 * Database reset + light seed (multi-subject).
 * Run with:  npx tsx server/reset-seed.ts
 *
 * Produces a small, clean, RICH dataset so the Focus-Subject Recommender has a
 * real student × subject matrix to work with:
 *   - 1 admin
 *   - 5 subject teachers, each teaching all 4 grades (9–12) → 20 courses
 *     (Mathematics, English, Science, Social Studies, Computer Science)
 *   - 10 students per grade (40 total), each enrolled in ALL 5 subjects of their
 *     grade → 200 enrollments
 *   - marks for 3 exam types (midterm/final/quiz) per enrollment, with each
 *     student genuinely strong in some subjects and weak in others (+ a small
 *     midterm→final trend) → 600 marks
 *   - ~10 weekdays of attendance per enrollment, plus a few assignments/course
 *
 * Logins:  admin/admin123 · <subject>_teacher/teacher123 · <STU-ID>/student123
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

// One teacher per subject; each teaches every grade.
const SUBJECTS = [
  { subject: 'Mathematics',    code: 'MATH', first: 'Ram',   last: 'Prasad'  },
  { subject: 'English',        code: 'ENG',  first: 'Shyam', last: 'Kumar'   },
  { subject: 'Science',        code: 'SCI',  first: 'Hari',  last: 'Sharma'  },
  { subject: 'Social Studies', code: 'SOC',  first: 'Gopal', last: 'Dahal'   },
  { subject: 'Computer Science', code: 'COMP', first: 'Sita', last: 'Rai'    },
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
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const hash = (p: string) => bcrypt.hash(p, 12);

async function run() {
  console.log('🔄 Resetting database and seeding a rich multi-subject dataset...\n');

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

  // 3. Teachers — one per subject, each teaching a course for every grade.
  //    teacherCourses maps (teacher, subject) → the course for each grade.
  const teacherCourses: { teacherId: string; courseId: string; grade: number; subject: string }[] = [];
  let tnum = 1;
  for (const s of SUBJECTS) {
    const teacherId = `TCH-${pad(tnum++)}`;
    const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}@pathshala.local`;
    const [teacher] = await db.insert(teachers).values({
      teacherId,
      firstName: s.first,
      lastName: s.last,
      email,
      phoneNumber: generatePhone(),
      address: 'Kathmandu, Nepal',
      subject: s.subject,
      qualification: 'M.Ed',
      experience: 5,
      salary: '60000',
      joinDate: '2020-01-15',
      status: 'active',
    }).returning();

    // Login username derived from subject, e.g. math_teacher, english_teacher.
    const uname = `${s.subject.split(' ')[0].toLowerCase()}_teacher`;
    await db.insert(users).values({
      username: uname,
      email,
      password: await hash('teacher123'),
      role: 'teacher',
      profileId: teacher.id,
      status: 'active',
    });

    for (const grade of GRADES) {
      const [course] = await db.insert(courses).values({
        courseCode: `${s.code}-G${grade}`,
        name: `${s.subject} — Grade ${grade}`,
        description: `${s.subject} for Grade ${grade}`,
        grade,
        subject: s.subject,
        teacherId: teacher.id,
        credits: 4,
        status: 'active',
      }).returning();
      teacherCourses.push({ teacherId: teacher.id, courseId: course.id, grade, subject: s.subject });
    }
    console.log(`  ✅ ${s.first} ${s.last} — ${s.subject} (Grades 9–12), login: ${uname}`);
  }

  // 4. Students — 10 per grade, enrolled in ALL subjects of their grade, with
  //    per-subject marks (varied ability) + attendance.
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

      // A baseline ability for this student (some students stronger overall).
      const baseAbility = 55 + Math.floor(Math.random() * 30); // 55–85

      for (const tc of gradeCourses) {
        await db.insert(courseEnrollments).values({
          studentId: student.id,
          courseId: tc.courseId,
          enrollmentDate: today(),
          status: 'active',
        });

        // Per-subject offset: makes each student strong in some, weak in others.
        const subjectOffset = Math.floor(Math.random() * 41) - 20; // -20..+20
        const midtermBase = clamp(baseAbility + subjectOffset, 35, 100);
        // Small trend: some subjects improve toward the final, some slip.
        const trendDelta = Math.floor(Math.random() * 21) - 10; // -10..+10

        const midterm = clamp(midtermBase + (Math.random() * 6 - 3), 35, 100);
        const finalScore = clamp(midtermBase + trendDelta + (Math.random() * 6 - 3), 35, 100);
        const quiz = clamp(midtermBase + (Math.random() * 10 - 5), 35, 100);

        const examMarks: { type: string; value: number }[] = [
          { type: 'midterm', value: Math.round(midterm) },
          { type: 'final', value: Math.round(finalScore) },
          { type: 'quiz', value: Math.round(quiz) },
        ];

        for (const em of examMarks) {
          await db.insert(marks).values({
            studentId: student.id,
            courseId: tc.courseId,
            examType: em.type,
            marks: String(em.value),
            totalMarks: '100',
            examDate: today(),
            remarks: em.value >= 75 ? 'Good' : em.value >= 50 ? 'Satisfactory' : 'Needs improvement',
          });
        }

        // Attendance — last 10 weekdays.
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
    console.log(`  ✅ Grade ${grade}: ${STUDENTS_PER_GRADE} students × ${gradeCourses.length} subjects`);
  }

  // 5. A few assignments per course.
  const titles = ['Homework 1', 'Quiz 1', 'Project 1'];
  const types = ['homework', 'quiz', 'project'];
  for (const tc of teacherCourses) {
    for (let i = 0; i < titles.length; i++) {
      await db.insert(assignments).values({
        title: `${titles[i]} — ${tc.subject} (Grade ${tc.grade})`,
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
  const finalMarks = await db.select().from(marks);
  console.log('\n✨ Done.');
  console.log(`   Teachers: ${SUBJECTS.length} · Courses: ${finalCourses.length} · Students: ${finalStudents.length} · Marks: ${finalMarks.length}`);
  console.log('\n🔐 Logins:');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: math_teacher / teacher123 (also english_/science_/social_/computer_)');
  console.log('   Student: STU-0001 / student123');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
