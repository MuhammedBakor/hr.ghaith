import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, Lock, AlertTriangle, Ban, Eye, Activity, Zap, CheckCircle2, Clock, RefreshCw, Loader2, Server, Globe, BarChart3, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function StatBlock({ label, value, icon: Icon, color = 'blue' }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color?: string; }) {
  const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600', orange: 'bg-orange-50 text-orange-600' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colors[color] ?? colors.blue)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = { critical: 'bg-red-100 text-red-700 border-red-200', high: 'bg-orange-100 text-orange-700 border-orange-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-gray-100 text-gray-600 border-gray-200' };
  const labels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' };
  return <Badge className={cn('border text-xs font-medium', map[severity] ?? map.low)}>{labels[severity] ?? severity}</Badge>;
}

function EventTypeTag({ type }: { type: string }) {
  const labels: Record<string, string> = { rate_limit: 'تجاوز الحد', brute_force: 'محاولة اختراق', ban: 'حظر IP', suspicious: 'نشاط مشبوه', anomaly: 'شذوذ', auth_fail: 'فشل دخول', auth_success: 'دخول ناجح' };
  return <span className="text-xs text-gray-600">{labels[type] ?? type}</span>;
}

export default function SecurityDashboard() {
  const [searchIP, setSearchIP] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const { data: stats, isLoading, refetch } = useQuery({ queryKey: ['integration', 'securityOverview'], queryFn: () => api.get('/integration/security-overview').then(r => r.data), refetchInterval: 30_000 });
  const { data: events = [] } = useQuery({ queryKey: ['integration', 'securityEvents'], queryFn: () => api.get('/integration/security-events', { params: { limit: 100 } }).then(r => r.data), refetchInterval: 15_000 });
  const { data: health } = useQuery({ queryKey: ['integration', 'systemHealth'], queryFn: () => api.get('/integration/system-health').then(r => r.data), refetchInterval: 60_000 });

  const unbanIP = useMutation({
    mutationFn: (data: { ip: string }) => api.post('/admin/security/unban-ip', data).then(r => r.data),
    onSuccess: () => {
      refetch();
      toast.success('تم رفع الحظر بنجاح');
    },
    onError: (e: any) => toast.error(e?.message || 'حدث خطأ')
  });

  const last24h = stats?.last24h ?? {};
  const last1h = stats?.last1h ?? {};
  const filteredEvents = searchIP ? events.filter((e: any) => JSON.stringify(e).includes(searchIP)) : events;
  const criticalCount = events.filter((e: any) => e.severity === 'critical').length;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-500">تحميل بيانات الأمان...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">لوحة الأمان</h1>
              <p className="text-xs text-gray-500">مراقبة أمنية في الوقت الحقيقي</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && <Badge className="bg-red-500 text-white animate-pulse">{criticalCount} حدث حرج</Badge>}
            <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" />تحديث
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatBlock label="Rate Limit (آخر ساعة)" value={last1h.rate_limit ?? 0} icon={Zap} color="yellow" />
          <StatBlock label="محاولات اختراق (24h)" value={last24h.brute_force ?? 0} icon={Lock} color="red" />
          <StatBlock label="IPs محظورة" value={stats?.blockedIPs ?? 0} icon={Ban} color="red" />
          <StatBlock label="IPs مشبوهة" value={stats?.suspiciousIPs ?? 0} icon={AlertTriangle} color="orange" />
          <StatBlock label="إجمالي حوادث (24h)" value={Object.values(last24h).reduce((a, b) => a + Number(b), 0)} icon={Activity} color="blue" />
          <StatBlock label="الحالة الأمنية" value={health?.status === 'healthy' ? 'آمن' : 'تحذير'} icon={Shield} color={health?.status === 'healthy' ? 'green' : 'red'} />
        </div>

        {stats?.blockedIPsList && stats?.blockedIPsList?.length > 0 && (
          <Card className="border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                IPs محظورة ({stats?.blockedIPsList?.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.blockedIPsList?.slice(0, 10).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-red-400" />
                      <span className="font-mono text-sm text-red-800">{item.ip}</span>
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">نقاط: {item.score}</Badge>
                    </div>
                    <Button disabled={unbanIP.isPending} size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600" onClick={() => unbanIP.mutate({ ip: item.ip })}>
                      رفع الحظر
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                توزيع الحوادث (24 ساعة)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(last24h).length > 0 ? Object.entries(last24h).map(([type, count]) => {
                const total = Math.max(...Object.values(last24h).map(v => Number(v)), 1);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <EventTypeTag type={type} />
                      <span className="font-medium">{String(count)}</span>
                    </div>
                    <Progress value={Math.round((Number(count) / total) * 100)} className="h-1.5" />
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-green-400" />
                  <p className="text-sm">لا حوادث في 24 ساعة</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                آخر ساعة — لقطة أمنية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(last1h).length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-green-400" />
                  <p className="text-sm">النظام آمن خلال الساعة الماضية</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(last1h).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-xl border bg-amber-50 border-amber-100">
                      <EventTypeTag type={type} />
                      <Badge className={cn('text-xs font-bold', Number(count) > 10 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700')}>{String(count)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                سجل الأحداث الأمنية
                <Badge variant="secondary" className="text-xs">{filteredEvents.length}</Badge>
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input value={searchIP} onChange={e => setSearchIP(e.target.value)} placeholder="فلترة..." className="pe-9 h-8 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredEvents.slice(0, 100).map((event: any, i: number) => (
                <div key={i}
                  className={cn('rounded-xl border p-3 cursor-pointer', event.severity === 'critical' ? 'bg-red-50 border-red-100' : event.severity === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100 hover:bg-gray-50')}
                  onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={event.severity} />
                    <EventTypeTag type={event.type} />
                    <span className="font-mono text-xs text-gray-500 truncate flex-1">{event.ip ?? 'N/A'}</span>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(event.timestamp).toLocaleTimeString('ar-SA')}</span>
                    {expandedEvent === i ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                  {expandedEvent === i && (
                    <div className="mt-2 p-2 bg-white/70 rounded-lg">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">{JSON.stringify({ details: event.details }, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Shield className="w-8 h-8 mb-2 text-green-400" />
                  <p className="text-sm">لا أحداث أمنية</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {health && (
          <Card className="border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4 text-blue-500" />صحة النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className={cn('text-3xl font-bold', health.score >= 70 ? 'text-green-600' : 'text-red-600')}>{health.score}/100</p>
                  <p className="text-xs text-gray-500">نقاط الصحة</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">{Math.floor(health.uptime / 60)}م</p>
                  <p className="text-xs text-gray-500">وقت التشغيل</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">{health.memory?.usagePercent?.toFixed(0) ?? 0}%</p>
                  <p className="text-xs text-gray-500">الذاكرة</p>
                </div>
                <div>
                  <p className={cn('text-3xl font-bold', health.status === 'healthy' ? 'text-green-600' : 'text-amber-600')}>
                    {health.status === 'healthy' ? 'سليم' : 'تحذير'}
                  </p>
                  <p className="text-xs text-gray-500">الحالة</p>
                </div>
              </div>
              {health.issues?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {health?.issues?.map((issue: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{issue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
