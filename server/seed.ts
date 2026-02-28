/**
 * Database seed script — creates demo users with hashed passwords.
 * Run with: npm run db:seed
 * 
 * Seeds:
 * - 1 Admin user
 * - 10 Teachers with user accounts
 * - 5 Courses assigned to teachers
 * - 300 Students enrolled in courses
 * - Assignments for each course
 * - Attendance records for each student
 * - Marks/Grades for students
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { 
  users, students, teachers, courses, courseEnrollments, 
  assignments, attendance, marks 
} from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

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
  { courseCode: 'MATH101', name: 'Mathematics I', description: 'Basic Mathematics for Grade 1-12', subject: 'Mathematics', grade: 10 },
  { courseCode: 'ENG101', name: 'English I', description: 'English Language and Literature', subject: 'English', grade: 10 },
  { courseCode: 'SCI101', name: 'Science I', description: 'General Science including Physics, Chemistry, Biology', subject: 'Science', grade: 10 },
  { courseCode: 'NEP101', name: 'Nepali I', description: 'Nepali Language and Grammar', subject: 'Nepali', grade: 10 },
  { courseCode: 'CS101', name: 'Computer Science', description: 'Introduction to Computer Science', subject: 'Computer', grade: 10 },
];

const ASSIGNMENT_TITLES = {
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
  'Aditya', 'Myra', 'Arnav', 'Kavya', 'Ishaan', 'Ananya', 'Ayaan', 'Diya', 'Krishna', 'Pihu',
  'Raj', 'Tara', 'Sam', 'Nina', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Quinn',
  'Priya', 'Nikita', 'Sanjay', 'Bikram', 'Milan', 'Sabina', 'Niraj', 'Asmita', 'Rabin', 'Kalpana',
  'Rohan', 'Meera', 'Kiran', 'Nisha', 'Vivek', 'Sunita', 'Ajay', 'Laxmi', 'Deepak', 'Barsha',
  'Suresh', 'Kamala', 'Rajesh', 'Sarita', 'Prakash', 'Kabita', 'Nirajan', 'Sabita', 'Bishnu', 'Asha'
];

const LAST_NAMES = [
  'Sharma', 'Poudel', 'Maharjan', 'Rana', 'Thapa', 'Chaudhary', 'Gurung', 'Dahal', 'Bhatt', 'Khan',
  'Limbu', 'Magar', 'Tamang', 'Sherpa', 'Das', 'Bishwas', 'Karki', 'Adhikari', 'Poudel', 'Bhandari',
  'Joshi', 'Poudel', 'Shrestha', 'Dongol', 'Bajracharya', 'Maskey', 'Malla', 'Ranjitkar', 'Upadhyay', 'Poudel'
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

function randomGrade(): number {
  return Math.floor(Math.random() * 4) + 9; // Grades 9, 10, 11, 12
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

async function seed() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // 1. Seed Admin User
  console.log('📋 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  try {
    await db.insert(users).values({
      username: 'admin',
      email: 'admin@pathshala.local',
      password: adminPassword,
      role: 'admin',
      status: 'active',
    }).onConflictDoNothing();
    console.log('  ✅ Admin user created (admin / admin123)');
  } catch (err: any) {
    if (err.code === '23505') {
      console.log('  ⏭️  Admin user already exists');
    } else {
      throw err;
    }
  }

  // 2. Get or Create 10 Teachers
  console.log('\n👨‍🏫 Creating 10 teachers...');
  let createdTeachers: { id: string; teacherId: string; subject: string }[] = [];
  
  // Check if teachers already exist
  const existingTeachers = await db.select().from(teachers);
  
  if (existingTeachers.length >= 10) {
    console.log('  ⏭️  Teachers already exist, using existing data');
    createdTeachers = existingTeachers.slice(0, 10).map(t => ({ 
      id: t.id, 
      teacherId: t.teacherId, 
      subject: t.subject 
    }));
  } else {
    for (let i = 0; i < TEACHER_DATA.length; i++) {
      const teacherData = TEACHER_DATA[i];
      const teacherId = generateId('TCH', i + 1);
      const email = `${teacherData.firstName.toLowerCase()}.${teacherData.lastName.toLowerCase()}@pathshala.local`;
      
      try {
        const [teacher] = await db.insert(teachers).values({
          teacherId,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          email,
          phoneNumber: generatePhone(),
          address: 'Kathmandu, Nepal',
          subject: teacherData.subject,
          qualification: teacherData.qualification,
          experience: teacherData.experience,
          salary: String(50000 + Math.random() * 50000),
          joinDate: '2020-01-15',
          status: 'active',
        }).onConflictDoNothing().returning();
        
        if (teacher) {
          createdTeachers.push({ id: teacher.id, teacherId: teacher.teacherId, subject: teacher.subject });
          
          const teacherPassword = await bcrypt.hash('teacher123', 12);
          try {
            await db.insert(users).values({
              username: `${teacherData.firstName.toLowerCase()}_teacher`,
              email,
              password: teacherPassword,
              role: 'teacher',
              profileId: teacher.id,
              status: 'active',
            }).onConflictDoNothing();
            console.log(`  ✅ Teacher ${i + 1}: ${teacherData.firstName} ${teacherData.lastName} (${teacherId}) - ${teacherData.subject}`);
          } catch (err: any) {
            if (err.code !== '23505') throw err;
          }
        }
      } catch (err: any) {
        if (err.code !== '23505') throw err;
        console.log(`  ⏭️  Teacher ${i + 1} already exists`);
      }
    }
  }

  // 3. Get or Create 5 Courses
  console.log('\n📚 Creating 5 courses...');
  let createdCourses: { id: string; courseCode: string; teacherId: string; subject: string; name: string }[] = [];
  
  // Check if courses already exist
  const existingCourses = await db.select().from(courses);
  
  if (existingCourses.length >= 5) {
    console.log('  ⏭️  Courses already exist, using existing data');
    createdCourses = existingCourses.slice(0, 5).map(c => ({ 
      id: c.id, 
      courseCode: c.courseCode, 
      teacherId: c.teacherId || '',
      subject: c.subject,
      name: c.name
    }));
  } else {
    for (let i = 0; i < COURSE_DATA.length; i++) {
      const courseData = COURSE_DATA[i];
      const teacher = createdTeachers[i % Math.max(createdTeachers.length, 1)];
      
      try {
        const [course] = await db.insert(courses).values({
          courseCode: courseData.courseCode,
          name: courseData.name,
          description: courseData.description,
          grade: courseData.grade,
          subject: courseData.subject,
          teacherId: teacher?.id,
          credits: 4,
          schedule: JSON.stringify({ day: 'Monday-Friday', time: '8:00 AM - 3:00 PM' }),
          status: 'active',
        }).onConflictDoNothing().returning();
        
        if (course) {
          createdCourses.push({ 
            id: course.id, 
            courseCode: course.courseCode, 
            teacherId: course.teacherId || '',
            subject: course.subject,
            name: course.name
          });
          console.log(`  ✅ Course ${i + 1}: ${courseData.name} (${courseData.courseCode})`);
        }
      } catch (err: any) {
        if (err.code !== '23505') throw err;
        console.log(`  ⏭️  Course ${courseData.courseCode} already exists`);
      }
    }
  }

  // 4. Get or Create 300 Students with Enrollments
  console.log('\n👨‍🎓 Creating 300 students with course enrollments...');
  
  // Check if students already exist
  const existingStudents = await db.select().from(students);
  
  if (existingStudents.length >= 300) {
    console.log('  ⏭️  Students already exist, using existing data');
  } else {
    const batchSize = 50;
    const totalStudents = 300;
    const studentCount = existingStudents.length;
    const studentsToCreate = totalStudents - studentCount;
    
    for (let batch = 0; batch < studentsToCreate / batchSize; batch++) {
      const startIdx = studentCount + batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalStudents);
      
      const studentPromises: Promise<any>[] = [];
      
      for (let i = startIdx; i < endIdx; i++) {
        const studentId = generateId('STU', i + 1);
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i + 1}@student.pathshala.local`;
        const grade = randomGrade();
        const section = randomElement(SECTIONS);
        
        const promise = db.insert(students).values({
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
        }).onConflictDoNothing().returning();
        
        studentPromises.push(promise);
      }
      
      const results = await Promise.all(studentPromises);
      
      for (const result of results) {
        if (result && result[0]) {
          const student = result[0];
          
          const studentPassword = await bcrypt.hash('student123', 12);
          try {
            await db.insert(users).values({
              username: student.studentId,
              email: student.email,
              password: studentPassword,
              role: 'student',
              profileId: student.id,
              status: 'active',
            }).onConflictDoNothing();
          } catch (err: any) {
            if (err.code !== '23505') console.log('  ⚠️  User creation error:', err.message);
          }
          
          // Enroll student in courses (2-4 random courses)
          const numCourses = Math.floor(Math.random() * 3) + 2;
          const shuffledCourses = [...createdCourses].sort(() => Math.random() - 0.5);
          
          for (let j = 0; j < numCourses && j < shuffledCourses.length; j++) {
            await db.insert(courseEnrollments).values({
              studentId: student.id,
              courseId: shuffledCourses[j].id,
              enrollmentDate: generateDate(2023, 2024),
              status: 'active',
            }).onConflictDoNothing();
          }
        }
      }
      
      console.log(`  ✅ Created students ${startIdx + 1} - ${endIdx} with course enrollments`);
    }
  }

  // 5. Get or Create Assignments for Each Course
  console.log('\n📝 Creating assignments for each course...');
  
  const existingAssignments = await db.select().from(assignments);
  
  if (existingAssignments.length >= createdCourses.length * 5) {
    console.log('  ⏭️  Assignments already exist');
  } else {
    for (const course of createdCourses) {
      const subject = course.subject || 'Mathematics';
      const assignmentTitles = ASSIGNMENT_TITLES[subject as keyof typeof ASSIGNMENT_TITLES] || ASSIGNMENT_TITLES['Mathematics'];
      const teacher = createdTeachers.find(t => t.id === course.teacherId) || createdTeachers[0];
      
      // Check if assignments exist for this course
      const courseAssignments = existingAssignments.filter(a => a.courseId === course.id);
      if (courseAssignments.length >= 5) continue;
      
      for (let i = 0; i < 5; i++) {
        const dueDate = generateDate(2025, 2026);
        
        try {
          await db.insert(assignments).values({
            title: assignmentTitles[i],
            description: `${assignmentTitles[i]} for ${course.name} - Complete all exercises and submit on time.`,
            courseId: course.id,
            teacherId: teacher?.id,
            dueDate,
            totalPoints: 100,
            type: ['assignment', 'homework', 'project', 'quiz', 'test'][i % 5] as any,
            status: 'active',
            createdAt: generateDate(2024, 2025),
          }).onConflictDoNothing();
        } catch (err: any) {
          // Skip duplicates
        }
      }
      console.log(`  ✅ Created 5 assignments for ${course.name}`);
    }
  }

  // 6. Create Attendance Records for Each Student (last 30 days)
  console.log('\n📅 Creating attendance records for each student...');
  
  // Get all student-course enrollments
  const allEnrollments = await db.select().from(courseEnrollments);
  
  // Check existing attendance
  const existingAttendance = await db.select().from(attendance);
  
  if (existingAttendance.length >= allEnrollments.length * 20) {
    console.log('  ⏭️  Attendance records already exist');
  } else {
    const attendanceBatchSize = 200;
    let attendanceCount = 0;
    
    for (let i = 0; i < allEnrollments.length; i += attendanceBatchSize) {
      const batch = allEnrollments.slice(i, i + attendanceBatchSize);
      const attendancePromises: Promise<any>[] = [];
      
      for (const enrollment of batch) {
        // Create attendance for last 30 days (skip if already exists)
        for (let day = 0; day < 30; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          const dateStr = date.toISOString().split('T')[0];
          
          // Skip weekends
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          // Check if attendance already exists
          const existingRecord = existingAttendance.find(
            a => a.studentId === enrollment.studentId && 
                 a.courseId === enrollment.courseId && 
                 a.date === dateStr
          );
          if (existingRecord) continue;
          
          const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
          
          attendancePromises.push(
            db.insert(attendance).values({
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
              date: dateStr,
              status,
              remarks: status === 'absent' ? 'Excused absence' : null,
            }).onConflictDoNothing()
          );
        }
      }
      
      if (attendancePromises.length > 0) {
        await Promise.all(attendancePromises);
        attendanceCount += attendancePromises.length;
        console.log(`  ✅ Created attendance for batch ${Math.floor(i / attendanceBatchSize) + 1}`);
      }
    }
    console.log(`  ✅ Total new attendance records: ${attendanceCount}`);
  }

  // 7. Create Marks/Grades for Students
  console.log('\n📊 Creating marks/grades for each student...');
  
  const examTypes = ['midterm', 'final', 'quiz', 'assignment', 'project'] as const;
  
  // Check existing marks
  const existingMarks = await db.select().from(marks);
  
  if (existingMarks.length >= allEnrollments.length * 3) {
    console.log('  ⏭️  Marks records already exist');
  } else {
    const marksBatchSize = 200;
    let marksCount = 0;
    
    for (let i = 0; i < allEnrollments.length; i += marksBatchSize) {
      const batch = allEnrollments.slice(i, i + marksBatchSize);
      const marksPromises: Promise<any>[] = [];
      
      for (const enrollment of batch) {
        // Create marks for 3-5 exams per course
        const numExams = Math.floor(Math.random() * 3) + 3;
        
        for (let e = 0; e < numExams; e++) {
          // Check if marks already exist
          const existingRecord = existingMarks.find(
            m => m.studentId === enrollment.studentId && 
                 m.courseId === enrollment.courseId &&
                 m.examType === examTypes[e % examTypes.length]
          );
          if (existingRecord) continue;
          
          const totalMarks = 100;
          const obtainedMarks = Math.floor(Math.random() * 40) + 60; // 60-100 range
          
          marksPromises.push(
            db.insert(marks).values({
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
              examType: examTypes[e % examTypes.length],
              marks: String(obtainedMarks),
              totalMarks: String(totalMarks),
              examDate: generateDate(2024, 2025),
              remarks: obtainedMarks >= 90 ? 'Excellent' : (obtainedMarks >= 75 ? 'Good' : (obtainedMarks >= 60 ? 'Satisfactory' : 'Needs Improvement')),
            }).onConflictDoNothing()
          );
        }
      }
      
      if (marksPromises.length > 0) {
        await Promise.all(marksPromises);
        marksCount += marksPromises.length;
        console.log(`  ✅ Created marks for batch ${Math.floor(i / marksBatchSize) + 1}`);
      }
    }
    console.log(`  ✅ Total new marks records: ${marksCount}`);
  }

  // Final count summary
  const finalTeachers = await db.select().from(teachers);
  const finalCourses = await db.select().from(courses);
  const finalStudents = await db.select().from(students);
  const finalEnrollments = await db.select().from(courseEnrollments);
  const finalAssignments = await db.select().from(assignments);
  const finalAttendance = await db.select().from(attendance);
  const finalMarks = await db.select().from(marks);

  console.log('\n✨ Seed complete! Demo credentials:');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: [firstname]_teacher / teacher123');
  console.log('   Student: [student-id] / student123');
  console.log('\n📊 Final Database Summary:');
  console.log(`   - Teachers: ${finalTeachers.length}`);
  console.log(`   - Courses: ${finalCourses.length}`);
  console.log(`   - Students: ${finalStudents.length}`);
  console.log(`   - Enrollments: ${finalEnrollments.length}`);
  console.log(`   - Assignments: ${finalAssignments.length}`);
  console.log(`   - Attendance records: ${finalAttendance.length}`);
  console.log(`   - Marks records: ${finalMarks.length}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
