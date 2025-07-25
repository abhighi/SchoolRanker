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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, Users, Calendar, ClipboardList, 
  Plus, Eye, CheckCircle, Clock, AlertCircle 
} from "lucide-react";
import type { Assignment, Student, Course, AssignmentSubmission } from "@shared/schema";

export default function TeacherPanel() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sample teacher ID - in a real app, this would come from authentication
  const teacherId = "teacher-001";

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/teacher", teacherId],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const teacherCourses = courses.filter((course) => course.teacherId === teacherId);

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

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const assignmentData = {
      title: formData.get("title"),
      description: formData.get("description"),
      courseId: formData.get("courseId"),
      teacherId: teacherId,
      dueDate: formData.get("dueDate"),
      totalPoints: parseInt(formData.get("totalPoints") as string),
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Teacher Panel" subtitle="Manage your classes, assignments, and student progress" />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your classes, assignments, and student progress</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherCourses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClipboardList className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
              <DialogTrigger asChild>
                <Button className="h-16 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input name="title" placeholder="Assignment title" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea name="description" placeholder="Assignment description" />
                  </div>
                  <div>
                    <Label htmlFor="courseId">Course</Label>
                    <Select name="courseId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input name="dueDate" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="totalPoints">Total Points</Label>
                      <Input name="totalPoints" type="number" defaultValue="100" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue="assignment">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="homework">Homework</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAssignmentForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAttendanceForm} onOpenChange={setShowAttendanceForm}>
              <DialogTrigger asChild>
                <Button className="h-16 bg-green-600 hover:bg-green-700 text-white">
                  <Calendar className="w-5 h-5 mr-2" />
                  Mark Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Attendance</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMarkAttendance} className="space-y-4">
                  <div>
                    <Label htmlFor="courseId">Course</Label>
                    <Select name="courseId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student</Label>
                    <Select name="studentId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="present">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Input name="remarks" placeholder="Any additional notes" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAttendanceForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={markAttendanceMutation.isPending}>
                      {markAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button className="h-16 bg-purple-600 hover:bg-purple-700 text-white">
              <Users className="w-5 h-5 mr-2" />
              Add Student
            </Button>

            <Button className="h-16 bg-orange-600 hover:bg-orange-700 text-white">
              <ClipboardList className="w-5 h-5 mr-2" />
              Grade Assignments
            </Button>
          </div>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                My Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments created yet</p>
                  <p className="text-sm">Create your first assignment to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{assignment.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            {getStatusBadge(assignment.type)}
                            <span className="text-sm text-gray-500">Due: {assignment.dueDate}</span>
                            <span className="text-sm text-gray-500">{assignment.totalPoints} points</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            Submissions
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}