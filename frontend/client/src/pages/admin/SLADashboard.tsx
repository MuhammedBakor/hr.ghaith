/**
 * SLA Dashboard - لوحة مراقبة اتفاقيات مستوى الخدمة
 * 
 * تعرض:
 * - الكيانات المتجاوزة للـ SLA
 * - التصعيدات النشطة
 * - إحصائيات الأتمتة
 * - المهام المعلقة والفاشلة
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle2, XCircle, ArrowUpCircle, RefreshCw, Timer, Briefcase, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// أنواع البيانات
interface SLATracking {
  id: string;
  entityType: string;
  entityId: string;
  startedAt: string;
  dueAt: string;
  warningAt: string;
  currentStatus: 'on_track' | 'warning' | 'breached' | 'escalated';
  currentLevel: number;
  escalatedTo: number[];
  companyId: string;
  branchId?: string;
  completedAt?: string;
}

interface AutomationStats {
  slaDefinitions: number;
  activeSLATrackings: number;
  breachedSLAs: number;
  escalationRules: number;
  businessRules: number;
  pendingJobs: number;
  failedJobs: number;
  pendingTimers: number;
}

interface AutomationJob {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduledAt: string;
  error?: string;
  retryCount: number;
}

export default function SLADashboard() {
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // جلب البيانات من الـ API
  const { data: stats, refetch: refetchStats, isLoading: loadingStats } = useQuery({
    queryKey: ['automation', 'statistics'],
    queryFn: () => api.get('/automation/statistics').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: breachedSLAs, refetch: refetchBreached, isLoading: loadingBreached } = useQuery({
    queryKey: ['automation', 'breached-slas'],
    queryFn: () => api.get('/automation/breached-slas').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: escalations, refetch: refetchEscalations, isLoading: loadingEscalations } = useQuery({
    queryKey: ['automation', 'active-escalations'],
    queryFn: () => api.get('/automation/active-escalations').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: pendingJobs, refetch: refetchJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['automation', 'pending-jobs'],
    queryFn: () => api.get('/automation/pending-jobs').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: failedJobs, refetch: refetchFailed } = useQuery({
    queryKey: ['automation', 'failed-jobs'],
    queryFn: () => api.get('/automation/failed-jobs').then(r => r.data),
    refetchInterval: 60000,
  });

  // تحديث جميع البيانات
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchBreached(),
      refetchEscalations(),
      refetchJobs(),
      refetchFailed(),
    ]);
    setIsRefreshing(false);
  };

  // حساب الإحصائيات
  const statsData = stats || {
    slaDefinitions: 0,
    activeSLATrackings: 0,
    breachedSLAs: 0,
    escalationRules: 0,
    businessRules: 0,
    pendingJobs: 0,
    failedJobs: 0,
    pendingTimers: 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-500">في المسار</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">تحذير</Badge>;
      case 'breached':
        return <Badge className="bg-red-500">متجاوز</Badge>;
      case 'escalated':
        return <Badge className="bg-purple-500">مصعّد</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-600">حرج</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">عالي</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500">عادي</Badge>;
      case 'low':
        return <Badge className="bg-gray-500">منخفض</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateTime(dateStr);
  };

  const getTimeRemaining = (dueAt: string) => {
    const now = new Date();
    const due = new Date(dueAt);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) {
      const overdue = Math.abs(diff);
      const hours = Math.floor(overdue / (1000 * 60 * 60));
      const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
      return <span className="text-red-600 font-bold">متأخر بـ {hours} ساعة و {minutes} دقيقة</span>;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 2) {
      return <span className="text-yellow-600 font-bold">متبقي {hours} ساعة و {minutes} دقيقة</span>;
    }
    
    return <span className="text-green-600">متبقي {hours} ساعة و {minutes} دقيقة</span>;
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة مراقبة SLA</h1>
          <p className="text-gray-500 mt-1">مراقبة اتفاقيات مستوى الخدمة والتصعيدات</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-r-4 border-r-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تتبعات SLA النشطة</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.activeSLATrackings}</div>
            <p className="text-xs text-muted-foreground">
              من أصل {statsData.slaDefinitions} تعريف
            </p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLAs متجاوزة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statsData.breachedSLAs}</div>
            <p className="text-xs text-muted-foreground">
              تتطلب اهتمام فوري
            </p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مهام معلقة</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.failedJobs} فاشلة
            </p>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">قواعد نشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.businessRules}</div>
            <p className="text-xs text-muted-foreground">
              {statsData.escalationRules} قاعدة تصعيد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="breached" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            متجاوزة ({breachedSLAs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="escalations" className="flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            تصعيدات ({escalations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            مهام ({pendingJobs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Breaches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  أحدث التجاوزات
                </CardTitle>
                <CardDescription>آخر 5 تجاوزات لـ SLA</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBreached ? (
                  <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
                ) : breachedSLAs && breachedSLAs.length > 0 ? (
                  <div className="space-y-3">
                    {breachedSLAs.slice(0, 5).map((sla: any) => (
                      <div key={sla.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium">{sla.entityType}</p>
                          <p className="text-sm text-gray-500">#{sla.entityId}</p>
                        </div>
                        <div className="text-start">
                          {getStatusBadge(sla.currentStatus)}
                          <p className="text-xs text-gray-500 mt-1">
                            المستوى: {sla.currentLevel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد تجاوزات حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Escalations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-purple-500" />
                  التصعيدات النشطة
                </CardTitle>
                <CardDescription>الكيانات المصعّدة حالياً</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEscalations ? (
                  <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
                ) : escalations && escalations.length > 0 ? (
                  <div className="space-y-3">
                    {escalations.slice(0, 5).map((esc: any) => (
                      <div key={esc.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <p className="font-medium">{esc.entityType}</p>
                          <p className="text-sm text-gray-500">#{esc.entityId}</p>
                        </div>
                        <div className="text-start">
                          <Badge className="bg-purple-500">المستوى {esc.currentLevel}</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            مصعّد إلى: {esc.escalatedTo.length} شخص
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد تصعيدات نشطة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                صحة النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">تعريفات SLA</p>
                  <p className="text-2xl font-bold">{statsData.slaDefinitions}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">قواعد التصعيد</p>
                  <p className="text-2xl font-bold">{statsData.escalationRules}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">قواعد العمل</p>
                  <p className="text-2xl font-bold">{statsData.businessRules}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">مؤقتات معلقة</p>
                  <p className="text-2xl font-bold">{statsData.pendingTimers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breached SLAs Tab */}
        <TabsContent value="breached">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                SLAs المتجاوزة
              </CardTitle>
              <CardDescription>جميع الكيانات التي تجاوزت الوقت المحدد</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBreached ? (
                <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
              ) : breachedSLAs && breachedSLAs.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <table className="min-w-[600px] w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-end p-3">النوع</th>
                        <th className="text-end p-3">المعرف</th>
                        <th className="text-end p-3">بدأ في</th>
                        <th className="text-end p-3">موعد الاستحقاق</th>
                        <th className="text-end p-3">الحالة</th>
                        <th className="text-end p-3">المستوى</th>
                        <th className="text-end p-3">التأخير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breachedSLAs.map((sla: any) => (
                        <tr key={sla.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{sla.entityType}</td>
                          <td className="p-3">#{sla.entityId}</td>
                          <td className="p-3 text-sm">{formatDate(sla.startedAt)}</td>
                          <td className="p-3 text-sm">{formatDate(sla.dueAt)}</td>
                          <td className="p-3">{getStatusBadge(sla.currentStatus)}</td>
                          <td className="p-3">
                            <Badge variant="outline">المستوى {sla.currentLevel}</Badge>
                          </td>
                          <td className="p-3">{getTimeRemaining(sla.dueAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">ممتاز! لا توجد تجاوزات</p>
                  <p className="text-sm">جميع الكيانات ضمن الوقت المحدد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalations Tab */}
        <TabsContent value="escalations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-purple-500" />
                التصعيدات النشطة
              </CardTitle>
              <CardDescription>الكيانات التي تم تصعيدها للمستويات الأعلى</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEscalations ? (
                <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
              ) : escalations && escalations.length > 0 ? (
                <div className="space-y-4">
                  {escalations.map((esc: any) => (
                    <div key={esc.id} className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{esc.entityType}</h3>
                          <p className="text-gray-600">#{esc.entityId}</p>
                        </div>
                        <Badge className="bg-purple-600 text-lg px-4 py-1">
                          المستوى {esc.currentLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">بدأ في</p>
                          <p className="font-medium">{formatDate(esc.startedAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">موعد الاستحقاق</p>
                          <p className="font-medium">{formatDate(esc.dueAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">مصعّد إلى</p>
                          <p className="font-medium">{esc.escalatedTo.length} شخص</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        {getTimeRemaining(esc.dueAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">لا توجد تصعيدات نشطة</p>
                  <p className="text-sm">جميع الكيانات تعمل بشكل طبيعي</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  مهام معلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
                ) : pendingJobs && pendingJobs.length > 0 ? (
                  <div className="space-y-3">
                    {pendingJobs.map((job: any) => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{job.type}</p>
                          {getPriorityBadge(job.priority)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          مجدول: {formatDate(job.scheduledAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد مهام معلقة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Failed Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  مهام فاشلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {failedJobs && failedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {failedJobs.map((job: any) => (
                      <div key={job.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{job.type}</p>
                          <Badge variant="destructive">فشل</Badge>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          {job.error || 'خطأ غير معروف'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          محاولات: {job.retryCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد مهام فاشلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}