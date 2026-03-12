import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Settings2, Clock, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Calendar, DollarSign, BookOpen, UserPlus, AlertOctagon, FileCheck, BarChart3, History, Zap, Timer, Activity, Database, Shield, Info } from 'lucide-react';

// ── أيقونات الأقسام
const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  leave:       { icon: <Calendar className="w-4 h-4" />,     label: 'الإجازات',         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  attendance:  { icon: <Clock className="w-4 h-4" />,        label: 'الحضور',            color: 'bg-green-50 text-green-700 border-green-200' },
  payroll:     { icon: <DollarSign className="w-4 h-4" />,   label: 'الرواتب',           color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  performance: { icon: <BarChart3 className="w-4 h-4" />,    label: 'الأداء',            color: 'bg-purple-50 text-purple-700 border-purple-200' },
  training:    { icon: <BookOpen className="w-4 h-4" />,     label: 'التدريب',           color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  recruitment: { icon: <UserPlus className="w-4 h-4" />,     label: 'التوظيف',           color: 'bg-pink-50 text-pink-700 border-pink-200' },
  violations:  { icon: <AlertOctagon className="w-4 h-4" />, label: 'المخالفات',         color: 'bg-red-50 text-red-700 border-red-200' },
  onboarding:  { icon: <FileCheck className="w-4 h-4" />,    label: 'العقود والوثائق',   color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  success: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'نجح',    color: 'bg-green-100 text-green-700' },
  failed:  { icon: <XCircle className="w-3 h-3" />,      label: 'فشل',    color: 'bg-red-100 text-red-700' },
  running: { icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: 'يعمل', color: 'bg-blue-100 text-blue-700' },
  skipped: { icon: <Pause className="w-3 h-3" />,        label: 'تخطى',   color: 'bg-gray-100 text-gray-700' },
};

const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

type Service = {
  id: number;
  serviceKey: string;
  serviceName: string;
  category: string;
  description: string | null;
  isEnabled: boolean;
  runMode: 'auto' | 'manual' | 'scheduled' | 'triggered';
  cronExpression: string | null;
  intervalMinutes: number | null;
  runAt: string | null;
  activeFrom: string | null;
  activeTo: string | null;
  activeDays: string | null;
  timeoutMinutes: number | null;
  retryCount: number | null;
  retryDelayMin: number | null;
  config: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | 'skipped' | 'running' | null;
  lastRunMessage: string | null;
  nextRunAt: string | null;
  runCount: number | null;
  failCount: number | null;
};

// ── مكوّن بطاقة الخدمة ──────────────────────────────────────────────────────
function ServiceCard({ service, onToggle, onRunNow, onEdit }: {
  service: Service;
  onToggle: (key: string, val: boolean) => void;
  onRunNow: (key: string) => void;
  onEdit:   (service: Service) => void;
}) {
  const cat = CATEGORY_META[service.category] ?? CATEGORY_META.onboarding;
  const st  = service.lastRunStatus ? STATUS_META[service.lastRunStatus] : null;

  return (
    <Card className={`transition-all border ${service.isEnabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* رأس البطاقة */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg border text-sm flex-shrink-0 ${cat.color}`}>
              {cat.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-gray-900 text-sm">{service.serviceName}</h3>
                {!service.isEnabled && (
                  <Badge variant="secondary" className="text-xs bg-gray-100">معطَّل</Badge>
                )}
                {st && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                    {st.icon} {st.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
            </div>
          </div>

          {/* مفتاح التشغيل */}
          <Switch
            checked={service.isEnabled}
            onCheckedChange={(v) => onToggle(service.serviceKey, v)}
            className="flex-shrink-0 mt-0.5"
          />
        </div>

        {/* معلومات الجدولة */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {service.cronExpression && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {service.cronExpression}
            </span>
          )}
          {service.intervalMinutes && (
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" /> كل {service.intervalMinutes} دقيقة
            </span>
          )}
          {service.activeFrom && service.activeTo && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> {service.activeFrom}–{service.activeTo}
            </span>
          )}
          {service.activeDays && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {service.activeDays.split(',').map(d => DAYS_AR[parseInt(d)]).join('، ')}
            </span>
          )}
          <Badge variant="outline" className="text-xs capitalize">{service.runMode}</Badge>
        </div>

        {/* آخر تشغيل */}
        {service.lastRunAt && (
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <History className="w-3 h-3" />
            آخر تشغيل: {formatDateTime(service.lastRunAt)}
            {service.runCount != null && <span className="me-2">• {service.runCount} مرة</span>}
            {!!service.failCount && <span className="text-red-400">• {service.failCount} فشل</span>}
          </div>
        )}

        {service.lastRunMessage && (
          <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 line-clamp-2">
            {service.lastRunMessage}
          </p>
        )}

        {/* أزرار الإجراء */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-3"
            onClick={() => onRunNow(service.serviceKey)}
          >
            <Play className="w-3 h-3 me-1" /> تشغيل الآن
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-3"
            onClick={() => onEdit(service)}
          >
            <Settings2 className="w-3 h-3 me-1" /> إعدادات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── حوار الإعدادات ───────────────────────────────────────────────────────────
function ServiceSettingsDialog({ service, open, onClose, onSave }: {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({});

  if (!service) return null;

  const merged = { ...service, ...form };
  const configObj = (() => {
    try { return JSON.parse(service.config ?? '{}'); } catch { return {}; }
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            إعدادات: {service.serviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* التشغيل العام */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">التحكم في التشغيل</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">وضع التشغيل</Label>
                <Select
                  value={(merged.runMode as string) ?? 'scheduled'}
                  onValueChange={v => setForm(f => ({ ...f, runMode: v }))}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">تلقائي (auto)</SelectItem>
                    <SelectItem value="scheduled">مجدول (scheduled)</SelectItem>
                    <SelectItem value="triggered">محفَّز (triggered)</SelectItem>
                    <SelectItem value="manual">يدوي فقط (manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">مهلة التنفيذ (دقيقة)</Label>
                <Input
                  type="number" min={1} max={1440}
                  className="h-8 text-xs mt-1"
                  value={(merged.timeoutMinutes as number) ?? 30}
                  onChange={e => setForm(f => ({ ...f, timeoutMinutes: +e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* الجدولة */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">الجدولة الزمنية</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cron Expression</Label>
                <Input
                  className="h-8 text-xs mt-1 font-mono"
                  placeholder="0 8 * * *"
                  value={(merged.cronExpression as string) ?? ''}
                  onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value || null }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">مثال: 0 9 * * 0-4 = كل يوم عمل 9ص</p>
              </div>
              <div>
                <Label className="text-xs">أو: كل N دقيقة</Label>
                <Input
                  type="number" min={1} className="h-8 text-xs mt-1"
                  placeholder="60"
                  value={(merged.intervalMinutes as number) ?? ''}
                  onChange={e => setForm(f => ({ ...f, intervalMinutes: e.target.value ? +e.target.value : null }))}
                />
              </div>
            </div>
          </div>

          {/* نافذة التشغيل */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">نافذة التشغيل (تشغيل من / إلى)</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">تشغيل من</Label>
                <Input
                  type="time" className="h-8 text-xs mt-1"
                  value={(merged.activeFrom as string) ?? '06:00'}
                  onChange={e => setForm(f => ({ ...f, activeFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">إيقاف في</Label>
                <Input
                  type="time" className="h-8 text-xs mt-1"
                  value={(merged.activeTo as string) ?? '23:00'}
                  onChange={e => setForm(f => ({ ...f, activeTo: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">أيام التشغيل</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_AR.map((day, i) => {
                  const activeDays = ((merged.activeDays as string) ?? '0,1,2,3,4').split(',').map(Number);
                  const active = activeDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const days = ((merged.activeDays as string) ?? '0,1,2,3,4').split(',').map(Number);
                        const next = active ? days.filter(d => d !== i) : [...days, i].sort();
                        setForm(f => ({ ...f, activeDays: next.join(',') }));
                      }}
                      className={`px-3 py-1 rounded text-xs border transition-colors ${
                        active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* إعادة المحاولة */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">إعادة المحاولة عند الفشل</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">عدد المحاولات</Label>
                <Input
                  type="number" min={0} max={10} className="h-8 text-xs mt-1"
                  value={(merged.retryCount as number) ?? 3}
                  onChange={e => setForm(f => ({ ...f, retryCount: +e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">انتظار بين المحاولات (دقيقة)</Label>
                <Input
                  type="number" min={1} max={60} className="h-8 text-xs mt-1"
                  value={(merged.retryDelayMin as number) ?? 5}
                  onChange={e => setForm(f => ({ ...f, retryDelayMin: +e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* إعدادات الخدمة الخاصة */}
          {Object.keys(configObj).length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" /> إعدادات الخدمة
              </h4>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-600 leading-relaxed">
                {JSON.stringify(configObj, null, 2)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={() => {
              onSave({ serviceKey: service.serviceKey, ...form });
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            حفظ الإعدادات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════════════════════
export default function HRAutomation() {
  const [editService, setEditService] = useState<Service | null>(null);
  const [activeTab, setActiveTab]     = useState('services');
  const [filterCat, setFilterCat]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── API calls ────────────────────────────────────────────────────────────
  const { data: services = [], refetch, isLoading } = useQuery({
    queryKey: ['hrAutomation'],
    queryFn: () => api.get('/hr/automation').then(res => res.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['hrAutomationStats'],
    queryFn: () => api.get('/hr/automation/stats').then(res => res.data),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['hrAutomationLogs'],
    queryFn: () => api.get('/hr/automation/logs', { params: { limit: 200 } }).then(res => res.data),
  });

  const initialize = useMutation({
    mutationFn: (data: any) => api.post('/hr/automation/initialize', data).then(res => res.data),
    onSuccess: (r: any) => { toast.success(`تمت التهيئة: ${r.created} جديد، ${r.existing} موجود`); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (data: any) => api.post('/hr/automation/toggle', data).then(res => res.data),
    onSuccess: (r: any) => {
      toast.success(`${r.isEnabled ? 'تم تفعيل' : 'تم إيقاف'} الخدمة`);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const runNow = useMutation({
    mutationFn: (data: any) => api.post('/hr/automation/run-now', data).then(res => res.data),
    onSuccess: (r: any) => {
      if (r.success) toast.success(`${r.message} -- ${r.affected} سجل`);
      else           toast.error(`${r.message}`);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (data: any) => api.put('/hr/automation/update', data).then(res => res.data),
    onSuccess: () => { toast.success('حُفظت الإعدادات'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  // ── فلترة ────────────────────────────────────────────────────────────────
  const filtered = (services as Service[]).filter(s => {
    if (filterCat    !== 'all' && s.category       !== filterCat)     return false;
    if (filterStatus === 'enabled'  && !s.isEnabled)                   return false;
    if (filterStatus === 'disabled' &&  s.isEnabled)                   return false;
    if (filterStatus === 'failed'   && s.lastRunStatus !== 'failed')   return false;
    return true;
  });

  // ── تجميع حسب القسم ───────────────────────────────────────────────────────
  const grouped: Record<string, Service[]> = {};
  for (const s of filtered) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-600" />
            أتمتة الموارد البشرية
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة وجدولة الخدمات الآلية لمسار HR مع تحكم كامل في كل خدمة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 me-2" /> تحديث
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => initialize.mutate({})}
            disabled={initialize.isPending}
          >
            <Database className="w-4 h-4 me-2" />
            {initialize.isPending ? 'جاري...' : 'تهيئة الخدمات'}
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الخدمات', value: stats.total,   icon: <Shield className="w-5 h-5" />,   color: 'text-gray-600',  bg: 'bg-gray-50' },
            { label: 'مفعَّلة',         value: stats.enabled,  icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'موقوفة',          value: stats.disabled, icon: <Pause className="w-5 h-5" />,    color: 'text-yellow-600',bg: 'bg-yellow-50' },
            { label: 'فشل آخر تشغيل',  value: stats.failed ?? 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(item => (
            <Card key={item.label} className={`${item.bg} border-0`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={item.color}>{item.icon}</div>
                <div>
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* تبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-sm">
          <TabsTrigger value="services">الخدمات</TabsTrigger>
          <TabsTrigger value="logs">سجل التشغيل</TabsTrigger>
        </TabsList>

        {/* تبويب الخدمات */}
        <TabsContent value="services" className="space-y-4 mt-4">
          {/* فلاتر */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="enabled">مفعَّلة فقط</SelectItem>
                <SelectItem value="disabled">موقوفة فقط</SelectItem>
                <SelectItem value="failed">فشل آخر تشغيل</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-gray-400 mr-auto">
              {filtered.length} من {services.length} خدمة
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              جاري التحميل...
            </div>
          ) : services.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">لم يتم تهيئة الخدمات بعد</p>
                <Button onClick={() => initialize.mutate({})}>
                  <Zap className="w-4 h-4 me-2" /> تهيئة الخدمات الافتراضية
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* عرض مجمَّع حسب القسم */
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, svcs]) => {
                const meta = CATEGORY_META[cat] ?? CATEGORY_META.onboarding;
                return (
                  <div key={cat}>
                    <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg border text-sm font-medium w-fit ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                      <span className="text-xs opacity-70">({svcs.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {svcs.map(s => (
                        <ServiceCard
                          key={s.serviceKey}
                          service={s}
                          onToggle={(k, v) => toggle.mutate({ serviceKey: k, enabled: v })}
                          onRunNow={(k) => runNow.mutate({ serviceKey: k })}
                          onEdit={setEditService}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* تبويب السجل */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                سجل تشغيل الخدمات الآلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(logs as Record<string, unknown>[]).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">لا توجد سجلات بعد</p>
              ) : (
                <div className="divide-y">
                  {(logs as Record<string, unknown>[]).map((log) => {
                    const st = STATUS_META[(log.status as string)] ?? STATUS_META.skipped;
                    return (
                      <div key={log.id as number} className="py-3 flex items-start gap-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {log.serviceKey as string}
                            </code>
                            <span className="text-xs text-gray-400">
                              {log.triggeredBy as string === 'manual' ? '👤 يدوي' : '🤖 تلقائي'}
                            </span>
                            {log.affectedCount != null && (log.affectedCount as number) > 0 && (
                              <span className="text-xs text-green-600">• {log.affectedCount as number} سجل</span>
                            )}
                            {log.durationMs != null && (
                              <span className="text-xs text-gray-400">• {log.durationMs as number}ms</span>
                            )}
                          </div>
                          {log.message && (
                            <p className="text-xs text-gray-500 mt-0.5">{log.message as string}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDateTime(log.startedAt as string)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* حوار الإعدادات */}
      <ServiceSettingsDialog
        service={editService}
        open={!!editService}
        onClose={() => setEditService(null)}
        onSave={(updates) => update.mutate(updates as Parameters<typeof update.mutate>[0])}
      />
    </div>
  );
}
