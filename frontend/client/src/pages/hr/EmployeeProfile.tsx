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

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Edit, Printer, Download, Mail, Phone, MapPin, Building2, Briefcase, CreditCard, FileText, AlertTriangle, CheckCircle2, XCircle, User, Plus, Upload, X, Shield, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  useEmployee,
  useAttendanceByEmployee,
  useLeavesByEmployee,
  usePayrollByEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
  useDepartments,
  usePositions,
  useBranches,
  useEmployees
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

  // Check if mode=edit query param is set
  const searchParams = new URLSearchParams(window.location.search);
  const startInEditMode = searchParams.get('mode') === 'edit';

  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<ViewMode>(startInEditMode ? "edit" : "profile");

  // جلب بيانات الموظف من API
  const { data: employeeData, isLoading: isLoadingEmployee } = useEmployee(employeeId);

  // جلب سجلات الحضور من قاعدة البيانات
  const { data: attendanceData } = useAttendanceByEmployee(employeeId);

  // جلب سجلات الإجازات من قاعدة البيانات
  const { data: leavesData } = useLeavesByEmployee(employeeId);

  // جلب سجلات الرواتب من قاعدة البيانات
  const { data: payrollData } = usePayrollByEmployee(employeeId);

  const { data: departmentsData } = useDepartments();
  const { data: positionsData } = usePositions();
  const { data: branchesData } = useBranches();
  const { data: allEmployeesData } = useEmployees();

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
      const salary = employeeData.salary || 0;
      setEmployee({
        ...employeeData,
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        position: (typeof employeeData.position === 'object' ? employeeData.position?.title : employeeData.position) || '',
        positionId: (typeof employeeData.position === 'object' ? employeeData.position?.id : null),
        department: (typeof employeeData.department === 'object' ? (employeeData.department?.nameAr || employeeData.department?.name) : employeeData.department) || '',
        departmentId: (typeof employeeData.department === 'object' ? employeeData.department?.id : null),
        branch: employeeData.branch?.nameAr || employeeData.branch?.name || employeeData.branch || '',
        manager: employeeData.manager ? `${employeeData.manager.firstName} ${employeeData.manager.lastName}` : '',
        userRole: employeeData.userRole || employeeData.user?.role || employeeData.role || '',
        joinDate: employeeData.hireDate || employeeData.createdAt || '',
        basicSalary: salary,
      });
      setEditForm({
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        departmentId: (typeof employeeData.department === 'object' ? String(employeeData.department?.id || '') : ''),
        positionId: (typeof employeeData.position === 'object' ? String(employeeData.position?.id || '') : ''),
        branchId: (typeof employeeData.branch === 'object' ? String(employeeData.branch?.id || '') : ''),
        managerId: employeeData.manager ? String(employeeData.manager.id || '') : '',
        roles: employeeData.userRoles || (employeeData.user?.allRoles) || (employeeData.userRole ? [employeeData.userRole] : (employeeData.user?.role ? [employeeData.user.role] : [])),
        salary: employeeData.salary ? String(employeeData.salary) : '',
        nationalId: employeeData.nationalId || '',
        nationality: employeeData.nationality || '',
        dateOfBirth: employeeData.dateOfBirth || '',
        gender: employeeData.gender || '',
        maritalStatus: employeeData.maritalStatus || '',
        address: employeeData.address || '',
        city: employeeData.city || '',
        emergencyName: employeeData.emergencyName || '',
        emergencyRelation: employeeData.emergencyRelation || '',
        emergencyPhone: employeeData.emergencyPhone || '',
        bankName: employeeData.bankName || '',
        bankAccount: employeeData.bankAccount || '',
        iban: employeeData.iban || '',
      });
    }
  }, [employeeData]);

  // حالة نموذج التعديل
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    branchId: '',
    managerId: '',
    roles: [] as string[],
    salary: '',
    nationalId: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    address: '',
    city: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    bankName: '',
    bankAccount: '',
    iban: '',
  });

  const handleSaveEdit = () => {
    const updateData: any = {
      id: employeeId,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      nationalId: editForm.nationalId || null,
      nationality: editForm.nationality || null,
      dateOfBirth: editForm.dateOfBirth || null,
      gender: editForm.gender || null,
      maritalStatus: editForm.maritalStatus || null,
      address: editForm.address || null,
      city: editForm.city || null,
      emergencyName: editForm.emergencyName || null,
      emergencyRelation: editForm.emergencyRelation || null,
      emergencyPhone: editForm.emergencyPhone || null,
      bankName: editForm.bankName || null,
      bankAccount: editForm.bankAccount || null,
      iban: editForm.iban || null,
    };
    if (editForm.salary) {
      updateData.salary = parseFloat(editForm.salary);
    }
    if (editForm.departmentId) {
      updateData.department = { id: parseInt(editForm.departmentId) };
    }
    if (editForm.positionId) {
      updateData.position = { id: parseInt(editForm.positionId) };
    }
    if (editForm.branchId) {
      updateData.branch = { id: parseInt(editForm.branchId) };
    }
    if (editForm.managerId) {
      updateData.manager = { id: parseInt(editForm.managerId) };
    }
    if (editForm.roles && editForm.roles.length > 0) {
      updateData.role = editForm.roles.join(',');
    }

    updateMutation.mutate(updateData, {
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

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);

  const [contracts, setContracts] = useState<EmployeeContract[]>([]);

  // حساب أرصدة الإجازات من البيانات الفعلية
  const leaveBalances: LeaveBalance[] = useMemo(() => {
    if (!leavesData || (leavesData as any[]).length === 0) return [];
    const records = leavesData as any[];
    const typeMap: Record<string, { used: number }> = {};
    records.forEach(r => {
      const type = r.leaveType || 'أخرى';
      if (!typeMap[type]) typeMap[type] = { used: 0 };
      if (r.status === 'approved') {
        const days = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        typeMap[type].used += days;
      }
    });
    return Object.entries(typeMap).map(([type, data]) => ({
      type,
      total: 0,
      used: data.used,
      remaining: 0,
    }));
  }, [leavesData]);

  const attendanceSummary = useMemo(() => {
    const records = (attendanceData as any[]) || [];
    const totalRecords = records.length;
    return {
      month: new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
      workDays: totalRecords,
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

  const getRoleArabic = (role: string) => {
    switch (role) {
      case 'OWNER': return 'مالك';
      case 'GENERAL_MANAGER': return 'مدير عام';
      case 'DEPARTEMENT_MANAGER': return 'مدير قسم';
      case 'SUPERVISOR': return 'مشرف';
      case 'EMPLOYEE': return 'موظف';
      case 'AGENT': return 'مندوب';
      default: return role || '-';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">غير نشط</Badge>;
      case 'suspended':
        return <Badge className="bg-amber-100 text-amber-800">موقوف مؤقتاً</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">في إجازة</Badge>;
      case 'terminated':
        return <Badge className="bg-gray-100 text-gray-800">منتهي الخدمة</Badge>;
      case 'incomplete':
        return <Badge className="bg-orange-100 text-orange-800">غير مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMissingFieldStyle = (value: any) => {
    if (!value || value === '' || value === 0 || value === '-') {
      return 'bg-yellow-50 border-yellow-300';
    }
    return '';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("profile")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للملف
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">تعديل بيانات الموظف</h2>
          <p className="text-muted-foreground">قم بتعديل بيانات الموظف ثم اضغط حفظ</p>
        </div>
      </div>

      {/* البيانات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الأول</Label>
                <Input
                  className={getMissingFieldStyle(editForm.firstName)}
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>اسم العائلة</Label>
                <Input
                  className={getMissingFieldStyle(editForm.lastName)}
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
                  className={getMissingFieldStyle(editForm.email)}
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input
                  className={getMissingFieldStyle(editForm.phone)}
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القسم</Label>
                <Select
                  value={editForm.departmentId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.departmentId)}>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departmentsData || []).map((dept: any) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.nameAr || dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المسمى الوظيفي</Label>
                <Select
                  value={editForm.positionId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, positionId: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.positionId)}>
                    <SelectValue placeholder="اختر المنصب" />
                  </SelectTrigger>
                  <SelectContent>
                    {(positionsData || []).map((pos: any) => (
                      <SelectItem key={pos.id} value={String(pos.id)}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الفرع</Label>
                <Select
                  value={editForm.branchId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, branchId: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.branchId)}>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {(branchesData || []).map((branch: any) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.nameAr || branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المدير المباشر</Label>
                <Select
                  value={editForm.managerId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.managerId)}>
                    <SelectValue placeholder="اختر المدير المباشر" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allEmployeesData || [])
                      .filter((emp: any) => emp.id !== employeeId)
                      .map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الدور في النظام</Label>
                <div className="border rounded-md p-3 space-y-3">
                  {['DEPARTEMENT_MANAGER', 'SUPERVISOR', 'EMPLOYEE', 'AGENT'].map((roleOption) => (
                    <div key={roleOption}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes(roleOption)}
                          onChange={(e) => {
                            setEditForm(prev => ({
                              ...prev,
                              roles: e.target.checked
                                ? [...prev.roles, roleOption]
                                : prev.roles.filter(r => r !== roleOption)
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{getRoleArabic(roleOption)}</span>
                      </label>
                      {/* عند اختيار مدير قسم — تنبيه لاختيار القسم */}
                      {roleOption === 'DEPARTEMENT_MANAGER' && editForm.roles.includes('DEPARTEMENT_MANAGER') && (
                        <p className="mr-6 mt-1 text-xs text-amber-600">
                          تأكد من اختيار القسم الذي يديره في حقل "القسم" أعلاه
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {editForm.roles.length === 0 && (
                  <p className="text-xs text-red-500">يجب اختيار دور واحد على الأقل</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>الراتب الأساسي</Label>
                <Input
                  type="number"
                  className={getMissingFieldStyle(editForm.salary)}
                  value={editForm.salary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="أدخل الراتب"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البيانات الشخصية */}
      <Card>
        <CardHeader>
          <CardTitle>البيانات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهوية / الإقامة</Label>
                <Input
                  className={getMissingFieldStyle(editForm.nationalId)}
                  value={editForm.nationalId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nationalId: e.target.value }))}
                  placeholder="أدخل رقم الهوية"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الجنسية</Label>
                <Input
                  className={getMissingFieldStyle(editForm.nationality)}
                  value={editForm.nationality}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="أدخل الجنسية"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الميلاد</Label>
                <Input
                  type="date"
                  className={getMissingFieldStyle(editForm.dateOfBirth)}
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الجنس</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.gender)}>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحالة الاجتماعية</Label>
                <Select
                  value={editForm.maritalStatus}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, maritalStatus: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.maritalStatus)}>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">أعزب</SelectItem>
                    <SelectItem value="married">متزوج</SelectItem>
                    <SelectItem value="divorced">مطلق</SelectItem>
                    <SelectItem value="widowed">أرمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  className={getMissingFieldStyle(editForm.city)}
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="أدخل المدينة"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                className={getMissingFieldStyle(editForm.address)}
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="أدخل العنوان"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جهة اتصال الطوارئ */}
      <Card>
        <CardHeader>
          <CardTitle>جهة اتصال الطوارئ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم جهة الاتصال</Label>
                <Input
                  className={getMissingFieldStyle(editForm.emergencyName)}
                  value={editForm.emergencyName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                  placeholder="أدخل الاسم"
                />
              </div>
              <div className="space-y-2">
                <Label>صلة القرابة</Label>
                <Select
                  value={editForm.emergencyRelation}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, emergencyRelation: value }))}
                >
                  <SelectTrigger className={getMissingFieldStyle(editForm.emergencyRelation)}>
                    <SelectValue placeholder="اختر صلة القرابة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">أب</SelectItem>
                    <SelectItem value="mother">أم</SelectItem>
                    <SelectItem value="spouse">زوج/زوجة</SelectItem>
                    <SelectItem value="brother">أخ</SelectItem>
                    <SelectItem value="sister">أخت</SelectItem>
                    <SelectItem value="son">ابن</SelectItem>
                    <SelectItem value="daughter">ابنة</SelectItem>
                    <SelectItem value="friend">صديق</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                className={getMissingFieldStyle(editForm.emergencyPhone)}
                value={editForm.emergencyPhone}
                onChange={(e) => setEditForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* البيانات البنكية */}
      <Card>
        <CardHeader>
          <CardTitle>البيانات البنكية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم البنك</Label>
                <Input
                  className={getMissingFieldStyle(editForm.bankName)}
                  value={editForm.bankName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="مثال: بنك الراجحي"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الحساب</Label>
                <Input
                  className={getMissingFieldStyle(editForm.bankAccount)}
                  value={editForm.bankAccount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                  placeholder="أدخل رقم الحساب"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رقم الآيبان (IBAN)</Label>
              <Input
                className={getMissingFieldStyle(editForm.iban)}
                value={editForm.iban}
                onChange={(e) => setEditForm(prev => ({ ...prev, iban: e.target.value }))}
                placeholder="SA..."
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الحفظ */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="outline" onClick={() => setViewMode("profile")}>إلغاء</Button>
        <Button disabled={updateMutation.isPending} onClick={handleSaveEdit}>
          {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
      </div>
    </div>
  );

  // Render Add Document Form
  const renderAddDocumentForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees">
            <Button variant="ghost" size="icon" aria-label="العودة">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ملف الموظف</h2>
            <p className="text-gray-500 text-sm">رقم الموظف: {employee.employeeNumber || '-'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
            <Printer className="h-4 w-4 ms-2" />
            <span className="hidden sm:inline">طباعة</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 ms-2" />
            <span className="hidden sm:inline">تصدير PDF</span>
          </Button>
          <Button size="sm" onClick={() => setViewMode("edit")} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 ms-2" />
            تعديل
          </Button>
        </div>
      </div>

      {/* Employee Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Avatar className="h-16 w-16 sm:h-24 sm:w-24 mx-auto sm:mx-0">
              <AvatarImage src={employee.avatar || undefined} />
              <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                {employee.firstName ? employee.firstName.charAt(0) : 'E'}
                {employee.lastName ? employee.lastName.charAt(0) : 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold">{employee.firstName} {employee.lastName}</h3>
                {getStatusBadge(employee.status)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2 text-sm">
                <p className="flex items-center gap-1 flex-wrap"><span className="text-gray-500"><Shield className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />الدور: </span><Badge className="bg-primary/10 text-primary">{getRoleArabic(employee.userRole)}</Badge></p>
                <p className="truncate"><span className="text-gray-500"><Briefcase className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />المنصب: </span><span className="font-medium">{employee.position || '-'}</span></p>
                <p className="truncate"><span className="text-gray-500"><Building2 className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />القسم: </span><span className="font-medium">{employee.department || '-'}</span></p>
                <p className="truncate"><span className="text-gray-500"><MapPin className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />الفرع: </span><span className="font-medium">{employee.branch || '-'}</span></p>
                <p className="truncate"><span className="text-gray-500"><Mail className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />البريد: </span><span className="font-medium" dir="ltr">{employee.email || '-'}</span></p>
                <p className="truncate"><span className="text-gray-500"><Phone className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />الجوال: </span><span className="font-medium" dir="ltr">{employee.phone || '-'}</span></p>
                <p className="truncate"><span className="text-gray-500"><UserCheck className="h-4 w-4 inline-block me-1 align-middle text-gray-400" />المدير المباشر: </span><span className="font-medium">{employee.manager || '-'}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="overview" className="flex-shrink-0">نظرة عامة</TabsTrigger>
          <TabsTrigger value="documents" className="flex-shrink-0">الوثائق</TabsTrigger>
          <TabsTrigger value="contracts" className="flex-shrink-0">العقود</TabsTrigger>
          <TabsTrigger value="leaves" className="flex-shrink-0">الإجازات</TabsTrigger>
          <TabsTrigger value="attendance" className="flex-shrink-0">الحضور</TabsTrigger>
          <TabsTrigger value="salary" className="flex-shrink-0">الراتب</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span className="text-gray-500">الدور في النظام</span>
                  <Badge className="bg-primary/10 text-primary">{getRoleArabic(employee.userRole)}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">القسم</span>
                  <span className="font-medium">{employee.department || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">المنصب</span>
                  <span className="font-medium">{employee.position || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">الفرع</span>
                  <span className="font-medium">{employee.branch || '-'}</span>
                </div>
                <Separator />
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
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">رقم الموظف</span>
                  <span className="font-medium font-mono">{employee.employeeNumber || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg">الوثائق والمستندات</CardTitle>
              <Button size="sm" onClick={() => setViewMode("add-document")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة وثيقة
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد وثائق مسجلة لهذا الموظف</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg">العقود</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 ms-2" />
                عقد جديد
              </Button>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد عقود مسجلة لهذا الموظف</p>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          {leaveBalances.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {leaveBalances.map((balance) => (
                <Card key={balance.type}>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500 mb-2">{balance.type}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold">{balance.used}</span>
                      <span className="text-sm text-gray-500">يوم مستخدم</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg">سجل الإجازات</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد إجازات مسجلة</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">إجمالي السجلات</p>
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
              {attendanceRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات حضور</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">الراتب الأساسي</p>
                <p className="text-2xl font-bold text-primary">
                  {employee.basicSalary ? `${Number(employee.basicSalary).toLocaleString()} ر.س` : 'لم يتم تحديده'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">عدد كشوف الرواتب</p>
                <p className="text-2xl font-bold">{salaryRecords.length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg">سجل الرواتب</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ms-2" />
                تصدير كشف الراتب
              </Button>
            </CardHeader>
            <CardContent>
              {salaryRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات رواتب لهذا الموظف</p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
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
                        <td className="py-3 px-4">{record.basicSalary?.toLocaleString() || 0} ر.س</td>
                        <td className="py-3 px-4 text-green-600">+{record.allowances?.toLocaleString() || 0} ر.س</td>
                        <td className="py-3 px-4 text-red-600">{record.deductions > 0 ? `-${record.deductions.toLocaleString()}` : '0'} ر.س</td>
                        <td className="py-3 px-4 font-bold">{record.netSalary?.toLocaleString() || 0} ر.س</td>
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
              )}
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
