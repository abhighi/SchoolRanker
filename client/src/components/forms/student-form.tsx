import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Simplified student form — only the essentials. The Student ID, enrollment
// date, status and login account are generated automatically by the server.
const studentFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  grade: z.number({ invalid_type_error: "Select a grade" }).min(1).max(12),
  section: z.string().min(1, "Select a section"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
}

export function StudentForm({ open, onOpenChange, student }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!student;

  const getDefaultValues = (): StudentFormValues => ({
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    email: student?.email ?? "",
    grade: student?.grade ?? 9,
    section: student?.section ?? "A",
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Re-initialize the form each time it opens (or a different student is edited).
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const applyFieldErrors = (error: any, fallback: string) => {
    try {
      const parsed = JSON.parse(error?.message ?? "{}");
      if (parsed?.errors?.length) {
        parsed.errors.forEach((err: { field: string; message: string }) => {
          form.setError(err.field as any, { message: err.message });
        });
        return;
      }
      if (parsed?.message) {
        toast({ title: parsed.message, variant: "destructive" });
        return;
      }
    } catch {
      /* fall through */
    }
    toast({ title: fallback, variant: "destructive" });
  };

  const createMutation = useMutation({
    mutationFn: (data: StudentFormValues) => apiRequest("POST", "/api/students", data),
    onSuccess: async (res) => {
      const created = await res.json().catch(() => null);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Student created",
        description: created?.loginEmail
          ? `Login: ${created.loginEmail} / ${created.defaultPassword} (they set their own password on first login)`
          : undefined,
      });
      onOpenChange(false);
      form.reset(getDefaultValues());
    },
    onError: (error: any) => applyFieldErrors(error, "Failed to create student"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: StudentFormValues) => apiRequest("PUT", `/api/students/${student!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Student updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => applyFieldErrors(error, "Failed to update student"),
  });

  const onSubmit = (data: StudentFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...form.register("firstName")} placeholder="John" />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...form.register("lastName")} placeholder="Doe" />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (used to log in)</Label>
            <Input id="email" type="email" {...form.register("email")} placeholder="student@school.edu" />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={String(form.watch("grade") ?? "")}
                onValueChange={(value) => form.setValue("grade", parseInt(value), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.grade && (
                <p className="text-sm text-red-500">{form.formState.errors.grade.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="section">Section</Label>
              <Select
                value={form.watch("section") ?? ""}
                onValueChange={(value) => form.setValue("section", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D"].map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.section && (
                <p className="text-sm text-red-500">{form.formState.errors.section.message}</p>
              )}
            </div>
          </div>

          {!isEditing && (
            <p className="text-xs text-gray-500">
              A login account is created automatically. The student signs in with this
              email and the default password, then sets their own password on first login.
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? "Update Student" : "Create Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
