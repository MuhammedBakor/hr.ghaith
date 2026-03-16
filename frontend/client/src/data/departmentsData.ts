export interface DeptItemData {
  label: string;
  path: string;
}

export interface DeptData {
  id: string;
  label: string;
  items: DeptItemData[];
}

export const departmentsData: DeptData[] = [
  {
    id: 'hr',
    label: 'الموارد البشرية',
    items: [
      { label: 'الموظفين', path: '/hr/employees' },
      { label: 'الحضور والانصراف', path: '/hr/attendance-monitoring' },
      { label: 'الإجازات', path: '/hr/leave-management' },
      { label: 'الرواتب', path: '/hr/payroll' },
      { label: 'تقييم الأداء', path: '/hr/performance-advanced' },
      { label: 'التدريب', path: '/hr/training-advanced' },
      { label: 'الهيكل التنظيمي', path: '/hr/organization-structure' },
      { label: 'التوظيف', path: '/hr/recruitment-advanced' },
      { label: 'المخالفات والجزاءات', path: '/hr/violations' },
      { label: 'مخالفاتي', path: '/hr/my-violations' },
      { label: 'الورديات والسياسات', path: '/hr/shifts' },
      { label: 'التتبع الميداني', path: '/hr/field-tracking' },
      { label: 'ماسح QR', path: '/hr/qr-scanner' },
      { label: 'الخطابات الرسمية', path: '/hr/official-letters' },
      { label: 'تقارير الحضور', path: '/hr/attendance-reports' },
      { label: 'مراجعة الانضمام', path: '/hr/onboarding-review' },
      { label: 'تصعيد الجزاءات', path: '/hr/penalty-escalation' },
      { label: 'أتمتة HR', path: '/hr/automation' },
      { label: 'بنود الراتب', path: '/hr/salary-components' },
      { label: 'أرصدة الإجازات', path: '/hr/leave-balances' },
      { label: 'إضافة موظف', path: '/hr/employees/add' },
      { label: 'الحضور', path: '/hr/attendance' },
    ],
  },
  {
    id: 'finance',
    label: 'المالية',
    items: [
      { label: 'الفواتير', path: '/finance' },
      { label: 'المصروفات', path: '/finance/expenses' },
      { label: 'الميزانية', path: '/finance/budget' },
      { label: 'التقارير المالية', path: '/finance/reports' },
      { label: 'الموردين', path: '/finance/vendors' },
      { label: 'طلبات الشراء', path: '/finance/purchase-orders' },
      { label: 'أتمتة المالية', path: '/finance/automation' },
      { label: 'العهد', path: '/finance/custodies' },
      { label: 'السلف', path: '/finance/salary-advances' },
      { label: 'المستودعات', path: '/finance/warehouses' },
      { label: 'الضرائب والزكاة', path: '/finance/tax' },
      { label: 'السندات', path: '/finance/vouchers' },
      { label: 'القيود', path: '/finance/journal-entries' },
      { label: 'شجرة الحسابات', path: '/finance/accounts' },
      { label: 'الالتزامات المالية', path: '/finance/commitments' },
      { label: 'الطلبات المالية', path: '/finance/requests' },
      { label: 'دورة الشراء P2P', path: '/finance/p2p' },
    ],
  },
  {
    id: 'fleet',
    label: 'الأسطول',
    items: [
      { label: 'التتبع المباشر', path: '/fleet' },
      { label: 'المركبات', path: '/fleet/vehicles' },
      { label: 'الصيانة', path: '/fleet/maintenance' },
      { label: 'استهلاك الوقود', path: '/fleet/fuel' },
      { label: 'السائقين', path: '/fleet/drivers' },
      { label: 'الخريطة', path: '/fleet/map' },
      { label: 'التنبيهات', path: '/fleet/alerts' },
      { label: 'التقارير', path: '/fleet/reports' },
      { label: 'الرحلات', path: '/fleet/trips' },
      { label: 'السياج الجغرافي', path: '/fleet/geofences' },
      { label: 'التحليلات', path: '/fleet/insights' },
      { label: 'أتمتة الأسطول', path: '/fleet/automation' },
    ],
  },
  {
    id: 'property',
    label: 'إدارة الأملاك',
    items: [
      { label: 'نظرة عامة', path: '/property' },
      { label: 'العقارات', path: '/property/list' },
      { label: 'العقود', path: '/property/contracts' },
      { label: 'المستأجرين', path: '/property/tenants' },
      { label: 'الصيانة', path: '/property/maintenance' },
      { label: 'أتمتة العقارات', path: '/property/automation' },
    ],
  },
  {
    id: 'operations',
    label: 'العمليات',
    items: [
      { label: 'نظرة عامة', path: '/operations' },
      { label: 'المشاريع', path: '/operations/projects' },
      { label: 'مهام المشاريع', path: '/projects/tasks' },
      { label: 'أعضاء المشاريع', path: '/projects/members' },
      { label: 'تدقيق المشاريع', path: '/projects/audit' },
      { label: 'أتمتة المشاريع', path: '/projects/automation' },
    ],
  },
  {
    id: 'governance',
    label: 'الحوكمة',
    items: [
      { label: 'نظرة عامة', path: '/governance' },
      { label: 'إدارة الهوية والوصول', path: '/governance/iam' },
      { label: 'إدارة متقدمة', path: '/governance/iam-advanced' },
      { label: 'حزم الأدوار', path: '/governance/role-packs' },
      { label: 'الامتثال', path: '/governance/compliance' },
      { label: 'مصفوفة الصلاحيات', path: '/governance/permissions' },
      { label: 'حدود العمليات', path: '/governance/operation-limits' },
      { label: 'قواعد العمل', path: '/governance/business-rules' },
      { label: 'مراقبة الجلسات', path: '/governance/session-monitor' },
      { label: 'تقييد الوصول', path: '/governance/access-restrictions' },
      { label: 'سجل التغييرات', path: '/governance/permission-log' },
      { label: 'السياسات', path: '/governance/policies' },
      { label: 'المخاطر', path: '/governance/risks' },
      { label: 'التدقيق', path: '/governance/audits' },
      { label: 'كشف الشذوذ', path: '/governance/anomaly-detections' },
      { label: 'قواعد الشذوذ', path: '/governance/anomaly-rules' },
      { label: 'الرقابة المزدوجة', path: '/governance/dual-control' },
    ],
  },
  {
    id: 'bi',
    label: 'ذكاء الأعمال',
    items: [
      { label: 'نظرة عامة', path: '/bi' },
      { label: 'لوحات المعلومات', path: '/bi/dashboards' },
      { label: 'مؤشرات الأداء', path: '/bi/kpis' },
      { label: 'التقارير التحليلية', path: '/bi/reports' },
      { label: 'محرك القرارات', path: '/bi/decision-engine' },
      { label: 'مصادر البيانات', path: '/bi/data-sources' },
      { label: 'سجل التحليلات', path: '/bi/audit' },
    ],
  },
  {
    id: 'legal',
    label: 'الشؤون القانونية',
    items: [
      { label: 'القضايا', path: '/legal' },
      { label: 'العقود', path: '/legal/contracts' },
      { label: 'الوثائق القانونية', path: '/legal/documents' },
      { label: 'سجل التدقيق', path: '/legal/audit' },
      { label: 'أتمتة الشؤون القانونية', path: '/legal/automation' },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق',
    items: [
      { label: 'التسويق', path: '/marketing' },
    ],
  },
  {
    id: 'store',
    label: 'المتجر',
    items: [
      { label: 'المنتجات', path: '/store' },
      { label: 'الطلبات', path: '/store/orders' },
    ],
  },
  {
    id: 'documents',
    label: 'المستندات',
    items: [
      { label: 'كل المستندات', path: '/documents' },
      { label: 'المجلدات', path: '/documents/folders' },
      { label: 'القوالب', path: '/documents/templates' },
      { label: 'الأرشيف', path: '/documents/archive' },
    ],
  },
  {
    id: 'reports',
    label: 'التقارير',
    items: [
      { label: 'نظرة عامة', path: '/reports' },
      { label: 'تقارير مخصصة', path: '/reports/custom' },
      { label: 'جدولة التقارير', path: '/reports/scheduled' },
    ],
  },
  {
    id: 'comms',
    label: 'التواصل',
    items: [
      { label: 'المراسلات', path: '/comms' },
      { label: 'الخطابات الرسمية', path: '/comms/official-letters' },
      { label: 'الصادر', path: '/correspondence/outgoing' },
      { label: 'الوارد', path: '/correspondence/incoming' },
    ],
  },
  {
    id: 'workflow',
    label: 'سير العمل',
    items: [
      { label: 'العمليات', path: '/workflow' },
      { label: 'الموافقات', path: '/workflow/approvals' },
      { label: 'التفويضات', path: '/workflow/delegations' },
      { label: 'إعدادات الموافقات', path: '/workflow/settings' },
    ],
  },
  {
    id: 'inbox',
    label: 'صندوق الوارد',
    items: [
      { label: 'صندوق الوارد', path: '/inbox' },
    ],
  },
  {
    id: 'public-site',
    label: 'الموقع العام',
    items: [
      { label: 'الصفحات', path: '/public-site' },
      { label: 'المدونة', path: '/public-site/blog' },
    ],
  },
  {
    id: 'integrations',
    label: 'التكاملات',
    items: [
      { label: 'التكاملات', path: '/integrations' },
    ],
  },
];

// Lookup maps built once for fast access
export const deptByPath: Record<string, DeptData> = {};
export const labelByPath: Record<string, string> = {};

for (const dept of departmentsData) {
  for (const item of dept.items) {
    deptByPath[item.path] = dept;
    labelByPath[item.path] = item.label;
    // Also register /departments/... variant
    deptByPath['/departments' + item.path] = dept;
    labelByPath['/departments' + item.path] = item.label;
  }
}
