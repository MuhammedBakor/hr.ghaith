import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plug, CheckCircle2, Link as LinkIcon, AlertCircle, Loader2, RefreshCw, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function IntegrationsHub() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    integrationKey: '',
    name: '',
    nameAr: '',
    integrationType: 'communication' as const,
    apiEndpoint: '',
    apiKey: '',
  });

  // جلب التكاملات من الـ API
  const { data: integrations, isLoading, refetch } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations').then(r => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['integrations-stats'],
    queryFn: () => api.get('/integrations/stats').then(r => r.data),
  });

  // mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/integrations', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة التكامل بنجاح');
      setShowAddDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إضافة التكامل: ${error.message}`);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: any) => api.post('/integrations/toggle-status', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث حالة التكامل');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث الحالة: ${error.message}`);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: any) => api.post('/integrations/test-connection', data).then(r => r.data),
    onSuccess: (result: any) => {
      if (result.success) {
        toast.success('الاتصال ناجح');
      } else {
        toast.error(`فشل الاتصال: ${result.message}`);
      }
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في اختبار الاتصال: ${error.message}`);
    },
  });

  const handleAddIntegration = () => {
    if (!newIntegration.integrationKey || !newIntegration.name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createMutation.mutate(newIntegration);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">قيد الانتظار</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      communication: 'تواصل',
      tracking: 'تتبع',
      payment: 'دفع',
      erp: 'ERP',
      hr: 'موارد بشرية',
      ai: 'ذكاء اصطناعي',
      storage: 'تخزين',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مركز التكاملات</h2>
          <p className="text-gray-500">إدارة جميع التكاملات الخارجية</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ms-2" />
          إضافة تكامل
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Plug className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي التكاملات</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
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
              <p className="text-2xl font-bold">{stats?.active || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">غير نشطة</p>
              <p className="text-2xl font-bold">{stats?.inactive || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">بها أخطاء</p>
              <p className="text-2xl font-bold">{stats?.error || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة التكاملات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            التكاملات المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{integration.nameAr || integration.name}</p>
                    <p className="text-sm text-gray-500">{getTypeLabel(integration.integrationType)}</p>
                    {integration.lastConnectedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        آخر اتصال: {formatDateTime(integration.lastConnectedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration.status)}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => testConnectionMutation.mutate({ id: integration.id })}
                      disabled={testConnectionMutation.isPending}
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={integration.status === 'active' ? 'destructive' : 'default'}
                      onClick={() => toggleStatusMutation.mutate({
                        id: integration.id,
                        status: integration.status === 'active' ? 'inactive' : 'active',
                      })}
                    >
                      {integration.status === 'active' ? 'تعطيل' : 'تفعيل'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تكاملات مضافة</p>
              <p className="text-sm">اضغط على "إضافة تكامل" لإضافة تكامل جديد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إضافة تكامل */}
      {showAddDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة تكامل جديد</h3>
            <p className="text-sm text-gray-500">
              أدخل بيانات التكامل الخارجي
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="integrationKey">مفتاح التكامل *</Label>
              <Input
                id="integrationKey"
                placeholder="مثال: whatsapp_business"
                value={newIntegration.integrationKey}
                onChange={(e) => setNewIntegration({ ...newIntegration, integrationKey: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم (إنجليزي) *</Label>
              <Input
                id="name"
                placeholder="مثال: WhatsApp Business"
                value={newIntegration.name}
                onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameAr">الاسم (عربي)</Label>
              <Input
                id="nameAr"
                placeholder="مثال: واتساب للأعمال"
                value={newIntegration.nameAr}
                onChange={(e) => setNewIntegration({ ...newIntegration, nameAr: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="integrationType">نوع التكامل</Label>
              <Select
                value={newIntegration.integrationType}
                onValueChange={(value: any) => setNewIntegration({ ...newIntegration, integrationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communication">تواصل</SelectItem>
                  <SelectItem value="tracking">تتبع</SelectItem>
                  <SelectItem value="payment">دفع</SelectItem>
                  <SelectItem value="erp">ERP</SelectItem>
                  <SelectItem value="hr">موارد بشرية</SelectItem>
                  <SelectItem value="ai">ذكاء اصطناعي</SelectItem>
                  <SelectItem value="storage">تخزين</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiEndpoint">رابط الـ API</Label>
              <Input
                id="apiEndpoint"
                placeholder="https://api.example.com"
                value={newIntegration.apiEndpoint}
                onChange={(e) => setNewIntegration({ ...newIntegration, apiEndpoint: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">مفتاح الـ API</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="أدخل مفتاح الـ API"
                value={newIntegration.apiKey}
                onChange={(e) => setNewIntegration({ ...newIntegration, apiKey: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddIntegration} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              إضافة
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
