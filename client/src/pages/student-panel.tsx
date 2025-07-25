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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, Calendar, ClipboardList, 
  CheckCircle, Clock, AlertCircle, FileText, Upload
} from "lucide-react";
import type { Assignment, AssignmentSubmission, Course } from "@shared/schema";

export default function StudentPanel() {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sample student ID - in a real app, this would come from authentication
  const studentId = "student-001";

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: submissions = [] } = useQuery<AssignmentSubmission[]>({
    queryKey: ["/api/assignment-submissions/student", studentId],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

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

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find((sub) => sub.assignmentId === assignmentId);
    if (!submission) return null;
    return submission;
  };

  const getStatusBadge = (assignment: Assignment) => {
    const submission = getSubmissionStatus(assignment.id);
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (submission) {
      switch (submission.status) {
        case "submitted":
          return <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </Badge>;
        case "graded":
          return <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Graded: {submission.grade}%
          </Badge>;
        case "late":
          return <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Late Submission
          </Badge>;
        default:
          return <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>;
      }
    }

    if (dueDate < now) {
      return <Badge className="bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Overdue
      </Badge>;
    }

    return <Badge className="bg-yellow-100 text-yellow-800">
      <Clock className="w-3 h-3 mr-1" />
      Due Soon
    </Badge>;
  };

  const getTypebadge = (type: string) => {
    switch (type) {
      case "assignment":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Assignment</Badge>;
      case "homework":
        return <Badge variant="outline" className="text-green-600 border-green-600">Homework</Badge>;
      case "project":
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Project</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getCourseNameById = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : "Unknown Course";
  };

  const pendingAssignments = assignments.filter((assignment) => !getSubmissionStatus(assignment.id));
  const submittedAssignments = assignments.filter((assignment) => getSubmissionStatus(assignment.id));
  const overdueAssignments = assignments.filter((assignment) => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    return !getSubmissionStatus(assignment.id) && dueDate < now;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Student Panel" subtitle="View assignments, homework, and track your progress" />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">View assignments, homework, and track your progress</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{submittedAssignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingAssignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueAssignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Assignments Alert */}
          {overdueAssignments.length > 0 && (
            <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Overdue Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  You have {overdueAssignments.length} overdue assignment(s). Please submit them as soon as possible.
                </p>
                <div className="space-y-2">
                  {overdueAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {assignment.dueDate} • {getCourseNameById(assignment.courseId)}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowSubmissionForm(true);
                        }}
                      >
                        Submit Now
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                  Pending Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending assignments</p>
                    <p className="text-sm">Great job! You're all caught up</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAssignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{assignment.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              {getTypebadge(assignment.type)}
                              {getStatusBadge(assignment)}
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Due: {assignment.dueDate}</span>
                              <span>{assignment.totalPoints} points</span>
                              <span>{getCourseNameById(assignment.courseId)}</span>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowSubmissionForm(true);
                            }}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submitted Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Submitted Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submittedAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No submitted assignments yet</p>
                    <p className="text-sm">Submit your first assignment to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submittedAssignments.map((assignment) => {
                      const submission = getSubmissionStatus(assignment.id);
                      return (
                        <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                              <div className="flex items-center space-x-2 mt-2">
                                {getTypebadge(assignment.type)}
                                {getStatusBadge(assignment)}
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Submitted: {submission?.submittedAt?.split('T')[0]}</span>
                                <span>{assignment.totalPoints} points</span>
                                {submission?.grade && <span>Grade: {submission.grade}%</span>}
                              </div>
                              {submission?.feedback && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Feedback:</strong> {submission.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submission Form Dialog */}
        <Dialog open={showSubmissionForm} onOpenChange={setShowSubmissionForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
            </DialogHeader>
            {selectedAssignment && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedAssignment.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedAssignment.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Due: {selectedAssignment.dueDate}</span>
                    <span>{selectedAssignment.totalPoints} points</span>
                    <span>{getCourseNameById(selectedAssignment.courseId)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  <div>
                    <Label htmlFor="submissionText">Your Submission</Label>
                    <Textarea 
                      name="submissionText" 
                      placeholder="Enter your assignment text or explain your submission..."
                      rows={6}
                      required 
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowSubmissionForm(false);
                      setSelectedAssignment(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitAssignmentMutation.isPending}>
                      {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}