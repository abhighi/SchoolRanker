import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { TeacherForm } from "@/components/forms/teacher-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Eye, Edit, Trash2, Download, Printer, Presentation, Mail, Phone, MapPin } from "lucide-react";
import type { Teacher } from "@shared/schema";

export default function Teachers() {
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>();
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Teacher deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete teacher", variant: "destructive" });
    },
  });

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowTeacherForm(true);
  };

  const handleView = (teacher: Teacher) => {
    setViewingTeacher(teacher);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowTeacherForm(false);
    setEditingTeacher(undefined);
  };

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = !searchTerm ||
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = !subjectFilter || teacher.subject === subjectFilter;
    const matchesStatus = !statusFilter || teacher.status === statusFilter;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const subjects = Array.from(new Set(teachers.map(t => t.subject))).filter(Boolean);

  return (
    <div>
      <Header
        title="Teachers Management"
        subtitle="Manage teacher profiles, assignments, and schedules"
        onAddClick={() => setShowTeacherForm(true)}
        addButtonText="Add New Teacher"
      />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Teacher Records</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <Presentation className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                <p className="text-gray-500 mb-4">
                  {teachers.length === 0
                    ? "Get started by adding your first teacher."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                <Button onClick={() => setShowTeacherForm(true)}>
                  Add New Teacher
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                              <Presentation className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {teacher.firstName} {teacher.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{teacher.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.teacherId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.experience ? `${teacher.experience} years` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={teacher.status === 'active' ? 'default' : 'destructive'}
                          >
                            {teacher.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(teacher)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(teacher)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(teacher.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredTeachers.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{filteredTeachers.length}</span> of{" "}
                  <span className="font-medium">{filteredTeachers.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TeacherForm
        open={showTeacherForm}
        onOpenChange={handleFormClose}
        teacher={editingTeacher}
      />

      {/* View Teacher Dialog */}
      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Teacher ID</p>
                  <p className="mt-1">{viewingTeacher.teacherId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{viewingTeacher.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">First Name</p>
                  <p className="mt-1">{viewingTeacher.firstName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Name</p>
                  <p className="mt-1">{viewingTeacher.lastName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{viewingTeacher.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="mt-1">{viewingTeacher.subject}</p>
                </div>
                {viewingTeacher.qualification && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Qualification</p>
                    <p className="mt-1">{viewingTeacher.qualification}</p>
                  </div>
                )}
                {viewingTeacher.phoneNumber && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{viewingTeacher.phoneNumber}</p>
                  </div>
                )}
                {viewingTeacher.address && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="mt-1">{viewingTeacher.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
