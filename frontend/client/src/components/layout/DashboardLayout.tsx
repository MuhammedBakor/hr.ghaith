import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
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
  Inbox
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
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

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

  // جلب بيانات الموظفين لمدير القسم
  const isDeptManager = ['hr_manager', 'finance_manager', 'fleet_manager', 'legal_manager', 'projects_manager', 'store_manager', 'department_manager'].includes(selectedRole);
  const { data: allEmployees } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: () => api.get('/hr/employees').then(r => r.data).catch(() => []),
    enabled: isDeptManager && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adminCompanies } = useQuery<any[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    staleTime: 2 * 60 * 1000,
  });

  // حساب عدد موظفي القسم
  const currentEmployee = allEmployees?.find((emp: any) =>
    emp.userId === user?.id || emp.user?.id === user?.id
  );
  const currentDeptId = typeof currentEmployee?.department === 'object'
    ? currentEmployee?.department?.id
    : currentEmployee?.departmentId;
  const deptEmployeeCount = isDeptManager && currentDeptId
    ? allEmployees?.filter((emp: any) => {
      const empDeptId = typeof emp.department === 'object' ? emp.department?.id : emp.departmentId;
      return empDeptId === currentDeptId;
    }).length || 0
    : 0;

  // حماية الصفحات - توجيه المستخدم غير المصادق لصفحة الدخول
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [loading, isAuthenticated, setLocation]);

  // حماية الوحدات - منع الوصول للصفحات غير المسموح بها
  useEffect(() => {
    if (loading || !isAuthenticated) return;

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

    // الصفحات المسموح بها للجميع
    const publicPaths = ['/', '/profile', '/inbox', '/departments'];
    if (publicPaths.includes(location)) return;

    // البحث عن الوحدة المطابقة
    for (const [prefix, mod] of Object.entries(pathToModule)) {
      if (location.startsWith(prefix)) {
        if (!canAccessModule(mod)) {
          setLocation('/');
        }
        return;
      }
    }
  }, [loading, isAuthenticated, location, canAccessModule, setLocation]);

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
    { label: 'الرئيسية', path: '/', icon: LayoutDashboard, module: 'home' },
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
    // عنصر الأقسام - يظهر فقط لمدير النظام والمدير العام
    ...(isTopAdmin ? [{
      label: 'الأقسام',
      path: '/departments',
      icon: Grid3X3,
      module: 'home' as ModuleType,
    }] : []),
    // مراقبة الحضور - وصول سريع للمدير العام ومدير النظام
    ...(isTopAdmin ? [{
      label: 'مراقبة الحضور',
      path: '/hr/attendance-monitoring',
      icon: ClipboardCheck,
      module: 'home' as ModuleType,
    }] : []),
    // إدارة الإجازات - وصول سريع للمدير العام ومدير النظام
    ...(isTopAdmin ? [{
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
        { label: 'الموظفين', path: '/hr', icon: Users, hrSubPage: 'employees' },
        { label: 'الحضور', path: '/hr/attendance', icon: ClipboardCheck, hrSubPage: 'attendance' },
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
        { label: 'الموظفين', path: '/hr/employees', icon: Users, hrSubPage: 'employees-list' },
        { label: 'الإجازات', path: '/hr/leaves', icon: CalendarOff, hrSubPage: 'leaves-list' },
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
    { label: 'التكاملات', path: '/integrations', icon: LinkIcon, module: 'integrations' },
    {
      label: 'الطلبات',
      path: '/requests',
      icon: FileText,
      module: 'requests',
      children: [
        { label: 'كل الطلبات', path: '/requests', icon: FileText },
        ...(['admin', 'general_manager', 'hr_manager'].includes(selectedRole) ? [
          { label: 'أنواع الطلبات', path: '/requests/types', icon: ListTodo },
        ] : []),
        { label: 'سير العمل', path: '/requests/workflows', icon: GitBranch },
        ...(['admin', 'general_manager', 'hr_manager', 'department_manager', 'supervisor'].includes(selectedRole) ? [
          { label: 'الموافقات', path: '/workflow/approvals', icon: CheckCircle },
        ] : []),
        { label: 'التذاكر', path: '/support/tickets', icon: Ticket },
        ...(['admin', 'general_manager'].includes(selectedRole) ? [
          { label: 'أتمتة الدعم', path: '/support/automation', icon: Zap },
        ] : []),
      ]
    },
    {
      label: 'المستندات',
      path: '/documents',
      icon: FileStack,
      module: 'documents',
      children: [
        { label: 'كل المستندات', path: '/documents', icon: FileStack },
        { label: 'المجلدات', path: '/documents/folders', icon: FolderOpen },
        { label: 'القوالب', path: '/documents/templates', icon: FilePlus },
        { label: 'الأرشيف', path: '/documents/archive', icon: Archive },
      ]
    },
    {
      label: 'التقارير',
      path: '/reports',
      icon: BarChart3,
      module: 'reports',
      children: [
        { label: 'نظرة عامة', path: '/reports', icon: BarChart3 },
        { label: 'تقارير مخصصة', path: '/reports/custom', icon: FilePlus },
        { label: 'جدولة التقارير', path: '/reports/scheduled', icon: CalendarClock },
      ]
    },
    {
      label: 'مدير النظام',
      path: '/admin',
      icon: Shield,
      module: 'admin',
      children: [
        { label: 'نظرة عامة', path: '/admin', icon: Shield },
        { label: 'لوحة النظام', path: '/admin/system', icon: Monitor },
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
    },
    {
      label: 'التواصل',
      path: '/comms',
      icon: Mail,
      module: 'comms',
      children: [
        { label: 'المراسلات', path: '/comms', icon: MessageSquare },
        { label: 'الخطابات الرسمية', path: '/comms/official-letters', icon: Send },
        { label: 'الصادر', path: '/correspondence/outgoing', icon: Send },
        { label: 'الوارد', path: '/correspondence/incoming', icon: Mail },
        { label: 'المعاملات', path: '/correspondence/transactions', icon: FileStack },
      ]
    },
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
    {
      label: 'سير العمل',
      path: '/workflow',
      icon: GitBranch,
      module: 'workflow',
      children: [
        { label: 'العمليات', path: '/workflow', icon: GitBranch },
        { label: 'الموافقات', path: '/workflow/approvals', icon: CheckCircle },
        { label: 'التفويضات', path: '/workflow/delegations', icon: Users },
        { label: 'إعدادات الموافقات', path: '/workflow/settings', icon: Settings },
      ]
    },
    { label: 'صندوق الوارد', path: '/inbox', icon: Mail, module: 'inbox' },
    {
      label: 'أدوات المنصة',
      path: '/platform/calendar',
      icon: Cog,
      module: 'platform',
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
    },
    {
      label: 'الموقع العام',
      path: '/public-site',
      icon: Globe,
      module: 'public_site',
      children: [
        { label: 'الصفحات', path: '/public-site', icon: Globe },
        { label: 'المدونة', path: '/public-site/blog', icon: BookOpen },
      ]
    },
    {
      label: 'الإعدادات',
      path: '/settings',
      icon: Settings,
      module: 'settings',
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
    },
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
    map[item.path] = item.label;

    // If it's a department module, its logical parent is the Departments Hub
    if (item.module && departmentModules.includes(item.module)) {
      sectionMap[item.path] = { label: 'الأقسام', path: '/departments' };
    }

    if (item.children) {
      for (const child of item.children) {
        // Child gets its own label in the map.
        // We allow overwriting the item path label if the child path is the same,
        // so that the more specific (child) label is used for that path.
        map[child.path] = child.label;

        // Every child path maps to its parent section
        sectionMap[child.path] = { label: item.label, path: item.path };
      }
    }
  }

  // Robust mapping for unlisted pages:
  // If a path starts with a module path (e.g. /hr/anything), and isn't in sectionMap,
  // make it a child of the module's main path.
  const currentPath = location;
  if (!sectionMap[currentPath]) {
    for (const item of allNavItems) {
      if (item.module && currentPath.startsWith(item.path + '/') && currentPath !== item.path) {
        sectionMap[currentPath] = { label: item.label, path: item.path };
        break;
      }
    }
  }

  // Explicitly ensure /departments parent is home
  sectionMap['/departments'] = { label: 'الرئيسية', path: '/' };

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

    if (hasChildren) {
      return (
        <div key={item.path}>
          <button
            onClick={() => toggleExpand(item.path)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-5 w-5", isActive ? 'text-primary' : 'text-gray-400')} />
              {item.label}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="me-4 mt-1 space-y-1 border-r-2 border-gray-100 pe-2">
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
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isChild ? "py-2" : "",
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon className={cn(
          isChild ? "h-4 w-4" : "h-5 w-5",
          isActive ? 'text-primary' : 'text-gray-400'
        )} />
        {item.label}
      </Link>
    );
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`bg-white border-l border-gray-200 fixed inset-y-0 right-0 z-50 w-64 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <span className="text-2xl">🌧️</span>
              <span>منصة غيث</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => renderNavItem(item))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={`https://ui-avatars.com/api/?name=${ctxEmployee ? `${ctxEmployee.firstName} ${ctxEmployee.lastName}` : (user?.username || roleLabels[selectedRole])}&background=random`} />
                <AvatarFallback>{(ctxEmployee ? ctxEmployee.firstName : (user?.username || roleLabels[selectedRole])).substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ctxEmployee ? `${ctxEmployee.firstName} ${ctxEmployee.lastName}` : (user?.username || roleLabels[selectedRole])}
                </p>
                <p className="text-xs truncate" style={{ color: roleColors[selectedRole] }}>{roleLabels[selectedRole]}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
                <LogOut className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:me-0 transition-all duration-300">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              {navItems.find(i => location === i.path || location.startsWith(`${i.path}/`))?.label || 'الرئيسية'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* خانة الإشعارات */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-2 end-2 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* خانة الصفة - فقط للمستخدمين الذين لديهم أكثر من دور */}
            {allowedRoles.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 border border-purple-200 bg-purple-50 hover:bg-purple-100"
                    style={{ borderColor: `${roleColors[selectedRole]}40`, backgroundColor: `${roleColors[selectedRole]}10` }}
                  >
                    <Shield className="h-4 w-4" style={{ color: roleColors[selectedRole] }} />
                    <span className="hidden sm:inline-block text-sm font-medium" style={{ color: roleColors[selectedRole] }}>
                      {roleLabels[selectedRole]}
                    </span>
                    <ChevronDown className="h-3 w-3" style={{ color: roleColors[selectedRole] }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>تغيير الصفة</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allowedRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={selectedRole === role ? 'bg-purple-50 text-purple-700' : ''}
                    >
                      <Shield
                        className={`h-4 w-4 ms-2`}
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
                  <Button variant="ghost" className="gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="hidden sm:inline-block text-sm font-medium text-blue-700">
                      {currentBranch?.name || 'جميع الفروع'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-blue-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>تغيير الفرع</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    key="all"
                    onClick={() => setSelectedBranchId(null)}
                    className={selectedBranchId === null ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Building2 className={`h-4 w-4 ms-2 ${selectedBranchId === null ? 'text-blue-600' : 'text-gray-400'}`} />
                    جميع الفروع
                    <span className="mr-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">كل</span>
                  </DropdownMenuItem>
                  {branches.map((branch) => (
                    <DropdownMenuItem
                      key={branch.id}
                      onClick={() => setSelectedBranchId(branch.id)}
                      className={selectedBranchId === branch.id ? 'bg-blue-50 text-blue-700' : ''}
                    >
                      <Building2 className={`h-4 w-4 ms-2 ${selectedBranchId === branch.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      {branch.name}
                    </DropdownMenuItem>
                  ))}
                  {adminCompanies && adminCompanies.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-gray-400">الشركات</DropdownMenuLabel>
                      {adminCompanies.map((comp: any) => (
                        <DropdownMenuItem key={`comp-${comp.id}`} className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 ms-2 text-gray-400" />
                          <span>{comp.nameAr || comp.name}</span>
                          {comp.city && <span className="mr-auto text-xs text-gray-400">{comp.city}</span>}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Navigation History Breadcrumb */}
        {location !== '/' && history.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-4 lg:px-8 py-3">
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
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all group",
                              meta.bgColor,
                              meta.borderColor,
                              "hover:shadow-sm hover:scale-[1.02]"
                            )} style={{ color: meta.color }}>
                              {Icon && <Icon className="h-3.5 w-3.5" />}
                              <span>{entry.label}</span>
                            </div>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="transition-all duration-200">
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm border",
                              "text-white"
                            )} style={{ backgroundColor: meta.color, borderColor: meta.color }}>
                              {Icon && <Icon className="h-3.5 w-3.5" />}
                              <span>{entry.label}</span>
                            </div>
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="opacity-40">
                          <ChevronLeft className="h-4 w-4" />
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
