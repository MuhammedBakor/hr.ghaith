/**
 * ════════════════════════════════════════════════════════════════════════
 * HOME v5 — لوحة التحكم الرئيسية الذكية الشاملة
 * بيانات حقيقية • إحصاءات حية • بحث شامل • تنبيهات فورية • تكامل كامل
 * ════════════════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  useDashboardSummary,
  usePendingActions,
  useKpiSummary,
  useQuickSearch
} from '@/services/dashboardService';
import { useAuth } from '@/_core/hooks/useAuth';
import { Users, FileText, Car, Shield, AlertTriangle, CheckCircle2, TrendingUp, Search, Settings, Building2, DollarSign, Scale, MessageSquare, FolderKanban, RefreshCw, ChevronRight, Calendar, UserCheck, BarChart3, Loader2, X, AlertCircle, Inbox, ClipboardList, CheckSquare, TrendingDown, Gauge, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════════════════════════
function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;
    let startTime: number | null = null;
    const animate = (t: number) => {
      if (!startTime) startTime = t;
      const p = Math.min((t - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = end;
  }, [value, duration]);
  return <span>{display.toLocaleString('ar-SA')}</span>;
}

// ═══════════════════════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════════════════════
function StatusDot({ status }: { status: 'healthy' | 'warning' | 'critical' | 'unknown' }) {
  const map = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-400 animate-pulse',
    critical: 'bg-red-500 animate-pulse',
    unknown: 'bg-gray-400',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />;
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'teal' | 'orange' | 'pink' | 'gray';
interface StatCardProps {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: ColorKey;
  link?: string;
  alert?: boolean;
  trend?: number;
  trendLabel?: string;
  badge?: string;
}

const COLOR_MAP: Record<ColorKey, { bg: string; icon: string; border: string; gradient: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-500 to-blue-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100', gradient: 'from-green-500 to-emerald-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100', gradient: 'from-red-500 to-rose-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100', gradient: 'from-yellow-400 to-orange-500' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100', gradient: 'from-purple-500 to-violet-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-500 to-blue-600' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-100', gradient: 'from-teal-500 to-cyan-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100', gradient: 'from-orange-500 to-amber-600' },
  pink: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-100', gradient: 'from-pink-500 to-rose-600' },
  gray: { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-100', gradient: 'from-gray-500 to-gray-600' },
};

function StatCard({ title, value, sub, icon: Icon, color = 'blue', link, alert, trend, trendLabel, badge }: StatCardProps) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

  const content = (
    <div className={cn(
      'bg-white rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden',
      alert ? 'border-red-200 shadow-red-50/50 shadow-md' : `${c.border} hover:border-opacity-70`,
    )}>
      {alert && (
        <div className="absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-t-2xl" />
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-6 h-6', c.icon)} />
        </div>
        <div className="flex items-center gap-2">
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          {alert && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
          {link && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {trend !== undefined && trend !== 0 && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-500')}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% {trendLabel ?? 'هذا الشهر'}
        </div>
      )}
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

// ═══════════════════════════════════════════════════════════
// ALERT BANNER
// ═══════════════════════════════════════════════════════════
function AlertBanner({ message, module, link, severity }: {
  message: string; module: string; link: string; severity: 'error' | 'warning';
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border text-sm',
      severity === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-amber-50 border-amber-200 text-amber-800',
    )}>
      <AlertTriangle className={cn('w-4 h-4 shrink-0', severity === 'error' ? 'text-red-500' : 'text-amber-500')} />
      <span className="flex-1">{message}</span>
      <Link href={link} className={cn('text-xs font-medium underline shrink-0', severity === 'error' ? 'text-red-600' : 'text-amber-700')}>
        عرض
      </Link>
      <button onClick={() => setDismissed(true)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MODULE HEALTH CARD
// ═══════════════════════════════════════════════════════════
function ModuleHealthBadge({ status, name }: { status: 'healthy' | 'warning' | 'critical' | 'unknown'; name: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium',
      status === 'healthy' ? 'bg-green-50 border-green-100 text-green-700' :
        status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
          status === 'critical' ? 'bg-red-50 border-red-100 text-red-700' :
            'bg-gray-50 border-gray-100 text-gray-600',
    )}>
      <StatusDot status={status} />
      {name}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════
function QuickAction({ icon: Icon, label, link, color = 'blue', count: countNum }: {
  icon: React.ComponentType<{ className?: string }>; label: string; link: string; color?: ColorKey; count?: number;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <Link href={link}>
      <div className={cn(
        'group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md relative',
        c.border, c.bg, 'hover:scale-[1.03]',
      )}>
        {countNum !== undefined && countNum > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {countNum > 99 ? '99+' : countNum}
          </span>
        )}
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════
// SEARCH RESULT ITEM
// ═══════════════════════════════════════════════════════════
function SearchResult({ result, onClose }: {
  result: { id: number | string; type: string; module: string; title: string; subtitle?: string; link: string; badge?: string; badgeColor?: string };
  onClose: () => void;
}) {
  const moduleColors: Record<string, ColorKey> = {
    hr: 'blue', finance: 'green', fleet: 'orange', support: 'yellow',
    legal: 'purple', projects: 'indigo', property: 'teal', admin: 'gray',
  };
  const color = moduleColors[result.module] ?? 'gray';
  const c = COLOR_MAP[color];

  return (
    <Link href={result.link} onClick={onClose}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
          <span className={cn('text-xs font-bold', c.icon)}>{result.module.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
          {result.subtitle && <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>}
        </div>
        {result.badge && (
          <Badge variant="secondary" className="text-xs shrink-0">{result.badge}</Badge>
        )}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════
// PENDING ACTION ROW
// ═══════════════════════════════════════════════════════════
function PendingActionRow({ item }: {
  item: { type: string; id: number; title: string; priority: string; link: string; createdAt: string | Date };
}) {
  const priorityConfig: Record<string, { color: string; label: string }> = {
    critical: { color: 'text-red-600 bg-red-50 border-red-100', label: 'حرج' },
    high: { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'عالي' },
    medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-100', label: 'متوسط' },
    low: { color: 'text-gray-600 bg-gray-50 border-gray-100', label: 'منخفض' },
  };
  const pc = priorityConfig[item.priority] ?? priorityConfig.medium;

  return (
    <Link href={item.link}>
      <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
        <div className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0', pc.color)}>
          {pc.label}
        </div>
        <p className="flex-1 text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{item.title}</p>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════
// SYSTEM STATUS BAR
// ═══════════════════════════════════════════════════════════
function SystemStatusBar({ systemStatus }: { systemStatus: 'healthy' | 'warning' | 'critical' }) {
  if (systemStatus === 'healthy') return null;
  return (
    <div className={cn(
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border',
      systemStatus === 'critical'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-amber-50 border-amber-200 text-amber-800',
    )}>
      <Radio className={cn('w-4 h-4', systemStatus === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500')} />
      {systemStatus === 'critical' ? 'النظام يواجه مشكلة حرجة — يرجى التواصل مع الدعم الفني' : 'بعض الوحدات تحتاج انتباهاً'}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ─── API Calls ────────────────────────────────────────────
  const { data: dashboard, isLoading, refetch } = useDashboardSummary();

  const { data: pendingActions } = usePendingActions();

  const { data: searchResults, isLoading: searchLoading } = useQuickSearch(debouncedQuery);

  const { data: kpis } = useKpiSummary();

  const handleRefresh = () => {
    refetch();
    setRefreshKey(k => k + 1);
  };

  const stats = dashboard?.stats;
  const systemStatus = (dashboard?.systemStatus ?? 'healthy') as 'healthy' | 'warning' | 'critical';
  const alerts = dashboard?.criticalAlerts ?? [];
  const moduleIssues = dashboard?.health ?? [];

  // ─── Quick Actions Config ─────────────────────────────────
  const quickActions: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; link: string; color: ColorKey; count?: number }> = [
    { icon: Users, label: 'الموظفون', link: '/hr/employees', color: 'blue', count: stats?.hr.active },
    { icon: FileText, label: 'الإجازات', link: '/hr/leaves', color: 'green', count: stats?.hr.pendingLeaves },
    { icon: DollarSign, label: 'الفواتير', link: '/finance/invoices', color: 'teal', count: stats?.finance.overdue },
    { icon: Car, label: 'الأسطول', link: '/fleet/vehicles', color: 'orange', count: stats?.fleet.inMaintenance },
    { icon: MessageSquare, label: 'الدعم الفني', link: '/support/tickets', color: 'yellow', count: stats?.support.critical },
    { icon: Scale, label: 'القانونية', link: '/legal', color: 'purple', count: stats?.legal.expiringContracts },
    { icon: FolderKanban, label: 'المشاريع', link: '/projects', color: 'indigo', count: stats?.projects.overdue },
    { icon: Building2, label: 'العقارات', link: '/property', color: 'pink' },
    { icon: Shield, label: 'الحوكمة', link: '/governance', color: 'red', count: stats?.governance.pendingApprovals },
    { icon: ClipboardList, label: 'الطلبات', link: '/requests', color: 'gray', count: pendingActions?.total },
    { icon: Inbox, label: 'البريد الوارد', link: '/inbox', color: 'blue' },
    { icon: BarChart3, label: 'التقارير', link: '/bi', color: 'green' },
  ];

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Welcome */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">
              {greetingTime()}، {user?.username?.split(' ')[0] ?? 'مرحباً'} 👋
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Global Search */}
          <div ref={searchRef} className="relative w-72 hidden md:block">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length >= 2); }}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                placeholder="بحث شامل... (Ctrl+K)"
                className="pe-10 ps-14 text-sm bg-gray-50 border-gray-200 focus:bg-white"
              />
              <kbd className="absolute start-3 top-1/2 -translate-y-1/2 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>

            {/* Search Dropdown */}
            {showSearch && (
              <div className="absolute top-full end-0 start-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-6 gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري البحث...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-gray-500 font-medium">{searchResults.length} نتيجة</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                      {searchResults.map((r, i) => (
                        <SearchResult key={r.id ?? `SearchResult-${i}`} result={r} onClose={() => { setShowSearch(false); setSearchQuery(''); }} />
                      ))}
                    </div>
                  </>
                ) : debouncedQuery.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                    <Search className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">لا نتائج لـ "{debouncedQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="تحديث" aria-label="إعدادات">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="الإعدادات" aria-label="تقويم">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        {/* System Status */}
        <SystemStatusBar systemStatus={systemStatus} />

        {/* Critical Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <AlertBanner key={alert.id ?? `AlertBanner-${i}`} {...alert} />
            ))}
          </div>
        )}

        {/* ─── Main KPI Stats Grid ─────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">إحصاءات النظام</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <StatCard
              title="الموظفون النشطون"
              value={stats?.hr.active ?? 0}
              sub={`${stats?.hr.pendingLeaves ?? 0} إجازة معلقة`}
              icon={Users} color="blue" link="/hr/employees"
              alert={(stats?.hr.pendingLeaves ?? 0) > 15}
            />
            <StatCard
              title="فواتير متأخرة"
              value={stats?.finance.overdue ?? 0}
              sub={`${stats?.finance.totalInvoices ?? 0} إجمالي الفواتير`}
              icon={DollarSign} color="red" link="/finance/invoices"
              alert={(stats?.finance.overdue ?? 0) > 0}
            />
            <StatCard
              title="مركبات متاحة"
              value={stats?.fleet.available ?? 0}
              sub={`${stats?.fleet.inMaintenance ?? 0} في الصيانة`}
              icon={Car} color="orange" link="/fleet/vehicles"
              alert={(stats?.fleet.inMaintenance ?? 0) > 3}
            />
            <StatCard
              title="تذاكر مفتوحة"
              value={stats?.support.open ?? 0}
              sub={`${stats?.support.critical ?? 0} حرجة`}
              icon={MessageSquare} color="yellow" link="/support/tickets"
              alert={(stats?.support.critical ?? 0) > 0}
            />
            <StatCard
              title="قضايا قانونية"
              value={stats?.legal.openCases ?? 0}
              sub={`${stats?.legal.expiringContracts ?? 0} عقد ينتهي قريباً`}
              icon={Scale} color="purple" link="/legal"
              alert={(stats?.legal.expiringContracts ?? 0) > 0}
            />
            <StatCard
              title="مشاريع نشطة"
              value={stats?.projects.active ?? 0}
              sub={`${stats?.projects.overdue ?? 0} متأخرة`}
              icon={FolderKanban} color="indigo" link="/projects"
              alert={(stats?.projects.overdue ?? 0) > 0}
            />
          </div>
        </div>

        {/* ─── Secondary Stats Row ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="موظفون جدد (هذا الشهر)"
            value={stats?.hr.monthHires ?? 0}
            icon={UserCheck} color="green" link="/hr/employees"
          />
          <StatCard
            title="طلبات اعتماد معلقة"
            value={stats?.governance.pendingApprovals ?? 0}
            icon={CheckSquare} color="blue" link="/governance"
            alert={(stats?.governance.pendingApprovals ?? 0) > 5}
          />
          <StatCard
            title="وحدات عقارية"
            value={stats?.property.total ?? 0}
            sub={`${stats?.property.vacant ?? 0} شاغرة`}
            icon={Building2} color="teal" link="/property"
          />
          <StatCard
            title="مخاطر مفتوحة"
            value={stats?.governance.openRisks ?? 0}
            icon={Shield} color="red" link="/governance"
            alert={(stats?.governance.openRisks ?? 0) > 0}
          />
        </div>

        {/* ─── Quick Actions & Pending Actions ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">الوصول السريع</h2>
              <Badge variant="secondary" className="text-xs">{quickActions.length} رابط</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:grid-cols-6 gap-3">
              {quickActions.map((action, i) => (
                <QuickAction key={`QuickAction-${i}`} {...action} />
              ))}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">يحتاج إجراءك</h2>
              {pendingActions && pendingActions.total > 0 && (
                <Badge className="text-xs bg-red-500">{pendingActions.total?.toLocaleString()}</Badge>
              )}
            </div>
            {pendingActions?.items && pendingActions?.items?.length > 0 ? (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {pendingActions?.items?.map((item, i) => (
                  <PendingActionRow key={item.id ?? `PendingActionRow-${i}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckCircle2 className="w-10 h-10 mb-2 text-green-400" />
                <p className="text-sm font-medium text-gray-500">لا إجراءات معلقة</p>
                <p className="text-xs text-gray-400">كل شيء على ما يرام!</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Module Health + KPIs ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Health */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">صحة الوحدات</h2>
              <div className="flex items-center gap-2">
                <StatusDot status={systemStatus} />
                <span className="text-xs text-gray-500 font-medium capitalize">{systemStatus}</span>
              </div>
            </div>
            {moduleIssues.length > 0 ? (
              <div className="space-y-3">
                {moduleIssues.map((mod, i) => (
                  <div key={mod.id ?? `div-${i}`} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border',
                    mod.status === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100',
                  )}>
                    <StatusDot status={mod.status as any} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{mod.nameAr}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mod?.issues?.map((issue, j) => (
                          <span key={`span-${j}`} className="text-xs text-gray-600">{issue}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Gauge className="w-10 h-10 mb-2 text-green-400" />
                <p className="text-sm font-medium text-green-600">جميع الوحدات تعمل بشكل طبيعي</p>
              </div>
            )}
          </div>

          {/* Weekly KPIs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">مؤشرات هذا الأسبوع</h2>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            {kpis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500">تذاكر جديدة</p>
                    <p className="text-2xl font-bold text-blue-700">{kpis.week?.newTickets ?? 0}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-gray-500">تم حلها</p>
                    <p className="text-2xl font-bold text-green-600">{kpis.week?.resolvedTickets ?? 0}</p>
                  </div>
                </div>

                {kpis.week?.newTickets > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">معدل الحل</span>
                      <span className="font-medium text-gray-700">{kpis?.week?.ticketResolutionRate}%</span>
                    </div>
                    <Progress value={kpis?.week?.ticketResolutionRate} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-800">{kpis.current?.pendingRequests ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">طلبات معلقة</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-indigo-600">{kpis.current?.activeProjects ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">مشاريع نشطة</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-gray-400 pb-4">
          <span>ERP System — نظام المؤسسة المتكامل</span>
          <span>تحديث تلقائي كل دقيقة • {new Date().toLocaleTimeString('ar-SA')}</span>
        </div>
      </div>
    </div>
  );
}
