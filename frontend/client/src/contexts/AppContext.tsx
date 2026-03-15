import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useUser } from '@/services/authService';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// أنواع الصفات المتاحة
export type UserRoleType = 'admin' | 'general_manager' | 'hr_manager' | 'finance_manager' | 'fleet_manager' | 'legal_manager' | 'projects_manager' | 'store_manager' | 'supervisor' | 'employee' | 'department_manager' | 'agent';

export const roleLabels: Record<UserRoleType, string> = {
  admin: 'مدير النظام',
  general_manager: 'المدير العام',
  hr_manager: 'مدير الموارد البشرية',
  finance_manager: 'المدير المالي',
  fleet_manager: 'مدير الأسطول',
  legal_manager: 'المدير القانوني',
  projects_manager: 'مدير المشاريع',
  store_manager: 'مدير المخازن',
  supervisor: 'مشرف',
  employee: 'موظف',
  department_manager: 'مدير قسم',
  agent: 'مندوب / وكيل',
};

export const roleColors: Record<UserRoleType, string> = {
  admin: '#C0392B',
  general_manager: '#8E44AD',
  hr_manager: '#2980B9',
  finance_manager: '#27AE60',
  fleet_manager: '#D35400',
  legal_manager: '#7F8C8D',
  projects_manager: '#1ABC9C',
  store_manager: '#F39C12',
  supervisor: '#3498DB',
  employee: '#95A5A6',
  department_manager: '#16A085',
  agent: '#E67E22',
};

// ربط الأقسام بأدوار مدير القسم
export const departmentToRoleMap: Record<string, UserRoleType> = {
  // by code
  'HR': 'hr_manager',
  'FIN': 'finance_manager',
  'FLEET': 'fleet_manager',
  'LEGAL': 'legal_manager',
  'PROJ': 'projects_manager',
  'WH': 'store_manager',
  'PROP': 'department_manager',
  'UMRAH': 'department_manager',
  // by Arabic name
  'الموارد البشرية': 'hr_manager',
  'المالية': 'finance_manager',
  'الاسطول': 'fleet_manager',
  'القانون': 'legal_manager',
  'المشاريع': 'projects_manager',
  'المخازن': 'store_manager',
  'الاملاك': 'department_manager',
  'العمرة': 'department_manager',
  // by English name
  'Human Resources': 'hr_manager',
  'Finance': 'finance_manager',
  'Fleet': 'fleet_manager',
  'Legal': 'legal_manager',
  'Projects': 'projects_manager',
  'Warehouses': 'store_manager',
  'Properties': 'department_manager',
  'Umrah': 'department_manager',
};

// مستويات الأدوار (الأعلى = صلاحيات أكثر)
export const roleLevels: Record<UserRoleType, number> = {
  admin: 100,
  general_manager: 90,
  hr_manager: 70,
  finance_manager: 70,
  fleet_manager: 70,
  legal_manager: 70,
  projects_manager: 70,
  store_manager: 70,
  supervisor: 50,
  employee: 10,
  department_manager: 60,
  agent: 15,
};

// الفروع المتاحة
export interface Branch {
  id: number;
  name: string;
  nameAr?: string;
  code: string;
  city?: string;
}

// الوحدات المتاحة في النظام
export type ModuleType =
  | 'home'
  | 'hr'
  | 'finance'
  | 'fleet'
  | 'property'
  | 'operations'
  | 'governance'
  | 'bi'
  | 'support'
  | 'legal'
  | 'projects'
  | 'documents'
  | 'reports'
  | 'admin'
  | 'settings'
  | 'system'
  | 'marketing'
  | 'store'
  | 'workflow'
  | 'comm'
  | 'integrations'
  | 'requests'
  | 'comms'
  | 'public_site'
  | 'inbox'
  | 'platform';

// ربط كودات الأقسام (departmentCodes في AdminCompany) بالوحدات
export const DEPT_CODE_TO_MODULE: Record<string, ModuleType> = {
  'hr': 'hr',
  'finance': 'finance',
  'fleet': 'fleet',
  'property': 'property',
  'operations': 'projects',
  'governance': 'governance',
  'legal': 'legal',
  'bi': 'bi',
  'support': 'support',
  'marketing': 'marketing',
  'store': 'store',
  'requests': 'requests',
  'documents': 'documents',
  'reports': 'reports',
  'comms': 'comms',
  'workflow': 'workflow',
  'public-site': 'public_site',
  'integrations': 'integrations',
  'inbox': 'inbox',
};

// الوحدات الأساسية المتاحة دائماً بغض النظر عن أقسام الشركة
const CORE_MODULES: ModuleType[] = ['home', 'admin', 'platform', 'settings', 'system', 'inbox'];

// صلاحيات الوحدات لكل صفة
export const modulePermissions: Record<UserRoleType, ModuleType[]> = {
  admin: [
    'home', 'hr', 'finance', 'fleet', 'property', 'operations', 'governance',
    'bi', 'integrations', 'requests', 'documents', 'reports', 'admin',
    'comms', 'legal', 'marketing', 'store', 'workflow', 'public_site', 'settings',
    'support', 'projects', 'platform', 'inbox', 'comm', 'system'
  ],
  general_manager: [
    'home', 'hr', 'finance', 'fleet', 'property', 'operations', 'governance',
    'bi', 'integrations', 'requests', 'documents', 'reports', 'admin',
    'comms', 'legal', 'marketing', 'store', 'workflow', 'public_site', 'settings',
    'support', 'projects', 'platform', 'inbox'
  ],
  hr_manager: [
    'home', 'hr', 'requests', 'documents', 'reports', 'comms', 'settings'
  ],
  finance_manager: [
    'home', 'finance', 'requests', 'documents', 'reports', 'comms', 'store', 'settings'
  ],
  fleet_manager: [
    'home', 'fleet', 'requests', 'documents', 'reports', 'comms', 'settings'
  ],
  legal_manager: [
    'home', 'legal', 'requests', 'documents', 'reports', 'comms', 'settings'
  ],
  projects_manager: [
    'home', 'operations', 'requests', 'documents', 'reports', 'comms', 'settings'
  ],
  store_manager: [
    'home', 'store', 'requests', 'documents', 'reports', 'comms', 'settings'
  ],
  supervisor: [
    'home', 'hr', 'requests', 'documents', 'comms', 'support', 'workflow'
  ],
  employee: [
    'home', 'hr', 'requests', 'documents', 'comms', 'support'
  ],
  department_manager: [
    'home', 'hr', 'property', 'requests', 'documents', 'comms', 'support', 'workflow'
  ],
  agent: [
    'home', 'fleet', 'requests', 'comms', 'support'
  ],
};

// صلاحيات HR الفرعية لكل صفة
export const hrSubPermissions: Record<UserRoleType, string[]> = {
  admin: [
    'employees', 'employees-list', 'attendance', 'attendance-monitoring', 'leaves', 'leaves-list', 'leave-balances', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations', 'my_violations',
    'shifts', 'tracking', 'qr', 'approvals', 'letters', 'reports', 'onboarding', 'escalation', 'automation', 'salary'
  ],
  general_manager: [
    'employees', 'employees-list', 'attendance', 'attendance-monitoring', 'leaves', 'leaves-list', 'leave-balances', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations',
    'shifts', 'tracking', 'qr', 'approvals', 'letters', 'reports', 'onboarding', 'escalation', 'automation', 'salary'
  ],
  hr_manager: [
    'employees', 'employees-list', 'attendance', 'attendance-monitoring', 'leaves', 'leaves-list', 'leave-balances', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations',
    'shifts', 'tracking', 'qr', 'approvals', 'letters', 'reports', 'onboarding', 'escalation', 'automation', 'salary'
  ],
  finance_manager: ['payroll'],
  fleet_manager: ['attendance', 'attendance-monitoring'],
  legal_manager: [],
  projects_manager: ['attendance', 'attendance-monitoring'],
  store_manager: ['attendance', 'attendance-monitoring'],
  supervisor: ['attendance', 'attendance-monitoring', 'leaves', 'my_violations'],
  employee: ['attendance', 'attendance-monitoring', 'leaves', 'my_violations'],
  department_manager: ['attendance', 'attendance-monitoring', 'leaves', 'leaves-list', 'violations', 'employees-list'],
  agent: ['attendance', 'attendance-monitoring', 'my_violations'],
};

// صلاحيات كل صفة
export const rolePermissions: Record<UserRoleType, {
  canViewAllBranches: boolean;
  canManageViolations: boolean;
  canConfirmViolations: boolean;
  canApproveViolations: boolean;
  canExecutePenalties: boolean;
  canManageEmployees: boolean;
  canApproveLeaves: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canManageFinance: boolean;
  canManageFleet: boolean;
  canManageProperty: boolean;
  canManageGovernance: boolean;
  canManageBI: boolean;
  canManageLegal: boolean;
}> = {
  admin: {
    canViewAllBranches: true, canManageViolations: true, canConfirmViolations: true,
    canApproveViolations: true, canExecutePenalties: true, canManageEmployees: true,
    canApproveLeaves: true, canViewReports: true, canManageSettings: true,
    canManageUsers: true, canManageRoles: true, canViewAuditLogs: true,
    canManageFinance: true, canManageFleet: true, canManageProperty: true,
    canManageGovernance: true, canManageBI: true, canManageLegal: true,
  },
  general_manager: {
    canViewAllBranches: true, canManageViolations: true, canConfirmViolations: true,
    canApproveViolations: true, canExecutePenalties: true, canManageEmployees: true,
    canApproveLeaves: true, canViewReports: true, canManageSettings: true,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: true,
    canManageFinance: true, canManageFleet: true, canManageProperty: true,
    canManageGovernance: true, canManageBI: true, canManageLegal: true,
  },
  hr_manager: {
    canViewAllBranches: false, canManageViolations: true, canConfirmViolations: true,
    canApproveViolations: true, canExecutePenalties: true, canManageEmployees: true,
    canApproveLeaves: true, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  finance_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: true, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: true, canManageLegal: false,
  },
  fleet_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: true, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  legal_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: true,
  },
  projects_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: true,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  store_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: true, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  supervisor: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: true,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: true, canViewReports: false, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  employee: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: false, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  department_manager: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: true,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: true, canViewReports: false, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
  agent: {
    canViewAllBranches: false, canManageViolations: false, canConfirmViolations: false,
    canApproveViolations: false, canExecutePenalties: false, canManageEmployees: false,
    canApproveLeaves: false, canViewReports: false, canManageSettings: false,
    canManageUsers: false, canManageRoles: false, canViewAuditLogs: false,
    canManageFinance: false, canManageFleet: false, canManageProperty: false,
    canManageGovernance: false, canManageBI: false, canManageLegal: false,
  },
};

interface AppContextType {
  // الفرع
  selectedBranchId: number | null;
  setSelectedBranchId: (branchId: number | null) => void;
  currentBranch: Branch | null;
  branches: Branch[];
  branchesLoading: boolean;

  // الشركة المختارة
  selectedCompanyId: number | null;
  setSelectedCompanyId: (companyId: number | null) => void;

  // الصفة
  selectedRole: UserRoleType;
  setSelectedRole: (role: UserRoleType) => void;
  roleLevel: number;

  // الصلاحيات
  permissions: typeof rolePermissions[UserRoleType];
  hasPermission: (permission: keyof typeof rolePermissions[UserRoleType]) => boolean;

  // صلاحيات الوحدات
  allowedModules: ModuleType[];
  canAccessModule: (module: ModuleType) => boolean;

  // صلاحيات HR الفرعية
  allowedHrSubPages: string[];
  canAccessHrSubPage: (subPage: string) => boolean;

  // تحديث السياق في السيرفر
  updateContext: (data: { currentRoleId?: number; currentBranchId?: number; viewAllBranches?: boolean }) => void;

  // معلومات مدير القسم
  isDepartmentManager: boolean;
  currentUserId: number | null;
  currentEmployeeId: number | null;
  currentEmployee: any | null;

  // الأدوار المتاحة للمستخدم الحالي
  allowedRoles: UserRoleType[];

  // كودات أقسام الشركة المختارة (null = لا قيود)
  companyDeptCodes: string[] | null;

  // بيانات الشركة المختارة
  selectedCompanyData: any | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBranchId');
      return saved ? parseInt(saved) : null;
    }
    return null;
  });

  const [selectedCompanyId, setSelectedCompanyIdState] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedCompanyId');
      return saved ? parseInt(saved) : null;
    }
    return null;
  });

  const setSelectedCompanyId = (companyId: number | null) => {
    setSelectedCompanyIdState(companyId);
    if (typeof window !== 'undefined') {
      if (companyId !== null) {
        localStorage.setItem('selectedCompanyId', companyId.toString());
      } else {
        localStorage.removeItem('selectedCompanyId');
      }
    }
  };

  const [selectedRole, setSelectedRoleState] = useState<UserRoleType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('selectedRole') as UserRoleType) || 'admin';
    }
    return 'admin';
  });

  // جلب أقسام الشركة المختارة
  const { data: selectedCompanyData } = useQuery<any>({
    queryKey: ['admin', 'company', selectedCompanyId],
    queryFn: () => api.get(`/admin/companies/${selectedCompanyId}`).then(r => r.data).catch(() => null),
    enabled: !!selectedCompanyId,
    staleTime: 5 * 60 * 1000,
  });

  // قائمة كودات أقسام الشركة المختارة (null = لا قيود)
  const companyDeptCodes = useMemo<string[] | null>(() => {
    if (!selectedCompanyId || !selectedCompanyData) return null;
    try {
      const codes = JSON.parse(selectedCompanyData.departmentCodes || '[]');
      return Array.isArray(codes) && codes.length > 0 ? codes : null;
    } catch {
      return null;
    }
  }, [selectedCompanyId, selectedCompanyData]);

  // الوحدات المتاحة للشركة المختارة
  const companyModuleSet = useMemo<Set<ModuleType> | null>(() => {
    if (!companyDeptCodes) return null;
    const s = new Set<ModuleType>(CORE_MODULES);
    for (const code of companyDeptCodes) {
      const mod = DEPT_CODE_TO_MODULE[code];
      if (mod) s.add(mod);
    }
    return s;
  }, [companyDeptCodes]);

  // جلب الفروع من السيرفر
  const { data: branchesData, isLoading: branchesLoading } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/hr/branches').then(r => r.data).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  // جلب معلومات المستخدم الحالي
  const { data: authData } = useUser();
  const currentUserId = authData?.id || null;

  // جلب الأدوار المخصصة (RolePack) لتطبيق صلاحياتها عند تعيينها للموظف
  const { data: allRolePacks } = useQuery<any[]>({
    queryKey: ['custom-roles'],
    queryFn: () => api.get('/roles').then(r => r.data).catch(() => []),
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('token'),
  });

  // ابحث عن RolePack مطابق لأحد أدوار المستخدم (authData.roles)
  const activeRolePack = (() => {
    if (!allRolePacks || !authData?.roles) return null;
    const userRoleCodes = (authData.roles as string[]).map((r: string) => r.toLowerCase());
    return allRolePacks.find((rp: any) =>
      rp.code && userRoleCodes.includes(rp.code.toLowerCase())
    ) || null;
  })();

  // جلب الموظف المرتبط بالمستخدم الحالي - مفلتر بالفرع للعزل بين الفروع
  const { data: currentEmployee } = useQuery<any>({
    queryKey: ['employee', 'me', currentUserId, selectedBranchId],
    queryFn: () => {
      const params = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
      return api.get(`/hr/employees/user/${currentUserId}${params}`).then(r => r.data).catch(() => null);
    },
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000,
  });
  const currentEmployeeId = currentEmployee?.id || null;

  // ربط الدور من السيرفر — تعيين الدور الأولي بعد تسجيل الدخول
  useEffect(() => {
    if (authData?.role) {
      const savedRole = localStorage.getItem('selectedRole') as UserRoleType | null;

      // تحويل الدور الأساسي من السيرفر إلى دور الواجهة
      const mapServerRole = (sr: string): UserRoleType => {
        const s = sr.toLowerCase();
        if (s === 'owner' || s === 'admin' || s === 'system_admin') return 'admin';
        if (s === 'general_manager') return 'general_manager';
        if (s === 'departement_manager' && currentEmployee) {
          const dept = currentEmployee.department;
          const deptCode = typeof dept === 'object' ? (dept?.code || dept?.nameAr || dept?.name) : dept;
          return departmentToRoleMap[deptCode] || 'department_manager';
        }
        if (s === 'departement_manager') return 'department_manager';
        if (s === 'supervisor') return 'supervisor';
        if (s === 'agent') return 'agent';
        return 'employee';
      };

      // إذا لا يوجد اختيار سابق، عيّن الدور الأساسي
      if (!savedRole) {
        setSelectedRole(mapServerRole(authData.role as string));
      }
    }
  }, [authData?.role, currentEmployee]);

  // تحديث السياق في السيرفر
  // const updateContextMutation = trpc.controlKernel.context.update.useMutation();
  const updateContextMutation = { mutate: (data: any) => console.log('Mock update context', data) };

  const branches: Branch[] = branchesData?.map((b: any) => ({
    id: b.id,
    name: b.name,
    nameAr: b.nameAr || '',
    code: b.code || '',
    city: b.city || '',
  })) || [];

  // حفظ الاختيارات في localStorage
  const setSelectedBranchId = (branchId: number | null) => {
    setSelectedBranchIdState(branchId);
    if (typeof window !== 'undefined') {
      if (branchId !== null) {
        localStorage.setItem('selectedBranchId', branchId.toString());
      } else {
        localStorage.removeItem('selectedBranchId');
        // Also clear company when branch is cleared (admin entry mode)
        localStorage.removeItem('selectedCompanyId');
        setSelectedCompanyIdState(null);
      }
    }
    // تحديث السياق في السيرفر
    updateContextMutation.mutate({
      currentBranchId: branchId || undefined,
      viewAllBranches: branchId === null
    });
  };

  const setSelectedRole = (role: UserRoleType) => {
    setSelectedRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRole', role);
    }
  };

  const currentBranch = branches.find(b => b.id === selectedBranchId) || null;
  const permissions = rolePermissions[selectedRole];
  const roleLevel = roleLevels[selectedRole];

  // هل المستخدم مدير قسم؟
  const isDepartmentManager = selectedRole === 'department_manager';

  // تحديد الأدوار المتاحة للمستخدم بناءً على أدواره من السيرفر (دعم الأدوار المتعددة)
  const allowedRoles: UserRoleType[] = (() => {
    // لا تغير الأدوار قبل تحميل بيانات المستخدم
    if (!authData?.role) {
      return Object.keys(roleLabels) as UserRoleType[];
    }
    const serverRoles: string[] = (authData?.roles && authData.roles.length > 0)
      ? authData.roles.map((r: string) => r.toLowerCase())
      : [(authData.role as string).toLowerCase()];
    const allRoles = Object.keys(roleLabels) as UserRoleType[];

    // OWNER و admin يرون كل الأدوار
    if (serverRoles.some(r => r === 'owner' || r === 'admin' || r === 'system_admin')) {
      return allRoles;
    }
    // المدير العام يرى كل الأدوار
    if (serverRoles.includes('general_manager')) {
      return allRoles;
    }

    // بناء قائمة الأدوار المتاحة من كل الأدوار المعينة
    const result = new Set<UserRoleType>();
    for (const serverRole of serverRoles) {
      if (serverRole === 'departement_manager' && currentEmployee) {
        const dept = currentEmployee.department;
        const deptCode = typeof dept === 'object' ? (dept?.code || dept?.nameAr || dept?.name) : dept;
        const mappedRole = departmentToRoleMap[deptCode] || 'department_manager';
        result.add(mappedRole);
      } else if (serverRole === 'departement_manager') {
        result.add('department_manager');
      } else if (serverRole === 'supervisor') {
        result.add('supervisor');
      } else if (serverRole === 'employee') {
        result.add('employee');
      } else if (serverRole === 'agent') {
        result.add('agent');
      } else {
        // Try direct mapping
        const roleMap: Record<string, UserRoleType> = {
          'hr_manager': 'hr_manager',
          'finance_manager': 'finance_manager',
          'fleet_manager': 'fleet_manager',
          'legal_manager': 'legal_manager',
          'projects_manager': 'projects_manager',
          'store_manager': 'store_manager',
        };
        if (roleMap[serverRole]) {
          result.add(roleMap[serverRole]);
        }
      }
    }

    return result.size > 0 ? Array.from(result) : ['employee'];
  })();

  // إذا كان للمستخدم دور مخصص (RolePack)، استخدم صلاحياته بدلاً من الصلاحيات الافتراضية
  const rolePackPermissions = (() => {
    if (!activeRolePack?.permissions) return null;
    try {
      const parsed = typeof activeRolePack.permissions === 'string'
        ? JSON.parse(activeRolePack.permissions)
        : activeRolePack.permissions;
      return parsed as { modules?: string[]; hrSubPages?: string[] };
    } catch {
      return null;
    }
  })();

  const allowedModules: ModuleType[] = rolePackPermissions?.modules
    ? (rolePackPermissions.modules as ModuleType[])
    : modulePermissions[selectedRole];

  const allowedHrSubPages: string[] = rolePackPermissions?.hrSubPages
    ? rolePackPermissions.hrSubPages
    : hrSubPermissions[selectedRole];

  // التحقق من أن الدور المختار لا يزال ضمن الأدوار المسموحة (فقط بعد تحميل بيانات المستخدم)
  useEffect(() => {
    if (authData?.role && allowedRoles.length > 0 && !allowedRoles.includes(selectedRole)) {
      setSelectedRole(allowedRoles[0]);
    }
  }, [allowedRoles, selectedRole, authData?.role]);

  const hasPermission = (permission: keyof typeof rolePermissions[UserRoleType]) => {
    return permissions[permission];
  };

  const canAccessModule = (module: ModuleType): boolean => {
    // فحص صلاحية الدور أولاً
    if (!allowedModules.includes(module)) return false;
    // إذا كنا في سياق شركة وتم تحديد أقسامها، نطبق القيود
    if (companyModuleSet !== null) {
      return companyModuleSet.has(module);
    }
    return true;
  };

  const canAccessHrSubPage = (subPage: string) => {
    return allowedHrSubPages.includes(subPage);
  };

  const updateContext = (data: { currentRoleId?: number; currentBranchId?: number; viewAllBranches?: boolean }) => {
    updateContextMutation.mutate(data);
  };

  return (
    <AppContext.Provider value={{
      selectedBranchId,
      setSelectedBranchId,
      selectedCompanyId,
      setSelectedCompanyId,
      currentBranch,
      branches,
      branchesLoading,
      selectedRole,
      setSelectedRole,
      roleLevel,
      permissions,
      hasPermission,
      allowedModules,
      canAccessModule,
      allowedHrSubPages,
      canAccessHrSubPage,
      updateContext,
      isDepartmentManager,
      currentUserId,
      currentEmployeeId,
      currentEmployee: currentEmployee || null,
      allowedRoles,
      companyDeptCodes,
      selectedCompanyData: selectedCompanyData ?? null,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
