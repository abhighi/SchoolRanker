import { type StudentWithGPA } from "@shared/schema";

// Quick Sort implementation for student rankings
export function quickSortStudentsByGPA(students: StudentWithGPA[], low = 0, high = students.length - 1): StudentWithGPA[] {
  if (low < high) {
    const pivotIndex = partition(students, low, high);
    quickSortStudentsByGPA(students, low, pivotIndex - 1);
    quickSortStudentsByGPA(students, pivotIndex + 1, high);
  }
  return students;
}

function partition(students: StudentWithGPA[], low: number, high: number): number {
  const pivot = students[high].gpa;
  let i = low - 1;

  for (let j = low; j < high; j++) {
    // Sort in descending order (highest GPA first)
    if (students[j].gpa > pivot) {
      i++;
      [students[i], students[j]] = [students[j], students[i]];
    }
  }

  [students[i + 1], students[high]] = [students[high], students[i + 1]];
  return i + 1;
}

// Merge Sort implementation for student rankings (alternative sorting algorithm)
export function mergeSortStudentsByGPA(students: StudentWithGPA[]): StudentWithGPA[] {
  if (students.length <= 1) return students;

  const mid = Math.floor(students.length / 2);
  const left = mergeSortStudentsByGPA(students.slice(0, mid));
  const right = mergeSortStudentsByGPA(students.slice(mid));

  return merge(left, right);
}

function merge(left: StudentWithGPA[], right: StudentWithGPA[]): StudentWithGPA[] {
  const result: StudentWithGPA[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    // Sort in descending order (highest GPA first)
    if (left[leftIndex].gpa >= right[rightIndex].gpa) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// Add ranking numbers to sorted students
export function addRankingsToStudents(students: StudentWithGPA[]): StudentWithGPA[] {
  return students.map((student, index) => ({
    ...student,
    rank: index + 1
  }));
}

// Get top N students
export function getTopStudents(students: StudentWithGPA[], count: number): StudentWithGPA[] {
  const sortedStudents = quickSortStudentsByGPA([...students]);
  const rankedStudents = addRankingsToStudents(sortedStudents);
  return rankedStudents.slice(0, count);
}

// Get students below average
export function getBelowAverageStudents(students: StudentWithGPA[]): StudentWithGPA[] {
  if (students.length === 0) return [];
  
  const totalGPA = students.reduce((sum, student) => sum + student.gpa, 0);
  const averageGPA = totalGPA / students.length;
  
  return students.filter(student => student.gpa < averageGPA);
}

// Calculate performance categories
export function categorizeStudentPerformance(students: StudentWithGPA[]) {
  if (students.length === 0) {
    return {
      aboveAverage: 0,
      average: 0,
      belowAverage: 0,
      averageGPA: 0
    };
  }

  const totalGPA = students.reduce((sum, student) => sum + student.gpa, 0);
  const averageGPA = totalGPA / students.length;
  
  const aboveAverage = students.filter(s => s.gpa > averageGPA + 0.3).length;
  const average = students.filter(s => s.gpa >= averageGPA - 0.3 && s.gpa <= averageGPA + 0.3).length;
  const belowAverage = students.filter(s => s.gpa < averageGPA - 0.3).length;

  return {
    aboveAverage: Math.round((aboveAverage / students.length) * 100),
    average: Math.round((average / students.length) * 100),
    belowAverage: Math.round((belowAverage / students.length) * 100),
    averageGPA: Math.round(averageGPA * 100) / 100
  };
}
