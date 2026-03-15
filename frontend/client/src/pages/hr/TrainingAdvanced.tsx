import { formatDate } from '@/lib/formatDate';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, BookOpen, Award, Plus, Eye, Trash2, Users, CheckCircle2, Loader2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";
import {
  useTrainingPrograms,
  useCreateTrainingProgram,
  useDeleteTrainingProgram,
  useTrainingEnrollments,
  useCreateTrainingEnrollment,
  useDeleteTrainingEnrollment,
} from "@/services/trainingService";
import { useEmployees, useBranches, useDepartments } from "@/services/hrService";

export default function TrainingAdvanced() {
  const { selectedRole: userRole, selectedBranchId } = useAppContext();

  const [activeTab, setActiveTab] = useState('courses');
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showViewProgram, setShowViewProgram] = useState(false);

  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    category: '',
    instructor: '',
    duration: '',
    maxParticipants: '',
    startDate: '',
    endDate: '',
  });

  const [enrollFilterBranch, setEnrollFilterBranch] = useState('');
  const [enrollFilterDept, setEnrollFilterDept] = useState('');
  const [enrollmentData, setEnrollmentData] = useState({ employeeId: '', programId: '' });
  const [deleteProgramId, setDeleteProgramId] = useState<number | null>(null);
  const [deleteEnrollmentId, setDeleteEnrollmentId] = useState<number | null>(null);

  // Data hooks
  const { data: programs = [], isLoading: programsLoading, isError } = useTrainingPrograms();
  const { data: allEnrollments = [], isLoading: enrollmentsLoading } = useTrainingEnrollments();
  const { data: employeesData = [] } = useEmployees({ branchId: selectedBranchId });
  const { data: branchesData = [] } = useBranches();
  const { data: departmentsData = [] } = useDepartments({
    branchId: selectedBranchId || (enrollFilterBranch ? parseInt(enrollFilterBranch) : null),
  });

  const createProgramMutation = useCreateTrainingProgram();
  const deleteProgramMutation = useDeleteTrainingProgram();
  const createEnrollmentMutation = useCreateTrainingEnrollment();
  const deleteEnrollmentMutation = useDeleteTrainingEnrollment();

  const branches = (branchesData as any[]).filter((b: any) => b.id);
  const departments = departmentsData as any[];
  const employees = employeesData as any[];

  // Filter employees in enroll dialog by branch/dept filters
  const filteredEnrollEmployees = employees.filter((e: any) => {
    if (enrollFilterBranch && String(e.branch?.id) !== enrollFilterBranch) return false;
    if (enrollFilterDept && String(e.department?.id) !== enrollFilterDept) return false;
    return true;
  });

  // Filter enrollments by current branch
  const enrollments = selectedBranchId
    ? (allEnrollments as any[]).filter((e: any) => e.employee?.branch?.id === selectedBranchId)
    : (allEnrollments as any[]);

  // Stats
  const trainingStats = {
    totalCourses: programs.length,
    activeCourses: (programs as any[]).filter((p: any) => p.status === 'active').length,
    totalEnrollments: enrollments.length,
    completionRate: enrollments.length > 0
      ? Math.round((enrollments.filter((e: any) => e.status === 'completed').length / enrollments.length) * 100)
      : 0,
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
        setNewCourse({ name: '', description: '', category: '', instructor: '', duration: '', maxParticipants: '', startDate: '', endDate: '' });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء إنشاء الدورة');
      },
    });
  };

  const handleEnroll = () => {
    if (!enrollmentData.employeeId || !enrollmentData.programId) {
      toast.error('يرجى اختيار الموظف والدورة');
      return;
    }
    createEnrollmentMutation.mutate({
      employeeId: parseInt(enrollmentData.employeeId),
      programId: parseInt(enrollmentData.programId),
    }, {
      onSuccess: () => {
        toast.success('تم تسجيل الموظف بنجاح');
        setShowEnrollDialog(false);
        setEnrollmentData({ employeeId: '', programId: '' });
        setEnrollFilterBranch('');
        setEnrollFilterDept('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء التسجيل');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': case 'in_progress':
        return <Badge className="bg-green-100 text-green-700">نشط</Badge>;
      case 'upcoming': case 'planned': case 'draft':
        return <Badge className="bg-blue-100 text-blue-700">قادم</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700">مكتمل</Badge>;
      case 'enrolled':
        return <Badge className="bg-purple-100 text-purple-700">مسجل</Badge>;
      case 'withdrawn':
        return <Badge className="bg-red-100 text-red-700">منسحب</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              ) : (programs as any[]).length === 0 ? (
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
                    {(programs as any[]).map((program: any) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{program.category || '-'}</Badge>
                        </TableCell>
                        <TableCell>{program.instructor || '-'}</TableCell>
                        <TableCell>{program.duration ? `${program.duration} ${program.durationUnit || 'ساعة'}` : '-'}</TableCell>
                        <TableCell>{program.startDate ? formatDate(program.startDate) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(program.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedProgram(program); setShowViewProgram(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteProgramId(program.id)}>
                              <Trash2 className="h-4 w-4" />
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
                      <TableHead>الفرع</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>الدورة</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.employee
                            ? `${enrollment.employee.firstName} ${enrollment.employee.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {enrollment.employee?.branch?.nameAr || enrollment.employee?.branch?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {enrollment.employee?.department?.nameAr || enrollment.employee?.department?.name || '-'}
                        </TableCell>
                        <TableCell>{enrollment.program?.name || '-'}</TableCell>
                        <TableCell>
                          {enrollment.enrollmentDate ? formatDate(enrollment.enrollmentDate) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteEnrollmentId(enrollment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
              {enrollments.filter((e: any) => e.status === 'completed' && e.certificate).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا توجد شهادات</p>
                  <p className="text-sm">سيتم عرض الشهادات عند إتمام الموظفين للدورات التدريبية</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الدورة</TableHead>
                      <TableHead>تاريخ الإتمام</TableHead>
                      <TableHead>الشهادة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.filter((e: any) => e.status === 'completed').map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.employee ? `${enrollment.employee.firstName} ${enrollment.employee.lastName}` : '-'}
                        </TableCell>
                        <TableCell>{enrollment.program?.name || '-'}</TableCell>
                        <TableCell>{enrollment.completionDate ? formatDate(enrollment.completionDate) : '-'}</TableCell>
                        <TableCell>
                          {enrollment.certificate
                            ? <Badge className="bg-green-100 text-green-700">متاحة</Badge>
                            : <Badge variant="secondary">غير متاحة</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={(open) => { if (!open) setShowNewCourse(false); }}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              إنشاء دورة تدريبية جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الدورة <span className="text-red-500">*</span></Label>
                <Input
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="مثال: مهارات القيادة"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={newCourse.category} onValueChange={(v) => setNewCourse({ ...newCourse, category: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
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
                rows={3}
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
                <Label>المدة (ساعات)</Label>
                <Input
                  type="number"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                  placeholder="مثال: 16"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء <span className="text-red-500">*</span></Label>
                <Input type="date" value={newCourse.startDate} onChange={(e) => setNewCourse({ ...newCourse, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={newCourse.endDate} onChange={(e) => setNewCourse({ ...newCourse, endDate: e.target.value })} />
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
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowNewCourse(false)}>إلغاء</Button>
            <Button onClick={handleCreateCourse} disabled={createProgramMutation.isPending}>
              {createProgramMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إنشاء الدورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => { if (!open) { setShowEnrollDialog(false); setEnrollFilterBranch(''); setEnrollFilterDept(''); setEnrollmentData({ employeeId: '', programId: '' }); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              تسجيل موظف في دورة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Branch + Dept filters — branch hidden when in specific branch */}
            <div className={`grid gap-4 ${selectedBranchId ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {!selectedBranchId && (
                <div className="space-y-2">
                  <Label>الفرع (تصفية)</Label>
                  <Select value={enrollFilterBranch} onValueChange={(v) => { setEnrollFilterBranch(v === 'all' ? '' : v); setEnrollFilterDept(''); setEnrollmentData(d => ({ ...d, employeeId: '' })); }}>
                    <SelectTrigger><SelectValue placeholder="جميع الفروع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
                      {branches.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.nameAr || b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>القسم (تصفية)</Label>
                <Select value={enrollFilterDept} onValueChange={(v) => { setEnrollFilterDept(v === 'all' ? '' : v); setEnrollmentData(d => ({ ...d, employeeId: '' })); }}>
                  <SelectTrigger><SelectValue placeholder="جميع الأقسام" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={enrollmentData.employeeId} onValueChange={(v) => setEnrollmentData({ ...enrollmentData, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>
                  {filteredEnrollEmployees.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الدورة التدريبية <span className="text-red-500">*</span></Label>
              <Select value={enrollmentData.programId} onValueChange={(v) => setEnrollmentData({ ...enrollmentData, programId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الدورة" /></SelectTrigger>
                <SelectContent>
                  {(programs as any[]).map((prog: any) => (
                    <SelectItem key={prog.id} value={String(prog.id)}>{prog.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowEnrollDialog(false); setEnrollFilterBranch(''); setEnrollFilterDept(''); setEnrollmentData({ employeeId: '', programId: '' }); }}>إلغاء</Button>
            <Button onClick={handleEnroll} disabled={createEnrollmentMutation.isPending}>
              {createEnrollmentMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              تسجيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Program Dialog */}
      <Dialog open={showViewProgram} onOpenChange={(open) => { if (!open) { setShowViewProgram(false); setSelectedProgram(null); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              تفاصيل الدورة
            </DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">اسم الدورة</p>
                  <p className="font-medium">{selectedProgram.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">التصنيف</p>
                  <p className="font-medium">{selectedProgram.category || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">المدرب</p>
                  <p className="font-medium">{selectedProgram.instructor || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">المدة</p>
                  <p className="font-medium">{selectedProgram.duration ? `${selectedProgram.duration} ${selectedProgram.durationUnit || 'ساعة'}` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">تاريخ البدء</p>
                  <p className="font-medium">{selectedProgram.startDate ? formatDate(selectedProgram.startDate) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">تاريخ الانتهاء</p>
                  <p className="font-medium">{selectedProgram.endDate ? formatDate(selectedProgram.endDate) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">الحد الأقصى</p>
                  <p className="font-medium">{selectedProgram.maxParticipants || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">الحالة</p>
                  {getStatusBadge(selectedProgram.status)}
                </div>
              </div>
              {selectedProgram.description && (
                <div>
                  <p className="text-gray-500 mb-1 text-sm">الوصف</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedProgram.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowViewProgram(false); setSelectedProgram(null); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Program AlertDialog */}
      <AlertDialog open={deleteProgramId !== null} onOpenChange={(open) => { if (!open) setDeleteProgramId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الدورة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الدورة التدريبية؟ سيتم حذف جميع التسجيلات المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteProgramId !== null) {
                  deleteProgramMutation.mutate(deleteProgramId, {
                    onSuccess: () => { toast.success('تم حذف الدورة'); setDeleteProgramId(null); },
                    onError: (err: any) => { toast.error(`فشل الحذف: ${err.message}`); setDeleteProgramId(null); },
                  });
                }
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Enrollment AlertDialog */}
      <AlertDialog open={deleteEnrollmentId !== null} onOpenChange={(open) => { if (!open) setDeleteEnrollmentId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التسجيل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التسجيل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteEnrollmentId !== null) {
                  deleteEnrollmentMutation.mutate(deleteEnrollmentId, {
                    onSuccess: () => { toast.success('تم حذف التسجيل'); setDeleteEnrollmentId(null); },
                    onError: (err: any) => { toast.error(`فشل الحذف: ${err.message}`); setDeleteEnrollmentId(null); },
                  });
                }
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
