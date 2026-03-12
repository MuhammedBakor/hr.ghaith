/**
 * Setup Wizard - معالج الإعداد التفاعلي
 * =====================================
 * 
 * يظهر للمدير عند وجود عناصر إعداد مفقودة
 * يوجه المستخدم خطوة بخطوة لإكمال الإعداد الأساسي
 */

import { useState, useEffect } from "react";
import { generateNextCode } from '@/lib/generateCode';
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Building2, 
  GitBranch, 
  Users, 
  Shield, 
  FileText,
  Clock,
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
  CheckCheck,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

// أنواع البيانات
interface SetupItem {
  id: string;
  name: string;
  nameAr: string;
  module: string;
  isRequired: boolean;
  isComplete: boolean;
  priority: number;
}

interface SetupStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingItems: SetupItem[];
  blockedModules: string[];
}

// خريطة الأيقونات حسب العنصر
const itemIcons: Record<string, React.ReactNode> = {
  company: <Building2 className="h-5 w-5" />,
  branches: <GitBranch className="h-5 w-5" />,
  departments: <Users className="h-5 w-5" />,
  roles: <Shield className="h-5 w-5" />,
  hr_policies: <FileText className="h-5 w-5" />,
  attendance_policy: <Clock className="h-5 w-5" />,
  leave_policy: <Calendar className="h-5 w-5" />,
  salary_structure: <DollarSign className="h-5 w-5" />,
  approval_chains: <CheckCheck className="h-5 w-5" />,
  chart_of_accounts: <FileText className="h-5 w-5" />,
  fiscal_year: <Calendar className="h-5 w-5" />,
  cost_centers: <Building2 className="h-5 w-5" />,
};

// خريطة الوحدات
const moduleLabels: Record<string, string> = {
  core: "الإعدادات الأساسية",
  hr: "الموارد البشرية",
  governance: "الحوكمة",
  finance: "المالية",
};

export default function SetupWizard() {
  const [showInlineForm, setShowInlineForm] = useState(false);

  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const updateMutation = useMutation({ mutationFn: (data: any) => api.put('/settings/settings', data).then(r => r.data), onSuccess: () => { refetch(); setEditingItem(null); } });

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/settings/settings/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  // ═══ Real API connection ═══
  const setupProgressQuery = useQuery({ queryKey: ['setup', 'progress'], queryFn: () => api.get('/setup/progress').then(r => r.data) });

  const handleSave = () => {
    updateMutation.mutate(editingItem);
  };

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب حالة الإعداد
  const { data: setupStatus, isLoading, refetch } = useQuery({ queryKey: ['setup', 'status'], queryFn: () => api.get('/setup/status').then(r => r.data) }) as {
    data: SetupStatus | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  // Mutations للإعداد
  const createCompany = useMutation({
    mutationFn: (data: any) => api.post('/kernel/companies', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الشركة بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const createBranch = useMutation({
    mutationFn: (data: any) => api.post('/hr-advanced/branches', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الفرع بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const createDepartment = useMutation({
    mutationFn: (data: any) => api.post('/hr-advanced/departments', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء القسم بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // حالة النماذج
  const [companyForm, setCompanyForm] = useState({
    code: "COMP001",
    name: "",
    nameAr: "",
    commercialRegister: "",
    taxNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "السعودية",
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    nameAr: "",
    code: "BR001",
    address: "",
    city: "",
  });

  const [departmentForm, setDepartmentForm] = useState({
    branchId: 1,
    name: "",
    nameAr: "",
    code: "DEPT001",
  });

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // إذا كان الإعداد مكتمل، توجيه للصفحة الرئيسية
  useEffect(() => {
    if (setupStatus?.isComplete) {
      toast.success("الإعداد مكتمل! يمكنك الآن استخدام النظام");
      navigate("/");
    }
  }, [setupStatus?.isComplete, navigate]);

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {

  // Empty state
  const isEmpty = !currentUser || (Array.isArray(currentUser) && currentUser.length === 0);


  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل حالة الإعداد...</p>
        </div>
      </div>
    );
  }

  // تجميع العناصر حسب الوحدة
  const itemsByModule = setupStatus?.missingItems.reduce((acc: Record<string, SetupItem[]>, item: SetupItem) => {
    if (!acc[item.module]) {
      acc[item.module] = [];
    }
    acc[item.module].push(item);
    return acc;
  }, {} as Record<string, SetupItem[]>) || {};

  // الخطوات
  const steps = [
    { id: "overview", title: "نظرة عامة", icon: <Info className="h-5 w-5" /> },
    { id: "company", title: "الشركة", icon: <Building2 className="h-5 w-5" /> },
    { id: "branches", title: "الفروع", icon: <GitBranch className="h-5 w-5" /> },
    { id: "departments", title: "الأقسام", icon: <Users className="h-5 w-5" /> },
    { id: "complete", title: "اكتمال", icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  const handleCompanySubmit = async () => {
    if (!companyForm.name || !companyForm.nameAr) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCompany.mutateAsync(companyForm);
      setCurrentStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBranchSubmit = async () => {
    if (!branchForm.name || !branchForm.nameAr) {
      toast.error("يرجى إدخال اسم الفرع");
      return;
    }
    setIsSubmitting(true);
    try {
      await createBranch.mutateAsync(branchForm);
      setCurrentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepartmentSubmit = async () => {
    if (!departmentForm.name || !departmentForm.nameAr) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }
    setIsSubmitting(true);
    try {
      await createDepartment.mutateAsync(departmentForm);
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipToMain = () => {
    toast.info("يمكنك إكمال الإعداد لاحقاً من الإعدادات");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">معالج إعداد نظام غيث</h1>
          <p className="text-gray-600">أكمل الخطوات التالية لتفعيل النظام بالكامل</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">نسبة الإكمال</span>
            <span className="text-sm font-medium text-primary">
              {setupStatus?.completionPercentage || 0}%
            </span>
          </div>
          <Progress value={setupStatus?.completionPercentage || 0} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === index
                  ? "bg-primary text-white shadow-lg"
                  : currentStep > index
                  ? "bg-green-100 text-green-700"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {currentStep > index ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.icon
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="shadow-xl">
          {/* Step 0: Overview */}
          {currentStep === 0 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" />
                  نظرة عامة على حالة الإعداد
                </CardTitle>
                <CardDescription>
                  راجع العناصر المطلوبة لتفعيل النظام بالكامل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alert */}
                {setupStatus && !setupStatus.isComplete && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>الإعداد غير مكتمل</AlertTitle>
                    <AlertDescription>
                      يجب إكمال العناصر الإلزامية لتفعيل جميع وظائف النظام.
                      الوحدات المحظورة حالياً: {setupStatus?.blockedModules?.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Items by Module */}
                <div className="space-y-4">
                  {Object.entries(itemsByModule).map(([module, items]) => (
                    <div key={module} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Badge variant={module === "core" ? "default" : "secondary"}>
                          {moduleLabels[module] || module}
                        </Badge>
                      </h3>
                      <div className="grid gap-2">
                        {(items as SetupItem[]).map((item: SetupItem) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              item.isComplete
                                ? "bg-green-50 border border-green-200"
                                : item.isRequired
                                ? "bg-red-50 border border-red-200"
                                : "bg-yellow-50 border border-yellow-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {itemIcons[item.id] || <Circle className="h-5 w-5" />}
                              <div>
                                <p className="font-medium">{item.nameAr}</p>
                                <p className="text-sm text-gray-500">{item.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  إلزامي
                                </Badge>
                              )}
                              {item.isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(step)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: step.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleSkipToMain}>
                    تخطي الآن
                  </Button>
                  <Button onClick={() => setCurrentStep(1)}>
                    بدء الإعداد
                    <ArrowLeft className="h-4 w-4 me-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 1: Company */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  إعداد بيانات الشركة
                </CardTitle>
                <CardDescription>
                  أدخل المعلومات الأساسية للشركة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyNameAr">اسم الشركة (عربي) *</Label>
                    <Input
                      id="companyNameAr"
                      value={companyForm.nameAr}
                      onChange={(e) => setCompanyForm({ ...companyForm, nameAr: e.target.value })}
                      placeholder="شركة غيث للتقنية"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة (إنجليزي) *</Label>
                    <Input
                      id="companyName"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      placeholder="أدخل..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commercialRegister">رقم السجل التجاري</Label>
                    <Input
                      id="commercialRegister"
                      value={companyForm.commercialRegister}
                      onChange={(e) => setCompanyForm({ ...companyForm, commercialRegister: e.target.value })}
                      placeholder="أدخل..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                    <Input
                      id="taxNumber"
                      value={companyForm.taxNumber}
                      onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                      placeholder="أدخل..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      placeholder="الشركة"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">رقم الهاتف</Label>
                    <Input
                      id="companyPhone"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      placeholder="أدخل..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">المدينة</Label>
                    <Input
                      id="companyCity"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      placeholder="الرياض"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCountry">الدولة</Label>
                    <Select
                      value={companyForm.country}
                      onValueChange={(value) => setCompanyForm({ ...companyForm, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="السعودية">السعودية</SelectItem>
                        <SelectItem value="الإمارات">الإمارات</SelectItem>
                        <SelectItem value="الكويت">الكويت</SelectItem>
                        <SelectItem value="البحرين">البحرين</SelectItem>
                        <SelectItem value="قطر">قطر</SelectItem>
                        <SelectItem value="عمان">عمان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">العنوان</Label>
                  <Textarea
                    id="companyAddress"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="العنوان التفصيلي..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    <ArrowRight className="h-4 w-4 ms-2" />
                    السابق
                  </Button>
                  <Button onClick={handleCompanySubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    ) : null}
                    حفظ والتالي
                    <ArrowLeft className="h-4 w-4 me-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Branches */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-6 w-6 text-primary" />
                  إعداد الفروع
                </CardTitle>
                <CardDescription>
                  أضف الفرع الرئيسي للشركة (يمكنك إضافة فروع أخرى لاحقاً)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branchNameAr">اسم الفرع (عربي) *</Label>
                    <Input
                      id="branchNameAr"
                      value={branchForm.nameAr}
                      onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                      placeholder="الفرع الرئيسي"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchName">اسم الفرع (إنجليزي) *</Label>
                    <Input
                      id="branchName"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      placeholder="أدخل..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">رمز الفرع</Label>
                    <Input
                      id="branchCode"
                      value={branchForm.code}
                      readOnly
                      className="bg-muted font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchCity">المدينة</Label>
                    <Input
                      id="branchCity"
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      placeholder="الرياض"
                    />
                  </div>
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchAddress">العنوان</Label>
                  <Textarea
                    id="branchAddress"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    placeholder="العنوان التفصيلي..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowRight className="h-4 w-4 ms-2" />
                    السابق
                  </Button>
                  <Button onClick={handleBranchSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    ) : null}
                    حفظ والتالي
                    <ArrowLeft className="h-4 w-4 me-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Departments */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  إعداد الأقسام
                </CardTitle>
                <CardDescription>
                  أضف القسم الأول (يمكنك إضافة أقسام أخرى لاحقاً)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deptNameAr">اسم القسم (عربي) *</Label>
                    <Input
                      id="deptNameAr"
                      value={departmentForm.nameAr}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, nameAr: e.target.value })}
                      placeholder="الإدارة العامة"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deptName">اسم القسم (إنجليزي) *</Label>
                    <Input
                      id="deptName"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                      placeholder="أدخل..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deptCode">رمز القسم</Label>
                    <Input
                      id="deptCode"
                      value={departmentForm.code}
                      readOnly
                      className="bg-muted font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
                

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowRight className="h-4 w-4 ms-2" />
                    السابق
                  </Button>
                  <Button onClick={handleDepartmentSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    ) : null}
                    حفظ والتالي
                    <ArrowLeft className="h-4 w-4 me-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  تم إكمال الإعداد الأساسي
                </CardTitle>
                <CardDescription>
                  أحسنت! يمكنك الآن البدء باستخدام النظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">الإعداد الأساسي مكتمل</AlertTitle>
                  <AlertDescription className="text-green-700">
                    تم إعداد الشركة والفرع والقسم بنجاح. يمكنك الآن:
                    <ul className="list-disc list-inside mt-2">
                      <li>إضافة موظفين جدد</li>
                      <li>إعداد سياسات الحضور والإجازات</li>
                      <li>تفعيل الوحدات الأخرى</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => navigate("/hr/employees")}>
                    <Users className="h-4 w-4 ms-2" />
                    إضافة موظفين
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    <FileText className="h-4 w-4 ms-2" />
                    الإعدادات
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-center pt-4">
                  <Button size="lg" onClick={() => navigate("/")}>
                    الذهاب للصفحة الرئيسية
                    <ArrowLeft className="h-4 w-4 me-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>نظام غيث للإدارة المتكاملة - الإصدار 2.0</p>
        </div>
      </div>
    </div>
  );
}
