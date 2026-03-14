import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { departmentsData, labelByPath, deptByPath } from '@/data/departmentsData';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  Building2,
  CreditCard,
  FileStack,
  BarChart3,
  Truck,
  ShieldCheck,
  Activity,
  LineChart,
  Link as LinkIcon,
  Home,
  Shield,
  Grid3X3,
  ChevronDown,
  ChevronLeft,
  Clock,
  Calendar,
  DollarSign,
  GraduationCap,
  Target,
  Network,
  UserPlus,
  Receipt,
  Wallet,
  PieChart,
  Car,
  Wrench,
  Fuel,
  MapPin,
  User,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  Building,
  FileSignature,
  Users2,
  Hammer,
  TrendingUp,
  FileBarChart,
  FolderOpen,
  Archive,
  ListTodo,
  GitBranch,
  FilePlus,
  CalendarClock,
  UserCog,
  KeyRound,
  ScrollText,
  Cog,
  Search,
  BellRing,
  Database,
  Mail,
  MessageSquare,
  Scale,
  Briefcase,
  Megaphone,
  ShoppingCart,
  Package,
  Globe,
  BookOpen,
  CheckCircle,
  Send,
  LogOut,
  Ticket,
  Hash,
  FolderTree,
  Cpu,
  Zap,
  Lock,
  UserCheck,
  ClipboardList,
  ArrowRightLeft,
  Monitor,
  CalendarOff,
  Scan,
  History,
  Inbox,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppContext, roleLabels, UserRoleType, ModuleType, roleColors } from '@/contexts/AppContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useQuickSearch } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const GOLD = '#C9A84C';
const GOLD_HOVER = '#B8973B';

// ─── Search result row (used in topbar search dropdown) ──────────────────────
function SearchResultItem({ result, onClose }: {
  result: { id: number | string; type: string; module: string; title: string; subtitle?: string; link: string; badge?: string };
  onClose: () => void;
}) {
  const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    hr: { bg: 'bg-blue-50', text: 'text-blue-600' },
    finance: { bg: 'bg-green-50', text: 'text-green-600' },
    fleet: { bg: 'bg-orange-50', text: 'text-orange-600' },
    legal: { bg: 'bg-purple-50', text: 'text-purple-600' },
    projects: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    property: { bg: 'bg-teal-50', text: 'text-teal-600' },
    admin: { bg: 'bg-gray-50', text: 'text-gray-600' },
  };
  const c = COLOR_MAP[result.module] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <Link href={result.link} onClick={onClose}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
          <span className={cn('text-xs font-bold', c.text)}>{result.module.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
          {result.subtitle && <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>}
        </div>
        {result.badge && <Badge variant="secondary" className="text-xs shrink-0">{result.badge}</Badge>}
      </div>
    </Link>
  );
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  module?: ModuleType;
  hrSubPage?: string;
  children?: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { logout, user, loading, isAuthenticated } = useAuth();
  const {
    selectedBranchId,
    setSelectedBranchId,
    selectedCompanyId,
    setSelectedCompanyId,
    currentBranch,
    branches,
    branchesLoading,
    selectedRole,
    setSelectedRole,
    permissions,
    canAccessModule,
    canAccessHrSubPage,
    allowedRoles,
    currentEmployee: ctxEmployee,
  } = useAppContext();

  // جلب بيانات الموظفين لمدير القسم - مع فلترة بالفرع والقسم
  const isDeptManager = ['hr_manager', 'finance_manager', 'fleet_manager', 'legal_manager', 'projects_manager', 'store_manager', 'department_manager'].includes(selectedRole);
  const currentDeptId = ctxEmployee
    ? (typeof ctxEmployee.department === 'object' ? ctxEmployee.department?.id : ctxEmployee.departmentId)
    : null;

  const { data: deptEmployeesData } = useQuery<any[]>({
    queryKey: ['employees', { branchId: selectedBranchId, departmentId: currentDeptId }],
    queryFn: () => {
      const params: any = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      if (currentDeptId) params.departmentId = currentDeptId;
      return api.get('/hr/employees', { params }).then(r => r.data).catch(() => []);
    },
    enabled: isDeptManager && !!user && !!currentDeptId,
    staleTime: 5 * 60 * 1000,
  });
  const deptEmployeeCount = deptEmployeesData?.length || 0;

  // ─── Topbar search ───────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data: searchResults, isLoading: searchLoading } = useQuickSearch(debouncedQuery);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  const { data: adminCompanies } = useQuery<any[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    staleTime: 2 * 60 * 1000,
  });

  // حماية الصفحات - توجيه المستخدم غير المصادق لصفحة الدخول
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [loading, isAuthenticated, setLocation]);

  // حماية الوحدات - منع الوصول للصفحات غير المسموح بها
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    const topAdmin = selectedRole === 'admin' || selectedRole === 'general_manager';

    // تحديد الوحدة من المسار الحالي
    const pathToModule: Record<string, ModuleType> = {
      '/hr': 'hr',
      '/finance': 'finance',
      '/fleet': 'fleet',
      '/property': 'property',
      '/governance': 'governance',
      '/bi': 'bi',
      '/admin': 'admin',
      '/support': 'support',
      '/legal': 'legal',
      '/documents': 'documents',
      '/reports': 'reports',
      '/settings': 'settings',
      '/operations': 'projects',
      '/projects': 'projects',
      '/requests': 'requests',
      '/comms': 'comms',
      '/correspondence': 'comms',
      '/store': 'store',
      '/marketing': 'marketing',
      '/workflow': 'workflow',
      '/platform': 'platform',
      '/public-site': 'public_site',
      '/integrations': 'integrations',
      '/logs': 'admin',
    };

    // خريطة تحويل معرف القسم إلى وحدة النظام (لمسارات /departments/...)
    const deptIdToModule: Record<string, ModuleType> = {
      hr: 'hr', finance: 'finance', fleet: 'fleet', property: 'property',
      operations: 'projects', governance: 'governance', bi: 'bi',
      legal: 'legal', marketing: 'marketing', store: 'store',
      requests: 'requests', documents: 'documents', reports: 'reports',
      comms: 'comms', workflow: 'workflow', integrations: 'integrations',
    };

    // جدول مطابقة مسارات HR بصلاحياتها الفرعية (الأطول أولاً لتفادي التطابق المبكر)
    const hrPathToSubPage: Array<[string, string]> = [
      ['/hr/employees/add', 'add-employee'],
      ['/hr/employees', 'employees'],
      ['/hr/attendance-monitoring', 'attendance-monitoring'],
      ['/hr/attendance-reports', 'reports'],
      ['/hr/attendance', 'attendance'],
      ['/hr/leave-management', 'leaves'],
      ['/hr/leave-balances', 'leave-balances'],
      ['/hr/payroll', 'payroll'],
      ['/hr/performance-advanced', 'performance'],
      ['/hr/training-advanced', 'training'],
      ['/hr/organization-structure', 'organization'],
      ['/hr/recruitment-advanced', 'recruitment'],
      ['/hr/violations', 'violations'],
      ['/hr/my-violations', 'my_violations'],
      ['/hr/shifts', 'shifts'],
      ['/hr/field-tracking', 'tracking'],
      ['/hr/qr-scanner', 'qr'],
      ['/hr/approval-chains', 'approvals'],
      ['/hr/official-letters', 'letters'],
      ['/hr/onboarding-review', 'onboarding'],
      ['/hr/penalty-escalation', 'escalation'],
      ['/hr/automation', 'automation'],
      ['/hr/salary-components', 'salary'],
    ];

    const getHrSubPage = (path: string): string | undefined => {
      for (const [p, sub] of hrPathToSubPage) {
        if (path === p || path.startsWith(p + '/')) return sub;
      }
      return undefined;
    };

    // الصفحات المسموح بها للجميع
    const publicPaths = ['/', '/profile', '/inbox'];
    if (publicPaths.includes(location)) return;

    // صفحة الأقسام الرئيسية - للمدير العام ومدير النظام فقط
    if (location === '/departments') {
      if (!topAdmin) setLocation('/');
      return;
    }

    // مسارات /departments/{deptId}/... - تحقق من صلاحية الوحدة والصفحة الفرعية
    if (location.startsWith('/departments/')) {
      const deptMatch = location.match(/^\/departments\/([^/]+)(\/.*)?$/);
      if (deptMatch) {
        const deptId = deptMatch[1];
        const subPath = deptMatch[2] || '';
        const mod = deptIdToModule[deptId];
        if (mod && !canAccessModule(mod)) {
          setLocation('/');
          return;
        }
        // للوحدة hr: تحقق إضافي من صلاحية الصفحة الفرعية
        if (mod === 'hr' && subPath) {
          const sub = getHrSubPage(`/${deptId}${subPath}`);
          if (sub && !canAccessHrSubPage(sub)) {
            setLocation('/');
            return;
          }
        }
      }
      return;
    }

    // صفحات مركز الخدمات (hub) - /hr و /departments/hr بدون صفحة فرعية
    // لا يُسمح للموظف العادي برؤية مركز خدمات القسم
    if (location === '/hr' || location === '/departments/hr') {
      if (!canAccessHrSubPage('employees')) {
        setLocation('/');
      }
      return;
    }

    // البحث عن الوحدة المطابقة للمسارات المباشرة
    for (const [prefix, mod] of Object.entries(pathToModule)) {
      if (location.startsWith(prefix)) {
        if (!canAccessModule(mod)) {
          setLocation('/');
          return;
        }
        // للوحدة hr: تحقق إضافي من صلاحية الصفحة الفرعية
        if (mod === 'hr') {
          const sub = getHrSubPage(location);
          if (sub && !canAccessHrSubPage(sub)) {
            setLocation('/');
          }
        }
        return;
      }
    }
  }, [loading, isAuthenticated, location, canAccessModule, canAccessHrSubPage, setLocation, selectedRole]);

  // إغلاق الشريط الجانبي عند التنقل على الموبايل
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  // سيتم التحقق من المصادقة بعد تعريف كل الـ hooks

  // الأقسام التي يتم استبدالها بصفحة "الأقسام" للمدير العام ومدير النظام
  const isTopAdmin = selectedRole === 'admin' || selectedRole === 'general_manager';
  const departmentModules: ModuleType[] = ['hr', 'finance', 'fleet', 'property', 'operations', 'governance', 'bi', 'legal', 'marketing', 'store'];

  // جميع عناصر القائمة مع تحديد الوحدة لكل عنصر
  const allNavItems: NavItem[] = [
    // الرئيسية - مجمّعة في القائمة الشاملة، ومفردة عند دخول فرع
    ...(isTopAdmin && selectedBranchId === null ? [{
      label: 'الرئيسية',
      path: '/',
      icon: LayoutDashboard,
      module: 'home' as ModuleType,
      children: [
        { label: 'الإحصائيات الشاملة', path: '/', icon: BarChart3, module: 'home' as ModuleType },
        { label: 'الأقسام والفروع', path: '/departments', icon: Grid3X3, module: 'home' as ModuleType },
        { label: 'المؤسسات والشركات', path: '/admin/companies-overview', icon: Building2, module: 'home' as ModuleType },
        { label: 'أدارة الشركات', path: '/admin/system', icon: Building2, module: 'home' as ModuleType },
        { label: 'مقارنة المؤسسات', path: '/admin/comparison', icon: ArrowRightLeft, module: 'home' as ModuleType },
      ],
    }] : []),
    // عند دخول فرع: عرض عناصر الرئيسية مباشرةً بدون تجميع
    ...(isTopAdmin && selectedBranchId !== null ? [
      { label: 'الإحصائيات الشاملة', path: '/', icon: BarChart3, module: 'home' as ModuleType },
      { label: 'الأقسام', path: '/departments', icon: Grid3X3, module: 'home' as ModuleType },
    ] : []),
    // للأدوار الأخرى: رابط بسيط للرئيسية
    ...(!isTopAdmin ? [{ label: 'الرئيسية', path: '/', icon: LayoutDashboard, module: 'home' as ModuleType }] : []),
    // عنصر موظفي القسم - يظهر فقط لمدراء الأقسام
    ...(isDeptManager ? [{
      label: `موظفي القسم (${deptEmployeeCount})`,
      path: '/hr/department-employees',
      icon: Users2,
      module: 'home' as ModuleType,
    }] : []),
    // مراقبة الحضور - وصول سريع لمدراء الأقسام
    ...(isDeptManager ? [{
      label: 'مراقبة الحضور',
      path: '/hr/attendance-monitoring',
      icon: ClipboardCheck,
      module: 'home' as ModuleType,
    }] : []),
    // مراقبة الحضور - وصول سريع للمدير العام ومدير النظام (فقط عند دخول فرع)
    ...(isTopAdmin && selectedBranchId !== null ? [{
      label: 'مراقبة الحضور',
      path: '/hr/attendance-monitoring',
      icon: ClipboardCheck,
      module: 'home' as ModuleType,
    }] : []),
    // إدارة الإجازات - وصول سريع للمدير العام ومدير النظام (فقط عند دخول فرع)
    ...(isTopAdmin && selectedBranchId !== null ? [{
      label: 'إدارة الإجازات',
      path: '/hr/leave-management',
      icon: Calendar,
      module: 'home' as ModuleType,
    }] : []),
    {
      label: ['employee', 'supervisor'].includes(selectedRole) ? 'الحضور' : 'الموارد البشرية',
      path: '/hr',
      icon: Users,
      module: 'hr',
      children: [
        { label: 'الموظفون', path: '/hr/employees', icon: Users, hrSubPage: 'employees' },
        { label: 'الحضور والانصراف', path: '/hr/attendance', icon: ClipboardCheck, hrSubPage: 'attendance' },
        { label: 'إضافة موظف', path: '/hr/employees/add', icon: UserPlus, hrSubPage: 'add-employee' },
        { label: 'الإجازات', path: '/hr/leave-management', icon: Calendar, hrSubPage: 'leaves' },
        { label: 'الرواتب', path: '/hr/payroll', icon: DollarSign, hrSubPage: 'payroll' },
        { label: 'تقييم الأداء', path: '/hr/performance-advanced', icon: Target, hrSubPage: 'performance' },
        { label: 'التدريب', path: '/hr/training-advanced', icon: GraduationCap, hrSubPage: 'training' },
        { label: 'الهيكل التنظيمي', path: '/hr/organization-structure', icon: Network, hrSubPage: 'organization' },
        { label: 'التوظيف', path: '/hr/recruitment-advanced', icon: Briefcase, hrSubPage: 'recruitment' },
        { label: 'المخالفات والجزاءات', path: '/hr/violations', icon: Scale, hrSubPage: 'violations' },
        { label: 'مخالفاتي', path: '/hr/my-violations', icon: AlertTriangle, hrSubPage: 'my_violations' },
        { label: 'الورديات والسياسات', path: '/hr/shifts', icon: CalendarClock, hrSubPage: 'shifts' },
        { label: 'أرصدة الإجازات', path: '/hr/leave-balances', icon: Calendar, hrSubPage: 'leave-balances' },
        { label: 'التتبع الميداني', path: '/hr/field-tracking', icon: MapPin, hrSubPage: 'tracking' },
        { label: 'ماسح QR', path: '/hr/qr-scanner', icon: Scan, hrSubPage: 'qr' },
        { label: 'سلاسل الموافقات', path: '/hr/approval-chains', icon: GitBranch, hrSubPage: 'approvals' },
        { label: 'الخطابات الرسمية', path: '/hr/official-letters', icon: FileText, hrSubPage: 'letters' },
        { label: 'تقارير الحضور', path: '/hr/attendance-reports', icon: BarChart3, hrSubPage: 'reports' },
        { label: 'مراجعة الانضمام', path: '/hr/onboarding-review', icon: UserCheck, hrSubPage: 'onboarding' },
        { label: 'تصعيد الجزاءات', path: '/hr/penalty-escalation', icon: TrendingUp, hrSubPage: 'escalation' },
        { label: 'أتمتة HR', path: '/hr/automation', icon: Zap, hrSubPage: 'automation' },
        { label: 'بنود الراتب', path: '/hr/salary-components', icon: DollarSign, hrSubPage: 'salary' },
      ]
    },
    {
      label: 'المالية',
      path: '/finance',
      icon: CreditCard,
      module: 'finance',
      children: [
        { label: 'الفواتير', path: '/finance', icon: Receipt },
        { label: 'المصروفات', path: '/finance/expenses', icon: Wallet },
        { label: 'الميزانية', path: '/finance/budget', icon: PieChart },
        { label: 'التقارير المالية', path: '/finance/reports', icon: FileBarChart },
        { label: 'الموردين', path: '/finance/vendors', icon: Users },
        { label: 'طلبات الشراء', path: '/finance/purchase-orders', icon: ShoppingCart },
        { label: 'أتمتة المالية', path: '/finance/automation', icon: Zap },
        { label: 'العهد', path: '/finance/custodies', icon: Lock },
        { label: 'السلف', path: '/finance/salary-advances', icon: Wallet },
        { label: 'المستودعات', path: '/finance/warehouses', icon: Package },
        { label: 'الضرائب والزكاة', path: '/finance/tax', icon: Receipt },
        { label: 'السندات', path: '/finance/vouchers', icon: FileText },
        { label: 'القيود', path: '/finance/journal-entries', icon: ScrollText },
        { label: 'الفواتير', path: '/finance/invoices', icon: FileText },
        { label: 'شجرة الحسابات', path: '/finance/accounts', icon: GitBranch },
        { label: 'الالتزامات المالية', path: '/finance/commitments', icon: Lock },
        { label: 'الطلبات المالية', path: '/finance/requests', icon: ClipboardList },
        { label: 'دورة الشراء P2P', path: '/finance/p2p', icon: ArrowRightLeft },
      ]
    },
    {
      label: 'إدارة الأسطول',
      path: '/fleet',
      icon: Truck,
      module: 'fleet',
      children: [
        { label: 'التتبع المباشر', path: '/fleet', icon: MapPin },
        { label: 'المركبات', path: '/fleet/vehicles', icon: Car },
        { label: 'الصيانة', path: '/fleet/maintenance', icon: Wrench },
        { label: 'استهلاك الوقود', path: '/fleet/fuel', icon: Fuel },
        { label: 'السائقين', path: '/fleet/drivers', icon: User },
        { label: 'الخريطة', path: '/fleet/map', icon: MapPin },
        { label: 'التنبيهات', path: '/fleet/alerts', icon: Bell },
        { label: 'التقارير', path: '/fleet/reports', icon: FileBarChart },
        { label: 'الرحلات', path: '/fleet/trips', icon: Activity },
        { label: 'السياج الجغرافي', path: '/fleet/geofences', icon: Target },
        { label: 'التحليلات', path: '/fleet/insights', icon: TrendingUp },
        { label: 'أتمتة الأسطول', path: '/fleet/automation', icon: Zap },
      ]
    },
    {
      label: 'إدارة الأملاك',
      path: '/property',
      icon: Home,
      module: 'property',
      children: [
        { label: 'نظرة عامة', path: '/property', icon: Home },
        { label: 'العقارات', path: '/property/list', icon: Building },
        { label: 'العقود', path: '/property/contracts', icon: FileSignature },
        { label: 'المستأجرين', path: '/property/tenants', icon: Users2 },
        { label: 'الصيانة', path: '/property/maintenance', icon: Hammer },
        { label: 'أتمتة العقارات', path: '/property/automation', icon: Zap },
      ]
    },
    {
      label: 'العمليات',
      path: '/operations',
      icon: Activity,
      module: 'operations',
      children: [
        { label: 'نظرة عامة', path: '/operations', icon: Activity },
        { label: 'المشاريع', path: '/operations/projects', icon: Target },
        { label: 'مهام المشاريع', path: '/projects/tasks', icon: ListTodo },
        { label: 'أعضاء المشاريع', path: '/projects/members', icon: Users },
        { label: 'تدقيق المشاريع', path: '/projects/audit', icon: ScrollText },
        { label: 'أتمتة المشاريع', path: '/projects/automation', icon: Zap },
      ]
    },
    {
      label: 'الحوكمة',
      path: '/governance',
      icon: ShieldCheck,
      module: 'governance',
      children: [
        { label: 'نظرة عامة', path: '/governance', icon: ShieldCheck },
        { label: 'إدارة الهوية والوصول', path: '/governance/iam', icon: Users },
        { label: 'إدارة متقدمة', path: '/governance/iam-advanced', icon: KeyRound },
        { label: 'حزم الأدوار', path: '/governance/role-packs', icon: Shield },
        { label: 'الامتثال', path: '/governance/compliance', icon: Shield },
        { label: 'مصفوفة الصلاحيات', path: '/governance/permissions', icon: ShieldCheck },
        { label: 'حدود العمليات', path: '/governance/operation-limits', icon: Shield },
        { label: 'قواعد العمل', path: '/governance/business-rules', icon: Shield },
        { label: 'مراقبة الجلسات', path: '/governance/session-monitor', icon: Users },
        { label: 'تقييد الوصول', path: '/governance/access-restrictions', icon: KeyRound },
        { label: 'سجل التغييرات', path: '/governance/permission-log', icon: FileText },
        { label: 'السياسات', path: '/governance/policies', icon: FileCheck },
        { label: 'المخاطر', path: '/governance/risks', icon: AlertTriangle },
        { label: 'التدقيق', path: '/governance/audits', icon: ClipboardCheck },
        { label: 'كشف الشذوذ', path: '/governance/anomaly-detections', icon: Search },
        { label: 'قواعد الشذوذ', path: '/governance/anomaly-rules', icon: Zap },
        { label: 'الرقابة المزدوجة', path: '/governance/dual-control', icon: Shield },
      ]
    },
    {
      label: 'ذكاء الأعمال',
      path: '/bi',
      icon: LineChart,
      module: 'bi',
      children: [
        { label: 'نظرة عامة', path: '/bi', icon: LineChart },
        { label: 'لوحات المعلومات', path: '/bi/dashboards', icon: LayoutDashboard },
        { label: 'مؤشرات الأداء', path: '/bi/kpis', icon: TrendingUp },
        { label: 'التقارير التحليلية', path: '/bi/reports', icon: FileBarChart },
        { label: 'محرك القرارات', path: '/bi/decision-engine', icon: Activity },
        { label: 'مصادر البيانات', path: '/bi/data-sources', icon: Database },
        { label: 'سجل التحليلات', path: '/bi/audit', icon: ScrollText },
      ]
    },
    ...(!isTopAdmin || selectedBranchId === null ? [{
      label: 'مدير النظام',
      path: '/admin',
      icon: Shield,
      module: 'admin' as ModuleType,
      children: [
        { label: 'نظرة عامة', path: '/admin', icon: Shield },
        { label: 'الاشتراكات', path: '/admin/subscriptions', icon: Building2 },
        { label: 'المستخدمين', path: '/admin/users', icon: UserCog },
        { label: 'الأدوار والصلاحيات', path: '/admin/roles', icon: KeyRound },
        { label: 'سجلات النظام', path: '/admin/logs', icon: ScrollText },
        { label: 'التفويضات', path: '/workflow/delegations', icon: Users },
        { label: 'إعدادات الموافقات', path: '/workflow/settings', icon: CheckCircle },
        { label: 'الأرصدة المعلقة', path: '/admin/pending-balances', icon: Clock },
        { label: 'القرارات', path: '/governance/decisions', icon: Scale },
        { label: 'الحوكمة', path: '/admin/governance', icon: Shield },
        { label: 'سجل الحوكمة', path: '/governance/audit-log', icon: ScrollText },
        { label: 'سجل الأحداث', path: '/admin/event-log', icon: Activity },
        { label: 'صندوق المهام', path: '/admin/inbox', icon: Inbox },
        { label: 'الأرصدة المحجوزة', path: '/admin/pending-reserves', icon: Lock },
        { label: 'تاريخ الحالات', path: '/governance/state-history', icon: History },
        { label: 'تدقيق سير العمل', path: '/admin/workflow-audit', icon: ClipboardCheck },
        { label: 'الاستثناءات', path: '/governance/exceptions', icon: AlertTriangle },
        { label: 'SLA', path: '/admin/sla', icon: Clock },
        { label: 'المهام المجدولة', path: '/platform/scheduler', icon: Calendar },
        { label: 'مركز الأتمتة', path: '/admin/automation', icon: Zap },
        { label: 'سير العمل', path: '/workflow/flows', icon: GitBranch },
        { label: 'سجل الوظائف', path: '/platform/jobs', icon: Cpu },
        { label: 'الكليشة', path: '/settings/branding', icon: FileText },
      ]
    }] : []),
    {
      label: 'الشؤون القانونية',
      path: '/legal',
      icon: Scale,
      module: 'legal',
      children: [
        { label: 'القضايا', path: '/legal', icon: Briefcase },
        { label: 'العقود', path: '/legal/contracts', icon: FileSignature },
        { label: 'الوثائق القانونية', path: '/legal/documents', icon: FileText },
        { label: 'سجل التدقيق', path: '/legal/audit', icon: ScrollText },
        { label: 'أتمتة الشؤون القانونية', path: '/legal/automation', icon: Zap },
      ]
    },
    {
      label: 'التسويق',
      path: '/marketing',
      icon: Megaphone,
      module: 'marketing',
    },
    {
      label: 'المتجر',
      path: '/store',
      icon: ShoppingCart,
      module: 'store',
      children: [
        { label: 'المنتجات', path: '/store', icon: Package },
        { label: 'الطلبات', path: '/store/orders', icon: ShoppingCart },
      ]
    },
    ...(!isTopAdmin || selectedBranchId === null ? [{
      label: 'أدوات المنصة',
      path: '/platform/calendar',
      icon: Cog,
      module: 'platform' as ModuleType,
      children: [
        { label: 'التقويم', path: '/platform/calendar', icon: Calendar },
        { label: 'مركز الإشعارات', path: '/platform/notifications', icon: BellRing },
        { label: 'البحث', path: '/platform/search', icon: Search },
        { label: 'إدارة المستندات', path: '/platform/dms', icon: FileStack },
        { label: 'حزم الأدلة', path: '/platform/evidence', icon: ClipboardCheck },
        { label: 'المراقبة', path: '/platform/monitoring', icon: Activity },
        { label: 'التنبيهات', path: '/platform/alerts', icon: AlertTriangle },
        { label: 'الجلسات', path: '/platform/session', icon: User },
        { label: 'التحديثات', path: '/platform/upgrades', icon: TrendingUp },
        { label: 'سياسة الذكاء الاصطناعي', path: '/platform/ai-policy', icon: Cpu },
        { label: 'تفضيلات الإشعارات', path: '/platform/notify-prefs', icon: Bell },
        { label: 'قواعد الإشعارات', path: '/platform/notify-rules', icon: Zap },
      ]
    }] : []),
    ...(!isTopAdmin || selectedBranchId === null ? [{
      label: 'الإعدادات',
      path: '/settings',
      icon: Settings,
      module: 'settings' as ModuleType,
      children: [
        { label: 'عام', path: '/settings', icon: Settings },
        { label: 'إعدادات النظام', path: '/settings/system', icon: Cog },

        { label: 'الأمان', path: '/settings/security-config', icon: Shield },
        { label: 'SMTP بريد', path: '/settings/smtp', icon: Mail },
        { label: 'إعدادات HR', path: '/settings/hr-config', icon: Users },
        { label: 'إعدادات المالية', path: '/settings/finance-config', icon: CreditCard },
        { label: 'إعدادات الأسطول', path: '/settings/fleet-config', icon: Truck },
        { label: 'النطاقات', path: '/settings/domains', icon: Globe },
        { label: 'قوالب الخطابات', path: '/settings/letter-templates', icon: FileText },
        { label: 'سجل التدقيق', path: '/settings/audit-log', icon: FileText },
        { label: 'الإشعارات', path: '/settings/notifications', icon: BellRing },
        { label: 'النسخ الاحتياطي', path: '/settings/backup', icon: Database },
        { label: 'الفروع', path: '/settings/branches', icon: Building2 },
        { label: 'الأدوار', path: '/settings/roles', icon: KeyRound },
        { label: 'البريد الإلكتروني', path: '/settings/email', icon: Mail },
        { label: 'واتساب', path: '/settings/whatsapp', icon: MessageSquare },
        { label: 'SMS', path: '/settings/sms', icon: Send },
        { label: 'قوالب الرسائل', path: '/settings/message-templates', icon: FileText },
        { label: 'الأقسام', path: '/settings/departments', icon: FolderTree },
        { label: 'بادئات الترقيم', path: '/settings/code-prefixes', icon: Hash },
        { label: 'سجل الرسائل', path: '/logs/messages', icon: ScrollText },
      ]
    }] : []),
  ];

  // فلترة عناصر القائمة بناءً على صلاحيات المستخدم
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter(item => {
        // إخفاء عناصر الأقسام من الشريط الجانبي للمدير العام ومدير النظام
        if (isTopAdmin && item.module && departmentModules.includes(item.module)) {
          return false;
        }
        // إذا كان للعنصر وحدة محددة، تحقق من الصلاحية
        if (item.module && !canAccessModule(item.module)) {
          return false;
        }
        return true;
      })
      .map(item => {
        // إذا كان للعنصر أطفال، فلترهم أيضاً
        if (item.children) {
          const filteredChildren = item.children.filter(child => {
            // إذا كان للطفل صفحة HR فرعية، تحقق من الصلاحية
            if (child.hrSubPage && !canAccessHrSubPage(child.hrSubPage)) {
              return false;
            }
            return true;
          });
          // إذا لم يتبقى أي أطفال، لا تعرض العنصر الأب
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  };

  const navItems = filterNavItems(allNavItems);

  // Build path-to-label map and section map for breadcrumb navigation
  const map: Record<string, string> = {};
  const sectionMap: Record<string, { label: string; path: string }> = {};
  for (const item of allNavItems) {
    if (!map[item.path]) map[item.path] = item.label;

    // If it's a department module, its logical parent is the Departments Hub
    if (item.module && departmentModules.includes(item.module)) {
      sectionMap[item.path] = { label: 'الأقسام', path: '/departments' };
    }

    if (item.children) {
      for (const child of item.children) {
        // Child gets its own label in the map if it's a distinct path.
        // If it's the same path as parent (e.g. module home), we prefer the parent's module label.
        if (child.path !== item.path) {
          map[child.path] = child.label;
          // Every distinct child path maps to its parent section
          sectionMap[child.path] = { label: item.label, path: item.path };
        }
      }
    }
  }

  // Fixed root labels
  map['/'] = 'الرئيسية';
  map['/departments'] = 'الأقسام المركزية';
  sectionMap['/departments'] = { label: 'الرئيسية', path: '/' };

  // Build comprehensive breadcrumb maps from all department service paths.
  // This covers both /hr/employees and /departments/hr/employees patterns.
  for (const dept of departmentsData) {
    const deptDirectPath = `/${dept.id}`;          // e.g. /hr
    const deptHubPath = `/departments/${dept.id}`; // e.g. /departments/hr

    // Dept hub path → label + parent
    map[deptHubPath] = dept.label;
    sectionMap[deptHubPath] = { label: 'الأقسام المركزية', path: '/departments' };

    // Direct dept path (e.g. /hr) → label + parent is departments
    if (!map[deptDirectPath]) map[deptDirectPath] = dept.label;
    if (!sectionMap[deptDirectPath]) sectionMap[deptDirectPath] = { label: 'الأقسام المركزية', path: '/departments' };

    for (const item of dept.items) {
      // /hr/employees → label + parent /hr
      map[item.path] = item.label;
      sectionMap[item.path] = { label: dept.label, path: deptDirectPath };

      // /departments/hr/employees → label + parent /departments/hr
      const hubItemPath = '/departments' + item.path;
      map[hubItemPath] = item.label;
      sectionMap[hubItemPath] = { label: dept.label, path: deptHubPath };
    }
  }

  const currentPath = location;

  // Fallback for any path not in the data: walk up the URL segments to find a parent
  if (!map[currentPath] && currentPath !== '/') {
    const segments = currentPath.split('/').filter(Boolean);
    // Use last segment as a readable label fallback
    map[currentPath] = segments[segments.length - 1].replace(/-/g, ' ');
  }
  if (!sectionMap[currentPath] && currentPath !== '/') {
    // Try to find closest known ancestor by trimming last segment
    const parentPath = '/' + currentPath.split('/').filter(Boolean).slice(0, -1).join('/');
    if (parentPath !== '/' && map[parentPath]) {
      sectionMap[currentPath] = { label: map[parentPath], path: parentPath };
    } else {
      // Robust fallback: find the longest nav item prefix that matches
      for (const item of allNavItems) {
        if (item.module && currentPath.startsWith(item.path + '/') && currentPath !== item.path) {
          sectionMap[currentPath] = { label: item.label, path: item.path };
          break;
        }
      }
    }
  }

  const { history, navigateTo } = useNavigationHistory(map, sectionMap);

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // لا تعرض المحتوى إذا لم يكن المستخدم مصادقاً
  if (!isAuthenticated) {
    return null;
  }

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isItemActive = (item: NavItem, isChild = false): boolean => {
    // For child items: only exact match
    if (isChild) {
      return location === item.path;
    }
    // For parent items with children: highlight only if a child is active (not the parent itself)
    if (item.children && item.children.length > 0) {
      return item.children.some(child => location === child.path);
    }
    // For top-level items without children: exact match or prefix match
    if (location === item.path) return true;
    if (item.path !== '/' && location.startsWith(`${item.path}/`)) return true;
    return false;
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = isItemActive(item, isChild);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);

    const activeStyle = {
      backgroundColor: 'rgba(201,168,76,0.18)',
      color: '#C9A84C',
      border: '1px solid rgba(201,168,76,0.4)',
    };
    const inactiveStyle = {
      color: '#c9d1d9',
      border: '1px solid transparent',
    };
    const hoverStyle = {
      backgroundColor: 'rgba(96,165,250,0.07)',
      border: '1px solid rgba(96,165,250,0.25)',
      color: '#e5e7eb',
    };

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleExpand(item.path)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150"
            style={isActive ? activeStyle : inactiveStyle}
            onMouseEnter={e => { if (!isActive) Object.assign(e.currentTarget.style, hoverStyle); }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.color = '#c9d1d9'; } }}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" style={{ color: isActive ? '#C9A84C' : '#6b7280' }} />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" style={{ color: '#6b7280' }} />
            )}
          </button>
          {isExpanded && (
            <div className="me-3 mt-0.5 space-y-0.5 pe-2" style={{ borderRight: '1px solid #2d3555' }}>
              {item.children!.map(child => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        className="flex items-center gap-3 px-4 rounded-lg text-sm font-medium transition-all duration-150"
        style={{
          ...(isActive ? activeStyle : inactiveStyle),
          paddingTop: isChild ? '9px' : '11px',
          paddingBottom: isChild ? '9px' : '11px',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { if (!isActive) Object.assign((e.currentTarget as HTMLElement).style, hoverStyle); }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.border = '1px solid transparent'; (e.currentTarget as HTMLElement).style.color = '#c9d1d9'; } }}
      >
        <item.icon
          className="flex-shrink-0"
          style={{ width: isChild ? '15px' : '18px', height: isChild ? '15px' : '18px', color: isActive ? '#C9A84C' : '#6b7280' }}
        />
        {item.label}
      </Link>
    );
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const selectedCompanyData = selectedCompanyId && adminCompanies
    ? adminCompanies.find((c: any) => c.id === selectedCompanyId)
    : null;
  const companyDisplayName = selectedCompanyData
    ? (selectedCompanyData.nameAr || selectedCompanyData.name)
    : null;

  const scopeLabel = companyDisplayName
    ? (selectedCompanyData?.city ? `شركة ${companyDisplayName} - فرع ${selectedCompanyData.city}` : `شركة ${companyDisplayName}`)
    : selectedBranchId === null && (selectedRole === 'admin' || selectedRole === 'general_manager')
      ? 'لوحة تحكم (شاملة)'
      : currentBranch?.name || roleLabels[selectedRole];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f3f4f6' }} dir="rtl">
      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#1a2035', borderLeft: '1px solid #2d3555' }}
        className={`fixed inset-y-0 right-0 z-50 w-64 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo + Scope */}
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #2d3555' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-lg" style={{ color: '#C9A84C' }}>
                <span className="text-xl">🌧️</span>
                <span>منصة غيث</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                style={{ color: '#9ca3af' }}
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs" style={{ color: '#6b7280' }}>نطاق العمل:</p>
                <p className="text-sm font-semibold truncate" style={{ color: '#e5e7eb' }}>
                  {ctxEmployee?.firstNameAr && ctxEmployee?.lastNameAr
                    ? `${ctxEmployee.firstNameAr} ${ctxEmployee.lastNameAr}`
                    : ctxEmployee?.firstName && ctxEmployee?.lastName
                      ? `${ctxEmployee.firstName} ${ctxEmployee.lastName}`
                      : user?.username || ''}
                </p>
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: '#C9A84C' }}>{scopeLabel}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
            {navItems.map((item) => renderNavItem(item))}
          </nav>

          {/* Logout Button */}
          <div className="p-3" style={{ borderTop: '1px solid #2d3555' }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:me-0 transition-all duration-300">
        <header
          style={{ backgroundColor: '#1a2035', borderBottom: '1px solid #2d3555' }}
          className="h-16 flex items-center px-3 md:px-6 lg:px-8 sticky top-0 z-40 gap-3 md:gap-4 shrink-0"
        >
          {/* Left: greeting or menu toggle */}
          <div className="flex items-center gap-2 md:gap-3 flex-none">
            <button
              className="lg:hidden shrink-0 p-2 rounded-xl transition-colors hover:bg-white/10"
              style={{ color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div dir="rtl" className="flex flex-col">
              <p className="text-xs md:text-sm font-semibold leading-none truncate" style={{ color: '#e5e7eb' }}>
                {greetingTime()}، {ctxEmployee?.firstNameAr || ctxEmployee?.firstName || user?.username?.split(' ')[0] || 'مرحباً'}
              </p>
              <p className="text-[10px] md:text-xs font-medium mt-1 leading-none" style={{ color: GOLD }}>
                {roleLabels[selectedRole]}
              </p>
            </div>
          </div>

          {/* Center: company/scope label (Hidden on very small screens, compact on mid) */}
          <div className="flex-1 hidden sm:flex items-center justify-center overflow-hidden px-2">
            <span className="text-xs md:text-sm font-semibold truncate text-center" style={{ color: '#C9A84C' }}>
              {companyDisplayName || currentBranch?.name || 'الرئيسية'}
            </span>
          </div>

          {/* Right: Consolidated actions for mobile, detailed for desktop */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-none">
            {/* Search - Icon only on mobile, bar on desktop */}
            <div ref={searchRef} className="relative">
              <button
                className="lg:hidden p-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4" />
              </button>

              <div className="relative hidden lg:block">
                <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#6b7280' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length >= 2); }}
                  onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                  placeholder="بحث... (Ctrl+K)"
                  className="text-xs py-1.5 rounded-lg outline-none transition-all"
                  style={{
                    width: showSearch || searchQuery ? '200px' : '160px',
                    paddingInlineEnd: '28px',
                    paddingInlineStart: '36px',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    border: '1px solid #2d3555',
                    color: '#c9d1d9',
                    transition: 'width 0.2s ease',
                  }}
                  onFocusCapture={e => { (e.currentTarget).style.backgroundColor = 'rgba(255,255,255,0.12)'; (e.currentTarget).style.borderColor = '#C9A84C'; }}
                  onBlur={e => { (e.currentTarget).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget).style.borderColor = '#2d3555'; }}
                />
              </div>

              {showSearch && (
                <div className="absolute top-full end-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform translate-x-4 sm:translate-x-0">
                  {searchLoading ? (
                    <div className="p-6 text-center text-sm text-gray-500">جاري البحث...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((r: any, i: number) => (
                      <SearchResultItem key={i} result={r} onClose={() => { setShowSearch(false); setSearchQuery(''); }} />
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      {searchQuery.length < 2 ? 'ادخل حرفين على الأقل للبحث' : `لا نتائج لـ "${debouncedQuery}"`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Icons row - Hidden on mobile, dropdown instead? No, keep it simple for now but consolidated */}
            <div className="hidden md:flex items-center gap-1">
              <button
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: '#9ca3af' }}
                onClick={() => queryClient.invalidateQueries()}
                title="تحديث البيانات"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <Link href="/settings">
                <button
                  className="p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: '#9ca3af' }}
                  title="الإعدادات"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </Link>
            </div>

            {/* Bell/Notifications */}
            <button
              className="relative p-2 rounded-xl transition-colors hover:bg-white/10"
              style={{ color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a2035]"></span>
            </button>

            {/* خانة الصفة - فقط للمستخدمين الذين لديهم أكثر من دور */}
            {allowedRoles.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.12)'; }}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{roleLabels[selectedRole]}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>تغيير الصفة</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allowedRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={selectedRole === role ? 'bg-amber-50 text-amber-700' : ''}
                    >
                      <Shield
                        className="h-4 w-4 ms-2"
                        style={{ color: selectedRole === role ? roleColors[role] : '#9ca3af' }}
                      />
                      {roleLabels[role]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* خانة الفرع - فقط إذا كان للمستخدم صلاحية رؤية جميع الفروع */}
            {permissions.canViewAllBranches && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#c9d1d9', border: '1px solid #2d3555' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <Building2 className="h-4 w-4" style={{ color: '#C9A84C' }} />
                    <span className="hidden sm:inline-block">
                      {companyDisplayName
                        ? `شركة ${companyDisplayName}`
                        : selectedBranchId === null
                          ? 'جميع الفروع'
                          : currentBranch?.name || 'جميع الفروع'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>اختر الشركة</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { setSelectedBranchId(null); setSelectedCompanyId(null); }}
                    className={selectedBranchId === null ? 'bg-amber-50 text-amber-700' : ''}
                  >
                    <Building2 className={`h-4 w-4 ms-2 ${selectedBranchId === null ? 'text-amber-600' : 'text-gray-400'}`} />
                    <span>جميع الفروع</span>
                    <span className="mr-auto text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">كل</span>
                  </DropdownMenuItem>
                  {adminCompanies && adminCompanies.map((comp: any) => (
                    <DropdownMenuItem
                      key={`comp-${comp.id}`}
                      className={selectedCompanyId === comp.id ? 'bg-amber-50 text-amber-700' : ''}
                      onClick={() => {
                        setSelectedCompanyId(comp.id);
                        setSelectedBranchId(comp.branchId ?? comp.id);
                        setLocation('/');
                      }}
                    >
                      <Building2 className={`h-4 w-4 ms-2 shrink-0 ${selectedCompanyId === comp.id ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className="flex-1">{comp.nameAr || comp.name}</span>
                      {comp.city && <span className="text-xs text-gray-400 shrink-0">{comp.city}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Navigation History Breadcrumb */}
        {location !== '/' && history.length > 0 && (
          <div style={{ backgroundColor: '#1e2540', borderBottom: '1px solid #2d3555' }} className="px-4 lg:px-8 py-3">
            <Breadcrumb>
              <BreadcrumbList className="gap-2 sm:gap-3">
                {history.map((entry, index) => {
                  const isLast = index === history.length - 1;

                  // Helper to find icon and color for a path
                  const getMetadata = (path: string) => {
                    // Default values
                    let icon = null;
                    let color = '#64748b'; // slate-500
                    let bgColor = 'bg-slate-50';
                    let borderColor = 'border-slate-200';

                    if (path === '/') return { icon: Home, color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
                    if (path === '/departments') return { icon: Grid3X3, color: '#6366f1', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' };

                    // Find in nav items
                    const findInItems = (items: NavItem[]): any => {
                      for (const item of items) {
                        if (item.path === path) return item;
                        if (item.children) {
                          const found = findInItems(item.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };

                    const matchedItem = findInItems(allNavItems);
                    if (matchedItem) {
                      icon = matchedItem.icon;

                      // Map module to colors (sync with DepartmentsHub)
                      const moduleColors: Record<string, { color: string, bg: string, border: string }> = {
                        hr: { color: '#2980B9', bg: 'bg-blue-50', border: 'border-blue-200' },
                        finance: { color: '#27AE60', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                        fleet: { color: '#D35400', bg: 'bg-orange-50', border: 'border-orange-200' },
                        property: { color: '#8E44AD', bg: 'bg-purple-50', border: 'border-purple-200' },
                        operations: { color: '#1ABC9C', bg: 'bg-teal-50', border: 'border-teal-200' },
                        governance: { color: '#2C3E50', bg: 'bg-slate-50', border: 'border-slate-200' },
                        bi: { color: '#E74C3C', bg: 'bg-red-50', border: 'border-red-200' },
                        legal: { color: '#7F8C8D', bg: 'bg-gray-50', border: 'border-gray-200' },
                        marketing: { color: '#E91E63', bg: 'bg-pink-50', border: 'border-pink-200' },
                        store: { color: '#F39C12', bg: 'bg-amber-50', border: 'border-amber-200' },
                      };

                      const mod = matchedItem.module || (path.split('/')[1] as ModuleType);
                      if (moduleColors[mod]) {
                        color = moduleColors[mod].color;
                        bgColor = moduleColors[mod].bg;
                        borderColor = moduleColors[mod].border;
                      }
                    }

                    return { icon, color, bgColor, borderColor };
                  };

                  const meta = getMetadata(entry.path);
                  const Icon = meta.icon;

                  return (
                    <React.Fragment key={entry.key}>
                      <BreadcrumbItem>
                        {!isLast ? (
                          <BreadcrumbLink
                            asChild
                            className="cursor-pointer transition-all duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo(entry.path);
                            }}
                          >
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold transition-all group",
                              "bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-white/5",
                              "hover:border-[#C9A84C]/30 hover:shadow-[#C9A84C]/5 hover:scale-[1.03]"
                            )} style={{ color: '#C9A84C' }}>
                              {Icon && <Icon className="h-3.5 w-3.5" />}
                              <span className="text-slate-200 group-hover:text-white transition-colors">{entry.label}</span>
                            </div>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="transition-all duration-200">
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black shadow-lg border",
                              "bg-gradient-to-r from-[#C9A84C] to-[#b89740] border-[#C9A84C]/20 text-slate-900"
                            )}>
                              {Icon && <Icon className="h-4 w-4" />}
                              <span>{entry.label}</span>
                            </div>
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator>
                          <ChevronLeft className="h-4 w-4" style={{ color: '#4b5563' }} />
                        </BreadcrumbSeparator>
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div >

      {/* Overlay for mobile sidebar */}
      {
        isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )
      }
    </div >
  );
}
