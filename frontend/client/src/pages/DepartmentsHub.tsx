import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import {
  Users,
  CreditCard,
  Truck,
  Home,
  Activity,
  ShieldCheck,
  LineChart,
  Scale,
  Megaphone,
  ShoppingCart,
  ChevronLeft,
  Clock,
  Calendar,
  DollarSign,
  GraduationCap,
  Target,
  Network,
  Briefcase,
  Receipt,
  Wallet,
  PieChart,
  FileBarChart,
  Car,
  Wrench,
  Fuel,
  MapPin,
  User,
  Bell,
  Building,
  FileSignature,
  Users2,
  Hammer,
  TrendingUp,
  Package,
  AlertTriangle,
  CalendarClock,
  GitBranch,
  FileText,
  BarChart3,
  Scan,
  UserCheck,
  Zap,
  Lock,
  ScrollText,
  ClipboardList,
  ArrowRightLeft,
  LayoutDashboard,
  Database,
  Search,
  FileCheck,
  ClipboardCheck,
  Shield,
  KeyRound,
  CalendarOff,
  ArrowRight,
  FileStack,
  Mail,
  Globe,
  Plug2,
  MessageSquare,
  Send,
  BookOpen,
  FolderOpen,
  Archive,
  FilePlus,
  CheckCircle,
  Ticket,
  Inbox,
  ListTodo,
  Settings,
} from 'lucide-react';

interface DepartmentItem {
  label: string;
  path: string;
  icon: any;
}

interface Department {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  items: DepartmentItem[];
}

const departments: Department[] = [
  {
    id: 'hr',
    label: 'الموارد البشرية',
    icon: Users,
    color: '#2980B9',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'إدارة شؤون الموظفين والحضور والرواتب والتوظيف',
    items: [
      { label: 'الموظفين', path: '/hr/employees', icon: Users },
      { label: 'الحضور والانصراف', path: '/hr/attendance-monitoring', icon: Clock },
      { label: 'الإجازات', path: '/hr/leave-management', icon: Calendar },
      { label: 'الرواتب', path: '/hr/payroll', icon: DollarSign },
      { label: 'تقييم الأداء', path: '/hr/performance-advanced', icon: Target },
      { label: 'التدريب', path: '/hr/training-advanced', icon: GraduationCap },
      { label: 'الهيكل التنظيمي', path: '/hr/organization-structure', icon: Network },
      { label: 'التوظيف', path: '/hr/recruitment-advanced', icon: Briefcase },
      { label: 'المخالفات والجزاءات', path: '/hr/violations', icon: Scale },
      { label: 'مخالفاتي', path: '/hr/my-violations', icon: AlertTriangle },
      { label: 'الورديات والسياسات', path: '/hr/shifts', icon: CalendarClock },
      { label: 'التتبع الميداني', path: '/hr/field-tracking', icon: MapPin },
      { label: 'ماسح QR', path: '/hr/qr-scanner', icon: Scan },
      { label: 'سلاسل الموافقات', path: '/hr/approval-chains', icon: GitBranch },
      { label: 'الخطابات الرسمية', path: '/hr/official-letters', icon: FileText },
      { label: 'تقارير الحضور', path: '/hr/attendance-reports', icon: BarChart3 },
      { label: 'مراجعة الانضمام', path: '/hr/onboarding-review', icon: UserCheck },
      { label: 'تصعيد الجزاءات', path: '/hr/penalty-escalation', icon: TrendingUp },
      { label: 'أتمتة HR', path: '/hr/automation', icon: Zap },
      { label: 'بنود الراتب', path: '/hr/salary-components', icon: DollarSign },
    ],
  },
  {
    id: 'finance',
    label: 'المالية',
    icon: CreditCard,
    color: '#27AE60',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'إدارة الفواتير والمصروفات والميزانية والموردين',
    items: [
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
      { label: 'شجرة الحسابات', path: '/finance/accounts', icon: GitBranch },
      { label: 'الالتزامات المالية', path: '/finance/commitments', icon: Lock },
      { label: 'الطلبات المالية', path: '/finance/requests', icon: ClipboardList },
      { label: 'دورة الشراء P2P', path: '/finance/p2p', icon: ArrowRightLeft },
    ],
  },
  {
    id: 'fleet',
    label: 'الأسطول',
    icon: Truck,
    color: '#D35400',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'إدارة المركبات والسائقين والصيانة والتتبع',
    items: [
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
    ],
  },
  {
    id: 'property',
    label: 'إدارة الأملاك',
    icon: Home,
    color: '#8E44AD',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'إدارة العقارات والعقود والمستأجرين والصيانة',
    items: [
      { label: 'نظرة عامة', path: '/property', icon: Home },
      { label: 'العقارات', path: '/property/list', icon: Building },
      { label: 'العقود', path: '/property/contracts', icon: FileSignature },
      { label: 'المستأجرين', path: '/property/tenants', icon: Users2 },
      { label: 'الصيانة', path: '/property/maintenance', icon: Hammer },
      { label: 'أتمتة العقارات', path: '/property/automation', icon: Zap },
    ],
  },
  {
    id: 'operations',
    label: 'العمليات',
    icon: Activity,
    color: '#1ABC9C',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'إدارة المشاريع والمهام وتدقيق العمليات',
    items: [
      { label: 'نظرة عامة', path: '/operations', icon: Activity },
      { label: 'المشاريع', path: '/operations/projects', icon: Target },
      { label: 'مهام المشاريع', path: '/projects/tasks', icon: ClipboardList },
      { label: 'أعضاء المشاريع', path: '/projects/members', icon: Users },
      { label: 'تدقيق المشاريع', path: '/projects/audit', icon: ScrollText },
      { label: 'أتمتة المشاريع', path: '/projects/automation', icon: Zap },
    ],
  },
  {
    id: 'governance',
    label: 'الحوكمة',
    icon: ShieldCheck,
    color: '#2C3E50',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: 'إدارة السياسات والامتثال والصلاحيات والتدقيق',
    items: [
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
    ],
  },
  {
    id: 'bi',
    label: 'ذكاء الأعمال',
    icon: LineChart,
    color: '#E74C3C',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'لوحات المعلومات ومؤشرات الأداء والتقارير التحليلية',
    items: [
      { label: 'نظرة عامة', path: '/bi', icon: LineChart },
      { label: 'لوحات المعلومات', path: '/bi/dashboards', icon: LayoutDashboard },
      { label: 'مؤشرات الأداء', path: '/bi/kpis', icon: TrendingUp },
      { label: 'التقارير التحليلية', path: '/bi/reports', icon: FileBarChart },
      { label: 'محرك القرارات', path: '/bi/decision-engine', icon: Activity },
      { label: 'مصادر البيانات', path: '/bi/data-sources', icon: Database },
      { label: 'سجل التحليلات', path: '/bi/audit', icon: ScrollText },
    ],
  },
  {
    id: 'legal',
    label: 'الشؤون القانونية',
    icon: Scale,
    color: '#7F8C8D',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'إدارة القضايا والعقود والوثائق القانونية',
    items: [
      { label: 'القضايا', path: '/legal', icon: Briefcase },
      { label: 'العقود', path: '/legal/contracts', icon: FileSignature },
      { label: 'الوثائق القانونية', path: '/legal/documents', icon: FileText },
      { label: 'سجل التدقيق', path: '/legal/audit', icon: ScrollText },
      { label: 'أتمتة الشؤون القانونية', path: '/legal/automation', icon: Zap },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق',
    icon: Megaphone,
    color: '#E91E63',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'إدارة الحملات التسويقية والعملاء المحتملين',
    items: [
      { label: 'التسويق', path: '/marketing', icon: Megaphone },
    ],
  },
  {
    id: 'store',
    label: 'المتجر',
    icon: ShoppingCart,
    color: '#F39C12',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'إدارة المنتجات والطلبات والمبيعات',
    items: [
      { label: 'المنتجات', path: '/store', icon: Package },
      { label: 'الطلبات', path: '/store/orders', icon: ShoppingCart },
    ],
  },
  {
    id: 'requests',
    label: 'الطلبات',
    icon: FileText,
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'إدارة الطلبات وسير العمل والموافقات والدعم الفني',
    items: [
      { label: 'كل الطلبات', path: '/requests', icon: FileText },
      { label: 'أنواع الطلبات', path: '/requests/types', icon: ListTodo },
      { label: 'سير العمل', path: '/requests/workflows', icon: GitBranch },
      { label: 'الموافقات', path: '/workflow/approvals', icon: CheckCircle },
      { label: 'التذاكر', path: '/support/tickets', icon: Ticket },
      { label: 'أتمتة الدعم', path: '/support/automation', icon: Zap },
    ],
  },
  {
    id: 'documents',
    label: 'المستندات',
    icon: FileStack,
    color: '#7C3AED',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    description: 'إدارة المستندات والمجلدات والقوالب والأرشيف',
    items: [
      { label: 'كل المستندات', path: '/documents', icon: FileStack },
      { label: 'المجلدات', path: '/documents/folders', icon: FolderOpen },
      { label: 'القوالب', path: '/documents/templates', icon: FilePlus },
      { label: 'الأرشيف', path: '/documents/archive', icon: Archive },
    ],
  },
  {
    id: 'reports',
    label: 'التقارير',
    icon: BarChart3,
    color: '#0891B2',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: 'التقارير المخصصة والمجدولة ونظرة عامة على بيانات النظام',
    items: [
      { label: 'نظرة عامة', path: '/reports', icon: BarChart3 },
      { label: 'تقارير مخصصة', path: '/reports/custom', icon: FilePlus },
      { label: 'جدولة التقارير', path: '/reports/scheduled', icon: CalendarClock },
    ],
  },
  {
    id: 'comms',
    label: 'التواصل',
    icon: Mail,
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'المراسلات والخطابات الرسمية والبريد الصادر والوارد',
    items: [
      { label: 'المراسلات', path: '/comms', icon: MessageSquare },
      { label: 'الخطابات الرسمية', path: '/comms/official-letters', icon: Send },
      { label: 'الصادر', path: '/correspondence/outgoing', icon: Send },
      { label: 'الوارد', path: '/correspondence/incoming', icon: Mail },
    ],
  },
  {
    id: 'workflow',
    label: 'سير العمل',
    icon: GitBranch,
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'إدارة العمليات والموافقات والتفويضات وإعدادات سير العمل',
    items: [
      { label: 'العمليات', path: '/workflow', icon: GitBranch },
      { label: 'الموافقات', path: '/workflow/approvals', icon: CheckCircle },
      { label: 'التفويضات', path: '/workflow/delegations', icon: Users },
      { label: 'إعدادات الموافقات', path: '/workflow/settings', icon: Settings },
    ],
  },
  {
    id: 'inbox',
    label: 'صندوق الوارد',
    icon: Inbox,
    color: '#EA580C',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'استعراض وإدارة الرسائل والإشعارات الواردة',
    items: [
      { label: 'صندوق الوارد', path: '/inbox', icon: Inbox },
    ],
  },
  {
    id: 'public-site',
    label: 'الموقع العام',
    icon: Globe,
    color: '#0284C7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    description: 'إدارة صفحات الموقع الإلكتروني العام والمدونة',
    items: [
      { label: 'الصفحات', path: '/public-site', icon: Globe },
      { label: 'المدونة', path: '/public-site/blog', icon: BookOpen },
    ],
  },
  {
    id: 'integrations',
    label: 'التكاملات',
    icon: Plug2,
    color: '#475569',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: 'إدارة تكاملات النظام مع الخدمات والأنظمة الخارجية',
    items: [
      { label: 'التكاملات', path: '/integrations', icon: Plug2 },
    ],
  },
];

export default function DepartmentsHub() {
  const [location, navigate] = useLocation();

  // Parse selected dept from URL:
  // /departments/hr -> 'hr', /departments -> null
  // /hr (direct module route) -> 'hr'
  const pathParts = location.split('/').filter(Boolean);
  const deptIds = departments.map(d => d.id);
  const selectedDept =
    pathParts.length >= 2 && pathParts[0] === 'departments' ? pathParts[1] :
    pathParts.length === 1 && deptIds.includes(pathParts[0]) ? pathParts[0] :
    null;

  const { selectedCompanyId, selectedBranchId } = useAppContext();

  // Fetch company data to get its assigned departments (only when in a company context)
  const isInCompanyContext = selectedBranchId !== null && selectedCompanyId !== null;
  const { data: companyData } = useQuery<any>({
    queryKey: ['admin', 'companies', selectedCompanyId],
    queryFn: () => api.get(`/admin/companies/${selectedCompanyId}`).then(r => r.data).catch(() => null),
    enabled: isInCompanyContext,
    staleTime: 5 * 60 * 1000,
  });

  // Parse the allowed department codes from company; if none configured, show all
  const allowedDeptIds = useMemo<string[] | null>(() => {
    if (!isInCompanyContext || !companyData) return null;
    try {
      const codes = JSON.parse(companyData.departmentCodes || '[]');
      return Array.isArray(codes) && codes.length > 0 ? codes : null;
    } catch {
      return null;
    }
  }, [companyData, isInCompanyContext]);

  // Filter departments: show all if no restrictions, otherwise only allowed ones
  const visibleDepartments = allowedDeptIds
    ? departments.filter(d => allowedDeptIds.includes(d.id))
    : departments;

  const activeDept = visibleDepartments.find(d => d.id === selectedDept);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white shadow-xl mb-8 overflow-hidden relative border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black mb-1">الأقسام المركزية</h1>
            <p className="text-slate-300/80 text-sm">اختر القسم للوصول إلى خدماته وأدواته وإدارة العمليات اليومية</p>
          </div>
          <div className="hidden sm:flex w-12 h-12 bg-white/5 rounded-xl items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
            <LayoutDashboard className="w-6 h-6 text-[#C9A84C]" />
          </div>
        </div>
      </div>

      {!selectedDept ? (
        /* Department Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleDepartments.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => navigate('/departments/' + dept.id)}
                className={`group relative p-5 rounded-xl border border-white/5 bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-lg hover:shadow-[#C9A84C]/10 transition-all duration-300 text-right w-full hover:scale-[1.03] overflow-hidden`}
              >
                {/* Decorative background element with gold tint */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full -translate-x-12 -translate-y-12 blur-2xl group-hover:bg-[#C9A84C]/10 transition-colors" />

                <div className="relative flex items-start gap-4">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner group-hover:scale-110 group-hover:border-[#C9A84C]/30 transition-all duration-300"
                  >
                    <Icon className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-100 text-base mb-1 group-hover:text-white transition-colors">{dept.label}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-300 transition-colors">{dept.description}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-xs font-bold text-[#C9A84C]/80 group-hover:text-[#C9A84C] transition-colors">
                        {dept.items.length} خدمة
                      </span>
                      <ChevronLeft className="h-3.5 w-3.5 text-[#C9A84C]/60 group-hover:text-[#C9A84C] group-hover:-translate-x-1.5 transition-all" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Department Detail View */
        <div className="space-y-6">
          {/* Back button + Department header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/departments')}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[#C9A84C] transition-all group"
                title="رجوع للأقسام"
              >
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              {activeDept && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner"
                  >
                    <activeDept.icon className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{activeDept.label}</h2>
                    <p className="text-xs text-slate-400">{activeDept.description}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
              <span className="text-xs font-bold text-[#C9A84C]">
                {activeDept?.items.length || 0} خدمة مفعلة
              </span>
            </div>
          </div>

          {/* Items Grid */}
          {activeDept && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeDept.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={'/departments' + item.path}
                    className={`group flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-gradient-to-br from-[#1e293b] to-[#0f172a] hover:border-[#C9A84C]/30 hover:shadow-lg hover:shadow-[#C9A84C]/5 transition-all duration-300`}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-[#C9A84C]/20 transition-colors"
                    >
                      <ItemIcon className="h-5 w-5 text-[#C9A84C]/80 group-hover:text-[#C9A84C] transition-colors" />
                    </div>
                    <span className="font-bold text-slate-200 group-hover:text-white text-sm transition-colors">
                      {item.label}
                    </span>
                    <ChevronLeft className="h-4 w-4 text-[#C9A84C]/40 group-hover:text-[#C9A84C] mr-auto group-hover:-translate-x-1.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
