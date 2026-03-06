import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  useDashboardSummary,
  usePendingActions,
  useKpiSummary,
  useQuickSearch
} from '@/services/dashboardService';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext, roleLabels, UserRoleType } from '@/contexts/AppContext';
import { Users, FileText, Car, Shield, AlertTriangle, CheckCircle2, TrendingUp, Search, Settings, Building2, DollarSign, Scale, MessageSquare, FolderKanban, RefreshCw, ChevronRight, Calendar, UserCheck, BarChart3, Loader2, X, AlertCircle, Inbox, ClipboardList, CheckSquare, TrendingDown, Gauge, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Import shared elements
import {
  StatCard,
  QuickAction,
  PendingActionRow,
  SystemStatusBar,
  StatusDot,
  ModuleHealthBadge,
  ColorKey
} from '@/components/dashboard_elements';

// Import Role Dashboards
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { AgentDashboard } from '@/components/dashboard/AgentDashboard';

// ═══════════════════════════════════════════════════════════
// SEARCH RESULT ITEM
// ═══════════════════════════════════════════════════════════
function SearchResult({ result, onClose }: {
  result: { id: number | string; type: string; module: string; title: string; subtitle?: string; link: string; badge?: string; badgeColor?: string };
  onClose: () => void;
}) {
  const COLOR_MAP_LOCAL: any = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600' },
    gray: { bg: 'bg-gray-50', icon: 'text-gray-600' },
  };

  const moduleColors: Record<string, string> = {
    hr: 'blue', finance: 'green', fleet: 'orange', support: 'yellow',
    legal: 'purple', projects: 'indigo', property: 'teal', admin: 'gray',
  };
  const color = moduleColors[result.module] ?? 'gray';
  const c = COLOR_MAP_LOCAL[color];

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
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Home() {
  const { user } = useAuth();
  const { selectedRole } = useAppContext();
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

  // Determine which dashboard to show
  const renderDashboard = () => {
    const commonProps = { stats, pendingActions, kpis, moduleIssues, user, roleLabel: roleLabels[selectedRole] };

    // Managers
    if (['hr_manager', 'finance_manager', 'fleet_manager', 'legal_manager', 'projects_manager', 'store_manager', 'department_manager'].includes(selectedRole)) {
      return <ManagerDashboard {...commonProps} />;
    }

    // Supervisor
    if (selectedRole === 'supervisor') {
      return <SupervisorDashboard {...commonProps} />;
    }

    // Agent
    if (selectedRole === 'agent') {
      return <AgentDashboard {...commonProps} />;
    }

    // Employee
    if (selectedRole === 'employee') {
      return <EmployeeDashboard {...commonProps} />;
    }

    // Default: Admin/Full Dashboard
    return (
      <div className="space-y-6">
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">الوصول السريع</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <QuickAction icon={Users} label="الموظفون" link="/hr/employees" color="blue" count={stats?.hr.active} />
              <QuickAction icon={FileText} label="الإجازات" link="/hr/leaves" color="green" count={stats?.hr.pendingLeaves} />
              <QuickAction icon={DollarSign} label="الفواتير" link="/finance/invoices" color="teal" count={stats?.finance.overdue} />
              <QuickAction icon={Car} label="الأسطول" link="/fleet/vehicles" color="orange" count={stats?.fleet.inMaintenance} />
              <QuickAction icon={MessageSquare} label="الدعم الفني" link="/support/tickets" color="yellow" count={stats?.support.critical} />
              <QuickAction icon={Scale} label="القانونية" link="/legal" color="purple" count={stats?.legal.expiringContracts} />
              <QuickAction icon={FolderKanban} label="المشاريع" link="/projects" color="indigo" count={stats?.projects.overdue} />
              <QuickAction icon={Building2} label="العقارات" link="/property" color="pink" />
              <QuickAction icon={Shield} label="الحوكمة" link="/governance" color="red" count={stats?.governance.pendingApprovals} />
              <QuickAction icon={ClipboardList} label="الطلبات" link="/requests" color="gray" count={pendingActions?.total} />
              <QuickAction icon={Inbox} label="البريد الوارد" link="/inbox" color="blue" />
              <QuickAction icon={BarChart3} label="التقارير" link="/bi" color="green" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">يحتاج إجراءك</h2>
            <div className="space-y-1">
              {pendingActions?.items?.map((item: any, i: number) => (
                <PendingActionRow key={i} item={item} />
              ))}
              {(!pendingActions?.items || pendingActions.items.length === 0) && (
                <div className="py-10 text-center text-gray-400">لا إجراءات معلقة</div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Module Health + KPIs ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">صحة الوحدات</h2>
            <div className="space-y-3">
              {moduleIssues.length > 0 ? (
                moduleIssues.map((mod: any, i: number) => (
                  <ModuleHealthBadge key={i} status={mod.status} name={mod.nameAr} />
                ))
              ) : (
                <div className="py-8 text-center text-green-600 font-medium">جميع الوحدات تعمل بشكل طبيعي</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">مؤشرات الأسبوع</h2>
            {kpis ? (
              <div className="space-y-6">
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
                <Progress value={kpis?.week?.ticketResolutionRate} className="h-2" />
              </div>
            ) : (
              <div className="py-10 text-center text-gray-300">جاري التحميل...</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">
              {greetingTime()}، {user?.username?.split(' ')[0] ?? 'مرحباً'} 👋
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

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

            {showSearch && (
              <div className="absolute top-full end-0 start-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {searchLoading ? (
                  <div className="p-6 text-center text-sm text-gray-500">جاري البحث...</div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((r: any, i: number) => (
                    <SearchResult key={i} result={r} onClose={() => { setShowSearch(false); setSearchQuery(''); }} />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">لا نتائج لـ "{debouncedQuery}"</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        {renderDashboard()}

        {/* ─── Footer ─────────────────────────────────────── */}
        <div className="mt-12 flex items-center justify-between text-xs text-gray-400 pb-4">
          <span>ERP System — نظام المؤسسة المتكامل</span>
          <span>تحديث تلقائي كل دقيقة • {new Date().toLocaleTimeString('ar-SA')}</span>
        </div>
      </div>
    </div>
  );
}

