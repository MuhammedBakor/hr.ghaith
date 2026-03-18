import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Send, UserPlus, Mail, Phone, Building2, CheckCircle2, Shield, Users, Briefcase, UserCheck, Clock } from 'lucide-react';
import {
  useBranches,
  useDepartments,
  usePositions,
  useCreateSimpleEmployee,
  useRoles,
  useCustomRoles,
  useEmployees,
  useShifts
} from '@/services/hrService';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';

export default function AddEmployeeSimple() {
  const userRole = 'admin'; // For now, assume admin or get from context if needed

  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    employeeNumber: string;
    verificationCode: string;
    requestNumber: string;
  } | null>(null);

  const { selectedBranchId } = useAppContext();

  // قراءة معاملات URL لتعبئة القسم والدور تلقائياً
  const urlParams = new URLSearchParams(window.location.search);
  const preRole = urlParams.get('role') || 'EMPLOYEE';
  const preDeptId = urlParams.get('departmentId') || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    branchId: selectedBranchId?.toString() || '',
    departmentId: preDeptId,
    positionId: '',
    role: preRole,
    managerId: '',
    salary: '',
    housingAllowance: '',
    transportAllowance: '',
    shiftId: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation لإضافة موظف مبسط
  const createSimpleEmployeeMutation = useCreateSimpleEmployee();
  const { data: branchesData, isLoading } = useBranches();
  const { data: departmentsData } = useDepartments({ branchId: formData.branchId ? parseInt(formData.branchId) : (selectedBranchId || null) });
  const { data: positionsData } = usePositions({ branchId: formData.branchId ? parseInt(formData.branchId) : (selectedBranchId || null) });
  const { data: rolesData } = useRoles();
  const { data: customRolesData } = useCustomRoles();
  const { data: employeesData } = useEmployees({ branchId: selectedBranchId });
  const { data: shiftsData } = useShifts();
  const managers = (employeesData || []).filter((e: any) =>
    e.user?.role === 'GENERAL_MANAGER' || e.user?.role === 'DEPARTEMENT_MANAGER'
  );
  const branches = (branchesData || []).filter((b: any) => b.id);
  const departments = departmentsData || [];
  const positions = positionsData || [];

  const systemRoleMap: Record<string, string> = {
    OWNER: 'مالك', GENERAL_MANAGER: 'مدير عام', DEPARTEMENT_MANAGER: 'مدير قسم',
    SUPERVISOR: 'مشرف', EMPLOYEE: 'موظف', AGENT: 'مندوب',
  };
  const systemRoles = (rolesData || [])
    .filter((r: any) => typeof r === 'string' && r.trim() !== '')
    .map((r: string) => ({ id: r, nameAr: systemRoleMap[r] || r, isCustom: false }));
  const customRoles = (customRolesData || [])
    .map((r: any) => ({ id: r.name || r.code, nameAr: r.nameAr || r.name, isCustom: true }));

  const handleSubmit = async () => {
    // التحقق من الحقول المطلوبة
    if (!formData.firstName || !formData.lastName) {
      toast.error('يرجى إدخال اسم الموظف');
      return;
    }
    if (!formData.email) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!formData.phone) {
      toast.error('يرجى إدخال رقم الجوال');
      return;
    }

    setIsSubmitting(true);
    createSimpleEmployeeMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle || undefined,
      branchId: formData.branchId ? parseInt(formData.branchId) : undefined,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      positionId: formData.positionId ? parseInt(formData.positionId) : undefined,
      role: formData.role,
      managerId: formData.managerId && formData.managerId !== 'none' ? parseInt(formData.managerId) : undefined,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
      housingAllowance: formData.housingAllowance ? parseFloat(formData.housingAllowance) : undefined,
      transportAllowance: formData.transportAllowance ? parseFloat(formData.transportAllowance) : undefined,
      shiftId: formData.shiftId && formData.shiftId !== 'none' ? parseInt(formData.shiftId) : undefined,
    }, {
      onSuccess: (data: any) => {
        setCreatedEmployee({
          employeeNumber: data.employeeNumber,
          verificationCode: data.verificationCode,
          requestNumber: data.requestNumber,
        });
        setShowSuccess(true);
        setIsSubmitting(false);
        toast.success('تم إضافة الموظف بنجاح');
      },
      onError: (err: any) => {
        setIsSubmitting(false);
        const apiError = err.response?.data?.message || err.response?.data?.error;
        if (err.response?.status === 409 || (apiError && apiError.includes('email'))) {
          toast.error(apiError || 'عذراً، البريد الإلكتروني الذي أدخلته مستخدم بالفعل لموظف آخر.');
        } else {
          toast.error(`فشل الإضافة: ${err.message}`);
        }
      }
    });
  };

  if (showSuccess && createdEmployee) {
    if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
      <div className="space-y-6" dir="rtl">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">تم إضافة الموظف بنجاح!</CardTitle>
            <CardDescription>
              تم إرسال رسالة تفعيل إلى الموظف على البريد الإلكتروني والجوال
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رقم الموظف:</span>
                <span className="font-mono font-bold">{createdEmployee.employeeNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رقم الطلب:</span>
                <span className="font-mono font-bold">{createdEmployee.requestNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">كود التفعيل:</span>
                <span className="font-mono font-bold text-primary">{createdEmployee.verificationCode}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">الخطوات التالية:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>سيستلم الموظف رسالة على البريد الإلكتروني والجوال</li>
                <li>يقوم الموظف بتفعيل حسابه باستخدام كود التفعيل</li>
                <li>يعبئ الموظف جميع بياناته ويرفق المستندات المطلوبة</li>
                <li>يتم مراجعة الطلب واعتماده من قبل المسؤول</li>
              </ol>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => {
                setShowSuccess(false);
                setCreatedEmployee(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  jobTitle: '',
                  branchId: selectedBranchId?.toString() || '',
                  departmentId: '',
                  positionId: '',
                  role: 'EMPLOYEE',
                  managerId: '',
                  salary: '',
                  housingAllowance: '',
                  transportAllowance: '',
                  shiftId: '',
                });
              }}>
                <UserPlus className="h-4 w-4 ms-2" />
                إضافة موظف آخر
              </Button>
              <Link href="/hr">
                <Button variant="outline">
                  العودة للموظفين
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr">
            <Button variant="ghost" size="icon" aria-label="بريد">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إضافة موظف جديد</h2>
            <p className="text-gray-500">أدخل البيانات الأساسية للموظف وسيتم إرسال رسالة تفعيل له</p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            البيانات الأساسية
          </CardTitle>
          <CardDescription>
            أدخل الاسم والبريد الإلكتروني ورقم الجوال فقط. سيقوم الموظف بتعبئة باقي البيانات بنفسه.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* الاسم */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الأول <span className="text-red-500">*</span></Label>
              <Input
                placeholder="أدخل الاسم الأول"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required />
            </div>
            <div className="space-y-2">
              <Label>اسم العائلة <span className="text-red-500">*</span></Label>
              <Input
                placeholder="أدخل اسم العائلة"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required />
            </div>
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              البريد الإلكتروني <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="employee@company.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <p className="text-xs text-gray-500">سيتم إرسال رسالة التفعيل على هذا البريد</p>
          </div>

          {/* رقم الجوال */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              رقم الجوال <span className="text-red-500">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="+966 5X XXX XXXX"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <p className="text-xs text-gray-500">سيتم إرسال رسالة نصية بكود التفعيل</p>
          </div>

          {/* المسمى الوظيفي */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              المسمى الوظيفي
            </Label>
            <Input
              placeholder="مثال: محاسب أول، مدير مبيعات..."
              value={formData.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* الفرع */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                الفرع
              </Label>
              <Select value={formData.branchId} onValueChange={(v) => updateField('branchId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">لا توجد فروع — أضف من إدارة النظام</div>
                  ) : (
                    branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {(branch as any).nameAr || branch.name}{branch.city ? ` — ${branch.city}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* القسم */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                القسم
              </Label>
              <Select value={formData.departmentId} onValueChange={(v) => updateField('departmentId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">لا توجد أقسام</div>
                  ) : (
                    departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nameAr || d.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* المنصب */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                المنصب
              </Label>
              <Select value={formData.positionId} onValueChange={(v) => updateField('positionId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصب" />
                </SelectTrigger>
                <SelectContent>
                  {positions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">لا توجد مناصب</div>
                  ) : (
                    positions.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* الدور */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                الدور في النظام
              </Label>
              <Select value={formData.role} onValueChange={(v) => updateField('role', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.nameAr}</SelectItem>
                  ))}
                  {customRoles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-400 border-t mt-1">أدوار مخصصة</div>
                      {customRoles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.nameAr}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* المدير المباشر */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              المدير المباشر
            </Label>
            <Select value={formData.managerId} onValueChange={(v) => updateField('managerId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدير المباشر (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مدير مباشر</SelectItem>
                {managers.map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.firstName} {m.lastName} — {m.user?.role === 'GENERAL_MANAGER' ? 'مدير عام' : 'مدير قسم'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الوردية */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              الوردية
            </Label>
            <Select value={formData.shiftId} onValueChange={(v) => updateField('shiftId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الوردية (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون وردية</SelectItem>
                {(shiftsData || []).filter((s: any) => s.isActive).map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}{s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الراتب والبدلات */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">الراتب والبدلات (اختياري)</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الراتب الأساسي</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.salary}
                  onChange={(e) => updateField('salary', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>بدل السكن</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.housingAllowance}
                  onChange={(e) => updateField('housingAllowance', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>بدل النقل</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.transportAllowance}
                  onChange={(e) => updateField('transportAllowance', e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* معلومات */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">ماذا سيحدث بعد الإضافة؟</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• سيتم إنشاء حساب للموظف برقم موظف فريد</li>
              <li>• سيستلم الموظف رسالة على البريد الإلكتروني والجوال</li>
              <li>• يقوم الموظف بتفعيل حسابه وتعبئة جميع بياناته</li>
              <li>• يتم مراجعة البيانات واعتمادها من قبل المسؤول</li>
            </ul>
          </div>

          {/* زر الإرسال */}
          <div className="flex gap-3 justify-end">
            <Link href="/hr">
              <Button variant="outline">إلغاء</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <svg className="h-4 w-4 ms-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Send className="h-4 w-4 ms-2" />
              )}
              {isSubmitting ? 'جاري الإرسال...' : 'إضافة وإرسال التفعيل'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
