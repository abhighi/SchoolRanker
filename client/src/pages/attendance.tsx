import { useState, useEffect } from "react";
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

  // Full (role-scoped) student list used ONLY to resolve names in the records
  // table — so records never show "Unknown".
  const { data: nameStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // The bulk-entry roster: the filtered endpoint returns only the students that
  // belong to the chosen grade/course. Empty params mean "no filter".
  const attendanceStudentsUrl =
    `/api/attendance/students?grade=${selectedGrade && selectedGrade !== 'all' ? selectedGrade : ''}` +
    `&courseId=${selectedCourse || ''}`;
  const { data: rosterStudents = [] } = useQuery<Student[]>({
    queryKey: [attendanceStudentsUrl],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Records-table pagination.
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  // Selecting a course triggers a refetch of the (server-filtered) student list;
  // the effect below (re)builds the attendance rows from that list.
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  // Handle grade selection — reset the course/list; the student list refetches
  // for the chosen grade.
  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedCourse("");
    setStudentAttendance([]);
  };

  // Keep the editable attendance rows in sync with the fetched student list once
  // a course is selected, preserving any statuses the user already set.
  useEffect(() => {
    if (!selectedCourse) {
      setStudentAttendance([]);
      return;
    }
    setStudentAttendance(prev => {
      const prevById = new Map(prev.map(sa => [sa.studentId, sa]));
      return rosterStudents.map(student =>
        prevById.get(student.id) || { studentId: student.id, status: "present" as const, remarks: "" }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterStudents, selectedCourse]);

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

  // O(1) name lookups via maps (built once per render) — avoids scanning the
  // whole student/course list for every attendance row.
  const studentNameById = new Map(
    nameStudents.map(s => [s.id, `${s.firstName} ${s.lastName}`])
  );
  const courseNameById = new Map(courses.map(c => [c.id, c.name]));
  const getStudentName = (studentId: string) => studentNameById.get(studentId) || 'Unknown';
  const getCourseName = (courseId: string) => courseNameById.get(courseId) || 'Unknown';

  // "all" is the placeholder value for the All-Courses / All-Status options and
  // means "no filter".
  const activeCourse = courseFilter && courseFilter !== 'all' ? courseFilter : '';
  const activeStatus = statusFilter && statusFilter !== 'all' ? statusFilter : '';
  const anyFilter = !!(searchTerm || activeCourse || activeStatus || dateFilter);

  // Filter attendance based on search and filters. When no filter is active we
  // skip the work entirely (the records table isn't shown until a filter is set).
  const searchLc = searchTerm.toLowerCase();
  const filteredAttendance = !anyFilter ? [] : attendance.filter(record => {
    const matchesSearch = !searchTerm ||
      getStudentName(record.studentId).toLowerCase().includes(searchLc) ||
      getCourseName(record.courseId).toLowerCase().includes(searchLc);
    const matchesCourse = !activeCourse || record.courseId === activeCourse;
    const matchesStatus = !activeStatus || record.status === activeStatus;
    const matchesDate = !dateFilter || record.date === dateFilter;
    return matchesSearch && matchesCourse && matchesStatus && matchesDate;
  });

  // Reset to first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, courseFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAttendance = filteredAttendance.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Stats reflect the filtered set when a filter is active, otherwise the whole
  // dataset (so the summary cards are still meaningful before filtering).
  const statsSource = anyFilter ? filteredAttendance : attendance;
  const totalRecords = statsSource.length;
  const presentCount = statsSource.filter(r => r.status === 'present').length;
  const absentCount = statsSource.filter(r => r.status === 'absent').length;
  const lateCount = statsSource.filter(r => r.status === 'late').length;
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
            {!anyFilter ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Apply a filter to view records</h3>
                <p className="text-gray-500">
                  Choose a course, status or date above, or search by student/course name.
                  Records stay hidden until a filter is set to keep the page fast.
                </p>
              </div>
            ) : attendanceLoading ? (
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
                    {pagedAttendance.map((record) => (
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

            {filteredAttendance.length > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredAttendance.length)} of {filteredAttendance.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                    Next
                  </Button>
                </div>
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
                      {rosterStudents.map((student) => {
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
