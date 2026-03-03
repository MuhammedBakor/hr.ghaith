import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mail, Server, Lock, User, AtSign, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailSettings() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading, refetch } = trpc.controlKernel.smtp.get.useQuery();
  const updateMutation = trpc.controlKernel.smtp.update.useMutation({
    onSuccess: () => {
      toast.success('تم حفظ إعدادات البريد بنجاح');
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    },
  });
  const testMutation = trpc.controlKernel.smtp.test.useMutation({
    onSuccess: () => {
      toast.success('تم إرسال البريد الاختباري بنجاح! تحقق من صندوق الوارد.');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إرسال البريد: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        host: settings.host || '',
        port: settings.port || 587,
        secure: settings.secure || false,
        username: settings.username || '',
        password: '', // لا نعرض كلمة المرور المحفوظة
        fromEmail: settings.fromEmail || '',
        fromName: settings.fromName || '',
      }, []);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!formData.host || !formData.username || !formData.fromEmail || !formData.fromName) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // إذا لم يتم إدخال كلمة مرور جديدة، نستخدم الكلمة المحفوظة
    const dataToSave = {
      ...formData,
      password: formData.password || (settings?.password === '********' ? '' : settings?.password) || '',
    };
    
    if (!dataToSave.password && !settings) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }
    
    updateMutation.mutate(dataToSave as any);
  };

  const handleTest = () => {
    if (!testEmail) {
      toast.error('يرجى إدخال بريد إلكتروني للاختبار');
      return;
    }
    testMutation.mutate({ testEmail });
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
        <h2 className="text-2xl font-bold">إعدادات البريد الإلكتروني</h2>
        <p className="text-gray-500">تكوين خادم SMTP لإرسال البريد الإلكتروني من النظام</p>
      </div>

      {/* حالة الاتصال */}
      {settings && (
        <Card className={settings.lastTestResult === 'success' ? 'border-green-200 bg-green-50' : settings.lastTestResult === 'failed' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {settings.lastTestResult === 'success' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">الاتصال يعمل بشكل صحيح</p>
                    <p className="text-sm text-green-600">آخر اختبار: {settings.lastTestedAt ? formatDateTime(settings.lastTestedAt) : 'غير محدد'}</p>
                  </div>
                </>
              ) : settings.lastTestResult === 'failed' ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700">فشل الاتصال</p>
                    <p className="text-sm text-red-600">{settings.lastTestError || 'خطأ غير معروف'}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700">لم يتم اختبار الاتصال</p>
                    <p className="text-sm text-amber-600">قم بإرسال بريد اختباري للتحقق من الإعدادات</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* إعدادات الخادم */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              إعدادات الخادم
            </CardTitle>
            <CardDescription>معلومات خادم SMTP للإرسال</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host">عنوان الخادم (Host) *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="send.smtp.com"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">المنفذ (Port) *</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value) || 587)}
                placeholder="587"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">المنافذ الشائعة: 587 (STARTTLS)، 465 (SSL)، 25 (غير مشفر)</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>اتصال آمن (SSL/TLS)</Label>
                <p className="text-xs text-gray-500">استخدم SSL للمنفذ 465</p>
              </div>
              <Switch
                checked={formData.secure}
                onCheckedChange={(checked) => handleChange('secure', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* بيانات المصادقة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              بيانات المصادقة
            </CardTitle>
            <CardDescription>معلومات تسجيل الدخول لخادم SMTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم *</Label>
              <div className="relative">
                <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="user@example.com"
                  className="pe-10"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور {settings ? '(اتركها فارغة للإبقاء على الحالية)' : '*'}</Label>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={settings ? '••••••••' : 'أدخل كلمة المرور'}
                  className="pe-10"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات المرسل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AtSign className="h-5 w-5" />
              معلومات المرسل
            </CardTitle>
            <CardDescription>البيانات التي ستظهر في البريد المرسل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">البريد الإلكتروني للمرسل *</Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => handleChange('fromEmail', e.target.value)}
                  placeholder="noreply@example.com"
                  className="pe-10"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromName">اسم المرسل *</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => handleChange('fromName', e.target.value)}
                placeholder="نظام غيث"
              />
            </div>
          </CardContent>
        </Card>

        {/* اختبار الإرسال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اختبار الإرسال
            </CardTitle>
            <CardDescription>إرسال بريد اختباري للتحقق من الإعدادات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">البريد الإلكتروني للاختبار</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                dir="ltr"
              />
            </div>
            
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !testEmail}
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
                  <Send className="ms-2 h-4 w-4" />
                  إرسال بريد اختباري
                </>
              )}
            </Button>
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
