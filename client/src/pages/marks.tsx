import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { MarksForm } from "@/components/forms/marks-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopStudents, categorizeStudentPerformance } from "@/lib/ranking";
import { Award, TrendingUp, TrendingDown, Minus, Calculator, BookOpen, Users } from "lucide-react";
import type { StudentWithGPA, SubjectTopper } from "@shared/schema";

export default function Marks() {
  const [showMarksForm, setShowMarksForm] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("");

  const { data: studentsWithGPA = [], isLoading: studentsLoading } = useQuery<StudentWithGPA[]>({
    queryKey: ["/api/analytics/students-gpa"],
  });

  const { data: subjectToppers = [], isLoading: toppersLoading } = useQuery<SubjectTopper[]>({
    queryKey: ["/api/analytics/subject-toppers"],
  });

  // Filter students by grade if selected
  const filteredStudents = gradeFilter && gradeFilter !== "all"
    ? studentsWithGPA.filter(student => student.grade.toString() === gradeFilter)
    : studentsWithGPA;

  const topStudents = getTopStudents(filteredStudents, 3);
  const performanceStats = categorizeStudentPerformance(filteredStudents);

  return (
    <div>
      <Header 
        title="Marks & Rankings" 
        subtitle="View student performance and academic rankings"
        onAddClick={() => setShowMarksForm(true)}
        addButtonText="Add Marks"
      />

      <div className="p-6 space-y-6">
        
        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Class Rankings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Class Rankings</CardTitle>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : topStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>No ranking data available yet.</p>
                  <p className="text-sm">Add student marks to see rankings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div 
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' :
                        index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400' :
                        'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-500' :
                          'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            Grade {student.grade} • Section {student.section}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          'text-orange-600'
                        }`}>
                          {student.gpa.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">GPA</p>
                      </div>
                    </div>
                  ))}

                  {/* Additional Rankings */}
                  {filteredStudents.length > 3 && (
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      {getTopStudents(filteredStudents, 10).slice(3, 8).map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 4}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {student.gpa.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Rankings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subject-wise Toppers</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {toppersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : subjectToppers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                  <p>No subject toppers available yet.</p>
                  <p className="text-sm">Add course marks to see subject rankings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjectToppers.map((topper, index) => (
                    <div 
                      key={topper.subject}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index % 4 === 0 ? 'bg-blue-50' :
                        index % 4 === 1 ? 'bg-green-50' :
                        index % 4 === 2 ? 'bg-purple-50' :
                        'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                          index % 4 === 0 ? 'bg-blue-500' :
                          index % 4 === 1 ? 'bg-green-500' :
                          index % 4 === 2 ? 'bg-purple-500' :
                          'bg-red-500'
                        }`}>
                          {index % 4 === 0 ? <Calculator className="w-4 h-4" /> :
                           index % 4 === 1 ? <BookOpen className="w-4 h-4" /> :
                           index % 4 === 2 ? <Users className="w-4 h-4" /> :
                           <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{topper.subject}</p>
                          <p className="text-sm text-gray-600">{topper.studentName}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        index % 4 === 0 ? 'text-blue-600' :
                        index % 4 === 1 ? 'text-green-600' :
                        index % 4 === 2 ? 'text-purple-600' :
                        'text-red-600'
                      }`}>
                        {topper.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance Analytics</CardTitle>
              <div className="flex space-x-2">
                <Select defaultValue="semester">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semester">This Semester</SelectItem>
                    <SelectItem value="last-semester">Last Semester</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performanceStats.aboveAverage}%
                </div>
                <div className="text-sm text-gray-600">Above Average Students</div>
                <div className="text-xs text-green-600 mt-1 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  High performers
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {performanceStats.average}%
                </div>
                <div className="text-sm text-gray-600">Average Performance</div>
                <div className="text-xs text-yellow-600 mt-1 flex items-center justify-center">
                  <Minus className="w-4 h-4 mr-1" />
                  Meeting standards
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {performanceStats.belowAverage}%
                </div>
                <div className="text-sm text-gray-600">Below Average Students</div>
                <div className="text-xs text-red-600 mt-1 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Need support
                </div>
              </div>
            </div>

            {performanceStats.averageGPA > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {performanceStats.averageGPA.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Overall Class Average GPA</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Class Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No student data available</h3>
                <p className="text-gray-500 mb-4">Add students and their marks to see complete rankings.</p>
                <Button onClick={() => setShowMarksForm(true)}>
                  Add Marks
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getTopStudents(filteredStudents, filteredStudents.length).map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index < 3 ? 'text-white' : 'bg-gray-100 text-gray-600'
                          } ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-500' :
                            index === 2 ? 'bg-orange-500' :
                            ''
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <Users className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{student.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.grade} - {student.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {student.gpa.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              student.gpa >= performanceStats.averageGPA + 0.3 ? 'default' :
                              student.gpa >= performanceStats.averageGPA - 0.3 ? 'secondary' : 'destructive'
                            }
                          >
                            {student.gpa >= performanceStats.averageGPA + 0.3 ? 'Excellent' :
                             student.gpa >= performanceStats.averageGPA - 0.3 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MarksForm 
        open={showMarksForm} 
        onOpenChange={setShowMarksForm}
      />
    </div>
  );
}
