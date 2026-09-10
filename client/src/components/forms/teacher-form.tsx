import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Teacher } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Simplified teacher form — only the essentials. The Teacher ID, join date,
// status, courses and login account are generated automatically by the server.
// The chosen grades link this teacher to students in those grades.
const teacherFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(1, "Select a subject"),
  // Optional in the schema (edit doesn't require it); required at create time,
  // enforced in onSubmit below.
  grades: z.array(z.number()).optional().default([]),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher;
}

const SUBJECTS = [
  "Mathematics", "Science", "English", "History", "Physics",
  "Chemistry", "Biology", "Computer", "Nepali", "Social Studies",
  "Geography", "Health", "Arts",
];

export function TeacherForm({ open, onOpenChange, teacher }: TeacherFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!teacher;

  const getDefaultValues = (): TeacherFormValues => ({
    firstName: teacher?.firstName ?? "",
    lastName: teacher?.lastName ?? "",
    email: teacher?.email ?? "",
    subject: teacher?.subject ?? "",
    grades: [],
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher]);

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
    mutationFn: (data: TeacherFormValues) => apiRequest("POST", "/api/teachers", data),
    onSuccess: async (res) => {
      const created = await res.json().catch(() => null);
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Teacher created",
        description: created?.loginEmail
          ? `Login: ${created.loginEmail} / ${created.defaultPassword} (they set their own password on first login)`
          : undefined,
      });
      onOpenChange(false);
      form.reset(getDefaultValues());
    },
    onError: (error: any) => applyFieldErrors(error, "Failed to create teacher"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: TeacherFormValues) => apiRequest("PUT", `/api/teachers/${teacher!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Teacher updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => applyFieldErrors(error, "Failed to update teacher"),
  });

  const onSubmit = (data: TeacherFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      if (!data.grades || data.grades.length === 0) {
        form.setError("grades", { message: "Select at least one grade (class)" });
        return;
      }
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
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
            <Input id="email" type="email" {...form.register("email")} placeholder="teacher@school.edu" />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={form.watch("subject") ?? ""}
              onValueChange={(value) => form.setValue("subject", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label>Grades / Classes taught</Label>
            <p className="text-xs text-gray-500 mb-2">
              Students in these grades will see this teacher, and the teacher gets a course for each.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {GRADE_OPTIONS.map((g) => {
                const selected = (form.watch("grades") ?? []).includes(g);
                return (
                  <label
                    key={g}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1.5 cursor-pointer text-sm ${
                      selected ? "border-primary bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const current = form.watch("grades") ?? [];
                        const next = checked
                          ? [...current, g]
                          : current.filter((x) => x !== g);
                        form.setValue("grades", next, { shouldValidate: true });
                      }}
                    />
                    <span>Grade {g}</span>
                  </label>
                );
              })}
            </div>
            {form.formState.errors.grades && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.grades.message as string}</p>
            )}
          </div>

          {!isEditing && (
            <p className="text-xs text-gray-500">
              A login account is created automatically. The teacher signs in with this
              email and the default password, then sets their own password on first login.
            </p>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? "Update Teacher" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
