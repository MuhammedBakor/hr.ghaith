import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";
import {

  Plus,
  Building2,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  User,
  Settings,
  FileText
} from 'lucide-react';

type SubscriptionPlan = 'trial' | 'basic' | 'professional' | 'enterprise';
type SubscriptionStatus = 'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';
type NotificationMethod = 'email' | 'whatsapp' | 'both';
type ViewMode = 'list' | 'create';

const planLabels: Record<SubscriptionPlan, string> = {
  trial: 'تجريبي',
  basic: 'أساسي',
  professional: 'احترافي',
  enterprise: 'مؤسسي',
};

const statusLabels: Record<SubscriptionStatus, string> = {
  pending: 'قيد الانتظار',
  active: 'نشط',
  suspended: 'معلق',
  expired: 'منتهي',
  cancelled: 'ملغي',
};

const statusColors: Record<SubscriptionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const StatusIcon = ({ status }: { status: SubscriptionStatus }) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'suspended':
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    case 'expired':
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

export default function Subscriptions() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<SubscriptionStatus | 'all'>('all');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companyNameAr: '',
    companyAddress: '',
    companyCity: '',
    companyPhone: '',
    companyEmail: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    plan: 'trial' as SubscriptionPlan,
    notificationMethod: 'email' as NotificationMethod,
    moduleIds: [] as number[],
    notes: '',
  });

  const { data: subscriptions, isLoading, refetch, isError, error } = trpc.subscription.list.useQuery(
    filterStatus === 'all' ? undefined : { status: filterStatus }
  );
  const { data: availableModules } = trpc.subscription.getAvailableModules.useQuery();

  const createMutation = trpc.subscription.create.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`تم إنشاء الاشتراك بنجاح. كود الاشتراك: ${result.subscriptionCode}`);
        setViewMode('list');
        resetForm();
        refetch();
      } else {
        toast.error(result.error || 'فشل في إنشاء الاشتراك');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = trpc.subscription.updateStatus.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('تم تحديث حالة الاشتراك');
        refetch();
      } else {
        toast.error(result.error || 'فشل في تحديث الحالة');
      }
    },
  });

  const resendWelcomeMutation = trpc.subscription.resendWelcome.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('تم إرسال رسالة الترحيب');
      } else {
        toast.error(result.error || 'فشل في إرسال الرسالة');
      }
    },
  });

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyNameAr: '',
      companyAddress: '',
      companyCity: '',
      companyPhone: '',
      companyEmail: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      plan: 'trial',
      notificationMethod: 'email',
      moduleIds: [],
      notes: '',
    });
  };

  const handleCreate = () => {
    if (!formData.companyName || !formData.companyNameAr || !formData.ownerName || !formData.ownerEmail) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleModuleToggle = (moduleId: number) => {
    setFormData(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  // عرض نموذج إنشاء اشتراك جديد في نفس الصفحة
  if (viewMode === 'create') {

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (isError) return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
        <p className="text-gray-500 mt-2">{error?.message}</p>
      </div>
    );

    return (
      <div className="p-6 space-y-6">
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        {/* رأس الصفحة مع زر العودة */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewMode('list');
              resetForm();
            }}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إنشاء اشتراك جديد</h1>
            <p className="text-gray-500 mt-1">أدخل بيانات الشركة والمالك لإنشاء اشتراك جديد</p>
          </div>
        </div>

        {/* نموذج إنشاء الاشتراك */}
        <div className="grid gap-6">
          {/* معلومات الشركة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                معلومات الشركة
              </CardTitle>
              <CardDescription>أدخل البيانات الأساسية للشركة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة (إنجليزي) <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="الاسم"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الشركة (عربي) <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.companyNameAr}
                    onChange={(e) => setFormData({ ...formData, companyNameAr: e.target.value })}
                    placeholder="اسم الشركة"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={formData.companyCity}
                    onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
                    placeholder="الرياض"
                  />
                </div>
                <div className="space-y-2">
                  <Label>هاتف الشركة</Label>
                  <Input
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني للشركة</Label>
                  <Input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="الشركة"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المالك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                معلومات المالك
              </CardTitle>
              <CardDescription>بيانات مالك الحساب الذي سيستلم بيانات الدخول</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المالك <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <Input
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>طريقة الإشعار</Label>
                  <Select
                    value={formData.notificationMethod}
                    onValueChange={(value: NotificationMethod) => setFormData({ ...formData, notificationMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">البريد الإلكتروني</SelectItem>
                      <SelectItem value="whatsapp">واتساب</SelectItem>
                      <SelectItem value="both">كلاهما</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الاشتراك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                إعدادات الاشتراك
              </CardTitle>
              <CardDescription>حدد نوع الاشتراك والوحدات المتاحة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>نوع الاشتراك</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value: SubscriptionPlan) => setFormData({ ...formData, plan: value })}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">تجريبي (14 يوم)</SelectItem>
                    <SelectItem value="basic">أساسي (سنة)</SelectItem>
                    <SelectItem value="professional">احترافي (سنة)</SelectItem>
                    <SelectItem value="enterprise">مؤسسي (بدون انتهاء)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>الوحدات المتاحة</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModules?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((module: any) => (
                    <div
                      key={module.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.moduleIds.includes(module.id)
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleModuleToggle(module.id)}
                    >
                      <Checkbox
                        checked={formData.moduleIds.includes(module.id)}
                        onCheckedChange={() => handleModuleToggle(module.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{module.nameAr}</p>
                        <p className="text-xs text-gray-500">{module.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملاحظات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ملاحظات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية حول الاشتراك..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 ms-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ms-2" />
                  إنشاء الاشتراك
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // عرض قائمة الاشتراكات
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الاشتراكات</h1>
          <p className="text-gray-500 mt-1">إنشاء وإدارة اشتراكات الشركات في النظام</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={() => setViewMode('create')}>
            <Plus className="h-4 w-4 ms-2" />
            اشتراك جديد
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Label>تصفية حسب الحالة:</Label>
        <Select
          value={filterStatus}
          onValueChange={(value: SubscriptionStatus | 'all') => setFilterStatus(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : subscriptions?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد اشتراكات حتى الآن</p>
            <Button className="mt-4" onClick={() => setViewMode('create')}>
              <Plus className="h-4 w-4 ms-2" />
              إنشاء أول اشتراك
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions?.map((sub: any) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{sub.companyNameAr}</h3>
                        <Badge className={statusColors[sub.status as SubscriptionStatus]}>
                          <StatusIcon status={sub.status} />
                          <span className="me-1">{statusLabels[sub.status as SubscriptionStatus]}</span>
                        </Badge>
                        <Badge variant="outline">{planLabels[sub.plan as SubscriptionPlan]}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        كود الاشتراك: <span className="font-mono font-semibold">{sub.subscriptionCode}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {sub.ownerEmail}
                        </span>
                        {sub.ownerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {sub.ownerPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(sub.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendWelcomeMutation.mutate({ subscriptionId: sub.id })}
                      disabled={resendWelcomeMutation.isPending}
                    >
                      <Send className="h-4 w-4 ms-1" />
                      إعادة إرسال
                    </Button>
                    {sub.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: sub.id, status: 'active' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 ms-1" />
                        تفعيل
                      </Button>
                    )}
                    {sub.status === 'active' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: sub.id, status: 'suspended' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 ms-1" />
                        تعليق
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
