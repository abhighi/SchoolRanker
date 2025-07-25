import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMarkSchema, type InsertMark, type Mark } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MarksFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mark?: Mark;
}

export function MarksForm({ open, onOpenChange, mark }: MarksFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!mark;

  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const form = useForm<InsertMark>({
    resolver: zodResolver(insertMarkSchema),
    defaultValues: mark ? {
      studentId: mark.studentId,
      courseId: mark.courseId,
      examType: mark.examType as "midterm" | "final" | "quiz" | "assignment" | "project",
      marks: mark.marks,
      totalMarks: mark.totalMarks,
      examDate: mark.examDate,
      remarks: mark.remarks || "",
    } : {
      studentId: "",
      courseId: "",
      examType: "quiz",
      marks: "",
      totalMarks: "",
      examDate: new Date().toISOString().split('T')[0],
      remarks: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertMark) => apiRequest("POST", "/api/marks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Mark added successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add mark", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertMark) => apiRequest("PUT", `/api/marks/${mark!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Mark updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update mark", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertMark) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const examTypes = ["midterm", "final", "quiz", "assignment", "project"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mark" : "Add New Mark"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="studentId">Student</Label>
            <Select onValueChange={(value) => form.setValue("studentId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} - {student.studentId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.studentId && (
              <p className="text-sm text-red-500">{form.formState.errors.studentId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="courseId">Course</Label>
            <Select onValueChange={(value) => form.setValue("courseId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} - {course.courseCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.courseId && (
              <p className="text-sm text-red-500">{form.formState.errors.courseId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="examType">Exam Type</Label>
            <Select onValueChange={(value) => form.setValue("examType", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.examType && (
              <p className="text-sm text-red-500">{form.formState.errors.examType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marks">Marks Obtained</Label>
              <Input
                id="marks"
                type="number"
                step="0.01"
                {...form.register("marks")}
                placeholder="85"
              />
              {form.formState.errors.marks && (
                <p className="text-sm text-red-500">{form.formState.errors.marks.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                step="0.01"
                {...form.register("totalMarks")}
                placeholder="100"
              />
              {form.formState.errors.totalMarks && (
                <p className="text-sm text-red-500">{form.formState.errors.totalMarks.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="examDate">Exam Date</Label>
            <Input
              id="examDate"
              type="date"
              {...form.register("examDate")}
            />
            {form.formState.errors.examDate && (
              <p className="text-sm text-red-500">{form.formState.errors.examDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              {...form.register("remarks")}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Update Mark" : "Add Mark"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
