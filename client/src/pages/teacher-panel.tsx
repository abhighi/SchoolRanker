import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  BookOpen, Users, Calendar, ClipboardList,
  Plus, CheckCircle, Clock, AlertCircle,
  GraduationCap, FileText, Award, GraduationCap as GradIcon, Save
} from "lucide-react";
import type { Assignment, Student, Course, Attendance, AssignmentSubmission } from "@shared/schema";

export default function TeacherPanel() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get teacher ID from session - fallback to profileId or user.id
  const teacherId = user?.profileId || user?.id || "";

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  // Submissions for this teacher's assignments (server already scopes to the
  // teacher's own courses).
  const { data: submissions = [] } = useQuery<AssignmentSubmission[]>({
    queryKey: ["/api/assignment-submissions"],
  });

  // The server already scopes /api/courses and /api/assignments to this teacher,
  // so use them directly (don't re-filter by a client-side id that may be stale).
  const teacherCourses = courses;
  const teacherAssignments = assignments;
  const recentAttendance = attendance.slice(-10); // Show last 10 attendance records

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment created successfully" });
      setShowAssignmentForm(false);
    },
    onError: () => {
      toast({ title: "Failed to create assignment", variant: "destructive" });
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Attendance marked successfully" });
      setShowAttendanceForm(false);
    },
    onError: () => {
      toast({ title: "Failed to mark attendance", variant: "destructive" });
    },
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PUT", `/api/assignments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update assignment", variant: "destructive" });
    },
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: ({ id, grade, feedback }: { id: string; grade: number; feedback: string }) =>
      apiRequest("PUT", `/api/assignment-submissions/${id}`, { grade, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignment-submissions"] });
      toast({ title: "Submission graded" });
    },
    onError: () => {
      toast({ title: "Failed to save grade", variant: "destructive" });
    },
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // No course is chosen here — the server attaches the assignment to the
    // course(s) this teacher teaches automatically.
    const assignmentData = {
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
      totalPoints: parseInt(formData.get("totalPoints") as string) || 100,
      type: formData.get("type"),
      status: "active",
      createdAt: new Date().toISOString().split('T')[0],
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const attendanceData = {
      studentId: formData.get("studentId"),
      courseId: formData.get("courseId"),
      date: formData.get("date"),
      status: formData.get("status"),
      remarks: formData.get("remarks") || "",
    };

    markAttendanceMutation.mutate(attendanceData);
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case "assignment":
        return <Badge className="bg-blue-100 text-blue-800">Assignment</Badge>;
      case "homework":
        return <Badge className="bg-green-100 text-green-800">Homework</Badge>;
      case "project":
        return <Badge className="bg-purple-100 text-purple-800">Project</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "due":
        return <Badge className="bg-yellow-100 text-yellow-800">Due</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "graded":
        return <Badge className="bg-purple-100 text-purple-800">Graded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case "excused":
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Teacher Panel" subtitle="Manage your classes, assignments, and student progress" />

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">My Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{teacherCourses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClipboardList className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{teacherAssignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{teacherCourses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
                  <DialogTrigger asChild>
                    <Button className="h-16 bg-blue-600 hover:bg-blue-700">
                      <div className="text-center">
                        <ClipboardList className="w-6 h-6 mx-auto mb-1" />
                        <span>Create Assignment</span>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAssignment} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input id="title" name="title" placeholder="Enter assignment title" required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Assignment description" />
                      </div>
                      <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                        This assignment will be posted to your {teacherCourses.length > 0
                          ? teacherCourses.length === 1
                            ? `class (${teacherCourses[0].subject} — Grade ${teacherCourses[0].grade}).`
                            : `${teacherCourses.length} classes.`
                          : "assigned class automatically."}
                      </div>
                      <div>
                        <Label htmlFor="type">Assignment Type</Label>
                        <Select name="type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input id="dueDate" name="dueDate" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="totalPoints">Total Points</Label>
                        <Input id="totalPoints" name="totalPoints" type="number" placeholder="100" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createAssignmentMutation.isPending}>
                        {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={showAttendanceForm} onOpenChange={setShowAttendanceForm}>
                  <DialogTrigger asChild>
                    <Button className="h-16 bg-green-600 hover:bg-green-700">
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                        <span>Mark Attendance</span>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Mark Student Attendance</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMarkAttendance} className="space-y-4">
                      <div>
                        <Label htmlFor="studentId">Student</Label>
                        <Select name="studentId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName} - Grade {student.grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="courseId">Course</Label>
                        <Select name="courseId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {teacherCourses.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.subject} - Grade {course.grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                      </div>
                      <div>
                        <Label htmlFor="status">Attendance Status</Label>
                        <Select name="status" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                        <Input id="remarks" name="remarks" placeholder="Any additional notes" />
                      </div>
                      <Button type="submit" className="w-full" disabled={markAttendanceMutation.isPending}>
                        {markAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                My Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teacherAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments created yet</p>
                  <p className="text-sm">Create your first assignment using the button above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAssignments.map((assignment) => {
                      const course = courses.find(c => c.id === assignment.courseId);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            <button
                              className="text-blue-600 hover:underline text-left"
                              onClick={() => setViewAssignment(assignment)}
                            >
                              {assignment.title}
                            </button>
                          </TableCell>
                          <TableCell>{course?.subject} - Grade {course?.grade}</TableCell>
                          <TableCell>{getStatusBadge(assignment.type)}</TableCell>
                          <TableCell>{assignment.dueDate}</TableCell>
                          <TableCell>{getAssignmentStatusBadge(assignment.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => setViewAssignment(assignment)}>
                                View Submissions
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateAssignmentStatusMutation.isPending}
                                onClick={() => updateAssignmentStatusMutation.mutate({
                                  id: assignment.id,
                                  status: assignment.status === 'active' ? 'inactive' : 'active'
                                })}
                              >
                                {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records yet</p>
                  <p className="text-sm">Start marking attendance using the button above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendance.map((record) => {
                      const student = students.find(s => s.id === record.studentId);
                      const course = courses.find(c => c.id === record.courseId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{student?.firstName} {student?.lastName}</TableCell>
                          <TableCell>{course?.subject}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                          <TableCell>{record.remarks || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Student Submissions / Grading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GradIcon className="w-5 h-5 mr-2" />
                Student Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions yet</p>
                  <p className="text-sm">Submissions from your students will appear here to grade</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Submission</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const student = students.find(s => s.id === submission.studentId);
                      const assignment = assignments.find(a => a.id === submission.assignmentId);
                      return (
                        <SubmissionGradeRow
                          key={submission.id}
                          submission={submission}
                          studentName={student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                          assignmentTitle={assignment?.title || "Unknown"}
                          totalPoints={assignment?.totalPoints || 100}
                          saving={gradeSubmissionMutation.isPending}
                          onSave={(grade, feedback) =>
                            gradeSubmissionMutation.mutate({ id: submission.id, grade, feedback })
                          }
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Per-assignment submissions view (opens when an assignment is clicked) */}
      <Dialog open={!!viewAssignment} onOpenChange={(o) => { if (!o) setViewAssignment(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions — {viewAssignment?.title}</DialogTitle>
          </DialogHeader>
          {(() => {
            if (!viewAssignment) return null;
            const subs = submissions.filter(s => s.assignmentId === viewAssignment.id);
            const submittedCountForAssignment = subs.length;
            return (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {submittedCountForAssignment} student{submittedCountForAssignment === 1 ? "" : "s"} submitted so far.
                </p>
                {subs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No students have submitted this assignment yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submission</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subs.map((submission) => {
                        const student = students.find(s => s.id === submission.studentId);
                        return (
                          <SubmissionGradeRow
                            key={submission.id}
                            submission={submission}
                            studentName={student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                            assignmentTitle={viewAssignment.title}
                            totalPoints={viewAssignment.totalPoints || 100}
                            saving={gradeSubmissionMutation.isPending}
                            onSave={(grade, feedback) =>
                              gradeSubmissionMutation.mutate({ id: submission.id, grade, feedback })
                            }
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// One editable grading row (kept as its own component so each row can hold its
// own draft grade/feedback state).
function SubmissionGradeRow({
  submission,
  studentName,
  assignmentTitle,
  totalPoints,
  onSave,
  saving,
}: {
  submission: AssignmentSubmission;
  studentName: string;
  assignmentTitle: string;
  totalPoints: number;
  onSave: (grade: number, feedback: string) => void;
  saving: boolean;
}) {
  const [grade, setGrade] = useState<string>(
    submission.grade !== null && submission.grade !== undefined ? String(submission.grade) : ""
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || "");

  return (
    <TableRow>
      <TableCell className="font-medium">{studentName}</TableCell>
      <TableCell>{assignmentTitle}</TableCell>
      <TableCell className="max-w-[220px] truncate" title={submission.submissionText || ""}>
        {submission.submissionText || "-"}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          max={totalPoints}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-20"
          placeholder={`/ ${totalPoints}`}
        />
      </TableCell>
      <TableCell>
        <Input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback"
          className="w-40"
        />
      </TableCell>
      <TableCell>
        {submission.status === "graded" ? (
          <Badge className="bg-purple-100 text-purple-800">Graded</Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          disabled={saving || grade === ""}
          onClick={() => onSave(Number(grade), feedback)}
        >
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </TableCell>
    </TableRow>
  );
}