/**
 * AutomationDashboard — مكوّن لوحة تحكم الأتمتة العام (قابل لإعادة الاستخدام)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Play, Pause, Settings2, Clock, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, BarChart3, Zap, Timer, Activity, Database, Shield, History,
} from 'lucide-react';

export type ServiceDef = {
  id: number; serviceKey: string; serviceName: string; category: string;
  description: string | null; isEnabled: boolean;
  runMode: 'auto' | 'manual' | 'scheduled' | 'triggered';
  cronExpression: string | null; intervalMinutes: number | null; runAt: string | null;
  activeFrom: string | null; activeTo: string | null; activeDays: string | null;
  timeoutMinutes: number | null; retryCount: number | null; retryDelayMin: number | null;
  config: string | null; lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | 'skipped' | 'running' | null;
  lastRunMessage: string | null; nextRunAt: string | null;
  runCount: number | null; failCount: number | null;
};

export type CategoryMeta = { [key: string]: { icon: React.ReactNode; label: string; color: string } };

const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  success: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'نجح',  color: 'bg-green-100 text-green-700 border-green-200' },
  failed:  { icon: <XCircle className="w-3 h-3" />,      label: 'فشل',  color: 'bg-red-100 text-red-700 border-red-200' },
  running: { icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: 'يعمل', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  skipped: { icon: <Pause className="w-3 h-3" />,        label: 'تخطى', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};
const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function ServiceCard({ service, catMeta, onToggle, onRunNow, onEdit }: {
  service: ServiceDef; catMeta: CategoryMeta;
  onToggle: (key: string, val: boolean) => void;
  onRunNow: (key: string) => void;
  onEdit:   (s: ServiceDef) => void;
}) {
  const cat = catMeta[service.category] ?? { icon: <Zap className="w-4 h-4" />, label: service.category, color: 'bg-gray-50 text-gray-700 border-gray-200' };
  const st  = service.lastRunStatus ? STATUS_META[service.lastRunStatus] : null;
  const activeDaysLabels = service.activeDays
    ? service.activeDays.split(',').map(d => DAYS_AR[parseInt(d)] ?? d).join(' · ')
    : null;

  return (
    <Card className={`transition-all border-2 ${service.isEnabled ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm' : 'border-gray-100 bg-gray-50 opacity-65'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cat.color}`}>
                {cat.icon} {cat.label}
              </span>
              {st && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                  {st.icon} {st.label}
                </span>
              )}
              {service.runMode === 'triggered' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200">
                  <Zap className="w-3 h-3" /> حدث
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{service.serviceName}</h3>
            {service.description && (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{service.description}</p>
            )}
          </div>
          <Switch checked={service.isEnabled} onCheckedChange={v => onToggle(service.serviceKey, v)} className="mt-1 shrink-0" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
          {service.cronExpression && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
              <Clock className="w-3 h-3" /> {service.cronExpression}
            </span>
          )}
          {service.runAt && (
            <span className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-100">
              <Timer className="w-3 h-3" /> {service.runAt}
            </span>
          )}
          {activeDaysLabels && <span className="text-gray-400">📅 {activeDaysLabels}</span>}
          {service.activeFrom && service.activeTo && (
            <span className="text-gray-400">🕐 {service.activeFrom}–{service.activeTo}</span>
          )}
        </div>
        {service.lastRunAt && (
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <History className="w-3 h-3" />
            {new Date(service.lastRunAt).toLocaleString('ar-SA')}
            {service.lastRunMessage && (
              <span className="text-gray-500 me-1 truncate max-w-[150px]">— {service.lastRunMessage}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{service.runCount ?? 0}</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />{service.failCount ?? 0}</span>
            {service.timeoutMinutes && <span className="text-gray-400 flex items-center gap-1"><Timer className="w-3 h-3" />{service.timeoutMinutes}م</span>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onEdit(service)}>
              <Settings2 className="w-3 h-3" />
            </Button>
            <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => onRunNow(service.serviceKey)}>
              <Play className="w-3 h-3 ms-1" /> تشغيل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditDialog({ service, open, onClose, onSave }: {
  service: ServiceDef | null; open: boolean;
  onClose: () => void;
  onSave: (key: string, data: Partial<ServiceDef>) => void;
}) {
  const [form, setForm] = useState<Partial<ServiceDef>>({});
  if (!service) return null;
  const merged = { ...service, ...form };
  const activeDays = (merged.activeDays ?? '0,1,2,3,4').split(',').map(Number);
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setForm({}); } }}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600" /> إعدادات: {service.serviceName}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="schedule">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="schedule">الجدولة</TabsTrigger>
            <TabsTrigger value="window">نافذة التشغيل</TabsTrigger>
            <TabsTrigger value="config">إعدادات متقدمة</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Cron Expression</Label>
                <Input value={merged.cronExpression ?? ''} onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))} placeholder="0 8 * * 0-4" className="font-mono text-sm mt-1" dir="ltr" />
                <p className="text-xs text-gray-400 mt-1">مثال: 0 8 * * 0-4</p>
              </div>
              <div>
                <Label className="text-sm">وقت ثابت يومي</Label>
                <Input type="time" value={merged.runAt ?? ''} onChange={e => setForm(f => ({ ...f, runAt: e.target.value }))} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">مهلة التنفيذ (دقائق)</Label>
                <Input type="number" value={merged.timeoutMinutes ?? 30} onChange={e => setForm(f => ({ ...f, timeoutMinutes: parseInt(e.target.value) }))} min={1} max={120} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">عدد إعادة المحاولة</Label>
                <Input type="number" value={merged.retryCount ?? 3} onChange={e => setForm(f => ({ ...f, retryCount: parseInt(e.target.value) }))} min={0} max={10} className="mt-1" dir="ltr" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="window" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">وقت البدء</Label>
                <Input type="time" value={merged.activeFrom ?? ''} onChange={e => setForm(f => ({ ...f, activeFrom: e.target.value }))} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="text-sm">وقت الانتهاء</Label>
                <Input type="time" value={merged.activeTo ?? ''} onChange={e => setForm(f => ({ ...f, activeTo: e.target.value }))} className="mt-1" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">أيام التشغيل</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_AR.map((day, i) => {
                  const active = activeDays.includes(i);
                  return (
                    <button key={i} onClick={() => {
                      const newDays = active ? activeDays.filter(d => d !== i) : [...activeDays, i].sort();
                      setForm(f => ({ ...f, activeDays: newDays.join(',') }));
                    }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="config" className="mt-4">
            <Label className="text-sm">الإعدادات (JSON)</Label>
            <Textarea value={merged.config ?? '{}'} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} className="font-mono text-xs mt-1 h-40" dir="ltr" />
          </TabsContent>
        </Tabs>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onClose(); setForm({}); }}>إلغاء</Button>
          <Button onClick={() => { onSave(service.serviceKey, form); setForm({}); }} className="bg-blue-600 hover:bg-blue-700">حفظ التغييرات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface AutomationDashboardProps {
  title: string; description: string; icon: React.ReactNode; accentColor: string;
  services: ServiceDef[] | undefined; isLoading: boolean; catMeta: CategoryMeta;
  onInitialize: () => void;
  onRunNow:  (key: string) => void;
  onToggle:  (key: string, val: boolean) => void;
  onUpdate:  (key: string, data: Partial<ServiceDef>) => void;
}

export default function AutomationDashboard({
  title, description, icon, accentColor, services, isLoading, catMeta,
  onInitialize, onRunNow, onToggle, onUpdate,
}: AutomationDashboardProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [editService, setEditService]       = useState<ServiceDef | null>(null);
  const [searchQ, setSearchQ]               = useState('');

  const categories = services ? Array.from(new Set(services.map(s => s.category))).sort() : [];
  const filtered   = (services ?? []).filter(s => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchQ   = !searchQ || s.serviceName.includes(searchQ) || s.description?.includes(searchQ) || s.serviceKey.includes(searchQ);
    return matchCat && matchQ;
  });

  const enabledCount = (services ?? []).filter(s => s.isEnabled).length;
  const failedCount  = (services ?? []).filter(s => s.lastRunStatus === 'failed').length;
  const runningCount = (services ?? []).filter(s => s.lastRunStatus === 'running').length;
  const totalRuns    = (services ?? []).reduce((s, sv) => s + (sv.runCount ?? 0), 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${accentColor}`}>{icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{description}</p>
          </div>
        </div>
        <Button onClick={onInitialize} variant="outline" size="sm" className="flex items-center gap-2">
          <Database className="w-4 h-4" /> تهيئة الخدمات
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'مفعّلة',           value: enabledCount,  icon: <Activity className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'قيد التشغيل',     value: runningCount,  icon: <RefreshCw className="w-4 h-4 animate-spin" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'إجمالي التشغيلات', value: totalRuns,    icon: <BarChart3 className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'فشل',              value: failedCount,   icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* البحث والفلاتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="ابحث..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeCategory === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            الكل ({services?.length ?? 0})
          </button>
          {categories.map(cat => {
            const meta  = catMeta[cat];
            const count = (services ?? []).filter(s => s.category === cat).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white border-gray-900' : `bg-white border-gray-200 hover:border-gray-400`}`}>
                {meta?.icon} {meta?.label ?? cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* شبكة الخدمات */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-36 bg-gray-50" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {services?.length === 0 ? 'لا توجد خدمات. انقر على "تهيئة الخدمات".' : 'لا توجد نتائج'}
          </p>
          {services?.length === 0 && <Button onClick={onInitialize} className="mt-4">تهيئة الخدمات</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <ServiceCard key={s.serviceKey} service={s} catMeta={catMeta} onToggle={onToggle} onRunNow={onRunNow} onEdit={setEditService} />
          ))}
        </div>
      )}

      <EditDialog service={editService} open={!!editService} onClose={() => setEditService(null)}
        onSave={(key, data) => { onUpdate(key, data); setEditService(null); }} />
    </div>
  );
}
