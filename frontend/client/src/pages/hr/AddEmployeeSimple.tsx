import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Send, UserPlus, Mail, Phone, Building2, CheckCircle2, Shield } from 'lucide-react';
import {
  useBranches,
  useCreateSimpleEmployee,
  useRoles
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    branchId: selectedBranchId?.toString() || '',
    role: 'USER',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation لإضافة موظف مبسط
  const createSimpleEmployeeMutation = useCreateSimpleEmployee();
  const { data: branchesData, isLoading } = useBranches();
  const { data: rolesData } = useRoles();
  const branches = (branchesData || []).filter((b: any) => b.id);
  const roles = (rolesData || []).filter((r: string) => r && r.trim() !== "").map((r: string) => ({
    id: r,
    name: r,
    nameAr: r === 'USER' ? 'موظف' : r === 'AGENT' ? 'مندوب' : r === 'MANAGER' ? 'مدير' : r === 'OPERATIONS' ? 'تشغيل' : r === 'ADMIN' ? 'مسؤول' : r === 'OWNER' ? 'مالك' : r
  }));

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
    try {
      createSimpleEmployeeMutation.mutate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        branchId: formData.branchId ? parseInt(formData.branchId) : undefined,
        role: formData.role,
      }, {
        onSuccess: (data: any) => {
          setCreatedEmployee({
            employeeNumber: data.employeeNumber,
            verificationCode: data.verificationCode,
            requestNumber: data.requestNumber,
          });
          setShowSuccess(true);
          toast.success('تم إضافة الموظف بنجاح وإرسال رسالة التفعيل');
        },
        onError: (err: any) => toast.error(`فشل الإضافة: ${err.message}`)
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  branchId: selectedBranchId?.toString() || '',
                  role: 'USER',
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
                {branches.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {(branch as any).nameAr || branch.name}
                  </SelectItem>
                ))}
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
                {roles.length > 0 ? roles.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nameAr || r.name}
                  </SelectItem>
                )) : (
                  <>
                    <SelectItem value="USER">موظف</SelectItem>
                    <SelectItem value="AGENT">مندوب</SelectItem>
                    <SelectItem value="MANAGER">مدير</SelectItem>
                    <SelectItem value="OPERATIONS">تشغيل</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">يحدد الدور صلاحيات الموظف في النظام</p>
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
              <Send className="h-4 w-4 ms-2" />
              {isSubmitting ? 'جاري الإرسال...' : 'إضافة وإرسال التفعيل'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
