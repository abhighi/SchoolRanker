/**
 * Database reset and seed script.
 * Run with: npx tsx server/reset-seed.ts
 * 
 * This will:
 * 1. Delete all existing data
 * 2. Re-seed with clean data
 */
import 'dotenv/config';
import { db } from './db';
import { 
  users, students, teachers, courses, courseEnrollments, 
  assignments, attendance, marks, notifications, calendarEvents,
  assignmentSubmissions
} from '@shared/schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TEACHER_DATA = [
  { firstName: 'Ram', lastName: 'Prasad', subject: 'Mathematics', qualification: 'M.Sc. Mathematics', experience: 8 },
  { firstName: 'Shyam', lastName: 'Kumar', subject: 'English', qualification: 'M.A. English', experience: 6 },
  { firstName: 'Hari', lastName: 'Sharma', subject: 'Science', qualification: 'M.Sc. Physics', experience: 10 },
  { firstName: 'Krishna', lastName: 'Bhatt', subject: 'Nepali', qualification: 'M.A. Nepali', experience: 5 },
  { firstName: 'Gopal', lastName: 'Dahal', subject: 'Social Studies', qualification: 'M.A. History', experience: 7 },
  { firstName: 'Nabin', lastName: 'Chaudhary', subject: 'Computer', qualification: 'M.Tech Computer Science', experience: 4 },
  { firstName: 'Bikash', lastName: 'Gurung', subject: 'Health', qualification: 'M.Sc. Health Education', experience: 6 },
  { firstName: 'Prabin', lastName: 'Thapa', subject: 'Mathematics', qualification: 'M.Sc. Mathematics', experience: 3 },
  { firstName: 'Sanjay', lastName: 'Rana', subject: 'Science', qualification: 'M.Sc. Chemistry', experience: 9 },
  { firstName: 'Rajesh', lastName: 'Maharjan', subject: 'English', qualification: 'M.A. English Literature', experience: 12 },
];

const COURSE_DATA = [
  { courseCode: 'MATH101', name: 'Mathematics I', description: 'Basic Mathematics for Grade 10', subject: 'Mathematics', grade: 10 },
  { courseCode: 'ENG101', name: 'English I', description: 'English Language and Literature', subject: 'English', grade: 10 },
  { courseCode: 'SCI101', name: 'Science I', description: 'General Science including Physics, Chemistry, Biology', subject: 'Science', grade: 10 },
  { courseCode: 'NEP101', name: 'Nepali I', description: 'Nepali Language and Grammar', subject: 'Nepali', grade: 10 },
  { courseCode: 'CS101', name: 'Computer Science', description: 'Introduction to Computer Science', subject: 'Computer', grade: 10 },
];

const ASSIGNMENT_TITLES: Record<string, string[]> = {
  'Mathematics': ['Algebra Homework', 'Geometry Quiz', 'Chapter Test', 'Practice Problems', 'Math Project'],
  'English': ['Essay Writing', 'Grammar Exercise', 'Reading Comprehension', 'Vocabulary Test', 'Book Review'],
  'Science': ['Lab Report', 'Science Experiment', 'Chapter Quiz', 'Research Project', 'Diagram Labeling'],
  'Nepali': ['Nepali Essay', 'Grammar Exercise', 'Poem Recitation', 'Story Writing', 'Language Test'],
  'Social Studies': ['History Essay', 'Map Work', 'Current Affairs', 'Project Work', 'Chapter Review'],
  'Computer': ['Coding Exercise', 'Lab Assignment', 'Theory Quiz', 'Project Work', 'Debugging Task'],
  'Health': ['Health Report', 'First Aid Practice', 'Nutrition Project', 'Quiz', 'Health Awareness'],
};

const FIRST_NAMES = [
  'Aarav', 'Aanya', 'Arjun', 'Ananya', 'Reyansh', 'Aadhya', 'Vihaan', 'Saanvi', 'Arnav', 'Pari',
  'Aditya', 'Myra', 'Kavya', 'Ishaan', 'Ayaan', 'Diya', 'Krishna', 'Pihu', 'Raj', 'Tara',
  'Sam', 'Nina', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Quinn', 'Priya', 'Nikita',
  'Sanjay', 'Bikram', 'Milan', 'Sabina', 'Niraj', 'Asmita', 'Rabin', 'Kalpana', 'Rohan', 'Meera',
  'Kiran', 'Nisha', 'Vivek', 'Sunita', 'Ajay', 'Laxmi', 'Deepak', 'Barsha', 'Suresh', 'Kamala',
  'Rajesh', 'Sarita', 'Prakash', 'Kabita', 'Nirajan', 'Sabita', 'Bishnu', 'Asha', 'Niraj', 'Rita',
  'Anil', 'Mina', 'Bijay', 'Niru', 'Dinesh', 'Punam', 'Kamal', 'Sita', 'Gopal', 'Hari'
];

const LAST_NAMES = [
  'Sharma', 'Poudel', 'Maharjan', 'Rana', 'Thapa', 'Chaudhary', 'Gurung', 'Dahal', 'Bhatt', 'Khan',
  'Limbu', 'Magar', 'Tamang', 'Sherpa', 'Das', 'Bishwas', 'Karki', 'Adhikari', 'Bhandari', 'Joshi',
  'Shrestha', 'Dongol', 'Bajracharya', 'Maskey', 'Malla', 'Ranjitkar', 'Upadhyay', 'Poudel', 'Nira', 'Tim'
];

const SECTIONS = ['A', 'B', 'C'];

function generateId(prefix: string, num: number): string {
  return `${prefix}-${String(num).padStart(4, '0')}`;
}

function generatePhone(): string {
  return `984${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDOB(): string {
  const year = 2008 + Math.floor(Math.random() * 4);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateDate(startYear: number, endYear: number): string {
  const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function resetAndSeed() {
  console.log('🔄 Starting database reset and fresh seed...\n');

  // 1. Delete all data in correct order (respecting foreign keys)
  console.log('🗑️  Deleting existing data...');
  
  try {
    await db.delete(assignmentSubmissions);
    console.log('  ✅ Deleted assignment submissions');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(attendance);
    console.log('  ✅ Deleted attendance');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(marks);
    console.log('  ✅ Deleted marks');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(assignments);
    console.log('  ✅ Deleted assignments');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(courseEnrollments);
    console.log('  ✅ Deleted enrollments');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(students);
    console.log('  ✅ Deleted students');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(courses);
    console.log('  ✅ Deleted courses');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(teachers);
    console.log('  ✅ Deleted teachers');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(notifications);
    console.log('  ✅ Deleted notifications');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(calendarEvents);
    console.log('  ✅ Deleted calendar events');
  } catch (e) { /* ignore */ }
  
  try {
    await db.delete(users);
    console.log('  ✅ Deleted users');
  } catch (e) { /* ignore */ }

  console.log('\n🌱 Starting fresh seed...\n');

  // 2. Seed Admin
  console.log('📋 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await db.insert(users).values({
    username: 'admin',
    email: 'admin@pathshala.local',
    password: adminPassword,
    role: 'admin',
    status: 'active',
  });
  console.log('  ✅ Admin: admin / admin123');

  // 3. Seed 10 Teachers
  console.log('\n👨‍🏫 Creating 10 teachers...');
  const createdTeachers: { id: string; teacherId: string; subject: string }[] = [];
  
  for (let i = 0; i < TEACHER_DATA.length; i++) {
    const t = TEACHER_DATA[i];
    const teacherId = generateId('TCH', i + 1);
    const email = `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@pathshala.local`;
    
    const [teacher] = await db.insert(teachers).values({
      teacherId,
      firstName: t.firstName,
      lastName: t.lastName,
      email,
      phoneNumber: generatePhone(),
      address: 'Kathmandu, Nepal',
      subject: t.subject,
      qualification: t.qualification,
      experience: t.experience,
      salary: String(50000 + Math.random() * 50000),
      joinDate: '2020-01-15',
      status: 'active',
    }).returning();
    
    createdTeachers.push({ id: teacher.id, teacherId: teacher.teacherId, subject: teacher.subject });
    
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    await db.insert(users).values({
      username: `${t.firstName.toLowerCase()}_teacher`,
      email,
      password: teacherPassword,
      role: 'teacher',
      profileId: teacher.id,
      status: 'active',
    });
    
    console.log(`  ✅ ${t.firstName} ${t.lastName} (${t.subject})`);
  }

  // 4. Seed 5 Courses
  console.log('\n📚 Creating 5 courses...');
  const createdCourses: { id: string; courseCode: string; teacherId: string; subject: string; name: string }[] = [];
  
  for (let i = 0; i < COURSE_DATA.length; i++) {
    const c = COURSE_DATA[i];
    const teacher = createdTeachers[i];
    
    const [course] = await db.insert(courses).values({
      courseCode: c.courseCode,
      name: c.name,
      description: c.description,
      grade: c.grade,
      subject: c.subject,
      teacherId: teacher.id,
      credits: 4,
      schedule: JSON.stringify({ day: 'Monday-Friday', time: '8:00 AM - 3:00 PM' }),
      status: 'active',
    }).returning();
    
    createdCourses.push({ 
      id: course.id, 
      courseCode: course.courseCode, 
      teacherId: course.teacherId || '',
      subject: course.subject,
      name: course.name
    });
    
    console.log(`  ✅ ${c.name} - Assigned to ${teacher.teacherId}`);
  }

  // 5. Seed 300 Students and Enrollments
  console.log('\n👨‍🎓 Creating 300 students with enrollments...');
  
  const studentEnrollments: { studentId: string; courseId: string; teacherId: string }[] = [];
  
  for (let i = 0; i < 300; i++) {
    const studentId = generateId('STU', i + 1);
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 1}@student.pathshala.local`;
    const grade = 10;
    const section = randomElement(SECTIONS);
    
    const [student] = await db.insert(students).values({
      studentId,
      firstName,
      lastName,
      email,
      grade,
      section,
      dateOfBirth: generateDOB(),
      address: `${Math.floor(Math.random() * 100) + 1}, Kathmandu, Nepal`,
      phoneNumber: generatePhone(),
      guardianName: `${randomElement(FIRST_NAMES)} ${lastName}`,
      guardianPhone: generatePhone(),
      status: 'active',
      enrollmentDate: generateDate(2023, 2024),
    }).returning();
    
    // Create user account
    const studentPassword = await bcrypt.hash('student123', 12);
    await db.insert(users).values({
      username: studentId,
      email,
      password: studentPassword,
      role: 'student',
      profileId: student.id,
      status: 'active',
    });
    
    // Enroll in 3-5 courses (distributed evenly across teachers)
    const numCourses = Math.floor(Math.random() * 3) + 3;
    
    // Distribute students evenly across courses for better teacher-student mapping
    for (let j = 0; j < numCourses; j++) {
      const courseIndex = (i + j) % createdCourses.length;
      const course = createdCourses[courseIndex];
      
      await db.insert(courseEnrollments).values({
        studentId: student.id,
        courseId: course.id,
        enrollmentDate: generateDate(2023, 2024),
        status: 'active',
      });
      
      studentEnrollments.push({
        studentId: student.id,
        courseId: course.id,
        teacherId: course.teacherId
      });
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`  ✅ Created students ${i + 1} - ${Math.min(i + 50, 300)}`);
    }
  }

  // 6. Create Assignments
  console.log('\n📝 Creating assignments for each course...');
  
  for (const course of createdCourses) {
    const titles = ASSIGNMENT_TITLES[course.subject] || ASSIGNMENT_TITLES['Mathematics'];
    const teacher = createdTeachers.find(t => t.id === course.teacherId) || createdTeachers[0];
    
    for (let i = 0; i < 5; i++) {
      await db.insert(assignments).values({
        title: titles[i],
        description: `${titles[i]} for ${course.name}`,
        courseId: course.id,
        teacherId: teacher.id,
        dueDate: generateDate(2025, 2026),
        totalPoints: 100,
        type: ['assignment', 'homework', 'project', 'quiz', 'test'][i % 5] as any,
        status: 'active',
        createdAt: generateDate(2024, 2025),
      });
    }
    console.log(`  ✅ ${course.name}: 5 assignments`);
  }

  // 7. Create Attendance
  console.log('\n📅 Creating attendance records...');
  
  const enrollments = await db.select().from(courseEnrollments);
  let attendanceCount = 0;
  
  for (let batch = 0; batch < enrollments.length; batch += 200) {
    const batchEnrollments = enrollments.slice(batch, batch + 200);
    const promises: Promise<any>[] = [];
    
    for (const enrollment of batchEnrollments) {
      // Create attendance for last 20 days
      for (let day = 1; day <= 20; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
        
        promises.push(
          db.insert(attendance).values({
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            date: dateStr,
            status,
            remarks: null,
          })
        );
      }
    }
    
    await Promise.all(promises);
    attendanceCount += promises.length;
    console.log(`  ✅ Batch ${Math.floor(batch / 200) + 1}: ${promises.length} records`);
  }
  console.log(`  ✅ Total: ${attendanceCount} attendance records`);

  // 8. Create Marks
  console.log('\n📊 Creating marks/grades...');
  
  const examTypes = ['midterm', 'final', 'quiz', 'assignment', 'project'] as const;
  let marksCount = 0;
  
  for (let batch = 0; batch < enrollments.length; batch += 200) {
    const batchEnrollments = enrollments.slice(batch, batch + 200);
    const promises: Promise<any>[] = [];
    
    for (const enrollment of batchEnrollments) {
      for (let e = 0; e < 3; e++) {
        const totalMarks = 100;
        const obtainedMarks = Math.floor(Math.random() * 40) + 60;
        
        promises.push(
          db.insert(marks).values({
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            examType: examTypes[e],
            marks: String(obtainedMarks),
            totalMarks: String(totalMarks),
            examDate: generateDate(2024, 2025),
            remarks: obtainedMarks >= 90 ? 'Excellent' : (obtainedMarks >= 75 ? 'Good' : 'Satisfactory'),
          })
        );
      }
    }
    
    await Promise.all(promises);
    marksCount += promises.length;
    console.log(`  ✅ Batch ${Math.floor(batch / 200) + 1}: ${promises.length} records`);
  }
  console.log(`  ✅ Total: ${marksCount} marks records`);

  // Summary
  const finalTeachers = await db.select().from(teachers);
  const finalCourses = await db.select().from(courses);
  const finalStudents = await db.select().from(students);
  const finalEnrollments = await db.select().from(courseEnrollments);
  const finalAssignments = await db.select().from(assignments);
  const finalAttendance = await db.select().from(attendance);
  const finalMarks = await db.select().from(marks);

  console.log('\n✅ Reset and seed complete!');
  console.log('\n📊 Final Database Summary:');
  console.log(`   - Teachers: ${finalTeachers.length}`);
  console.log(`   - Courses: ${finalCourses.length}`);
  console.log(`   - Students: ${finalStudents.length}`);
  console.log(`   - Enrollments: ${finalEnrollments.length}`);
  console.log(`   - Assignments: ${finalAssignments.length}`);
  console.log(`   - Attendance: ${finalAttendance.length}`);
  console.log(`   - Marks: ${finalMarks.length}`);

  // Show teacher-student relationships
  console.log('\n👥 Teacher-Student Relationships:');
  for (const teacher of createdTeachers) {
    const teacherCourses = createdCourses.filter(c => c.teacherId === teacher.id);
    const courseIds = teacherCourses.map(c => c.id);
    const studentCount = finalEnrollments.filter(e => courseIds.includes(e.courseId)).length;
    console.log(`   - ${teacher.subject}: ${teacherCourses.length} courses, ${studentCount} students`);
  }

  console.log('\n🔐 Login Credentials:');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: ram_teacher / teacher123');
  console.log('   Student: STU-0001 / student123');

  process.exit(0);
}

resetAndSeed().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
