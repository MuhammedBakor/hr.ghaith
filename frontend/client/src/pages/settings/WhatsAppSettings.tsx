import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, Key, Phone, Send, CheckCircle2, XCircle, AlertCircle, Building2, Hash } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppSettings() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    businessAccountId: '',
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: '',
    apiVersion: 'v18.0',
  });
  const [testPhone, setTestPhone] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading, refetch } = trpc.controlKernel.whatsapp.get.useQuery();
  const updateMutation = trpc.controlKernel.whatsapp.update.useMutation({
    onSuccess: () => {
      toast.success('تم حفظ إعدادات WhatsApp بنجاح');
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    },
  });
  const testMutation = trpc.controlKernel.whatsapp.test.useMutation({
    onSuccess: () => {
      toast.success('تم إرسال رسالة WhatsApp الاختبارية بنجاح!');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        businessAccountId: settings.business_account_id || '',
        phoneNumberId: settings.phone_number_id || '',
        accessToken: '', // لا نعرض التوكن المحفوظ
        webhookVerifyToken: settings.webhook_verify_token || '',
        apiVersion: settings.api_version || 'v18.0',
      }, []);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formData.businessAccountId || !formData.phoneNumberId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // إذا لم يتم إدخال توكن جديد، نرسل بدونه
    const dataToSave = {
      ...formData,
      accessToken: formData.accessToken || undefined,
    };
    
    if (!dataToSave.accessToken && !settings) {
      toast.error('يرجى إدخال Access Token');
      return;
    }
    
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
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">إعدادات WhatsApp</h2>
        <p className="text-gray-500">تكوين WhatsApp Business API لإرسال الرسائل من النظام</p>
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
        {/* إعدادات الحساب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              إعدادات الحساب
            </CardTitle>
            <CardDescription>معلومات حساب WhatsApp Business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessAccountId">معرف حساب الأعمال (Business Account ID) *</Label>
              <div className="relative">
                <Hash className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="businessAccountId"
                  value={formData.businessAccountId}
                  onChange={(e) => handleChange('businessAccountId', e.target.value)}
                  placeholder="123456789012345"
                  className="pe-10"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">معرف رقم الهاتف (Phone Number ID) *</Label>
              <div className="relative">
                <Phone className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumberId"
                  value={formData.phoneNumberId}
                  onChange={(e) => handleChange('phoneNumberId', e.target.value)}
                  placeholder="123456789012345"
                  className="pe-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiVersion">إصدار API</Label>
              <Input
                id="apiVersion"
                value={formData.apiVersion}
                onChange={(e) => handleChange('apiVersion', e.target.value)}
                placeholder="v18.0"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* بيانات المصادقة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              بيانات المصادقة
            </CardTitle>
            <CardDescription>مفاتيح الوصول لـ WhatsApp API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token {settings ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}</Label>
              <div className="relative">
                <Key className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="accessToken"
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => handleChange('accessToken', e.target.value)}
                  placeholder={settings ? '••••••••' : 'أدخل Access Token'}
                  className="pe-10"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-500">يمكنك الحصول عليه من Meta Business Suite</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token (اختياري)</Label>
              <Input
                id="webhookVerifyToken"
                value={formData.webhookVerifyToken}
                onChange={(e) => handleChange('webhookVerifyToken', e.target.value)}
                placeholder="your_verify_token"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">للتحقق من طلبات Webhook الواردة</p>
            </div>
          </CardContent>
        </Card>

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
                  <MessageCircle className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="testPhone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+966501234567"
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
                      <MessageCircle className="ms-2 h-4 w-4" />
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
    </div>
  );
}
