import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle2, Clock, RefreshCw, Loader2, Package, Shield, Zap, History, ArrowUpCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SystemUpdate {
  id: number;
  version: string;
  title: string;
  description: string;
  releaseDate: Date;
  type: 'major' | 'minor' | 'patch' | 'security';
  status: 'available' | 'downloading' | 'ready' | 'installed';
  size: string;
  changelog: string[];
}

export default function UpgradeManager() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/platform/upgrades', data).then(r => r.data),
    onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [localUpdates, setLocalUpdates] = useState<SystemUpdate[]>([]);

  const { data: healthData, isLoading: healthLoading, isError, error } = useQuery({ queryKey: ['infra-health'], queryFn: () => api.get('/platform/upgrades/health').then(r => r.data) });
  const { data: updatesData, isLoading: updatesLoading, refetch } = useQuery({ queryKey: ['system-upgrades'], queryFn: () => api.get('/platform/upgrades').then(r => r.data) });
  const { data: historyData } = useQuery({ queryKey: ['system-upgrades-history'], queryFn: () => api.get('/platform/upgrades/history').then(r => r.data) });

  const checkUpdatesMutation = useMutation({
    mutationFn: (data: any) => api.post('/platform/upgrades/check').then(r => r.data),
    onSuccess: (data: any) => {
      if (data.hasUpdates) {
        toast.success(`يوجد ${data.count} تحديث متاح`);
      } else {
        toast.success('النظام محدث إلى آخر إصدار');
      }
      refetch();
    },
    onError: () => {
      toast.error('فشل في التحقق من التحديثات');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (data: any) => api.post(`/platform/upgrades/${data.updateId}/download`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحميل التحديث بنجاح');
      setDownloadingId(null);
      setDownloadProgress(0);
      // تحديث حالة التحديث محلياً
      setLocalUpdates(prev => {
        const existing = prev.find(u => u.id === downloadingId);
        if (existing) {
          return prev.map(u => u.id === downloadingId ? { ...u, status: 'ready' as const } : u);
        }
        return prev;
      });
      refetch();
    },
    onError: () => {
      toast.error('فشل في تحميل التحديث');
      setDownloadingId(null);
      setDownloadProgress(0);
    },
  });

  const installMutation = useMutation({
    mutationFn: (data: any) => api.post(`/platform/upgrades/${data.updateId}/install`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تثبيت التحديث بنجاح');
      refetch();
    },
    onError: () => {
      toast.error('فشل في تثبيت التحديث');
    },
  });

  // Current system version
  const currentVersion = healthData?.version || '2.5.0';

  // دمج البيانات من API مع التحديثات المحلية
  const updates: SystemUpdate[] = (updatesData || []).map(u => {
    const localUpdate = localUpdates.find(lu => lu.id === u.id);
    return localUpdate ? { ...u, status: localUpdate.status } : u;
  });

  const handleCheckUpdates = () => {
    checkUpdatesMutation.mutate({});
  };

  const handleDownload = async (updateId: number) => {
    setDownloadingId(updateId);
    setDownloadProgress(0);
    
    // محاكاة تقدم التحميل
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setDownloadProgress(i);
    }

    // تحديث الحالة محلياً قبل استدعاء API
    setLocalUpdates(prev => {
      const existing = prev.find(u => u.id === updateId);
      if (existing) {
        return prev.map(u => u.id === updateId ? { ...u, status: 'ready' as const } : u);
      }
      const update = updates.find(u => u.id === updateId);
      if (update) {
        return [...prev, { ...update, status: 'ready' as const }];
      }
      return prev;
    });

    downloadMutation.mutate({ updateId });
  };

  const handleInstall = (updateId: number) => {
    toast.info('جاري تثبيت التحديث...');
    installMutation.mutate({ updateId });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'major':
        return <Badge className="bg-purple-100 text-purple-800">رئيسي</Badge>;
      case 'minor':
        return <Badge className="bg-blue-100 text-blue-800">ثانوي</Badge>;
      case 'patch':
        return <Badge className="bg-gray-100 text-gray-800">تصحيح</Badge>;
      case 'security':
        return <Badge className="bg-red-100 text-red-800">أمني</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">متاح</Badge>;
      case 'downloading':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">جاري التحميل</Badge>;
      case 'ready':
        return <Badge variant="outline" className="text-green-600 border-green-600">جاهز للتثبيت</Badge>;
      case 'installed':
        return <Badge className="bg-green-100 text-green-800">مثبت</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = healthLoading || updatesLoading;

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

  const availableUpdates = updates.filter(u => u.status !== 'installed');
  const installedUpdates = updates.filter(u => u.status === 'installed');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الترقيات</h2>
          <p className="text-gray-500">إدارة تحديثات وترقيات النظام</p>
        </div>
        <Button 
          onClick={handleCheckUpdates} 
          disabled={checkUpdatesMutation.isPending}
          className="gap-2"
        >
          {checkUpdatesMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          التحقق من التحديثات
        </Button>
      </div>

      {/* Current Version Card */}
      <Card className="border-2 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">الإصدار الحالي: {currentVersion}</h3>
                <p className="text-gray-500">النظام يعمل بأحدث إصدار مستقر</p>
              </div>
            </div>
            <div className="text-start">
              <p className="text-sm text-gray-500">آخر تحديث</p>
              <p className="font-medium">{new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">التحديثات المتاحة</p>
              <p className="text-2xl font-bold">{availableUpdates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المثبتة</p>
              <p className="text-2xl font-bold">{installedUpdates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">حالة الأمان</p>
              <p className="text-2xl font-bold">محمي</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">التحديث التلقائي</p>
              <p className="text-2xl font-bold">مفعل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Updates */}
      {availableUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />
              التحديثات المتاحة
            </CardTitle>
            <CardDescription>تحديثات جاهزة للتحميل والتثبيت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableUpdates.map((update) => (
              <div key={update.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">v{update.version}</h4>
                      {getTypeBadge(update.type)}
                      {getStatusBadge(update.status)}
                    </div>
                    <p className="font-medium">{update.title}</p>
                    <p className="text-sm text-gray-500">{update.description}</p>
                  </div>
                  <div className="text-start text-sm text-gray-500">
                    <p>{formatDate(update.releaseDate)}</p>
                    <p>{update.size}</p>
                  </div>
                </div>

                {downloadingId === update.id && (
                  <div className="space-y-2">
                    <Progress value={downloadProgress} className="h-2" />
                    <p className="text-sm text-gray-500 text-center">{downloadProgress}%</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {update.status === 'available' && (
                    <Button 
                      onClick={() => handleDownload(update.id)}
                      disabled={downloadingId !== null || downloadMutation.isPending}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      تحميل
                    </Button>
                  )}
                  {update.status === 'ready' && (
                    <Button 
                      onClick={() => handleInstall(update.id)}
                      disabled={installMutation.isPending}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {installMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                      تثبيت الآن
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2">
                    <Info className="h-4 w-4" />
                    التفاصيل
                  </Button>
                </div>

                {update.changelog.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">سجل التغييرات:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {update?.changelog?.map((item, index) => (
                        <li key={item.id ?? `li-${index}`} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Update History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل التحديثات
          </CardTitle>
          <CardDescription>التحديثات التي تم تثبيتها مسبقاً</CardDescription>
        </CardHeader>
        <CardContent>
          {historyData && historyData.length > 0 ? (
            <div className="space-y-3">
              {historyData.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">v{item.version}</p>
                      <p className="text-sm text-gray-500">تم التثبيت بواسطة {item.installedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatDate(item.installedAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : installedUpdates.length > 0 ? (
            <div className="space-y-3">
              {installedUpdates.map((update) => (
                <div key={update.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">v{update.version}</p>
                      <p className="text-sm text-gray-500">{update.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatDate(update.releaseDate)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا يوجد سجل تحديثات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
