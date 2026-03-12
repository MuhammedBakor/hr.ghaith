import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, BookOpen, Award, Plus, Eye, Edit, Users, CheckCircle2, Video, Loader2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";
import {
  useTrainingPrograms,
  useCreateTrainingProgram,
  useUpdateTrainingProgram,
  useDeleteTrainingProgram,
  useTrainingEnrollments,
  useCreateTrainingEnrollment,
  useUpdateTrainingEnrollment
} from "@/services/trainingService";
import { useEmployees } from "@/services/hrService";

export default function TrainingAdvanced() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole, selectedBranchId } = useAppContext();
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin";

  const [activeTab, setActiveTab] = useState('courses');
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    category: '',
    instructor: '',
    duration: '',
    maxParticipants: '',
    startDate: '',
    endDate: '',
    type: 'classroom'
  });

  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({ employeeId: '', programId: '' });

  // Hooks
  const { data: programs = [], isLoading: programsLoading, isError } = useTrainingPrograms();
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useTrainingEnrollments();
  const { data: employees = [] } = useEmployees({ branchId: selectedBranchId });

  const createProgramMutation = useCreateTrainingProgram();
  const createEnrollmentMutation = useCreateTrainingEnrollment();

  // حساب الإحصائيات من البيانات الفعلية
  const trainingStats = {
    totalCourses: programs.length,
    activeCourses: programs.filter((p: any) => p.status === 'active').length,
    totalEnrollments: enrollments.length,
    completionRate: enrollments.length > 0
      ? Math.round((enrollments.filter((e: any) => e.status === 'completed').length / enrollments.length) * 100)
      : 0
  };

  const handleCreateCourse = () => {
    if (!newCourse.name || !newCourse.startDate) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createProgramMutation.mutate({
      name: newCourse.name,
      description: newCourse.description,
      category: newCourse.category,
      instructor: newCourse.instructor,
      duration: newCourse.duration ? parseInt(newCourse.duration) : undefined,
      maxParticipants: newCourse.maxParticipants ? parseInt(newCourse.maxParticipants) : undefined,
      startDate: newCourse.startDate ? new Date(newCourse.startDate).toISOString() : undefined,
      endDate: newCourse.endDate ? new Date(newCourse.endDate).toISOString() : undefined,
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء الدورة بنجاح');
        setShowNewCourse(false);
        setNewCourse({
          name: '',
          description: '',
          category: '',
          instructor: '',
          duration: '',
          maxParticipants: '',
          startDate: '',
          endDate: '',
          type: 'classroom'
        });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء إنشاء الدورة');
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-700">نشط</Badge>;
      case 'upcoming':
      case 'planned':
        return <Badge className="bg-blue-100 text-blue-700">قادم</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700">مكتمل</Badge>;
      case 'enrolled':
        return <Badge className="bg-purple-100 text-purple-700">مسجل</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'online' ? <Video className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  // Remove early return

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التدريب والتطوير</h2>
          <p className="text-gray-500">إدارة الدورات التدريبية وتطوير الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEnrollDialog(true)}>
            <Users className="h-4 w-4 ms-2" />
            تسجيل موظف
          </Button>
          <Button onClick={() => setShowNewCourse(true)}>
            <Plus className="h-4 w-4 ms-2" />
            دورة جديدة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الدورات</p>
                <h3 className="text-2xl font-bold">{trainingStats.totalCourses}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">دورات نشطة</p>
                <h3 className="text-2xl font-bold text-green-600">{trainingStats.activeCourses}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي التسجيلات</p>
                <h3 className="text-2xl font-bold">{trainingStats.totalEnrollments}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">نسبة الإكمال</p>
                <h3 className="text-2xl font-bold">{trainingStats.completionRate}%</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="courses">الدورات</TabsTrigger>
          <TabsTrigger value="enrollments">التسجيلات</TabsTrigger>
          <TabsTrigger value="certificates">الشهادات</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الدورات التدريبية</CardTitle>
              <PrintButton title="الدورات التدريبية" />
              <CardDescription>قائمة جميع الدورات المتاحة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {programsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>
              ) : programs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا توجد دورات تدريبية</p>
                  <p className="text-sm mb-4">قم بإنشاء دورة تدريبية جديدة</p>
                  <Button onClick={() => setShowNewCourse(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    إنشاء دورة جديدة
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدورة</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>المدرب</TableHead>
                      <TableHead>المدة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((program: any) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{program.category || '-'}</Badge>
                        </TableCell>
                        <TableCell>{program.instructor || '-'}</TableCell>
                        <TableCell>{program.duration || '-'}</TableCell>
                        <TableCell>{program.startDate ? formatDate(program.startDate) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(program.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedProgram(program);
                              setShowEditProgram(true);
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setSelectedProgram(program);
                              setShowEditProgram(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>التسجيلات</CardTitle>
              <CardDescription>قائمة تسجيلات الموظفين في الدورات</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا توجد تسجيلات</p>
                  <p className="text-sm">قم بتسجيل موظفين في الدورات التدريبية</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الدورة</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.employeeName || '-'}</TableCell>
                        <TableCell>{enrollment.programName || '-'}</TableCell>
                        <TableCell>{enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress || 0} className="w-20" />
                            <span className="text-sm">{enrollment.progress || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الشهادات</CardTitle>
              <CardDescription>شهادات إتمام الدورات التدريبية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">لا توجد شهادات</p>
                <p className="text-sm">سيتم عرض الشهادات عند إتمام الموظفين للدورات التدريبية</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Course Dialog */}
      {showNewCourse && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء دورة تدريبية جديدة</h3>
            <p className="text-sm text-gray-500">أدخل تفاصيل الدورة التدريبية</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الدورة *</Label>
                <Input
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="مثال: مهارات القيادة"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={newCourse.category} onValueChange={(v) => setNewCourse({ ...newCourse, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إدارية">إدارية</SelectItem>
                    <SelectItem value="تقنية">تقنية</SelectItem>
                    <SelectItem value="مهارات شخصية">مهارات شخصية</SelectItem>
                    <SelectItem value="مالية">مالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="وصف الدورة التدريبية..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدرب</Label>
                <Input
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                  placeholder="اسم المدرب"
                />
              </div>
              <div className="space-y-2">
                <Label>المدة</Label>
                <Input
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                  placeholder="مثال: 16 ساعة"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={newCourse.startDate}
                  onChange={(e) => setNewCourse({ ...newCourse, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={newCourse.endDate}
                  onChange={(e) => setNewCourse({ ...newCourse, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للمشاركين</Label>
              <Input
                type="number"
                value={newCourse.maxParticipants}
                onChange={(e) => setNewCourse({ ...newCourse, maxParticipants: e.target.value })}
                placeholder="مثال: 20"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewCourse(false)}>إلغاء</Button>
            <Button onClick={handleCreateCourse} disabled={createProgramMutation.isPending}>
              {createProgramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              إنشاء الدورة
            </Button>
          </div>
        </div>
      </div>)}

      {/* Enroll Dialog */}
      {showEnrollDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تسجيل موظف في دورة</h3>
            <p className="text-sm text-gray-500">اختر الموظف والدورة التدريبية</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={enrollmentData.employeeId} onValueChange={(value) => setEnrollmentData({ ...enrollmentData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدورة التدريبية</Label>
              <Select value={enrollmentData.programId} onValueChange={(value) => setEnrollmentData({ ...enrollmentData, programId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((prog: any) => (
                    <SelectItem key={prog.id} value={String(prog.id)}>{prog.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => {
                if (!enrollmentData.employeeId || !enrollmentData.programId) {
                  toast.error('يرجى اختيار الموظف والدورة');
                  return;
                }
                createEnrollmentMutation.mutate({
                  employeeId: parseInt(enrollmentData.employeeId),
                  programId: parseInt(enrollmentData.programId)
                }, {
                  onSuccess: () => {
                    toast.success('تم تسجيل الموظف بنجاح');
                    setShowEnrollDialog(false);
                    setEnrollmentData({ employeeId: '', programId: '' });
                  },
                  onError: (error: any) => {
                    toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء التسجيل');
                  }
                });
              }}
              disabled={createEnrollmentMutation.isPending}
            >
              {createEnrollmentMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              تسجيل
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
