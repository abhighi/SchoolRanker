import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { StudentForm } from "@/components/forms/student-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Eye, Edit, Trash2, Download, Printer, Users, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import type { Student } from "@shared/schema";

export default function Students() {
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [viewingStudent, setViewingStudent] = useState<Student | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Student deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowStudentForm(false);
    setEditingStudent(undefined);
  };

  const handleView = (student: Student) => {
    setViewingStudent(student);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Student Records Report', 20, 30);

      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Total Students: ${filteredStudents.length}`, 20, 55);

      const tableData = filteredStudents.map(student => [
        `${student.firstName} ${student.lastName}`,
        student.studentId,
        student.grade.toString(),
        student.section || 'N/A',
        student.email,
        student.status
      ]);

      (doc as any).autoTable({
        head: [['Name', 'Student ID', 'Grade', 'Section', 'Email', 'Status']],
        body: tableData,
        startY: 70,
        theme: 'grid'
      });

      doc.save('student-records.pdf');
      toast({ title: "PDF exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export PDF", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredStudents.map(student => ({
        Name: `${student.firstName} ${student.lastName}`,
        'Student ID': student.studentId,
        Grade: student.grade,
        Section: student.section || '',
        Email: student.email,
        Phone: student.phoneNumber || '',
        'Date of Birth': student.dateOfBirth || '',
        Address: student.address || '',
        'Enrollment Date': student.enrollmentDate || '',
        Status: student.status
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'student-records.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "CSV exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export CSV", variant: "destructive" });
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = !gradeFilter || student.grade.toString() === gradeFilter;
    const matchesSection = !sectionFilter || student.section === sectionFilter;
    const matchesStatus = !statusFilter || student.status === statusFilter;

    return matchesSearch && matchesGrade && matchesSection && matchesStatus;
  });

  return (
    <div>
      <Header
        title="Students Management"
        subtitle="Manage student records, enrollment, and academic information"
        onAddClick={() => setShowStudentForm(true)}
        addButtonText="Add New Student"
      />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
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
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Records</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
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
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500 mb-4">
                  {students.length === 0
                    ? "Get started by adding your first student."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                <Button onClick={() => setShowStudentForm(true)}>
                  Add New Student
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
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
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              student.status === 'active' ? 'default' :
                                student.status === 'graduated' ? 'secondary' : 'destructive'
                            }
                          >
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(student)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'teacher') && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user?.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(student.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{filteredStudents.length}</span> of{" "}
                  <span className="font-medium">{filteredStudents.length}</span> results
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

      <StudentForm
        open={showStudentForm}
        onOpenChange={handleFormClose}
        student={editingStudent}
      />

      {/* Student Detail Dialog */}
      <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(undefined)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{viewingStudent.firstName} {viewingStudent.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student ID</label>
                      <p className="text-sm text-gray-900">{viewingStudent.studentId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {viewingStudent.email}
                      </p>
                    </div>
                    {viewingStudent.phoneNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {viewingStudent.phoneNumber}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm text-gray-900">{viewingStudent.dateOfBirth}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-sm text-gray-900">Grade {viewingStudent.grade}</p>
                    </div>
                    {viewingStudent.section && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Section</label>
                        <p className="text-sm text-gray-900">{viewingStudent.section}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Enrollment Date</label>
                      <p className="text-sm text-gray-900">{viewingStudent.enrollmentDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge
                        variant={
                          viewingStudent.status === 'active' ? 'default' :
                            viewingStudent.status === 'graduated' ? 'secondary' : 'destructive'
                        }
                        className="mt-1"
                      >
                        {viewingStudent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {viewingStudent.address && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                  <div>
                    <p className="text-sm text-gray-900 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      {viewingStudent.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingStudent(undefined)}>
                  Close
                </Button>
                {(user?.role === 'admin' || user?.role === 'teacher') && (
                  <Button
                    onClick={() => {
                      setViewingStudent(undefined);
                      handleEdit(viewingStudent);
                    }}
                  >
                    Edit Student
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
