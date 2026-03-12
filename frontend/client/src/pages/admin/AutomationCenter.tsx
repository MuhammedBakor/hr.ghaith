/**
 * ════════════════════════════════════════════════════════════════════════════
 * AUTOMATION CENTER — مركز التحكم الشامل للأتمتة
 * التحكم الكامل في جميع خدمات الأتمتة عبر 13 وحدة
 * ════════════════════════════════════════════════════════════════════════════
 */
import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RefreshCw, Settings2, Activity, Zap, AlertTriangle, CheckCircle2, XCircle, Clock, Search, Filter, RotateCcw, Layers, ChevronRight, Calendar } from 'lucide-react';
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from 'sonner';

// ─── أنواع ──────────────────────────────────────────────────────────────────
interface Service {
  module: string; moduleAr: string; color: string; icon: string;
  serviceKey: string; serviceName: string; isEnabled: boolean;
  category: string; runMode: string; lastRunAt: string | null;
  lastRunStatus: string | null; totalRuns: number;
}

// ─── ألوان الوحدات ──────────────────────────────────────────────────────────
const moduleColors: Record<string, string> = {
  hr: 'bg-blue-100 text-blue-800 border-blue-200',
  finance: 'bg-green-100 text-green-800 border-green-200',
  fleet: 'bg-orange-100 text-orange-800 border-orange-200',
  legal: 'bg-purple-100 text-purple-800 border-purple-200',
  projects: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  support: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  crm: 'bg-pink-100 text-pink-800 border-pink-200',
  store: 'bg-teal-100 text-teal-800 border-teal-200',
  governance: 'bg-red-100 text-red-800 border-red-200',
  property: 'bg-amber-100 text-amber-800 border-amber-200',
  workflow: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  comms: 'bg-violet-100 text-violet-800 border-violet-200',
  docs: 'bg-rose-100 text-rose-800 border-rose-200',
};

const runModeLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'مجدول', color: 'bg-blue-100 text-blue-700' },
  triggered:  { label: 'محفّز', color: 'bg-purple-100 text-purple-700' },
  interval:   { label: 'دوري', color: 'bg-teal-100 text-teal-700' },
  manual:     { label: 'يدوي', color: 'bg-gray-100 text-gray-700' },
  auto:       { label: 'تلقائي', color: 'bg-green-100 text-green-700' },
};

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────
export default function AutomationCenter() {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState('all');

  // ─── بيانات ────────────────────────────────────────────────────────────────
  const { data: dashData, refetch: refetchDash } = useQuery({
    queryKey: ["automation", "dashboard"],
    queryFn: () => api.get("/automation/dashboard").then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: servicesData, refetch: refetchServices } = useQuery({
    queryKey: ["automation", "listAll", filterModule, filterEnabled, filterMode, search],
    queryFn: () => api.get("/automation/list-all", { params: {
      module:    filterModule !== 'all' ? filterModule : undefined,
      isEnabled: filterEnabled === 'all' ? undefined : filterEnabled === 'enabled',
      runMode:   filterMode   !== 'all' ? filterMode  : undefined,
      search:    search || undefined,
      pageSize:  200,
    }}).then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["automation", "recentLogs"],
    queryFn: () => api.get("/automation/recent-logs", { params: { limit: 30 } }).then(r => r.data),
  });
  const { data: problemsData } = useQuery({
    queryKey: ["automation", "problems"],
    queryFn: () => api.get("/automation/problems").then(r => r.data),
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const runService = useMutation({
    mutationFn: (vars: { module: string; serviceKey: string }) => api.post("/automation/run-service", vars).then(r => r.data),
    onSuccess: (r: any, vars) => { toast.success(`تم تشغيل ${vars.serviceKey}: ${r.message}`); refetchServices(); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });

  const toggleService = useMutation({
    mutationFn: (vars: { module: string; serviceKey: string; isEnabled: boolean }) => api.post("/automation/toggle-service", vars).then(r => r.data),
    onSuccess: (_: any, vars: any) => {
      toast.success(vars.isEnabled ? 'تم تفعيل الخدمة' : 'تم إيقاف الخدمة');
      refetchServices(); refetchDash();
    },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });

  const initAll = useMutation({
    mutationFn: (data: any) => api.post("/automation/init-all", data).then(r => r.data),
    onSuccess: (r: any) => { toast.success(`تهيئة ${r.totalInitialized} خدمة جديدة`); refetchServices(); refetchDash(); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });

  const runAll = useMutation({
    mutationFn: (data: any) => api.post("/automation/run-all", data).then(r => r.data),
    onSuccess: (r: any) => { toast.success(`تشغيل ${r.succeeded}/${r.ran} خدمة بنجاح`); refetchServices(); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });

  const clearCache = useMutation({
    mutationFn: (data: any) => api.post("/automation/clear-cache", data).then(r => r.data),
    onSuccess: () => { toast.success('تم مسح الكاش'); refetchDash(); refetchServices(); },
  });

  // ─── إحصاءات ──────────────────────────────────────────────────────────────
  const stats  = dashData?.stats;
  const health = dashData?.health;
  const services: Service[] = (servicesData?.data ?? []) as Service[];

  // ─── الوحدات المتاحة ────────────────────────────────────────────────────
  const modules = useMemo(() => {
    const mods = new Map<string, { nameAr: string; icon: string; color: string }>();
    services.forEach(s => mods.set(s.module, { nameAr: s.moduleAr, icon: s.icon, color: s.color }));
    return Array.from(mods.entries()).map(([k, v]) => ({ key: k, ...v }));
  }, [services]);

  // ─── حالة الصحة ──────────────────────────────────────────────────────────
  const healthColor = health?.status === 'healthy' ? 'text-green-600' : health?.status === 'degraded' ? 'text-amber-600' : 'text-red-600';
  const healthLabel = health?.status === 'healthy' ? 'سليم' : health?.status === 'degraded' ? 'متدهور' : 'حرج';

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return formatDateTime(iso);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 rtl" dir="rtl">
        {/* ── رأس الصفحة ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-7 h-7 text-blue-600" />
              مركز التحكم بالأتمتة
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {stats?.totalServices ?? 0} خدمة • {stats?.enabledServices ?? 0} مفعّلة • {modules.length} وحدة
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => clearCache.mutate({})}>
              <RotateCcw className="w-4 h-4 ms-1" /> مسح الكاش
            </Button>
            <Button variant="outline" size="sm" onClick={() => initAll.mutate({})}>
              <Layers className="w-4 h-4 ms-1" /> تهيئة الكل
            </Button>
            <Button size="sm" onClick={() => runAll.mutate({})} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="w-4 h-4 ms-1" /> تشغيل المفعّلة
            </Button>
          </div>
        </div>

        {/* ── بطاقات الإحصاء ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-blue-700">{stats?.totalServices ?? 0}</div>
              <div className="text-sm text-blue-600 mt-1">إجمالي الخدمات</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-green-700">{stats?.enabledServices ?? 0}</div>
              <div className="text-sm text-green-600 mt-1">خدمات مفعّلة</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-4 pb-3">
              <div className="text-3xl font-bold text-amber-700">{stats?.disabledServices ?? 0}</div>
              <div className="text-sm text-amber-600 mt-1">خدمات متوقفة</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="pt-4 pb-3">
              <div className={`text-3xl font-bold ${healthColor}`}>{health?.score ?? 0}%</div>
              <div className="text-sm text-gray-600 mt-1">صحة النظام • <span className={healthColor}>{healthLabel}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* ── تنبيهات المشاكل ──────────────────────────────────────────── */}
        {(problemsData?.length ?? 0) > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> مشاكل تستحق الانتباه ({problemsData?.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {problemsData?.slice(0, 5).map((p, i) => (
                  <div key={p.id ?? `div-${i}`} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${p.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="font-medium">{p.moduleAr}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span>{p.serviceName}</span>
                    <span className="text-gray-500">— {p.issue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── المحتوى الرئيسي ──────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="all">كل الخدمات</TabsTrigger>
            <TabsTrigger value="modules">حسب الوحدة</TabsTrigger>
            <TabsTrigger value="logs">السجلات</TabsTrigger>
            <TabsTrigger value="schedule">الجدول الزمني</TabsTrigger>
          </TabsList>

          {/* ─── تبويب: كل الخدمات ───────────────────────────────────── */}
          <TabsContent value="all">
            {/* فلاتر */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute end-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input placeholder="بحث..." className="pe-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="الوحدة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الوحدات</SelectItem>
                  {modules.map(m => <SelectItem key={m.key} value={m.key}>{m.icon} {m.nameAr}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterEnabled} onValueChange={v => setFilterEnabled(v as any)}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="enabled">مفعّلة</SelectItem>
                  <SelectItem value="disabled">متوقفة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="وضع التشغيل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأوضاع</SelectItem>
                  {Object.entries(runModeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetchServices()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* جدول الخدمات */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-end w-8">تفعيل</TableHead>
                    <TableHead className="text-end">الخدمة</TableHead>
                    <TableHead className="text-end">الوحدة</TableHead>
                    <TableHead className="text-end">الوضع</TableHead>
                    <TableHead className="text-end">آخر تشغيل</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                    <TableHead className="text-end w-24">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map(svc => (
                    <TableRow key={`${svc.module}-${svc.serviceKey}`} className="hover:bg-gray-50/50">
                      <TableCell>
                        <Switch
                          checked={svc.isEnabled}
                          disabled={toggleService.isPending}
                          onCheckedChange={v => toggleService.mutate({ module: svc.module, serviceKey: svc.serviceKey, isEnabled: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{svc.serviceName}</div>
                        <div className="text-xs text-gray-400">{svc.serviceKey}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${moduleColors[svc.module] ?? 'bg-gray-100 text-gray-700'}`}>
                          {svc.icon} {svc.moduleAr}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${runModeLabels[svc.runMode]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {runModeLabels[svc.runMode]?.label ?? svc.runMode}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDate(svc.lastRunAt)}</TableCell>
                      <TableCell>
                        {svc.lastRunStatus === 'error' && <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle className="w-3 h-3" /> فشل</span>}
                        {svc.lastRunStatus === 'success' && <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3 h-3" /> نجح</span>}
                        {!svc.lastRunStatus && <span className="text-gray-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={runService.isPending}
                            onClick={() => runService.mutate({ module: svc.module, serviceKey: svc.serviceKey })}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => { setSelectedService(svc); setSettingsOpen(true); }}
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {services.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <div>لا توجد خدمات تطابق الفلتر</div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ─── تبويب: حسب الوحدة ────────────────────────────────────── */}
          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats?.byModule ?? {}).map(([mod, info]: [string, any]) => {
                const enabledPct = info.total > 0 ? Math.round((info.enabled / info.total) * 100) : 0;
                return (
                  <Card key={mod} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setFilterModule(mod); setTab('all'); }}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{info.icon}</span>
                          <div>
                            <div className="font-semibold text-sm">{info.nameAr}</div>
                            <div className="text-xs text-gray-400">{info.total?.toLocaleString()} خدمة</div>
                          </div>
                        </div>
                        <div className="text-start">
                          <div className="text-2xl font-bold text-green-600">{info.enabled}</div>
                          <div className="text-xs text-gray-400">مفعّلة</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${enabledPct}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{enabledPct}% مفعّل</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ─── تبويب: السجلات ─────────────────────────────────────────── */}
          <TabsContent value="logs">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> آخر عمليات التشغيل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-end">الوحدة</TableHead>
                      <TableHead className="text-end">الخدمة</TableHead>
                      <TableHead className="text-end">الحالة</TableHead>
                      <TableHead className="text-end">التأثير</TableHead>
                      <TableHead className="text-end">التوقيت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logsData ?? []).map((log: any, i) => (
                      <TableRow key={i} className="hover:bg-gray-50/50">
                        <TableCell>
                          <span className={`px-1.5 py-0.5 rounded text-xs border ${moduleColors[log.module] ?? 'bg-gray-100'}`}>
                            {log.icon} {log.moduleAr ?? log.module}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{log.serviceKey}</TableCell>
                        <TableCell>
                          {log.status === 'success' && <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-xs">نجح</Badge>}
                          {log.status === 'error'   && <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-xs">فشل</Badge>}
                          {log.status === 'running' && <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-xs">جارٍ</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{log.affected ?? 0}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(log.createdAt ?? log.startedAt ?? log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── تبويب: الجدول الزمني ─────────────────────────────────── */}
          <TabsContent value="schedule">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> الخدمات المجدولة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {services
                    .filter(s => s.runMode === 'scheduled' || s.runMode === 'interval')
                    .map(svc => (
                      <div key={`${svc.module}-${svc.serviceKey}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${svc.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <div className="font-medium text-sm">{svc.serviceName}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-1.5 rounded border ${moduleColors[svc.module] ?? 'bg-gray-100'}`}>{svc.icon} {svc.moduleAr}</span>
                              <span className="text-xs text-gray-400">{svc.runMode === 'interval' ? 'دوري' : 'مجدول'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-start">
                            <div className="text-xs text-gray-400">آخر تشغيل</div>
                            <div className="text-xs font-medium">{formatDate(svc.lastRunAt)}</div>
                          </div>
                          <Switch
                            checked={svc.isEnabled}
                            onCheckedChange={v => toggleService.mutate({ module: svc.module, serviceKey: svc.serviceKey, isEnabled: v })}
                          />
                          <Button disabled={runService.isPending} size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600"
                            onClick={() => runService.mutate({ module: svc.module, serviceKey: svc.serviceKey })}>
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── نافذة تفاصيل الخدمة ──────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              {selectedService?.serviceName}
            </DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">الوحدة</div>
                  <div className="font-medium">{selectedService.moduleAr}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">التصنيف</div>
                  <div className="font-medium">{selectedService.category}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">وضع التشغيل</div>
                  <div className="font-medium">{runModeLabels[selectedService.runMode]?.label ?? selectedService.runMode}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">إجمالي التشغيل</div>
                  <div className="font-bold text-lg text-blue-600">{selectedService.totalRuns}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="text-gray-500 text-xs mb-1">آخر تشغيل</div>
                <div>{formatDate(selectedService.lastRunAt)}</div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm font-medium">حالة الخدمة</span>
                <Switch
                  checked={selectedService.isEnabled}
                  onCheckedChange={v => {
                    toggleService.mutate({ module: selectedService.module, serviceKey: selectedService.serviceKey, isEnabled: v });
                    setSelectedService({ ...selectedService, isEnabled: v });
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>إغلاق</Button>
            <Button disabled={runService.isPending} className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
              if (selectedService) {
                runService.mutate({ module: selectedService.module, serviceKey: selectedService.serviceKey });
                setSettingsOpen(false);
              }
            }}>
              <Play className="w-4 h-4 ms-1" /> تشغيل الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
