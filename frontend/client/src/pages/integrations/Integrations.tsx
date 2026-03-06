import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plug, CheckCircle2, Settings, Loader2, TestTube, Save } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface Integration {
  id: number;
  name: string;
  type: string;
  status: string;
  description: string;
  config?: Record<string, string>;
}

export default function Integrations() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({ mutationFn: (data: any) => api.post('/integrations', data).then(r => r.data), onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  // جلب التكاملات من API
  const { data: integrationsData, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations').then(r => r.data),
  });

  // mutations
  const toggleMutation = useMutation({
    mutationFn: (data: any) => api.post('/integrations/toggle-status', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث حالة التكامل');
      refetch();
    },
    onError: () => toast.error('فشل تحديث حالة التكامل')
  });

  const testMutation = useMutation({
    mutationFn: (data: any) => api.post('/integrations/test-connection', data).then(r => r.data),
    onSuccess: (data: { success: boolean; message?: string }) => {
      if (data.success) {
        toast.success('اختبار الاتصال ناجح');
      } else {
        toast.error(data.message || 'فشل اختبار الاتصال');
      }
    },
    onError: () => toast.error('فشل اختبار الاتصال')
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/integrations', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات');
      setShowSettingsDialog(false);
      refetch();
    },
    onError: () => toast.error('فشل حفظ الإعدادات')
  });

  // بيانات افتراضية إذا لم تتوفر من API
  const defaultIntegrations: Integration[] = [
    { id: 1, name: 'WhatsApp', type: 'whatsapp', status: 'inactive', description: 'إرسال إشعارات عبر واتساب', config: { phoneNumberId: '', accessToken: '' } },
    { id: 2, name: 'SMS Gateway', type: 'sms', status: 'inactive', description: 'إرسال رسائل نصية', config: { apiKey: '', senderId: '' } },
    { id: 3, name: 'Email SMTP', type: 'email', status: 'inactive', description: 'إرسال بريد إلكتروني', config: { host: '', port: '', username: '', password: '' } },
    { id: 4, name: 'GPS Tracker', type: 'gps', status: 'inactive', description: 'تتبع المركبات', config: { apiUrl: '', apiKey: '' } },
  ];

  const integrations = integrationsData?.length ? integrationsData : defaultIntegrations;

  const handleOpenSettings = (integration: any) => {
    const mappedIntegration: Integration = {
      id: integration.id,
      name: integration.name || integration.nameAr || 'تكامل',
      type: integration.type || integration.integrationType || 'other',
      status: integration.status || (integration.isActive ? 'active' : 'inactive'),
      description: integration.description || integration.descriptionAr || '',
      config: typeof integration.config === 'string' ? (() => { try { return JSON.parse(integration.config || '{}'); } catch { return null; } })() : (integration.config || {})
    };
    setSelectedIntegration(mappedIntegration);
    setConfigValues(mappedIntegration.config || {});
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    if (!selectedIntegration) return;
    updateMutation.mutate({
      id: selectedIntegration.id,
      config: JSON.stringify(configValues)
    });
  };

  const handleToggle = (id: number, currentStatus: string) => {
    toggleMutation.mutate({
      id,
      status: currentStatus !== 'active' ? 'active' : 'inactive'
    });
  };

  const handleTest = (id: number) => {
    testMutation.mutate({ id });
  };

  const getConfigFields = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return [
          { key: 'phoneNumberId', label: 'معرف رقم الهاتف', placeholder: 'Phone Number ID' },
          { key: 'accessToken', label: 'رمز الوصول', placeholder: 'Access Token', type: 'password' }
        ];
      case 'sms':
        return [
          { key: 'apiKey', label: 'مفتاح API', placeholder: 'API Key', type: 'password' },
          { key: 'senderId', label: 'معرف المرسل', placeholder: 'Sender ID' }
        ];
      case 'email':
        return [
          { key: 'host', label: 'خادم SMTP', placeholder: 'smtp.example.com' },
          { key: 'port', label: 'المنفذ', placeholder: '587' },
          { key: 'username', label: 'اسم المستخدم', placeholder: 'user@example.com' },
          { key: 'password', label: 'كلمة المرور', placeholder: '********', type: 'password' }
        ];
      case 'gps':
        return [
          { key: 'apiUrl', label: 'رابط API', placeholder: 'https://api.tracker.com' },
          { key: 'apiKey', label: 'مفتاح API', placeholder: 'API Key', type: 'password' }
        ];
      default:
        return [];
    }
  };

  if (isError) return (
    <div className="p-8 text-center">
        {/* إضافة جديد */}
        <div className="mb-4 flex justify-between items-center">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showCreateForm ? 'إلغاء' : '+ إضافة جديد'}
          </button>
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="الاسم" value={createData.name || ''} onChange={e => setCreateData({...createData, name: e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input placeholder="الوصف" value={createData.description || ''} onChange={e => setCreateData({...createData, description: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => createMutation.mutate(createData)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ</button>
          </div>
        )}
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {


  return (
      <div className="flex items-center justify-center h-64">
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
        <h2 className="text-2xl font-bold tracking-tight">التكاملات</h2>
        <p className="text-gray-500">إدارة التكاملات مع الخدمات الخارجية</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Plug className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">التكاملات المتاحة</p>
              <p className="text-2xl font-bold">{integrations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نشطة</p>
              <p className="text-2xl font-bold">{integrations.filter(i => i.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            قائمة التكاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

              {!integrations?.length && <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>}
            {integrations?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Plug className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={integration.status === 'active'}
                    onCheckedChange={() => handleToggle(integration.id, integration.status)}
                    disabled={toggleMutation.isPending}
                  />
                  <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                    {integration.status === 'active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleTest(integration.id)}
                    disabled={testMutation.isPending}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleOpenSettings(integration)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* نافذة إعدادات التكامل */}
      {showSettingsDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Settings className="h-5 w-5" />
              إعدادات {selectedIntegration?.name}
            </h3>
          </div>
          <div className="space-y-4 py-4">
            {selectedIntegration && getConfigFields(selectedIntegration.type).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ''}
                  onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveSettings} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Save className="h-4 w-4 ms-2" />
              )}
              حفظ
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
