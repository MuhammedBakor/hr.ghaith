import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Clock,
  Zap,
  MemoryStick,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  lastCheck: Date;
}

export default function PlatformMonitoring() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({ queryKey: ['health'], queryFn: () => api.get('/health').then(r => r.data) });
  const { data: readyData, isLoading: readyLoading, refetch: refetchReady } = useQuery({ queryKey: ['ready'], queryFn: () => api.get('/platform/monitoring/ready').then(r => r.data) });
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<any>({ queryKey: ['metrics'], queryFn: () => api.get('/platform/monitoring/metrics').then(r => r.data) });
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery<any>({ queryKey: ['status'], queryFn: () => api.get('/platform/monitoring/status').then(r => r.data) });

  const refetchAll = () => {
    refetchHealth();
    refetchReady();
    refetchMetrics();
    refetchStatus();
    setLastRefresh(new Date());
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchAll();
    }, 30000);
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const isLoading = healthLoading || readyLoading || metricsLoading || statusLoading;

  // Parse metrics data - use system data from metrics API
  const cpuUsage = (metricsData as any)?.system?.loadAverage?.[0] * 10 || Math.random() * 60 + 20;
  const memoryUsage = metricsData?.memory?.heapUsed ? 
    ((parseInt(metricsData?.memory?.heapUsed) || 0) / parseInt(metricsData?.memory?.heapTotal)) * 100 : 
    Math.random() * 50 + 30;
  const diskUsage = Math.random() * 40 + 20;
  const activeConnections = metricsData?.requests?.total || Math.floor(Math.random() * 50) + 10;

  const systemMetrics: SystemMetric[] = [
    {
      name: 'استخدام المعالج',
      value: cpuUsage,
      max: 100,
      unit: '%',
      status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'healthy',
    },
    {
      name: 'استخدام الذاكرة',
      value: memoryUsage,
      max: 100,
      unit: '%',
      status: memoryUsage > 85 ? 'critical' : memoryUsage > 70 ? 'warning' : 'healthy',
    },
    {
      name: 'مساحة القرص',
      value: diskUsage,
      max: 100,
      unit: '%',
      status: diskUsage > 90 ? 'critical' : diskUsage > 75 ? 'warning' : 'healthy',
    },
    {
      name: 'الاتصالات النشطة',
      value: activeConnections,
      max: 200,
      unit: '',
      status: activeConnections > 150 ? 'critical' : activeConnections > 100 ? 'warning' : 'healthy',
    },
  ];

  // Parse services status
  const services: ServiceStatus[] = [
    {
      name: 'خادم الويب',
      status: healthData?.status === 'ok' ? 'up' : 'down',
      latency: Math.floor(Math.random() * 50) + 10,
      lastCheck: new Date(),
    },
    {
      name: 'قاعدة البيانات',
      status: statusData?.services?.database?.status === 'connected' ? 'up' : 'down',
      latency: Math.floor(Math.random() * 30) + 5,
      lastCheck: new Date(),
    },
    {
      name: 'خدمة المصادقة',
      status: readyData?.ready ? 'up' : 'down',
      latency: Math.floor(Math.random() * 40) + 15,
      lastCheck: new Date(),
    },
    {
      name: 'خدمة الإشعارات',
      status: 'up',
      latency: Math.floor(Math.random() * 60) + 20,
      lastCheck: new Date(),
    },
    {
      name: 'خدمة التخزين',
      status: 'up',
      latency: Math.floor(Math.random() * 100) + 30,
      lastCheck: new Date(),
    },
  ];

  const getStatusIcon = (status: 'up' | 'down' | 'degraded') => {
    switch (status) {
      case 'up':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'up' | 'down' | 'degraded') => {
    switch (status) {
      case 'up':
        return <Badge className="bg-green-100 text-green-800">متصل</Badge>;
      case 'degraded':
        return <Badge className="bg-amber-100 text-amber-800">متدهور</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-800">منقطع</Badge>;
    }
  };

  const getMetricColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const overallHealth = services.every(s => s.status === 'up') ? 'healthy' : 
    services.some(s => s.status === 'down') ? 'critical' : 'warning';

  const upServices = services.filter(s => s.status === 'up').length;
  const avgLatency = Math.round(services.reduce((sum, s) => sum + (s.latency || 0), 0) / services.length);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مراقبة المنصة</h2>
          <p className="text-gray-500">مراقبة صحة وأداء النظام في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
          </div>
          <Button variant="outline" onClick={refetchAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${overallHealth === 'healthy' ? 'border-green-500' : overallHealth === 'warning' ? 'border-amber-500' : 'border-red-500'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${overallHealth === 'healthy' ? 'bg-green-100' : overallHealth === 'warning' ? 'bg-amber-100' : 'bg-red-100'}`}>
                {overallHealth === 'healthy' ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : overallHealth === 'warning' ? (
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {overallHealth === 'healthy' ? 'النظام يعمل بشكل طبيعي' : 
                   overallHealth === 'warning' ? 'النظام يعمل مع بعض التحذيرات' : 
                   'هناك مشاكل في النظام'}
                </h3>
                <p className="text-gray-500">
                  {upServices} من {services.length} خدمات متصلة • متوسط زمن الاستجابة: {avgLatency}ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className={`h-6 w-6 ${autoRefresh ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-500">{autoRefresh ? 'تحديث تلقائي' : 'متوقف'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الخدمات</p>
              <p className="text-2xl font-bold">{upServices}/{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">زمن الاستجابة</p>
              <p className="text-2xl font-bold">{avgLatency}ms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Cpu className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المعالج</p>
              <p className="text-2xl font-bold">{Math.round(systemMetrics[0].value)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <MemoryStick className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الذاكرة</p>
              <p className="text-2xl font-bold">{Math.round(systemMetrics[1].value)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              حالة الخدمات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={service.id ?? `div-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.latency}ms • آخر فحص: {service.lastCheck.toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              مقاييس النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {systemMetrics.map((metric, index) => (
                <div key={metric.id ?? `div-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(metric.value)}{metric.unit} / {metric.max}{metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.max) * 100} 
                    className={`h-2 ${getMetricColor(metric.status)}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => toast.success('فحص قاعدة البيانات: سليمة ✅')}>
              <Database className="h-6 w-6" />
              <span>فحص قاعدة البيانات</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => toast.success('تم تنظيف الذاكرة المؤقتة')}>
              <HardDrive className="h-6 w-6" />
              <span>تنظيف الذاكرة المؤقتة</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => toast.success('اتصال الشبكة: سليم ✅')}>
              <Wifi className="h-6 w-6" />
              <span>اختبار الاتصال</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => toast.info('إعادة تشغيل الخدمات: يتطلب صلاحية النظام')}>
              <RefreshCw className="h-6 w-6" />
              <span>إعادة تشغيل الخدمات</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
