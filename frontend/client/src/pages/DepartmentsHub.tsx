import { useState } from 'react';
import { Link } from 'wouter';
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
      { label: 'الموظفين', path: '/hr', icon: Users },
      { label: 'الحضور والانصراف', path: '/hr/attendance', icon: Clock },
      { label: 'مراقبة الحضور', path: '/hr/attendance-monitoring', icon: ClipboardCheck },
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
];

export default function DepartmentsHub() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const activeDept = departments.find(d => d.id === selectedDept);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الأقسام</h1>
        <p className="text-gray-500 mt-1">اختر القسم للوصول إلى خدماته وأدواته</p>
      </div>

      {!selectedDept ? (
        /* Department Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`group relative p-5 rounded-xl border-2 ${dept.borderColor} ${dept.bgColor} hover:shadow-lg transition-all duration-200 text-right w-full hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${dept.color}15`, border: `1.5px solid ${dept.color}30` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: dept.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base">{dept.label}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs font-medium" style={{ color: dept.color }}>
                        {dept.items.length} خدمة
                      </span>
                      <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" style={{ color: dept.color }} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Department Detail View */
        <div className="space-y-4">
          {/* Back button + Department header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDept(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع للأقسام
            </button>
            {activeDept && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${activeDept.color}15` }}
                >
                  <activeDept.icon className="h-5 w-5" style={{ color: activeDept.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{activeDept.label}</h2>
                  <p className="text-xs text-gray-500">{activeDept.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Items Grid */}
          {activeDept && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeDept.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`group flex items-center gap-3 p-4 rounded-xl border ${activeDept.borderColor} bg-white hover:${activeDept.bgColor} hover:shadow-md transition-all duration-200`}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${activeDept.color}10` }}
                    >
                      <ItemIcon className="h-5 w-5" style={{ color: activeDept.color }} />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 text-sm">
                      {item.label}
                    </span>
                    <ChevronLeft className="h-4 w-4 text-gray-300 group-hover:text-gray-500 mr-auto group-hover:-translate-x-1 transition-transform" />
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
