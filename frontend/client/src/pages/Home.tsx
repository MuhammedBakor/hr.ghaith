import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  useDashboardSummary,
  usePendingActions,
  useKpiSummary,
} from '@/services/dashboardService';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext, roleLabels, UserRoleType } from '@/contexts/AppContext';
import { Users, FileText, Car, Shield, AlertTriangle, CheckCircle2, TrendingUp, Building2, DollarSign, Scale, MessageSquare, FolderKanban, ChevronRight, Calendar, UserCheck, BarChart3, Loader2, X, AlertCircle, Inbox, ClipboardList, CheckSquare, TrendingDown, Gauge, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const { selectedRole, currentEmployee, selectedBranchId, canAccessModule } = useAppContext();
  const isAdminEntry = (selectedRole === 'admin' || selectedRole === 'general_manager') && selectedBranchId === null;

  const { data: adminCompanies } = useQuery<any[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: isAdminEntry,
    staleTime: 2 * 60 * 1000,
  });

  // ─── Real data for admin global dashboard ─────────────────────────────────
  const { data: allEmployees = [] } = useQuery<any[]>({
    queryKey: ['admin', 'all-employees-home'],
    queryFn: () => api.get('/hr/employees').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: isAdminEntry,
    staleTime: 5 * 60 * 1000,
  });
  const { data: allLeaves = [] } = useQuery<any[]>({
    queryKey: ['admin', 'all-leaves-home'],
    queryFn: () => api.get('/hr/leaves').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: isAdminEntry,
    staleTime: 3 * 60 * 1000,
  });
  const { data: allInvoices = [] } = useQuery<any[]>({
    queryKey: ['admin', 'all-invoices-home'],
    queryFn: () => api.get('/finance/invoices').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: isAdminEntry,
    staleTime: 5 * 60 * 1000,
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayAttendance = [] } = useQuery<any[]>({
    queryKey: ['admin', 'today-att-home', todayStr],
    queryFn: () => api.get('/hr/attendance', { params: { date: todayStr } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: isAdminEntry,
    staleTime: 2 * 60 * 1000,
  });
  // ─── API Calls ────────────────────────────────────────────
  const { data: dashboard, isLoading } = useDashboardSummary(selectedBranchId);
  const { data: pendingActions } = usePendingActions();
  const { data: kpis } = useKpiSummary();

  const stats = dashboard?.stats;
  const systemStatus = (dashboard?.systemStatus ?? 'healthy') as 'healthy' | 'warning' | 'critical';
  const alerts = dashboard?.criticalAlerts ?? [];
  const allModuleHealth = dashboard?.health ?? [];
  // Only count modules with actual issues (warning/critical), not healthy ones
  const moduleIssues = allModuleHealth.filter((m: any) => m.status !== 'healthy');

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
    // Admin entry (no branch selected) — global overview + companies
    if (isAdminEntry) {
      // ── Derived stats from real data ─────────────────────────────────────
      const activeEmpCount = allEmployees.filter((e: any) => e.status === 'active' || e.status === 'ACTIVE').length;
      const pendingLeavesCount = allLeaves.filter((l: any) =>
        ['PENDING', 'PENDING_DEPT_MANAGER', 'PENDING_HR_MANAGER', 'PENDING_GM'].some(s => l.status === s || l.overallStatus === s)
      ).length;
      const presentTodayCount = todayAttendance.filter((a: any) => a.checkIn || a.status === 'PRESENT').length;

      // Employees per branch
      const branchDist = (adminCompanies || []).map((c: any) => {
        const bId = String(c.branchId || c.id);
        const cnt = allEmployees.filter((e: any) => String(e.branch?.id) === bId).length;
        return { name: c.nameAr || c.name, count: cnt };
      });
      const maxBranchEmp = Math.max(...branchDist.map((b: any) => b.count), 1);

      // Recent activities from leave requests
      const recentActs = [...allLeaves]
        .sort((a: any, b: any) => new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime())
        .slice(0, 5);

      const STAT_COLORS: Record<string, string> = { info: '#3B82F6', success: '#22C55E', warning: '#F59E0B', primary: '#2F3440', gold: '#C9A13B' };
      const BRANCH_COLORS = ['#C9A13B', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444'];
      const STATUS_DOT: Record<string, string> = {
        APPROVED: '#22C55E', REJECTED: '#EF4444',
        PENDING: '#F59E0B', PENDING_DEPT_MANAGER: '#F59E0B', PENDING_HR_MANAGER: '#F59E0B', PENDING_GM: '#F59E0B',
      };

      return (
        <div className="space-y-6">

          {/* ── Page title ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: '#2F3440' }}>الإحصائيات العامة</h2>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>نظرة شاملة على أداء جميع المؤسسات والكيانات</p>
            </div>
          </div>

          {/* ── 5 stat tiles (real data) ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'الموظفين',          value: allEmployees.length,        sub: `${activeEmpCount} نشط`,                 color: 'info' },
              { label: 'موظفون نشطون',      value: activeEmpCount,             sub: `${allEmployees.length - activeEmpCount} غير نشط`, color: 'success' },
              { label: 'الطلبات المعلقة',   value: pendingLeavesCount,         sub: `${allLeaves.length} إجمالي الطلبات`,    color: 'warning' },
              { label: 'حضور اليوم',        value: presentTodayCount,          sub: todayStr,                                 color: 'primary' },
              { label: 'الشركات المسجلة',   value: adminCompanies?.length || 0, sub: 'كيانات مسجلة',                         color: 'gold' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-5 hover:shadow-md transition" style={{
                background: '#ffffff',
                border: `1px solid rgba(228,231,236,0.8)`,
                borderBottom: `4px solid ${STAT_COLORS[s.color]}`,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}>
                <h3 className="text-xs font-bold mb-2" style={{ color: '#6b7280' }}>{s.label}</h3>
                <p className="text-2xl md:text-3xl font-black" style={{ color: s.color === 'gold' ? '#C9A13B' : '#2F3440' }}>
                  {s.value.toLocaleString('ar-SA')}
                </p>
                <p className="text-xs mt-1 font-bold" style={{ color: '#9ca3af' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Branch distribution + Recent activities ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid rgba(228,231,236,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 className="font-black text-lg mb-4" style={{ color: '#2F3440' }}>توزيع الموظفين حسب المؤسسة</h3>
              {branchDist.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>لا توجد بيانات</p>
              ) : (
                <div className="space-y-3">
                  {branchDist.map((b: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold truncate max-w-[60%]">{b.name}</span>
                        <span style={{ color: '#6b7280' }}>{b.count} موظف</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: '#f3f4f6' }}>
                        <div className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${maxBranchEmp > 0 ? (b.count / maxBranchEmp) * 100 : 0}%`, background: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid rgba(228,231,236,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 className="font-black text-lg mb-4" style={{ color: '#2F3440' }}>آخر الأنشطة</h3>
              {recentActs.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>لا توجد أنشطة حديثة</p>
              ) : (
                <div className="space-y-0">
                  {recentActs.map((act: any, i: number) => {
                    const status = act.overallStatus || act.status || 'PENDING';
                    const dot = STATUS_DOT[status] || '#6b7280';
                    const empName = [act.employee?.firstName, act.employee?.lastName].filter(Boolean).join(' ') || 'موظف';
                    const typeLabel = act.leaveType || act.type || 'إجازة';
                    const dateStr = act.createdAt
                      ? new Date(act.createdAt).toLocaleDateString('ar-SA')
                      : (act.startDate || '');
                    return (
                      <div key={i} className="flex items-center gap-3 py-2.5"
                        style={{ borderBottom: i < recentActs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#2F3440' }}>طلب {typeLabel} — {empName}</p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>{dateStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      );
    }

    const commonProps = { stats, pendingActions, kpis, moduleIssues, user, roleLabel: roleLabels[selectedRole], currentEmployee };

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
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>إحصاءات النظام</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {canAccessModule('hr') && <StatCard
              title="الموظفون النشطون"
              value={stats?.hr.active ?? 0}
              sub={`${stats?.hr.pendingLeaves ?? 0} إجازة معلقة`}
              icon={Users} color="blue" link="/hr/employees"
              alert={(stats?.hr.pendingLeaves ?? 0) > 15}
            />}
            {canAccessModule('finance') && <StatCard
              title="فواتير متأخرة"
              value={stats?.finance.overdue ?? 0}
              sub={`${stats?.finance.totalInvoices ?? 0} إجمالي الفواتير`}
              icon={DollarSign} color="red" link="/finance/invoices"
              alert={(stats?.finance.overdue ?? 0) > 0}
            />}
            {canAccessModule('fleet') && <StatCard
              title="مركبات متاحة"
              value={stats?.fleet.available ?? 0}
              sub={`${stats?.fleet.inMaintenance ?? 0} في الصيانة`}
              icon={Car} color="orange" link="/fleet/vehicles"
              alert={(stats?.fleet.inMaintenance ?? 0) > 3}
            />}
            {canAccessModule('support') && <StatCard
              title="تذاكر مفتوحة"
              value={stats?.support.open ?? 0}
              sub={`${stats?.support.critical ?? 0} حرجة`}
              icon={MessageSquare} color="yellow" link="/support/tickets"
              alert={(stats?.support.critical ?? 0) > 0}
            />}
            {canAccessModule('legal') && <StatCard
              title="قضايا قانونية"
              value={stats?.legal.openCases ?? 0}
              sub={`${stats?.legal.expiringContracts ?? 0} عقد ينتهي قريباً`}
              icon={Scale} color="purple" link="/legal"
              alert={(stats?.legal.expiringContracts ?? 0) > 0}
            />}
            {canAccessModule('projects') && <StatCard
              title="مشاريع نشطة"
              value={stats?.projects.active ?? 0}
              sub={`${stats?.projects.overdue ?? 0} متأخرة`}
              icon={FolderKanban} color="indigo" link="/projects"
              alert={(stats?.projects.overdue ?? 0) > 0}
            />}
          </div>
        </div>

        {/* ─── Secondary Stats Row ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {canAccessModule('hr') && <StatCard
            title="موظفون جدد (هذا الشهر)"
            value={stats?.hr.monthHires ?? 0}
            icon={UserCheck} color="green" link="/hr/employees"
          />}
          {canAccessModule('governance') && <StatCard
            title="طلبات اعتماد معلقة"
            value={stats?.governance.pendingApprovals ?? 0}
            icon={CheckSquare} color="blue" link="/governance"
            alert={(stats?.governance.pendingApprovals ?? 0) > 5}
          />}
          {canAccessModule('property') && <StatCard
            title="وحدات عقارية"
            value={stats?.property.total ?? 0}
            sub={`${stats?.property.vacant ?? 0} شاغرة`}
            icon={Building2} color="teal" link="/property"
          />}
          {canAccessModule('governance') && <StatCard
            title="مخاطر مفتوحة"
            value={stats?.governance.openRisks ?? 0}
            icon={Shield} color="red" link="/governance"
            alert={(stats?.governance.openRisks ?? 0) > 0}
          />}
        </div>

        {/* ─── Quick Actions & Pending Actions ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-4 md:p-5" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgb(201, 168, 76)' }}>الوصول السريع</h2>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {canAccessModule('hr') && <QuickAction icon={Users} label="الموظفون" link="/hr/employees" color="blue" count={stats?.hr.active} />}
              {canAccessModule('hr') && <QuickAction icon={FileText} label="الإجازات" link="/hr/leaves" color="green" count={stats?.hr.pendingLeaves} />}
              {canAccessModule('finance') && <QuickAction icon={DollarSign} label="الفواتير" link="/finance/invoices" color="teal" count={stats?.finance.overdue} />}
              {canAccessModule('fleet') && <QuickAction icon={Car} label="الأسطول" link="/fleet/vehicles" color="orange" count={stats?.fleet.inMaintenance} />}
              {canAccessModule('support') && <QuickAction icon={MessageSquare} label="الدعم الفني" link="/support/tickets" color="yellow" count={stats?.support.critical} />}
              {canAccessModule('legal') && <QuickAction icon={Scale} label="القانونية" link="/legal" color="purple" count={stats?.legal.expiringContracts} />}
              {canAccessModule('projects') && <QuickAction icon={FolderKanban} label="المشاريع" link="/projects" color="indigo" count={stats?.projects.overdue} />}
              {canAccessModule('property') && <QuickAction icon={Building2} label="العقارات" link="/property" color="pink" />}
              {canAccessModule('governance') && <QuickAction icon={Shield} label="الحوكمة" link="/governance" color="red" count={stats?.governance.pendingApprovals} />}
              {canAccessModule('requests') && <QuickAction icon={ClipboardList} label="الطلبات" link="/departments/requests" color="gray" count={pendingActions?.total} />}
              <QuickAction icon={Inbox} label="البريد الوارد" link="/inbox" color="blue" />
              {canAccessModule('bi') && <QuickAction icon={BarChart3} label="التقارير" link="/bi" color="green" />}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgb(201, 168, 76)' }}>يحتاج إجراءك</h2>
            <div className="space-y-1">
              {pendingActions?.items?.map((item: any, i: number) => (
                <PendingActionRow key={i} item={item} />
              ))}
              {(!pendingActions?.items || pendingActions.items.length === 0) && (
                <div className="py-10 text-center" style={{ color: 'rgba(0,0,0,0.45)' }}>لا إجراءات معلقة</div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Module Health + KPIs ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgb(201, 168, 76)' }}>صحة الوحدات</h2>
            <div className="space-y-3">
              {allModuleHealth.length > 0 ? (
                allModuleHealth.map((mod: any, i: number) => (
                  <ModuleHealthBadge key={i} status={mod.status} name={mod.nameAr} />
                ))
              ) : (
                <div className="py-8 text-center font-medium" style={{ color: 'rgba(0,0,0,0.7)' }}>جميع الوحدات تعمل بشكل طبيعي</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 6px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgb(201, 168, 76)' }}>مؤشرات الأسبوع</h2>
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
              <div className="py-10 text-center text-gray-400">جاري التحميل...</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-3 md:px-4 py-4 md:py-6">
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

