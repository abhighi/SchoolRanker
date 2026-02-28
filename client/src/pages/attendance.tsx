import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Calendar, CheckCircle, XCircle, Clock, CalendarCheck, Save } from "lucide-react";
import type { Attendance, Student, Course } from "@shared/schema";

interface StudentAttendance {
  studentId: string;
  status: "present" | "absent" | "late";
  remarks: string;
}

export default function AttendancePage() {
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Bulk attendance form state
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [selectAllStatus, setSelectAllStatus] = useState<"present" | "absent" | "late">("present");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  // Use filtered endpoint for attendance students - fetches only what's needed
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["api/attendance/students", selectedGrade || "all", selectedCourse || "all"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Initialize student attendance when course is selected
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    // Get the course to find its grade
    const course = courses.find(c => c.id === courseId);
    const grade = course?.grade;
    
    // Filter students by grade if course has a grade
    const filteredStudents = grade 
      ? students.filter(s => s.grade === grade)
      : students;
    
    // Initialize all filtered students with default status
    const initialAttendance: StudentAttendance[] = filteredStudents.map(student => ({
      studentId: student.id,
      status: "present",
      remarks: ""
    }));
    setStudentAttendance(initialAttendance);
  };

  // Handle grade selection
  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedCourse("");
    setStudentAttendance([]);
    
    // Filter courses by selected grade
    if (grade) {
      // Filter students by grade
      const gradeNum = parseInt(grade);
      const filteredStudents = students.filter(s => s.grade === gradeNum);
      const initialAttendance: StudentAttendance[] = filteredStudents.map(student => ({
        studentId: student.id,
        status: "present",
        remarks: ""
      }));
      setStudentAttendance(initialAttendance);
    }
  };

  // Update single student attendance
  const updateStudentAttendance = (studentId: string, field: keyof StudentAttendance, value: string) => {
    setStudentAttendance(prev =>
      prev.map(sa =>
        sa.studentId === studentId
          ? { ...sa, [field]: value }
          : sa
      )
    );
  };

  // Apply status to all students
  const applyToAll = (status: "present" | "absent" | "late") => {
    setSelectAllStatus(status);
    setStudentAttendance(prev =>
      prev.map(sa => ({ ...sa, status }))
    );
  };

  const createAttendanceMutation = useMutation({
    mutationFn: (attendanceData: any) => apiRequest("POST", "/api/attendance", attendanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Attendance marked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to mark attendance", variant: "destructive" });
    },
  });

  const handleBulkAttendance = async () => {
    if (!selectedCourse || studentAttendance.length === 0) {
      toast({ title: "Please select a course", variant: "destructive" });
      return;
    }

    const attendancePromises = studentAttendance.map(studentAtt =>
      createAttendanceMutation.mutateAsync({
        studentId: studentAtt.studentId,
        courseId: selectedCourse,
        date: attendanceDate,
        status: studentAtt.status,
        remarks: studentAtt.remarks
      })
    );

    try {
      await Promise.all(attendancePromises);
      setStudentAttendance([]);
      setShowAttendanceForm(false);
      setSelectedCourse("");
    } catch (error) {
      // Error is handled by mutation
    }
  };

  // Get student and course names
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown';
  };

  // Filter attendance based on search and filters
  const filteredAttendance = attendance.filter(record => {
    const studentName = getStudentName(record.studentId);
    const courseName = getCourseName(record.courseId);

    const matchesSearch = !searchTerm ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = !courseFilter || record.courseId === courseFilter;
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const matchesDate = !dateFilter || record.date === dateFilter;

    return matchesSearch && matchesCourse && matchesStatus && matchesDate;
  });

  // Calculate attendance statistics
  const totalRecords = filteredAttendance.length;
  const presentCount = filteredAttendance.filter(r => r.status === 'present').length;
  const absentCount = filteredAttendance.filter(r => r.status === 'absent').length;
  const lateCount = filteredAttendance.filter(r => r.status === 'late').length;
  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  return (
    <div>
      <Header
        title="Attendance Tracking"
        subtitle="Monitor and manage student attendance records"
        onAddClick={() => setShowAttendanceForm(true)}
        addButtonText="Mark Attendance"
      />

      <div className="p-6 space-y-6">
        {/* Attendance Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{totalRecords}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="text-red-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{attendanceRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search attendance..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                <p className="text-gray-500 mb-4">
                  {attendance.length === 0
                    ? "Start by marking attendance for your classes."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                <Button onClick={() => setShowAttendanceForm(true)}>
                  Mark Attendance
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getStudentName(record.studentId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCourseName(record.courseId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              record.status === 'present' ? 'default' :
                                record.status === 'late' ? 'secondary' : 'destructive'
                            }
                          >
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Attendance Marking Dialog */}
      <Dialog open={showAttendanceForm} onOpenChange={setShowAttendanceForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Attendance - Bulk Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendanceDate">Date</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
            </div>

            {/* Grade and Subject Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select value={selectedGrade} onValueChange={handleGradeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {[9, 10, 11, 12].map((grade) => (
                      <SelectItem key={grade} value={String(grade)}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={selectedCourse} 
                  onValueChange={handleCourseSelect}
                  disabled={!selectedGrade && !selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses
                      .filter(c => !selectedGrade || c.grade === parseInt(selectedGrade))
                      .map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.subject} ({course.name})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Actions */}
            {studentAttendance.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Quick Actions:</span>
                <Button
                  variant={selectAllStatus === "present" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("present")}
                  className="gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> All Present
                </Button>
                <Button
                  variant={selectAllStatus === "absent" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("absent")}
                  className="gap-1"
                >
                  <XCircle className="w-4 h-4" /> All Absent
                </Button>
                <Button
                  variant={selectAllStatus === "late" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("late")}
                  className="gap-1"
                >
                  <Clock className="w-4 h-4" /> All Late
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            {studentAttendance.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Quick Actions:</span>
                <Button
                  variant={selectAllStatus === "present" ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("present")}
                  className="gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> All Present
                </Button>
                <Button
                  variant={selectAllStatus === "absent" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("absent")}
                  className="gap-1"
                >
                  <XCircle className="w-4 h-4" /> All Absent
                </Button>
                <Button
                  variant={selectAllStatus === "late" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => applyToAll("late")}
                  className="gap-1"
                >
                  <Clock className="w-4 h-4" /> All Late
                </Button>
              </div>
            )}

            {/* Student Attendance List */}
            {studentAttendance.length > 0 && (
              <div>
                <Label>Students ({studentAttendance.length})</Label>
                <div className="mt-2 max-h-80 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => {
                        const att = studentAttendance.find(sa => sa.studentId === student.id);
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={att?.status || "present"}
                                onValueChange={(value: "present" | "absent" | "late") =>
                                  updateStudentAttendance(student.id, "status", value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      Present
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="absent">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-red-600" />
                                      Absent
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="late">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-orange-600" />
                                      Late
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                placeholder="Remarks (e.g., sick leave)"
                                value={att?.remarks || ""}
                                onChange={(e) => updateStudentAttendance(student.id, "remarks", e.target.value)}
                                className="w-full"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAttendanceForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAttendance}
                disabled={!selectedCourse || createAttendanceMutation.isPending}
                className="gap-1"
              >
                <Save className="w-4 h-4" />
                {createAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
