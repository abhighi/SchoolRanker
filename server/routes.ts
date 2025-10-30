"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
}

interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: string;
  submissionText: string;
  grade?: number;
  createdAt: string;
}

interface StudentWithGPA {
  id: string;
  name: string;
  gpa: number;
}

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const studentId = "student-001";

  // Queries
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: submissions = [] } = useQuery<AssignmentSubmission[]>({
    queryKey: ["/api/assignment-submissions"],
  });

  const { data: studentsWithGPA = [] } = useQuery<StudentWithGPA[]>({
    queryKey: ["/api/students-with-gpa"],
  });

  const currentStudent = studentsWithGPA.find((s) => s.id === studentId);

  // Mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("📤 Sending payload to API:", data); // Debug
      const res = await apiRequest("POST", "/api/assignment-submissions", data);
      console.log("📥 API Response:", res); // Debug
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignment-submissions"] });
      toast({ title: "✅ Assignment submitted successfully" });
      setShowSubmissionForm(false);
      setSelectedAssignment(null);
    },
    onError: (error: any) => {
      console.error("❌ Submission error:", error);
      toast({
        title: "Failed to submit assignment",
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) {
      toast({ title: "No assignment selected", variant: "destructive" });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const submissionText = formData.get("submissionText")?.toString().trim();

    if (!submissionText) {
      toast({ title: "Please enter your submission text", variant: "destructive" });
      return;
    }

    const payload = {
      assignmentId: selectedAssignment.id,
      studentId: studentId,
      submissionText,
    };

    console.log("📝 Submitting assignment:", payload); // Debug
    submitAssignmentMutation.mutate(payload);
  };

  const getAssignmentStatusBadge = (assignment: Assignment) => {
    const submission = submissions.find((s) => s.assignmentId === assignment.id);
    if (submission) return <Badge variant="success">Submitted</Badge>;
    if (new Date(assignment.dueDate) < new Date()) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getProgressColor = (assignment: Assignment) => {
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diff = due.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return 0;
    if (days < 2) return 20;
    if (days < 5) return 50;
    return 100;
  };

  return (
    <div className="p-6 space-y-6">
      {/* GPA Overview */}
      <Card>
        <CardHeader>
          <CardTitle>GPA Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            {currentStudent?.gpa != null ? currentStudent.gpa.toFixed(2) : "N/A"}
          </p>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>{getAssignmentStatusBadge(assignment)}</TableCell>
                  <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Progress value={getProgressColor(assignment)} />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmissionForm(true);
                      }}
                      disabled={!!submissions.find((s) => s.assignmentId === assignment.id)}
                    >
                      Submit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Submitted On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...submissions]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {assignments.find((a) => a.id === submission.assignmentId)?.title || "Unknown"}
                    </TableCell>
                    <TableCell>{submission.grade ?? "Pending"}</TableCell>
                    <TableCell>{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submission Form Dialog */}
      <Dialog open={showSubmissionForm} onOpenChange={setShowSubmissionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <p className="font-semibold">{selectedAssignment.title}</p>
              <Textarea name="submissionText" placeholder="Enter your submission..." />
              <Button type="submit" disabled={submitAssignmentMutation.isPending}>
                {submitAssignmentMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
