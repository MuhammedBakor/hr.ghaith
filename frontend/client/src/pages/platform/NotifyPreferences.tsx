import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Volume2, 
  Moon,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'requests',
    label: 'الطلبات',
    description: 'إشعارات عند إنشاء أو تحديث الطلبات',
    email: true,
    push: true,
    sms: false,
    inApp: true,
  },
  {
    id: 'approvals',
    label: 'الموافقات',
    description: 'إشعارات عند الحاجة للموافقة على طلب',
    email: true,
    push: true,
    sms: true,
    inApp: true,
  },
  {
    id: 'hr',
    label: 'الموارد البشرية',
    description: 'إشعارات الإجازات والحضور والانصراف',
    email: true,
    push: false,
    sms: false,
    inApp: true,
  },
  {
    id: 'finance',
    label: 'المالية',
    description: 'إشعارات الفواتير والمصروفات',
    email: true,
    push: true,
    sms: false,
    inApp: true,
  },
  {
    id: 'fleet',
    label: 'الأسطول',
    description: 'إشعارات المركبات والصيانة',
    email: false,
    push: true,
    sms: false,
    inApp: true,
  },
  {
    id: 'system',
    label: 'النظام',
    description: 'إشعارات التحديثات والصيانة',
    email: true,
    push: false,
    sms: false,
    inApp: true,
  },
];

export default function NotifyPreferences() {
  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'channel': '', 'enabled': '', 'frequency': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
        if (!formData.channel?.toString().trim()) errors.channel = 'مطلوب';
    if (!formData.enabled?.toString().trim()) errors.enabled = 'مطلوب';
    if (!formData.frequency?.toString().trim()) errors.frequency = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/platform/notify-preferences', data).then(r => r.data),
    onSuccess: () => {
      setFormData({ 'channel': '', 'enabled': '', 'frequency': '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      setIsSubmitting(false);
      alert('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/platform/notify-preferences/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  
  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);

  // Global settings
  const [globalSettings, setGlobalSettings] = useState({
    soundEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    emailDigest: 'instant',
  });

  // جلب التفضيلات من API
  const { data: savedPreferences, isLoading, refetch } = useQuery({ queryKey: ['notify-preferences'], queryFn: () => api.get('/platform/notify-preferences').then(r => r.data),
    enabled: isAuthenticated,
  });

  // mutation لحفظ جميع التفضيلات
  const saveAllMutation = useMutation({
    mutationFn: (data: any) => api.put('/platform/notify-preferences/all', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حفظ التفضيلات بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في حفظ التفضيلات: ' + error.message);
    },
  });

  // mutation لإعادة التعيين
  const resetMutation = useMutation({
    mutationFn: () => api.post('/platform/notify-preferences/reset').then(r => r.data),
    onSuccess: () => {
      toast.success('تم إعادة التفضيلات إلى الإعدادات الافتراضية');
      setPreferences(defaultPreferences);
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في إعادة التعيين: ' + error.message);
    },
  });

  // تحديث التفضيلات من البيانات المحفوظة
  useEffect(() => {
    if (savedPreferences && savedPreferences.length > 0) {
      setPreferences(prev => prev.map(pref => {
        const saved = savedPreferences.find(s => s.notificationType === pref.id);
        if (saved) {
          return {
            ...pref,
            email: saved.emailEnabled,
            push: saved.pushEnabled,
            sms: saved.smsEnabled,
            inApp: saved.inAppEnabled,
          };
        }
        return pref;
      }));
    }
  }, [savedPreferences]);

  const togglePreference = (id: string, channel: 'email' | 'push' | 'sms' | 'inApp') => {
    setPreferences(prev => prev.map(pref => {
      if (pref.id === id) {
        return { ...pref, [channel]: !pref[channel] };
      }
      return pref;
    }));
  };

  const handleSave = async () => {
    const prefsToSave = preferences.map(pref => ({
      notificationType: pref.id,
      emailEnabled: pref.email,
      smsEnabled: pref.sms,
      pushEnabled: pref.push,
      inAppEnabled: pref.inApp,
    }));
    
    saveAllMutation.mutate({ preferences: prefsToSave });
  };

  const handleReset = () => {
    resetMutation.mutate({});
  };

  if (isError) return (
    <div className="p-8 text-center">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">القناة</label>
            <input value={formData.channel || ""} onChange={(e) => handleFieldChange("channel", e.target.value)} placeholder="القناة" className={`w-full px-3 py-2 border rounded-lg ${formErrors.channel ? "border-red-500" : ""}`} />
            {formErrors.channel && <span className="text-xs text-red-500">{formErrors.channel}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">مفعّل</label>
            <input value={formData.enabled || ""} onChange={(e) => handleFieldChange("enabled", e.target.value)} placeholder="مفعّل" className={`w-full px-3 py-2 border rounded-lg ${formErrors.enabled ? "border-red-500" : ""}`} />
            {formErrors.enabled && <span className="text-xs text-red-500">{formErrors.enabled}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التكرار</label>
            <input value={formData.frequency || ""} onChange={(e) => handleFieldChange("frequency", e.target.value)} placeholder="التكرار" className={`w-full px-3 py-2 border rounded-lg ${formErrors.frequency ? "border-red-500" : ""}`} />
            {formErrors.frequency && <span className="text-xs text-red-500">{formErrors.frequency}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {


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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">تفضيلات الإشعارات</h2>
          <p className="text-gray-500">تخصيص كيفية تلقي الإشعارات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={resetMutation.isPending}
            className="gap-2"
          >
            {resetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            إعادة تعيين
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveAllMutation.isPending} 
            className="gap-2"
          >
            {saveAllMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ التفضيلات
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإعدادات العامة
          </CardTitle>
          <CardDescription>إعدادات تنطبق على جميع الإشعارات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="font-medium">أصوات الإشعارات</Label>
                <p className="text-sm text-gray-500">تشغيل صوت عند وصول إشعار جديد</p>
              </div>
            </div>
            <Switch
              checked={globalSettings.soundEnabled}
              onCheckedChange={(checked) => setGlobalSettings(prev => ({ ...prev, soundEnabled: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="font-medium">ساعات الهدوء</Label>
                <p className="text-sm text-gray-500">
                  إيقاف الإشعارات من {globalSettings.quietHoursStart} إلى {globalSettings.quietHoursEnd}
                </p>
              </div>
            </div>
            <Switch
              checked={globalSettings.quietHoursEnabled}
              onCheckedChange={(checked) => setGlobalSettings(prev => ({ ...prev, quietHoursEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            قنوات الإشعارات
          </CardTitle>
          <CardDescription>اختر كيف تريد تلقي كل نوع من الإشعارات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-end py-3 px-4 font-medium">النوع</th>
                  <th className="text-center py-3 px-4 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">بريد</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-xs">دفع</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">SMS</span>
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Bell className="h-4 w-4" />
                      <span className="text-xs">داخلي</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref) => (
                  <tr key={pref.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{pref.label}</p>
                        <p className="text-sm text-gray-500">{pref.description}</p>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Switch
                        checked={pref.email}
                        onCheckedChange={() => togglePreference(pref.id, 'email')}
                      />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Switch
                        checked={pref.push}
                        onCheckedChange={() => togglePreference(pref.id, 'push')}
                      />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Switch
                        checked={pref.sms}
                        onCheckedChange={() => togglePreference(pref.id, 'sms')}
                      />
                    </td>
                    <td className="text-center py-4 px-4">
                      <Switch
                        checked={pref.inApp}
                        onCheckedChange={() => togglePreference(pref.id, 'inApp')}
                      />
                    </td>
                  
                <div className="flex gap-2 mt-2"> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: pref.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">الإشعارات مفعلة</p>
              <p className="text-sm text-green-600">
                ستتلقى الإشعارات حسب التفضيلات المحددة أعلاه
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
