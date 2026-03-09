import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, User, CreditCard, Phone, FileText, CheckCircle2, CloudRain, Upload, X, File as FileIcon } from 'lucide-react';

export default function CompleteProfile() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const employeeId = params.get('employeeId');

  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    nationalId: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    address: '',
    city: '',
    phone: '',
    // Bank Info
    bankName: '',
    bankAccount: '',
    iban: '',
    // Emergency Contact
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  });

  // Document uploads
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    cv: null,
    passport: null,
    national_id: null,
    education_certificate: null,
  });

  const documentTypes = [
    { key: 'cv', label: 'السيرة الذاتية (CV)', accept: '.pdf,.doc,.docx' },
    { key: 'passport', label: 'صورة جواز السفر', accept: '.pdf,.jpg,.jpeg,.png' },
    { key: 'national_id', label: 'صورة الهوية الوطنية', accept: '.pdf,.jpg,.jpeg,.png' },
    { key: 'education_certificate', label: 'الشهادة التعليمية', accept: '.pdf,.jpg,.jpeg,.png' },
  ];

  const handleFileChange = (key: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [key]: file }));
  };

  const removeFile = (key: string) => {
    setDocuments(prev => ({ ...prev, [key]: null }));
  };

  // Fetch employee data to pre-fill
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['employee-profile', employeeId],
    queryFn: () => api.get(`/hr/employees/${employeeId}`).then(res => res.data),
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (employeeData) {
      setFormData(prev => ({
        ...prev,
        phone: employeeData.phone || '',
        nationalId: employeeData.nationalId || '',
        nationality: employeeData.nationality || '',
        dateOfBirth: employeeData.dateOfBirth || '',
        gender: employeeData.gender || '',
        maritalStatus: employeeData.maritalStatus || '',
        address: employeeData.address || '',
        city: employeeData.city || '',
        bankName: employeeData.bankName || '',
        bankAccount: employeeData.bankAccount || '',
        iban: employeeData.iban || '',
        emergencyName: employeeData.emergencyName || '',
        emergencyRelation: employeeData.emergencyRelation || '',
        emergencyPhone: employeeData.emergencyPhone || '',
      }));
    }
  }, [employeeData]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitMutation = useMutation({
    mutationFn: (data: any) =>
      api.put('/hr/employee-onboarding/update-profile', data).then(res => res.data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('تم حفظ بياناتك بنجاح. سيتم مراجعة بياناتك من قبل الإدارة');
        // Redirect to dashboard - employee can use the system while admin reviews
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(result.error || 'فشل في حفظ البيانات');
      }
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleSubmit = async () => {
    if (!formData.nationalId) {
      toast.error('رقم الهوية مطلوب');
      setActiveTab('personal');
      return;
    }

    // Upload documents first if any
    const docFiles = Object.entries(documents).filter(([, file]) => file !== null);
    if (docFiles.length > 0) {
      for (const [docType, file] of docFiles) {
        if (!file) continue;
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file);
          formDataUpload.append('employeeId', String(employeeId));
          formDataUpload.append('documentType', docType);
          formDataUpload.append('name', file.name);
          await api.post('/hr/employee-documents/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (err) {
          console.error(`Failed to upload ${docType}:`, err);
        }
      }
    }

    submitMutation.mutate({
      employeeId: Number(employeeId),
      ...formData,
    });
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center">
            <p className="text-red-600">رابط غير صالح. يرجى استخدام الرابط المرسل إليك.</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-blue-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <CloudRain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">منصة غيث</h1>
            <p className="text-xs text-gray-500">إكمال بيانات الملف الشخصي</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome message */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            مرحباً {employeeData?.firstName} {employeeData?.lastName}
          </h2>
          <p className="text-gray-600">
            يرجى إكمال بياناتك الشخصية لإتمام عملية التسجيل
          </p>
        </div>

        {/* Pre-filled info card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">الاسم: </span>
                <span className="font-medium">{employeeData?.firstName} {employeeData?.lastName}</span>
              </div>
              <div>
                <span className="text-gray-500">البريد الإلكتروني: </span>
                <span className="font-medium" dir="ltr">{employeeData?.email}</span>
              </div>
              {employeeData?.department && (
                <div>
                  <span className="text-gray-500">القسم: </span>
                  <span className="font-medium">
                    {typeof employeeData.department === 'object'
                      ? (employeeData.department.nameAr || employeeData.department.name)
                      : employeeData.department}
                  </span>
                </div>
              )}
              {employeeData?.position && (
                <div>
                  <span className="text-gray-500">المنصب: </span>
                  <span className="font-medium">
                    {typeof employeeData.position === 'object'
                      ? employeeData.position.title
                      : employeeData.position}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إكمال البيانات</CardTitle>
            <CardDescription>أكمل جميع البيانات المطلوبة ثم اضغط حفظ</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex w-full overflow-x-auto mb-6">
                <TabsTrigger value="personal" className="flex-shrink-0 gap-1">
                  <User className="h-4 w-4" />
                  البيانات الشخصية
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-shrink-0 gap-1">
                  <CreditCard className="h-4 w-4" />
                  البيانات البنكية
                </TabsTrigger>
                <TabsTrigger value="emergency" className="flex-shrink-0 gap-1">
                  <Phone className="h-4 w-4" />
                  جهة اتصال الطوارئ
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-shrink-0 gap-1">
                  <FileText className="h-4 w-4" />
                  الوثائق
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهوية / الإقامة <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.nationalId}
                      onChange={(e) => updateField('nationalId', e.target.value)}
                      placeholder="أدخل رقم الهوية"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجنسية</Label>
                    <Input
                      value={formData.nationality}
                      onChange={(e) => updateField('nationality', e.target.value)}
                      placeholder="أدخل الجنسية"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الميلاد</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجنس</Label>
                    <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                      <SelectTrigger>
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
                    <Select value={formData.maritalStatus} onValueChange={(v) => updateField('maritalStatus', v)}>
                      <SelectTrigger>
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
                    <Label>رقم الجوال</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="أدخل العنوان"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المدينة</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="أدخل المدينة"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Bank Info Tab */}
              <TabsContent value="bank" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم البنك</Label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) => updateField('bankName', e.target.value)}
                      placeholder="مثال: بنك الراجحي"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الحساب</Label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) => updateField('bankAccount', e.target.value)}
                      placeholder="أدخل رقم الحساب"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>رقم الآيبان (IBAN)</Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => updateField('iban', e.target.value)}
                    placeholder="SA..."
                    dir="ltr"
                  />
                </div>
              </TabsContent>

              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم جهة الاتصال</Label>
                    <Input
                      value={formData.emergencyName}
                      onChange={(e) => updateField('emergencyName', e.target.value)}
                      placeholder="أدخل الاسم"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صلة القرابة</Label>
                    <Select value={formData.emergencyRelation} onValueChange={(v) => updateField('emergencyRelation', v)}>
                      <SelectTrigger>
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
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    يرجى رفع الوثائق المطلوبة. الصيغ المدعومة: PDF، JPG، PNG، DOC
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {documentTypes.map((docType) => (
                    <div key={docType.key} className="space-y-2">
                      <Label>{docType.label}</Label>
                      {documents[docType.key] ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                          <FileIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{documents[docType.key]!.name}</p>
                            <p className="text-xs text-gray-500">
                              {(documents[docType.key]!.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFile(docType.key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-colors">
                          <Upload className="h-6 w-6 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-500">اضغط لاختيار الملف</span>
                          <span className="text-xs text-gray-400 mt-1">({docType.accept})</span>
                          <input
                            type="file"
                            className="hidden"
                            accept={docType.accept}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange(docType.key, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-4 border-t">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 ms-2" />
                    حفظ البيانات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 py-3 mt-8">
        <div className="text-center text-sm text-gray-500">
          &copy; 2026 منصة غيث - جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
