import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Key, Phone, Send, CheckCircle2, XCircle, AlertCircle, Server, Hash } from 'lucide-react';
import { toast } from 'sonner';

const SMS_PROVIDERS = [
  { value: 'unifonic', label: 'Unifonic (يونيفونيك)' },
  { value: 'twilio', label: 'Twilio (تويليو)' },
  { value: 'mobily', label: 'Mobily (موبايلي)' },
  { value: 'other', label: 'مزود آخر' },
];

export default function SmsSettings() {
  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/settings/sms/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    provider: 'unifonic',
    accountSid: '',
    authToken: '',
    fromNumber: '',
    apiUrl: '',
    apiKey: '',
    senderId: '',
  });
  const [testPhone, setTestPhone] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading, refetch } = useQuery({ queryKey: ['sms-settings'], queryFn: () => api.get('/settings/sms').then(r => r.data) });
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/settings/sms', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات SMS بنجاح');
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    },
  });
  const testMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/sms/test', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إرسال رسالة SMS الاختبارية بنجاح!');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        provider: settings.provider || 'unifonic',
        accountSid: settings.account_sid || '',
        authToken: '', // لا نعرض التوكن المحفوظ
        fromNumber: settings.from_number || '',
        apiUrl: settings.api_url || '',
        apiKey: '', // لا نعرض المفتاح المحفوظ
        senderId: settings.sender_id || '',
      }, []);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formData.provider) {
      toast.error('يرجى اختيار مزود الخدمة');
      return;
    }
    
    // التحقق من الحقول المطلوبة حسب المزود
    if (formData.provider === 'twilio' && (!formData.accountSid || !formData.fromNumber)) {
      toast.error('يرجى ملء Account SID ورقم المرسل لـ Twilio');
      return;
    }
    
    if (formData.provider === 'unifonic' && !formData.senderId) {
      toast.error('يرجى ملء Sender ID لـ Unifonic');
      return;
    }
    
    // إذا لم يتم إدخال توكن/مفتاح جديد، نرسل بدونه
    const dataToSave = {
      ...formData,
      authToken: formData.authToken || undefined,
      apiKey: formData.apiKey || undefined,
    };
    
    updateMutation.mutate(dataToSave as any);
  };

  const handleTest = () => {
    if (!testPhone) {
      toast.error('يرجى إدخال رقم هاتف للاختبار');
      return;
    }
    testMutation.mutate({ testPhone });
  };

  if (isLoading) {
  // Empty state
  const isEmpty = !currentUser || (Array.isArray(currentUser) && currentUser.length === 0);

    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">إعدادات الرسائل النصية (SMS)</h2>
        <p className="text-gray-500">تكوين خدمة SMS لإرسال الرسائل النصية من النظام</p>
      </div>

      {/* حالة الاتصال */}
      {settings && (
        <Card className={settings.last_test_result === 'success' ? 'border-green-200 bg-green-50' : settings.last_test_result === 'failed' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {settings.last_test_result === 'success' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">الاتصال يعمل بشكل صحيح</p>
                    <p className="text-sm text-green-600">آخر اختبار: {settings.last_tested_at ? formatDateTime(settings.last_tested_at) : 'غير محدد'}</p>
                  </div>
                </>
              ) : settings.last_test_result === 'failed' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700">فشل الاتصال</p>
                    <p className="text-sm text-red-600">{settings.last_test_error || 'خطأ غير معروف'}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700">لم يتم اختبار الاتصال</p>
                    <p className="text-sm text-amber-600">قم بإرسال رسالة اختبارية للتحقق من الإعدادات</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* اختيار المزود */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              مزود الخدمة
            </CardTitle>
            <CardDescription>اختر مزود خدمة الرسائل النصية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>مزود SMS *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => handleChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المزود" />
                </SelectTrigger>
                <SelectContent>
                  {SMS_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات Twilio */}
        {formData.provider === 'twilio' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  إعدادات Twilio
                </CardTitle>
                <CardDescription>بيانات حساب Twilio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID *</Label>
                  <Input
                    id="accountSid"
                    value={formData.accountSid}
                    onChange={(e) => handleChange('accountSid', e.target.value)}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token {settings ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}</Label>
                  <Input
                    id="authToken"
                    type="password"
                    value={formData.authToken}
                    onChange={(e) => handleChange('authToken', e.target.value)}
                    placeholder={settings ? '••••••••' : 'أدخل Auth Token'}
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  رقم المرسل
                </CardTitle>
                <CardDescription>رقم الهاتف المستخدم للإرسال</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromNumber">رقم المرسل *</Label>
                  <Input
                    id="fromNumber"
                    value={formData.fromNumber}
                    onChange={(e) => handleChange('fromNumber', e.target.value)}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">رقم Twilio الخاص بك بالصيغة الدولية</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* إعدادات Unifonic */}
        {formData.provider === 'unifonic' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  إعدادات Unifonic
                </CardTitle>
                <CardDescription>بيانات حساب Unifonic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">App SID / API Key {settings ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    placeholder={settings ? '••••••••' : 'أدخل App SID'}
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID *</Label>
                  <Input
                    id="senderId"
                    value={formData.senderId}
                    onChange={(e) => handleChange('senderId', e.target.value)}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">اسم المرسل الذي سيظهر للمستلم</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  إعدادات متقدمة
                </CardTitle>
                <CardDescription>إعدادات إضافية (اختياري)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">رابط API (اختياري)</Label>
                  <Input
                    id="apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => handleChange('apiUrl', e.target.value)}
                    placeholder="الرسالة"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">اتركه فارغاً لاستخدام الرابط الافتراضي</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* إعدادات مزود آخر */}
        {(formData.provider === 'mobily' || formData.provider === 'other') && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  بيانات المصادقة
                </CardTitle>
                <CardDescription>بيانات الوصول للخدمة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key {settings ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    placeholder={settings ? '••••••••' : 'أدخل API Key'}
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID *</Label>
                  <Input
                    id="senderId"
                    value={formData.senderId}
                    onChange={(e) => handleChange('senderId', e.target.value)}
                    placeholder="أدخل..."
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  إعدادات API
                </CardTitle>
                <CardDescription>رابط الخدمة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">رابط API *</Label>
                  <Input
                    id="apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => handleChange('apiUrl', e.target.value)}
                    placeholder="مثال"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* اختبار الإرسال */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اختبار الإرسال
            </CardTitle>
            <CardDescription>إرسال رسالة اختبارية للتحقق من الإعدادات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="testPhone">رقم الهاتف للاختبار</Label>
                <div className="relative">
                  <MessageSquare className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="testPhone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="أدخل..."
                    className="pe-10"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-gray-500">أدخل الرقم بالصيغة الدولية مع رمز الدولة</p>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleTest}
                  disabled={testMutation.isPending || !testPhone}
                  variant="outline"
                  className="w-full"
                >
                  {testMutation.isPending ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="ms-2 h-4 w-4" />
                      إرسال رسالة اختبارية
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="ms-2 h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            'حفظ الإعدادات'
          )}
        </Button>
      </div>
    
                <div className="flex gap-2 mt-2"> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: provider.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
  );
}
