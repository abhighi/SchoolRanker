import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { quickSortStudentsByGPA, addRankingsToStudents } from "@/lib/ranking";
import {
  BookOpen, Calendar, ClipboardList,
  CheckCircle, Clock, AlertCircle, FileText, Upload,
  Trophy, Award, GraduationCap, TrendingUp, Users, Mail, Presentation,
  Target, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import type { Assignment, AssignmentSubmission, Course, StudentWithGPA, Teacher } from "@shared/schema";

// Shape returned by the Focus-Subject Recommender endpoint.
interface FocusSubjectRec {
  courseId: string;
  subject: string;
  grade: number;
  studentAvgPct: number;
  classAvgPct: number;
  trend: "up" | "down" | "flat";
  focusScore: number;
  reason: string;
}

export default function StudentPanel() {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get student ID from auth - use profileId or user.id
  const studentId = user?.profileId || user?.id || "";

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: submissions = [] } = useQuery<AssignmentSubmission[]>({
    queryKey: ["/api/assignment-submissions"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: studentTeachers = [] } = useQuery<Teacher[]>({
    queryKey: [`/api/students/${studentId}/teachers`],
    enabled: !!studentId,
  });

  const { data: studentsWithGPA = [] } = useQuery<StudentWithGPA[]>({
    queryKey: ["/api/analytics/students-gpa"],
  });

  // Focus-Subject Recommender — content-based ranking of subjects to prioritize.
  const { data: focusData } = useQuery<{ recommendations: FocusSubjectRec[] }>({
    queryKey: ["/api/recommendations/focus-subjects"],
  });
  const focusSubjects = (focusData?.recommendations ?? []).slice(0, 3);

  const submitAssignmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignment-submissions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignment-submissions"] });
      toast({ title: "Assignment submitted successfully" });
      setShowSubmissionForm(false);
      setSelectedAssignment(null);
    },
    onError: () => {
      toast({ title: "Failed to submit assignment", variant: "destructive" });
    },
  });

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const formData = new FormData(e.target as HTMLFormElement);

    const submissionData = {
      assignmentId: selectedAssignment.id,
      studentId: studentId,
      submissionText: formData.get("submissionText"),
      submittedAt: new Date().toISOString(),
      status: "submitted",
    };

    submitAssignmentMutation.mutate(submissionData);
  };

  const getSubmissionStatus = (assignmentId: string | number) => {
    const submission = submissions.find((sub) => String(sub.assignmentId) === String(assignmentId) && sub.studentId === studentId);
    return submission;
  };

  const getAssignmentStatusBadge = (assignment: Assignment) => {
    const submission = getSubmissionStatus(assignment.id);
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();

    if (submission) {
      if (submission.grade !== null && submission.grade !== undefined) {
        return <Badge className="bg-purple-100 text-purple-800">Graded</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    }

    if (dueDate < now) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }

    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Pending</Badge>;
  };

  const getAssignmentTypeBadge = (type: string) => {
    switch (type) {
      case "assignment":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Assignment</Badge>;
      case "homework":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Homework</Badge>;
      case "project":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Project</Badge>;
      case "quiz":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Quiz</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    return `${diffDays} days left`;
  };

  const getProgressColor = (assignment: Assignment) => {
    const submission = getSubmissionStatus(assignment.id);
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();

    if (submission) return "text-blue-600";
    if (dueDate < now) return "text-red-600";

    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24) return "text-yellow-600";
    return "text-green-600";
  };

  // Student performance data — rank the whole cohort (QuickSort) so we can show
  // this student's real class rank.
  const rankedStudents = addRankingsToStudents(quickSortStudentsByGPA([...studentsWithGPA]));
  const currentStudent = rankedStudents.find(s => s.id === studentId);
  const submittedCount = assignments.filter(a => getSubmissionStatus(a.id)).length;
  const overdueCount = assignments.filter(a => {
    const submission = getSubmissionStatus(a.id);
    return !submission && new Date(a.dueDate) < new Date();
  }).length;
  const pendingCount = assignments.filter(a => {
    const submission = getSubmissionStatus(a.id);
    const dueDate = new Date(a.dueDate);
    return !submission && dueDate >= new Date();
  }).length;

  // Sort assignments by due date
  const sortedAssignments = [...assignments].sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Student Panel" subtitle="Track your assignments, homework, and academic progress" />

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Student Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Submitted</p>
                    <p className="text-2xl font-bold text-gray-900">{submittedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Performance */}
          {currentStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{currentStudent.gpa.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Current GPA</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">Grade {currentStudent.grade}</p>
                    <p className="text-sm text-gray-600">Current Grade</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{currentStudent.rank || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Class Rank</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Focus Subjects (content-based recommender) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-rose-600" />
                Recommended Focus Subjects
              </CardTitle>
              <p className="text-sm text-gray-500">
                Where extra effort will help you the most, based on your marks vs. your class.
              </p>
            </CardHeader>
            <CardContent>
              {focusSubjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet</p>
                  <p className="text-sm">Once you have exam marks, we'll suggest where to focus.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {focusSubjects.map((f, idx) => (
                    <div key={f.courseId} className="p-4 border rounded-lg" data-testid={`focus-${f.courseId}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-gray-900 truncate">{f.subject}</span>
                          {f.trend === "down" && (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                              <ArrowDown className="w-3 h-3" /> Declining
                            </Badge>
                          )}
                          {f.trend === "up" && (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" /> Improving
                            </Badge>
                          )}
                          {f.trend === "flat" && (
                            <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                              <Minus className="w-3 h-3" /> Steady
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-rose-700 border-rose-200 flex-shrink-0">
                          {f.reason}
                        </Badge>
                      </div>

                      {/* Your average vs class average */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Your average</span>
                            <span className="font-medium">{f.studentAvgPct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-rose-500 h-2 rounded-full"
                              style={{ width: `${Math.max(0, Math.min(100, f.studentAvgPct))}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Class average</span>
                            <span className="font-medium">{f.classAvgPct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-400 h-2 rounded-full"
                              style={{ width: `${Math.max(0, Math.min(100, f.classAvgPct))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Teachers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Presentation className="w-5 h-5 mr-2" />
                My Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Presentation className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No teachers to show yet</p>
                  <p className="text-sm">Teachers of your enrolled courses will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentTeachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Presentation className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{teacher.subject}</p>
                        <p className="text-xs text-gray-500 flex items-center truncate">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignments & Homework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                My Assignments & Homework
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments available</p>
                  <p className="text-sm">New assignments will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedAssignments.map((assignment) => {
                    const course = courses.find(c => c.id === assignment.courseId);
                    const submission = getSubmissionStatus(assignment.id);

                    return (
                      <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                {getAssignmentTypeBadge(assignment.type)}
                                {getAssignmentStatusBadge(assignment)}
                              </div>

                              <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  {course?.subject} - Grade {course?.grade}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Due: {assignment.dueDate}
                                </span>
                                <span className={`flex items-center font-medium ${getProgressColor(assignment)}`}>
                                  <Clock className="w-4 h-4 mr-1" />
                                  {getDaysUntilDue(assignment.dueDate)}
                                </span>
                              </div>

                              {submission && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-blue-800">
                                      Submitted on: {submission.submittedAt ? new Date(submission.submittedAt as string).toLocaleDateString() : 'N/A'}
                                    </span>
                                    {submission.grade !== null && submission.grade !== undefined && (
                                      <span className="text-sm font-semibold text-blue-800">
                                        Grade: {submission.grade}/{assignment.totalPoints}
                                      </span>
                                    )}
                                  </div>
                                  {submission.feedback && (
                                    <p className="text-sm text-blue-700 mt-1">
                                      Feedback: {submission.feedback}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-4">
                              {!submission && new Date(assignment.dueDate) >= new Date() && (
                                <Dialog
                                  open={showSubmissionForm && selectedAssignment?.id === assignment.id}
                                  onOpenChange={(open) => {
                                    setShowSubmissionForm(open);
                                    if (!open) setSelectedAssignment(null);
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() => setSelectedAssignment(assignment)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      Submit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Submit Assignment</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmitAssignment} className="space-y-4">
                                      <div>
                                        <Label>Assignment</Label>
                                        <p className="text-sm text-gray-600">{assignment.title}</p>
                                      </div>
                                      <div>
                                        <Label htmlFor="submissionText">Your Submission</Label>
                                        <Textarea
                                          id="submissionText"
                                          name="submissionText"
                                          placeholder="Enter your assignment content, answer, or notes here..."
                                          rows={6}
                                          required
                                        />
                                      </div>
                                      <div className="bg-yellow-50 p-3 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                          <strong>Due:</strong> {assignment.dueDate} ({getDaysUntilDue(assignment.dueDate)})
                                        </p>
                                      </div>
                                      <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={submitAssignmentMutation.isPending}
                                      >
                                        {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {submission && (
                                <div className="text-center">
                                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                                  <p className="text-xs text-green-600">Submitted</p>
                                </div>
                              )}

                              {!submission && new Date(assignment.dueDate) < new Date() && (
                                <div className="text-center">
                                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                                  <p className="text-xs text-red-600">Overdue</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter(s => s.studentId === studentId).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions yet</p>
                  <p className="text-sm">Your submitted work will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions
                      .filter(s => s.studentId === studentId)
                      .slice(-10)
                      .map((submission) => {
                        const assignment = assignments.find(a => a.id === submission.assignmentId);
                        const course = courses.find(c => c.id === assignment?.courseId);

                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{assignment?.title}</TableCell>
                            <TableCell>{course?.subject}</TableCell>
                            <TableCell>{submission.submittedAt ? new Date(submission.submittedAt as string).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              {submission.grade !== null && submission.grade !== undefined ? (
                                <span className="font-semibold text-green-600">
                                  {submission.grade}/{assignment?.totalPoints}
                                </span>
                              ) : (
                                <span className="text-gray-500">Pending</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.grade !== null && submission.grade !== undefined ? (
                                <Badge className="bg-purple-100 text-purple-800">Graded</Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}