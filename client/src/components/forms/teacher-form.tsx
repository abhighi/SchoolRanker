import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeacherSchema, type InsertTeacher, type Teacher } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher;
}

export function TeacherForm({ open, onOpenChange, teacher }: TeacherFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!teacher;

  const form = useForm<InsertTeacher>({
    resolver: zodResolver(insertTeacherSchema),
    defaultValues: teacher ? {
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber || "",
      address: teacher.address || "",
      subject: teacher.subject,
      qualification: teacher.qualification || "",
      experience: teacher.experience || 0,
      salary: teacher.salary || "",
      joinDate: teacher.joinDate,
      status: teacher.status as "active" | "inactive",
      profileImage: teacher.profileImage || "",
    } : {
      teacherId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      subject: "",
      qualification: "",
      experience: 0,
      salary: "",
      joinDate: new Date().toISOString().split('T')[0],
      status: "active",
      profileImage: "",
    },
  });

  // When editing, ensure form reflects latest 'teacher' values when dialog opens
  useEffect(() => {
    if (isEditing && teacher) {
      form.reset({
        teacherId: teacher.teacherId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phoneNumber: teacher.phoneNumber || "",
        address: teacher.address || "",
        subject: teacher.subject,
        qualification: teacher.qualification || "",
        experience: teacher.experience || 0,
        salary: teacher.salary || "",
        joinDate: teacher.joinDate,
        status: teacher.status as "active" | "inactive",
        profileImage: teacher.profileImage || "",
      });
    }
  }, [isEditing, teacher, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertTeacher) => apiRequest("POST", "/api/teachers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Teacher created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create teacher", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertTeacher) => apiRequest("PUT", `/api/teachers/${teacher!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Teacher updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update teacher", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertTeacher) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const subjects = [
    "Mathematics", "Science", "English", "History", "Physics", 
    "Chemistry", "Biology", "Computer Science", "Geography", "Arts"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                {...form.register("teacherId")}
                placeholder="TCH-2024-001"
              />
              {form.formState.errors.teacherId && (
                <p className="text-sm text-red-500">{form.formState.errors.teacherId.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="teacher@school.edu"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="John"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Doe"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select onValueChange={(value) => form.setValue("subject", value)} defaultValue={form.getValues("subject") || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
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
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                {...form.register("qualification")}
                placeholder="M.Sc, B.Ed"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input
                id="experience"
                type="number"
                {...form.register("experience", { valueAsNumber: true })}
                placeholder="5"
              />
            </div>
            
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                {...form.register("salary")}
                placeholder="50000"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue("status", value as "active" | "inactive")} defaultValue={form.getValues("status") || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                {...form.register("phoneNumber")}
                placeholder="+1234567890"
              />
            </div>
            
            <div>
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                {...form.register("joinDate")}
              />
              {form.formState.errors.joinDate && (
                <p className="text-sm text-red-500">{form.formState.errors.joinDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Teacher address"
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
              {isEditing ? "Update Teacher" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
