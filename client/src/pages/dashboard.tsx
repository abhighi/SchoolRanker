import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { StudentForm } from "@/components/forms/student-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Users, GraduationCap, BookOpen, Calendar, 
  TrendingUp, TrendingDown, Minus, Award 
} from "lucide-react";
import { getTopStudents } from "@/lib/ranking";
import type { StudentWithGPA, SubjectTopper } from "@shared/schema";

export default function Dashboard() {
  const [showStudentForm, setShowStudentForm] = useState(false);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard-stats"],
  });

  const { data: studentsWithGPA = [], isLoading: studentsLoading } = useQuery<StudentWithGPA[]>({
    queryKey: ["/api/analytics/students-gpa"],
  });

  const { data: subjectToppers = [], isLoading: toppersLoading } = useQuery<SubjectTopper[]>({
    queryKey: ["/api/analytics/subject-toppers"],
  });

  const topStudents = getTopStudents(studentsWithGPA, 3);

  if (statsLoading) {
    return (
      <div>
        <Header 
          title="Dashboard" 
          subtitle="Welcome back! Here's what's happening at your school."
          onAddClick={() => setShowStudentForm(true)}
          addButtonText="Add Student"
        />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
        title="Dashboard" 
        subtitle="Welcome back! Here's what's happening at your school."
        onAddClick={() => setShowStudentForm(true)}
        addButtonText="Add Student"
      />

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardStats?.totalStudents || 0}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Active enrollment
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
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Faculty strength
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
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <Minus className="w-4 h-4 mr-1" />
                    Active courses
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
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardStats?.avgAttendance ? `${dashboardStats.avgAttendance.toFixed(1)}%` : '0%'}
                  </p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Overall rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Performers */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Performing Students</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                        <p>No student data available yet.</p>
                        <p className="text-sm">Add students and marks to see rankings.</p>
                      </div>
                    ) : (
                      topStudents.map((student, index) => (
                        <div 
                          key={student.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                            index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' :
                            'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              'bg-orange-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Grade {student.grade} • Section {student.section}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{student.gpa.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">GPA</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-primary text-white hover:bg-blue-600"
                  onClick={() => setShowStudentForm(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add New Student
                </Button>
                <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Add New Teacher
                </Button>
                <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
                <Button className="w-full bg-orange-600 text-white hover:bg-orange-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">System Status</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-gray-600">All systems operational</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-gray-600">Database synchronized</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p className="text-gray-600">Ready for new entries</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subject-wise Top Performers</CardTitle>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option>All Subjects</option>
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
                <option>History</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {toppersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : subjectToppers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>No subject toppers available yet.</p>
                <p className="text-sm">Add courses and marks to see subject-wise performance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subjectToppers.map((topper, index) => (
                  <div 
                    key={topper.subject}
                    className={`p-4 rounded-lg border ${
                      index % 4 === 0 ? 'bg-blue-50 border-blue-200' :
                      index % 4 === 1 ? 'bg-green-50 border-green-200' :
                      index % 4 === 2 ? 'bg-purple-50 border-purple-200' :
                      'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <h4 className={`font-semibold mb-2 ${
                      index % 4 === 0 ? 'text-blue-900' :
                      index % 4 === 1 ? 'text-green-900' :
                      index % 4 === 2 ? 'text-purple-900' :
                      'text-orange-900'
                    }`}>
                      {topper.subject}
                    </h4>
                    <p className={`text-sm ${
                      index % 4 === 0 ? 'text-blue-700' :
                      index % 4 === 1 ? 'text-green-700' :
                      index % 4 === 2 ? 'text-purple-700' :
                      'text-orange-700'
                    }`}>
                      {topper.studentName} - {topper.percentage.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StudentForm 
        open={showStudentForm} 
        onOpenChange={setShowStudentForm} 
      />
    </div>
  );
}
