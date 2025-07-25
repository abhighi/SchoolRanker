import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, Users, GraduationCap, BookOpen, TrendingUp, 
  TrendingDown, Calendar, Award, PieChart, Activity 
} from "lucide-react";
import { categorizeStudentPerformance } from "@/lib/ranking";
import type { StudentWithGPA, SubjectTopper, Student, Teacher, Course } from "@shared/schema";

export default function Analytics() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
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

  // Calculate additional analytics
  const gradeDistribution = students.reduce((acc, student) => {
    acc[student.grade] = (acc[student.grade] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const subjectDistribution = courses.reduce((acc, course) => {
    acc[course.subject] = (acc[course.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const teacherWorkload = teachers.map(teacher => ({
    name: `${teacher.firstName} ${teacher.lastName}`,
    courses: courses.filter(course => course.teacherId === teacher.id).length,
    subject: teacher.subject,
    experience: teacher.experience || 0
  }));

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
        
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats?.totalStudents || 0}</p>
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Enrolled
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-primary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats?.activeTeachers || 0}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    Faculty
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats?.totalCourses || 0}</p>
                  <p className="text-sm text-purple-600 mt-1 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Active
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-purple-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {attendanceStats?.percentage ? `${attendanceStats.percentage.toFixed(1)}%` : '0%'}
                  </p>
                  <p className="text-sm text-orange-600 mt-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Overall
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Academic Performance Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Academic Performance Distribution
                </CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Above Average</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">
                      {performanceStats.aboveAverage}%
                    </span>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Average</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-yellow-600">
                      {performanceStats.average}%
                    </span>
                    <Activity className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Below Average</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-red-600">
                      {performanceStats.belowAverage}%
                    </span>
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>

                {performanceStats.averageGPA > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {performanceStats.averageGPA.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Class Average GPA</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Subject Performance Leaders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjectToppers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>No subject performance data available</p>
                  <p className="text-sm">Add course marks to see subject analysis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectToppers.slice(0, 6).map((topper, index) => (
                    <div 
                      key={topper.subject}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold ${
                          index % 4 === 0 ? 'bg-blue-500' :
                          index % 4 === 1 ? 'bg-green-500' :
                          index % 4 === 2 ? 'bg-purple-500' :
                          'bg-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{topper.subject}</p>
                          <p className="text-sm text-gray-600">{topper.studentName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {topper.percentage.toFixed(1)}%
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Top Score
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-sm font-medium">
                        {grade}
                      </div>
                      <span className="text-sm font-medium">Grade {grade}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(count / students.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Subject Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(subjectDistribution).map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded flex items-center justify-center text-xs font-medium">
                        {subject.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate">{subject}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(count / courses.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teacher Workload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Teacher Workload Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherWorkload.sort((a, b) => b.courses - a.courses).slice(0, 5).map((teacher, index) => (
                  <div key={teacher.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate">{teacher.name}</p>
                        <p className="text-xs text-gray-500">{teacher.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{teacher.courses}</p>
                      <p className="text-xs text-gray-500">courses</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Attendance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {attendanceStats?.totalClasses || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Total Classes</div>
                <div className="text-xs text-blue-600 mt-1">Recorded sessions</div>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {attendanceStats?.presentClasses || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Present Instances</div>
                <div className="text-xs text-green-600 mt-1">Student attendance</div>
              </div>
              
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {attendanceStats?.percentage ? `${attendanceStats.percentage.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-sm text-gray-600 mt-2">Overall Rate</div>
                <div className="text-xs text-orange-600 mt-1">Attendance percentage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Key Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Performance Highlights</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">
                      {performanceStats.aboveAverage}% of students are performing above average
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">
                      Class average GPA is {performanceStats.averageGPA.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">
                      Overall attendance rate is {attendanceStats?.percentage ? `${attendanceStats.percentage.toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Recommendations</h4>
                <div className="space-y-3">
                  {performanceStats.belowAverage > 20 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Consider additional support for struggling students
                      </p>
                    </div>
                  )}
                  {(attendanceStats?.percentage || 0) < 85 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Implement attendance improvement strategies
                      </p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-sm text-gray-600">
                      Regular performance monitoring is recommended
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
