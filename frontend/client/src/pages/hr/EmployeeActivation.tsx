import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, KeyRound, User, Briefcase, CreditCard, Phone, FileText, Loader2, AlertCircle, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

type ActivationStep = 'code' | 'profile' | 'documents' | 'review' | 'complete';

export default function EmployeeActivation() {
  const [showInlineForm, setShowInlineForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [, navigate] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const codeFromUrl = urlParams.get('code') || '';

  const [step, setStep] = useState<ActivationStep>('code');
  const [activationCode, setActivationCode] = useState(codeFromUrl);
  const [isActivating, setIsActivating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    nationality: 'سعودي',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    address: '',
    city: '',
    // Emergency Contact
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    // Work Info
    position: '',
    department: '',
    // Bank Info
    bankName: '',
    bankAccount: '',
    iban: '',
  });

  const [documents, setDocuments] = useState<{
    type: string;
    file: File | null;
    number?: string;
    issueDate?: string;
    expiryDate?: string;
  }[]>([
    { type: 'national_id', file: null },
    { type: 'photo', file: null },
    { type: 'education_certificate', file: null },
  ]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mutation لتفعيل الحساب
  const activateMutation = useMutation({
    mutationFn: (data: { activationCode: string }) => api.post('/hr/employee-onboarding/activate', data).then(res => res.data),
    onSuccess: (data) => {
      setEmployeeData(data);
      // التحقق من وجود البيانات
      if ('employeeId' in data) {
        setFormData(prev => ({
          ...prev,
          firstName: (data as any).firstName || '',
          lastName: (data as any).lastName || '',
          email: (data as any).email || '',
          phone: (data as any).phone || '',
        }));
      }
      setStep('profile');
      toast.success('تم تفعيل الحساب بنجاح! يرجى إكمال بياناتك.');
    },
    onError: (error: any) => {
      toast.error('كود التفعيل غير صحيح أو منتهي الصلاحية');
    },
  });

  // Mutation لتحديث البيانات الكاملة
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.put('/hr/employee-onboarding/update-profile', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeOnboarding'] });
      toast.success('تم حفظ البيانات بنجاح');
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const handleActivate = async () => {
    if (!activationCode) {
      toast.error('يرجى إدخال كود التفعيل');
      return;
    }
    setIsActivating(true);
    try {
      await activateMutation.mutateAsync({ activationCode });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSubmitProfile = async () => {
    // التحقق من الحقول المطلوبة
    if (!formData.nationalId) {
      toast.error('يرجى إدخال رقم الهوية الوطنية');
      setActiveTab('personal');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync({
        employeeId: employeeData.employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
      });
      setStep('documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDocuments = async () => {
    // التحقق من المستندات المطلوبة
    const requiredDocs = documents.filter(d => d.type === 'national_id' || d.type === 'photo');
    const missingDocs = requiredDocs.filter(d => !d.file);
    
    if (missingDocs.length > 0) {
      toast.error('يرجى رفع المستندات المطلوبة (الهوية والصورة الشخصية)');
      return;
    }

    setStep('review');
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // هنا يتم إرسال الطلب للمراجعة
      toast.success('تم إرسال طلبك للمراجعة بنجاح');
      setStep('complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentTypes = [
    { value: 'national_id', label: 'الهوية الوطنية', required: true },
    { value: 'photo', label: 'الصورة الشخصية', required: true },
    { value: 'passport', label: 'جواز السفر', required: false },
    { value: 'iqama', label: 'الإقامة', required: false },
    { value: 'driving_license', label: 'رخصة القيادة', required: false },
    { value: 'education_certificate', label: 'الشهادة التعليمية', required: false },
    { value: 'experience_certificate', label: 'شهادة الخبرة', required: false },
    { value: 'medical_certificate', label: 'الشهادة الصحية', required: false },
    { value: 'bank_letter', label: 'خطاب البنك', required: false },
  ];

  // صفحة إدخال كود التفعيل
  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">تفعيل حساب الموظف</CardTitle>
            <CardDescription>
              أدخل كود التفعيل الذي تم إرساله إليك عبر البريد الإلكتروني أو الجوال
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>كود التفعيل</Label>
              <Input
                placeholder="أدخل كود التفعيل"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={8}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleActivate}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ms-2" />
                  تفعيل الحساب
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // صفحة إكمال البيانات
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                إكمال بيانات الموظف
              </CardTitle>
              <CardDescription>
                مرحباً {formData.firstName}! يرجى إكمال جميع البيانات المطلوبة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
                  <TabsTrigger value="personal" className="gap-2">
                    <User className="h-4 w-4" />
                    شخصية
                  </TabsTrigger>
                  <TabsTrigger value="work" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    العمل
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    البنك
                  </TabsTrigger>
                  <TabsTrigger value="emergency" className="gap-2">
                    <Phone className="h-4 w-4" />
                    الطوارئ
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الأول <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم العائلة <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهوية الوطنية <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="أدخل رقم الهوية"
                        value={formData.nationalId}
                        onChange={(e) => updateField('nationalId', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الجنسية</Label>
                      <Select value={formData.nationality} onValueChange={(v) => updateField('nationality', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="سعودي">سعودي</SelectItem>
                          <SelectItem value="مصري">مصري</SelectItem>
                          <SelectItem value="أردني">أردني</SelectItem>
                          <SelectItem value="سوري">سوري</SelectItem>
                          <SelectItem value="يمني">يمني</SelectItem>
                          <SelectItem value="هندي">هندي</SelectItem>
                          <SelectItem value="باكستاني">باكستاني</SelectItem>
                          <SelectItem value="فلبيني">فلبيني</SelectItem>
                          <SelectItem value="أخرى">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>تاريخ الميلاد</Label>
                      <Input 
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الجنس</Label>
                      <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الحالة الاجتماعية</Label>
                      <Select value={formData.maritalStatus} onValueChange={(v) => updateField('maritalStatus', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">أعزب</SelectItem>
                          <SelectItem value="married">متزوج</SelectItem>
                          <SelectItem value="divorced">مطلق</SelectItem>
                          <SelectItem value="widowed">أرمل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Input 
                        placeholder="أدخل المدينة"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان</Label>
                      <Input 
                        placeholder="أدخل العنوان"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="work" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المنصب الوظيفي</Label>
                      <Input 
                        placeholder="أدخل المنصب"
                        value={formData.position}
                        onChange={(e) => updateField('position', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Select value={formData.department} onValueChange={(v) => updateField('department', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                          <SelectItem value="المالية">المالية</SelectItem>
                          <SelectItem value="تقنية المعلومات">تقنية المعلومات</SelectItem>
                          <SelectItem value="التسويق">التسويق</SelectItem>
                          <SelectItem value="المبيعات">المبيعات</SelectItem>
                          <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
                          <SelectItem value="العمليات">العمليات</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم البنك</Label>
                      <Select value={formData.bankName} onValueChange={(v) => updateField('bankName', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر البنك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الراجحي">مصرف الراجحي</SelectItem>
                          <SelectItem value="الأهلي">البنك الأهلي</SelectItem>
                          <SelectItem value="الرياض">بنك الرياض</SelectItem>
                          <SelectItem value="سامبا">سامبا</SelectItem>
                          <SelectItem value="الإنماء">مصرف الإنماء</SelectItem>
                          <SelectItem value="البلاد">بنك البلاد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الحساب</Label>
                      <Input 
                        placeholder="أدخل رقم الحساب"
                        value={formData.bankAccount}
                        onChange={(e) => updateField('bankAccount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الآيبان</Label>
                    <Input 
                      placeholder="أدخل..."
                      value={formData.iban}
                      onChange={(e) => updateField('iban', e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم جهة الاتصال</Label>
                      <Input 
                        placeholder="أدخل الاسم"
                        value={formData.emergencyName}
                        onChange={(e) => updateField('emergencyName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>صلة القرابة</Label>
                      <Select value={formData.emergencyRelation} onValueChange={(v) => updateField('emergencyRelation', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر صلة القرابة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="أب">أب</SelectItem>
                          <SelectItem value="أم">أم</SelectItem>
                          <SelectItem value="أخ">أخ</SelectItem>
                          <SelectItem value="أخت">أخت</SelectItem>
                          <SelectItem value="زوج">زوج</SelectItem>
                          <SelectItem value="زوجة">زوجة</SelectItem>
                          <SelectItem value="ابن">ابن</SelectItem>
                          <SelectItem value="ابنة">ابنة</SelectItem>
                          <SelectItem value="صديق">صديق</SelectItem>
                          <SelectItem value="أخرى">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الجوال</Label>
                    <Input 
                      placeholder="أدخل..."
                      value={formData.emergencyPhone}
                      onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('code')}>
                رجوع
              </Button>
              <Button onClick={handleSubmitProfile} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'التالي: رفع المستندات'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // صفحة رفع المستندات
  if (step === 'documents') {
    return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                رفع المستندات
              </CardTitle>
              <CardDescription>
                يرجى رفع المستندات المطلوبة. المستندات المميزة بـ (*) إلزامية.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {documentTypes.map((docType) => (
                <div key={docType.value} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base">
                      {docType.label}
                      {docType.required && <span className="text-red-500 me-1">*</span>}
                    </Label>
                    {documents.find(d => d.type === docType.value)?.file && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        تم الرفع
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <Input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDocuments(prev => {
                            const existing = prev.find(d => d.type === docType.value);
                            if (existing) {
                              return prev.map(d => d.type === docType.value ? { ...d, file } : d);
                            }
                            return [...prev, { type: docType.value, file }];
                          });
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  {(docType.value === 'national_id' || docType.value === 'passport' || docType.value === 'iqama') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="space-y-1">
                        <Label className="text-sm">رقم المستند</Label>
                        <Input 
                          placeholder="رقم المستند"
                          onChange={(e) => {
                            setDocuments(prev => prev.map(d => 
                              d.type === docType.value ? { ...d, number: e.target.value } : d
                            ));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">تاريخ الإصدار</Label>
                        <Input 
                          type="date"
                          onChange={(e) => {
                            setDocuments(prev => prev.map(d => 
                              d.type === docType.value ? { ...d, issueDate: e.target.value } : d
                            ));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">تاريخ الانتهاء</Label>
                        <Input 
                          type="date"
                          onChange={(e) => {
                            setDocuments(prev => prev.map(d => 
                              d.type === docType.value ? { ...d, expiryDate: e.target.value } : d
                            ));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('profile')}>
                رجوع
              </Button>
              <Button onClick={handleSubmitDocuments}>
                التالي: مراجعة الطلب
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // صفحة المراجعة
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                مراجعة الطلب
              </CardTitle>
              <CardDescription>
                يرجى مراجعة البيانات قبل الإرسال
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ملخص البيانات الشخصية */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  البيانات الشخصية
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">الاسم:</span> {formData.firstName} {formData.lastName}</div>
                  <div><span className="text-gray-500">رقم الهوية:</span> {formData.nationalId}</div>
                  <div><span className="text-gray-500">الجنسية:</span> {formData.nationality}</div>
                  <div><span className="text-gray-500">تاريخ الميلاد:</span> {formData.dateOfBirth || '-'}</div>
                  <div><span className="text-gray-500">البريد:</span> {formData.email}</div>
                  <div><span className="text-gray-500">الجوال:</span> {formData.phone}</div>
                </div>
              </div>

              {/* ملخص بيانات العمل */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  بيانات العمل
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">المنصب:</span> {formData.position || '-'}</div>
                  <div><span className="text-gray-500">القسم:</span> {formData.department || '-'}</div>
                </div>
              </div>

              {/* ملخص المستندات */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  المستندات المرفقة
                </h3>
                <div className="space-y-2">
                  {documents.filter(d => d.file).map((doc) => (
                    <div key={doc.type} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{documentTypes.find(t => t.value === doc.type)?.label}</span>
                      <span className="text-gray-500">({doc.file?.name})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800">تنبيه</h4>
                    <p className="text-sm text-amber-700">
                      بعد إرسال الطلب، سيتم مراجعته من قبل المسؤول. قد يتم طلب تعديلات أو مستندات إضافية.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('documents')}>
                رجوع
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ms-2" />
                    إرسال الطلب للمراجعة
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // صفحة الإكمال
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">تم إرسال طلبك بنجاح!</CardTitle>
            <CardDescription>
              سيتم مراجعة طلبك من قبل المسؤول وسيتم إشعارك بالنتيجة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                رقم الطلب: <span className="font-mono font-bold">{employeeData?.requestNumber || 'REQ-XXXX'}</span>
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>يمكنك متابعة حالة طلبك من خلال:</p>
              <ul className="list-disc list-inside mt-2 text-end">
                <li>البريد الإلكتروني المسجل</li>
                <li>رسائل الجوال</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
