import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, Users, GraduationCap, BookOpen, TrendingUp, 
  TrendingDown, Calendar, Award, PieChart, Activity, 
  Download, FileSpreadsheet, FileText, Crown, Trophy
} from "lucide-react";
import { 
  categorizeStudentPerformance, 
  getTopStudents, 
  getBelowAverageStudents,
  quickSortStudentsByGPA,
  mergeSortStudentsByGPA,
  addRankingsToStudents
} from "@/lib/ranking";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import type { StudentWithGPA, SubjectTopper, Student, Teacher, Course } from "@shared/schema";

export default function Analytics() {
  const { toast } = useToast();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<{
    totalStudents: number;
    activeTeachers: number;
    totalCourses: number;
    avgAttendance: number;
  }>({
    queryKey: ["/api/analytics/dashboard-stats"],
  });

  const { data: studentsWithGPA = [], isLoading: studentsLoading } = useQuery<StudentWithGPA[]>({
    queryKey: ["/api/analytics/students-gpa"],
  });

  const { data: subjectToppers = [], isLoading: toppersLoading } = useQuery<SubjectTopper[]>({
    queryKey: ["/api/analytics/subject-toppers"],
  });

  const { data: attendanceStats, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/analytics/attendance-stats"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const performanceStats = categorizeStudentPerformance(studentsWithGPA);
  const topStudents = getTopStudents(studentsWithGPA, 3);
  const belowAverageStudents = getBelowAverageStudents(studentsWithGPA);
  const sortedStudents = addRankingsToStudents(quickSortStudentsByGPA([...studentsWithGPA]));

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('School Analytics Report', 20, 30);
      
      // Add generation date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Dashboard stats
      doc.setFontSize(16);
      doc.text('Dashboard Statistics', 20, 65);
      doc.setFontSize(12);
      if (dashboardStats) {
        doc.text(`Total Students: ${dashboardStats.totalStudents}`, 20, 80);
        doc.text(`Active Teachers: ${dashboardStats.activeTeachers}`, 20, 90);
        doc.text(`Total Courses: ${dashboardStats.totalCourses}`, 20, 100);
        doc.text(`Average Attendance: ${dashboardStats.avgAttendance}%`, 20, 110);
      }
      
      // Top 3 students table
      doc.setFontSize(16);
      doc.text('Top 3 Students', 20, 130);
      
      const topStudentsData = topStudents.map(student => [
        student.rank,
        `${student.firstName} ${student.lastName}`,
        student.grade,
        student.gpa.toFixed(2)
      ]);
      
      (doc as any).autoTable({
        head: [['Rank', 'Name', 'Grade', 'GPA']],
        body: topStudentsData,
        startY: 140,
        theme: 'grid'
      });
      
      // Subject toppers
      doc.setFontSize(16);
      const currentY = (doc as any).lastAutoTable?.finalY || 180;
      doc.text('Subject Toppers', 20, currentY + 20);
      
      const toppersData = subjectToppers.map(topper => [
        topper.subject,
        topper.studentName,
        `${topper.percentage}%`
      ]);
      
      (doc as any).autoTable({
        head: [['Subject', 'Student Name', 'Percentage']],
        body: toppersData,
        startY: currentY + 30,
        theme: 'grid'
      });
      
      doc.save('school-analytics-report.pdf');
      toast({ title: "PDF exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export PDF", variant: "destructive" });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const csvData = sortedStudents.map(student => ({
        Rank: student.rank,
        Name: `${student.firstName} ${student.lastName}`,
        Email: student.email,
        Grade: student.grade,
        GPA: student.gpa.toFixed(2),
        Status: student.status
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'student-rankings.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "CSV exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export CSV", variant: "destructive" });
    }
  };

  const gradeDistribution = students.reduce((acc, student) => {
    acc[student.grade] = (acc[student.grade] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const subjectDistribution = courses.reduce((acc, course) => {
    acc[course.subject] = (acc[course.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (statsLoading || studentsLoading || toppersLoading || attendanceLoading) {
    return (
      <div>
        <Header 
          title="Analytics & Reports" 
          subtitle="Comprehensive analytics and performance reports"
        />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Analytics & Reports" 
        subtitle="Comprehensive analytics and performance reports"
      />
      
      <div className="p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end space-x-2">
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalStudents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.activeTeachers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalCourses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats?.avgAttendance || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Above Average</p>
                  <p className="text-2xl font-bold text-green-600">{performanceStats.aboveAverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average</p>
                  <p className="text-2xl font-bold text-blue-600">{performanceStats.average}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Below Average</p>
                  <p className="text-2xl font-bold text-red-600">{performanceStats.belowAverage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-600" />
              Top 3 Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No student data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        #{student.rank}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">Grade {student.grade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{student.gpa.toFixed(2)} GPA</p>
                      <Badge variant="outline" className="text-xs">
                        {index === 0 ? '🥇 First' : index === 1 ? '🥈 Second' : '🥉 Third'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Toppers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Subject-wise Toppers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectToppers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No subject data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectToppers.map((topper) => (
                  <Card key={`${topper.subject}-${topper.studentId}`} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{topper.subject}</h4>
                          <p className="text-sm text-gray-600">{topper.studentName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{topper.percentage}%</p>
                          <Badge variant="secondary" className="text-xs">Top Score</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Below Average Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              Students Needing Support ({belowAverageStudents.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {belowAverageStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>All students are performing at or above average!</p>
                <p className="text-sm">Great job on maintaining high academic standards</p>
              </div>
            ) : (
              <div className="space-y-3">
                {belowAverageStudents.slice(0, 10).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">Grade {student.grade} • {student.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{student.gpa.toFixed(2)} GPA</p>
                      <Badge variant="destructive" className="text-xs">Needs Support</Badge>
                    </div>
                  </div>
                ))}
                {belowAverageStudents.length > 10 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Showing 10 of {belowAverageStudents.length} students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grade {grade}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(count / students.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Subject Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(subjectDistribution).map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{subject}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(count / courses.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}