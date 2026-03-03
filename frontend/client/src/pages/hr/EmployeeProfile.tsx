import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Edit, Printer, Download, Mail, Phone, MapPin, Building2, Briefcase, CreditCard, FileText, AlertTriangle, CheckCircle2, XCircle, User, Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  useEmployee,
  useAttendanceByEmployee,
  useLeavesByEmployee,
  usePayrollByEmployee,
  useDeleteEmployee,
  useUpdateEmployee
} from '@/services/hrService';

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  expiryDate?: string;
  status: 'valid' | 'expiring' | 'expired';
  fileUrl?: string;
}

interface EmployeeContract {
  id: string;
  type: string;
  startDate: string;
  endDate?: string;
  salary: number;
  status: 'active' | 'expired' | 'terminated';
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

interface AttendanceSummary {
  month: string;
  workDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  workHours: number;
  overtime: number;
  notes?: string;
}

interface LeaveRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
  approvedBy?: string;
}

interface SalaryRecord {
  id: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidDate?: string;
}

interface EmployeeProfileProps {
  id?: string;
}

type ViewMode = "profile" | "edit" | "add-document";

export default function EmployeeProfile({ id: propId }: EmployeeProfileProps) {
  const { user: currentUser } = useAuth();
  const userRole = currentUser?.role || 'user';

  const params = useParams<{ id: string }>();
  const id = propId || params.id;
  const employeeId = parseInt(id || '0');

  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<ViewMode>("profile");

  // جلب بيانات الموظف من API
  const { data: employeeData, isLoading: isLoadingEmployee } = useEmployee(employeeId);

  // جلب سجلات الحضور من قاعدة البيانات
  const { data: attendanceData } = useAttendanceByEmployee(employeeId);

  // جلب سجلات الإجازات من قاعدة البيانات
  const { data: leavesData } = useLeavesByEmployee(employeeId);

  // جلب سجلات الرواتب من قاعدة البيانات
  const { data: payrollData } = usePayrollByEmployee(employeeId);

  const deleteMutation = useDeleteEmployee();
  const updateMutation = useUpdateEmployee();

  // حالة الموظف المحلية للعرض والتعديل
  const [employee, setEmployee] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    nationality: '',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    address: '',
    position: '',
    department: '',
    branch: '',
    manager: '',
    joinDate: '',
    status: 'active',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    totalSalary: 0
  });

  // تحديث حالة الموظف عند اكتمال التحميل
  useEffect(() => {
    if (employeeData) {
      setEmployee({
        ...employeeData,
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        position: (typeof employeeData.position === 'object' ? employeeData.position?.title : employeeData.position) || '',
        department: (typeof employeeData.department === 'object' ? employeeData.department?.name : employeeData.department) || '',
        branch: employeeData.branch?.name || employeeData.branch || '',
        manager: employeeData.manager ? `${employeeData.manager.firstName} ${employeeData.manager.lastName}` : '',
        basicSalary: employeeData.salary || 0,
        housingAllowance: (employeeData.salary || 0) * 0.25,
        transportAllowance: 500,
        totalSalary: (employeeData.salary || 0) * 1.25 + 500
      });
      setEditForm({
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        department: (typeof employeeData.department === 'object' ? employeeData.department?.name : employeeData.department) || '',
        position: (typeof employeeData.position === 'object' ? employeeData.position?.title : employeeData.position) || '',
      });
    }
  }, [employeeData]);

  // حالة نموذج التعديل
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id: employeeId,
      ...editForm
    }, {
      onSuccess: () => {
        toast.success('تم حفظ التعديلات بنجاح');
        setViewMode("profile");
      },
      onError: (error: any) => {
        toast.error('فشل في حفظ التعديلات: ' + error.message);
      }
    });
  };

  // حالة نموذج إضافة وثيقة
  const [documentForm, setDocumentForm] = useState({
    type: '',
    name: '',
    expiryDate: '',
  });

  const [documents, setDocuments] = useState<EmployeeDocument[]>([
    { id: '1', name: 'الهوية الوطنية', type: 'national_id', expiryDate: '2027-05-15', status: 'valid' },
    { id: '2', name: 'جواز السفر', type: 'passport', expiryDate: '2025-03-20', status: 'expiring' },
  ]);

  const [contracts, setContracts] = useState<EmployeeContract[]>([
    { id: '1', type: 'عقد دائم', startDate: '2023-01-15', salary: 19500, status: 'active' },
  ]);

  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([
    { type: 'سنوية', total: 21, used: 5, remaining: 16 },
    { type: 'مرضية', total: 30, used: 2, remaining: 28 },
  ]);

  const attendanceSummary = useMemo(() => {
    if (!attendanceData) return {
      month: 'يناير 2026',
      workDays: 22,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      overtimeHours: 0
    };

    const records = attendanceData as any[];
    return {
      month: new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
      workDays: 22,
      presentDays: records.filter(r => r.status === 'present').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      lateDays: records.filter(r => r.status === 'late').length,
      overtimeHours: records.reduce((acc, r) => acc + (r.overtime || 0), 0)
    };
  }, [attendanceData]);

  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    if (!attendanceData) return [];
    return (attendanceData as any[]).map(r => ({
      id: r.id.toString(),
      date: r.date,
      checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-',
      checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-',
      status: r.status,
      workHours: r.workHours || 0,
      overtime: r.overtime || 0,
      notes: r.notes
    }));
  }, [attendanceData]);

  const leaveRecords: LeaveRecord[] = useMemo(() => {
    if (!leavesData) return [];
    return (leavesData as any[]).map(r => ({
      id: r.id.toString(),
      type: r.leaveType,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      status: r.status,
      reason: r.reason,
      approvedBy: r.managerRemarks
    }));
  }, [leavesData]);

  const salaryRecords: SalaryRecord[] = useMemo(() => {
    if (!payrollData) return [];
    return (payrollData as any[]).map(r => ({
      id: r.id.toString(),
      month: `${r.month}/${r.year}`,
      basicSalary: r.basicSalary,
      allowances: (r.housingAllowance || 0) + (r.transportAllowance || 0) + (r.otherAllowances || 0),
      deductions: r.deductions || 0,
      netSalary: r.netSalary,
      status: r.status,
      paidDate: r.status === 'paid' ? r.updatedAt : undefined
    }));
  }, [payrollData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">غير نشط</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">في إجازة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 ms-1" />ساري</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 ms-1" />قارب على الانتهاء</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 ms-1" />منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('جاري طباعة ملف الموظف');
  };

  const handleExport = () => {
    toast.success('جاري تصدير ملف الموظف');
  };

  const handleAddDocument = () => {
    if (!documentForm.type || !documentForm.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const newDoc: EmployeeDocument = {
      id: Date.now().toString(),
      name: documentForm.name,
      type: documentForm.type,
      expiryDate: documentForm.expiryDate || undefined,
      status: 'valid',
    };
    setDocuments(prev => [...prev, newDoc]);
    toast.success('تم إضافة الوثيقة بنجاح');
    setDocumentForm({ type: '', name: '', expiryDate: '' });
    setViewMode("profile");
  };

  // Render Edit Form
  const renderEditForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("profile")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للملف
        </Button>
        <div>
          <h2 className="text-2xl font-bold">تعديل بيانات الموظف</h2>
          <p className="text-muted-foreground">قم بتعديل بيانات الموظف ثم اضغط حفظ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الأول</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>اسم العائلة</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القسم</Label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>المسمى الوظيفي</Label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("profile")}>إلغاء</Button>
              <Button disabled={updateMutation.isPending} onClick={handleSaveEdit}>
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Add Document Form
  const renderAddDocumentForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("profile")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للملف
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة وثيقة جديدة</h2>
          <p className="text-muted-foreground">أدخل بيانات الوثيقة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الوثيقة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>نوع الوثيقة</Label>
              <Select
                value={documentForm.type}
                onValueChange={(value) => setDocumentForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوثيقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">الهوية الوطنية</SelectItem>
                  <SelectItem value="passport">جواز السفر</SelectItem>
                  <SelectItem value="driving_license">رخصة القيادة</SelectItem>
                  <SelectItem value="education_certificate">شهادة تعليمية</SelectItem>
                  <SelectItem value="experience_certificate">شهادة خبرة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم الوثيقة</Label>
              <Input
                placeholder="أدخل اسم الوثيقة"
                value={documentForm.name}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input
                type="date"
                value={documentForm.expiryDate}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>رفع الملف</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">اسحب الملف هنا أو اضغط للاختيار</p>
                <Input type="file" className="hidden" placeholder="أدخل القيمة" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("profile")}>إلغاء</Button>
              <Button onClick={handleAddDocument}>حفظ الوثيقة</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Profile View
  const renderProfileView = () => (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees">
            <Button variant="ghost" size="icon" aria-label="العودة">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">ملف الموظف</h2>
            <p className="text-gray-500">رقم الموظف: {employee.employeeNumber || '-'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ms-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 ms-2" />
            تصدير PDF
          </Button>
          <Button onClick={() => setViewMode("edit")}>
            <Edit className="h-4 w-4 ms-2" />
            تعديل البيانات
          </Button>
        </div>
      </div>

      {/* Employee Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.avatar || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {employee.firstName ? employee.firstName.charAt(0) : 'E'}
                {employee.lastName ? employee.lastName.charAt(0) : 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h3>
                {getStatusBadge(employee.status)}
              </div>
              <p className="text-lg text-gray-600 mb-4">{employee.position}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{employee.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span dir="ltr">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span dir="ltr">{employee.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="documents">الوثائق</TabsTrigger>
          <TabsTrigger value="contracts">العقود</TabsTrigger>
          <TabsTrigger value="leaves">الإجازات</TabsTrigger>
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="salary">الراتب</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">رقم الهوية</span>
                  <span className="font-medium">{employee.nationalId || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">الجنسية</span>
                  <span className="font-medium">{employee.nationality || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ الميلاد</span>
                  <span className="font-medium">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">الحالة الاجتماعية</span>
                  <span className="font-medium">{employee.maritalStatus === 'married' ? 'متزوج' : 'أعزب'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">العنوان</span>
                  <span className="font-medium text-sm">{employee.address || '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  المعلومات الوظيفية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ الالتحاق</span>
                  <span className="font-medium">{employee.joinDate ? formatDate(employee.joinDate) : '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع العمل</span>
                  <span className="font-medium">{employee.workType === 'full_time' ? 'دوام كامل' : 'دوام جزئي'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">المدير المباشر</span>
                  <span className="font-medium">{employee.manager || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">الوثائق والمستندات</CardTitle>
              <Button size="sm" onClick={() => setViewMode("add-document")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة وثيقة
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        {doc.expiryDate && (
                          <p className="text-sm text-gray-500">
                            ينتهي في: {formatDate(doc.expiryDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getDocumentStatusBadge(doc.status)}
                      <Button variant="ghost" size="icon" aria-label="تحميل">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">العقود</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 ms-2" />
                عقد جديد
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{contract.type}</p>
                        <p className="text-sm text-gray-500">
                          من {formatDate(contract.startDate)}
                          {contract.endDate && ` إلى ${formatDate(contract.endDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{contract.salary.toLocaleString()} ر.س</span>
                      <Badge className={contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {contract.status === 'active' ? 'ساري' : 'منتهي'}
                      </Badge>
                      <Button variant="ghost" size="icon" aria-label="تحميل">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {leaveBalances.map((balance) => (
              <Card key={balance.type}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-2">{balance.type}</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">{balance.remaining}</span>
                    <span className="text-sm text-gray-500">من {balance.total?.toLocaleString()}</span>
                  </div>
                  <Progress value={(balance.remaining / balance.total) * 100} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">سجل الإجازات</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 ms-2" />
                طلب إجازة
              </Button>
            </CardHeader>
            <CardContent>
              {leaveRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد إجازات مسجلة</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-end py-3 px-4 font-medium">النوع</th>
                        <th className="text-end py-3 px-4 font-medium">من</th>
                        <th className="text-end py-3 px-4 font-medium">إلى</th>
                        <th className="text-end py-3 px-4 font-medium">المدة</th>
                        <th className="text-end py-3 px-4 font-medium">السبب</th>
                        <th className="text-end py-3 px-4 font-medium">الحالة</th>
                        <th className="text-end py-3 px-4 font-medium">المعتمد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{record.type}</td>
                          <td className="py-3 px-4">{formatDate(record.startDate)}</td>
                          <td className="py-3 px-4">{formatDate(record.endDate)}</td>
                          <td className="py-3 px-4">{record.days} يوم</td>
                          <td className="py-3 px-4">{record.reason}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              record.status === 'approved' ? 'bg-green-100 text-green-800' :
                                record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                            }>
                              {record.status === 'approved' ? 'موافق عليها' : record.status === 'pending' ? 'قيد المراجعة' : 'مرفوضة'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{record.approvedBy || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">أيام العمل</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceSummary.workDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">أيام الحضور</p>
                <p className="text-2xl font-bold text-green-600">{attendanceSummary.presentDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">أيام الغياب</p>
                <p className="text-2xl font-bold text-red-600">{attendanceSummary.absentDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">أيام التأخير</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.lateDays}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">ساعات إضافية</p>
                <p className="text-2xl font-bold text-purple-600">{attendanceSummary.overtimeHours}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">سجل الحضور - {attendanceSummary.month}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-end py-3 px-4 font-medium">التاريخ</th>
                      <th className="text-end py-3 px-4 font-medium">وقت الحضور</th>
                      <th className="text-end py-3 px-4 font-medium">وقت الانصراف</th>
                      <th className="text-end py-3 px-4 font-medium">ساعات العمل</th>
                      <th className="text-end py-3 px-4 font-medium">إضافي</th>
                      <th className="text-end py-3 px-4 font-medium">الحالة</th>
                      <th className="text-end py-3 px-4 font-medium">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(record.date)}</td>
                        <td className="py-3 px-4">{record.checkIn}</td>
                        <td className="py-3 px-4">{record.checkOut}</td>
                        <td className="py-3 px-4">{record.workHours} ساعة</td>
                        <td className="py-3 px-4">{record.overtime > 0 ? `+${record.overtime}` : '-'}</td>
                        <td className="py-3 px-4">
                          <Badge className={
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                  record.status === 'early_leave' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                          }>
                            {record.status === 'present' ? 'حاضر' :
                              record.status === 'late' ? 'متأخر' :
                                record.status === 'absent' ? 'غائب' :
                                  record.status === 'early_leave' ? 'خروج مبكر' :
                                    'عطلة'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">الراتب الأساسي</p>
                <p className="text-2xl font-bold">{employee.basicSalary.toLocaleString()} ر.س</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">بدل السكن</p>
                <p className="text-2xl font-bold text-green-600">+{employee.housingAllowance.toLocaleString()} ر.س</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">بدل النقل</p>
                <p className="text-2xl font-bold text-green-600">+{employee.transportAllowance.toLocaleString()} ر.س</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">إجمالي الراتب</p>
                <p className="text-2xl font-bold text-primary">{employee.totalSalary.toLocaleString()} ر.س</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">سجل الرواتب</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ms-2" />
                تصدير كشف الراتب
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-end py-3 px-4 font-medium">الشهر</th>
                      <th className="text-end py-3 px-4 font-medium">الراتب الأساسي</th>
                      <th className="text-end py-3 px-4 font-medium">البدلات</th>
                      <th className="text-end py-3 px-4 font-medium">الخصومات</th>
                      <th className="text-end py-3 px-4 font-medium">صافي الراتب</th>
                      <th className="text-end py-3 px-4 font-medium">الحالة</th>
                      <th className="text-end py-3 px-4 font-medium">تاريخ الصرف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{record.month}</td>
                        <td className="py-3 px-4">{record.basicSalary.toLocaleString()} ر.س</td>
                        <td className="py-3 px-4 text-green-600">+{record.allowances.toLocaleString()} ر.س</td>
                        <td className="py-3 px-4 text-red-600">{record.deductions > 0 ? `-${record.deductions.toLocaleString()}` : '0'} ر.س</td>
                        <td className="py-3 px-4 font-bold">{record.netSalary.toLocaleString()} ر.س</td>
                        <td className="py-3 px-4">
                          <Badge className={record.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {record.status === 'paid' ? 'مصروف' : 'قيد الانتظار'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{record.paidDate ? formatDate(record.paidDate) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ms-3">جاري تحميل بيانات الموظف...</span>
      </div>
    );
  }

  // Main render
  switch (viewMode) {
    case "edit":
      return renderEditForm();
    case "add-document":
      return renderAddDocumentForm();
    default:
      return renderProfileView();
  }
}

// Helper Loader component since it's used
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
