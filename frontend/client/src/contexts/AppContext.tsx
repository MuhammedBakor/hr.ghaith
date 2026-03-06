import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/services/authService';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// أنواع الصفات المتاحة
export type UserRoleType = 'admin' | 'general_manager' | 'hr_manager' | 'finance_manager' | 'fleet_manager' | 'legal_manager' | 'projects_manager' | 'store_manager' | 'supervisor' | 'employee' | 'department_manager';

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
};

// الفروع المتاحة
export interface Branch {
  id: number;
  name: string;
  code: string;
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
  | 'integrations'
  | 'requests'
  | 'documents'
  | 'reports'
  | 'admin'
  | 'comms'
  | 'legal'
  | 'marketing'
  | 'store'
  | 'workflow'
  | 'public_site'
  | 'inbox'
  | 'platform'
  | 'settings';

// صلاحيات الوحدات لكل صفة
export const modulePermissions: Record<UserRoleType, ModuleType[]> = {
  admin: [
    'home', 'hr', 'finance', 'fleet', 'property', 'operations', 'governance',
    'bi', 'integrations', 'requests', 'documents', 'reports', 'admin',
    'comms', 'legal', 'marketing', 'store', 'workflow', 'public_site', 'settings'
  ],
  general_manager: [
    'home', 'hr', 'finance', 'fleet', 'property', 'operations', 'governance',
    'bi', 'integrations', 'requests', 'documents', 'reports', 'admin',
    'comms', 'legal', 'marketing', 'store', 'workflow', 'public_site', 'settings'
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
    'home', 'hr', 'requests', 'documents', 'comms'
  ],
  employee: [
    'home', 'hr', 'requests', 'documents', 'comms'
  ],
  department_manager: [
    'home', 'hr', 'property', 'requests', 'documents', 'comms'
  ],
};

// صلاحيات HR الفرعية لكل صفة
export const hrSubPermissions: Record<UserRoleType, string[]> = {
  admin: [
    'employees', 'attendance', 'leaves', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations', 'my_violations'
  ],
  general_manager: [
    'employees', 'attendance', 'leaves', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations'
  ],
  hr_manager: [
    'employees', 'attendance', 'leaves', 'payroll', 'performance',
    'training', 'organization', 'recruitment', 'violations'
  ],
  finance_manager: ['payroll'],
  fleet_manager: ['attendance'],
  legal_manager: [],
  projects_manager: ['attendance'],
  store_manager: ['attendance'],
  supervisor: ['attendance', 'leaves', 'my_violations'],
  employee: ['attendance', 'leaves', 'my_violations'],
  department_manager: ['attendance', 'leaves', 'my_violations'],
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
};

interface AppContextType {
  // الفرع
  selectedBranchId: number | null;
  setSelectedBranchId: (branchId: number | null) => void;
  currentBranch: Branch | null;
  branches: Branch[];
  branchesLoading: boolean;

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

  // الأدوار المتاحة للمستخدم الحالي
  allowedRoles: UserRoleType[];
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

  const [selectedRole, setSelectedRoleState] = useState<UserRoleType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('selectedRole') as UserRoleType) || 'admin';
    }
    return 'admin';
  });

  // جلب الفروع من السيرفر
  const { data: branchesData, isLoading: branchesLoading } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/hr/branches').then(r => r.data).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  // جلب معلومات المستخدم الحالي
  const { data: authData } = useUser();
  const currentUserId = authData?.id || null;

  // جلب معلومات الموظف المرتبط بالمستخدم
  const { data: employeeData } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: () => api.get('/hr/employees').then(r => r.data).catch(() => []),
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000,
  });

  // البحث عن الموظف المرتبط بالمستخدم الحالي
  const currentEmployee = employeeData?.find((emp: any) =>
    emp.userId === currentUserId || emp.user?.id === currentUserId
  );
  const currentEmployeeId = currentEmployee?.id || null;

  // v60: ربط الدور من السيرفر — فقط إذا لم يكن هناك دور مختار مسبقاً
  useEffect(() => {
    if (authData?.role) {
      const hasPreference = !!localStorage.getItem('selectedRole');

      if (!hasPreference) {
        const serverRole = (authData.role as string).toLowerCase();
        // Map DB role to frontend role
        const roleMap: Record<string, UserRoleType> = {
          'admin': 'admin',
          'system_admin': 'admin',
          'owner': 'admin',
          'general_manager': 'general_manager',
          'hr_manager': 'hr_manager',
          'finance_manager': 'finance_manager',
          'fleet_manager': 'fleet_manager',
          'legal_manager': 'legal_manager',
          'projects_manager': 'projects_manager',
          'store_manager': 'store_manager',
          'supervisor': 'supervisor',
          'employee': 'employee',
          'agent': 'employee',
          'user': 'employee',
        };

        let mappedRole = roleMap[serverRole] || 'employee';

        // إذا كان مدير قسم، حدد الدور بناءً على القسم
        if (serverRole === 'departement_manager' && currentEmployee) {
          const dept = currentEmployee.department;
          const deptCode = typeof dept === 'object' ? (dept?.code || dept?.nameAr || dept?.name) : dept;
          mappedRole = departmentToRoleMap[deptCode] || 'department_manager';
        } else if (serverRole === 'departement_manager') {
          mappedRole = 'department_manager';
        }

        setSelectedRole(mappedRole);
      }
    }
  }, [authData?.role, currentEmployee]);

  // تحديث السياق في السيرفر
  // const updateContextMutation = trpc.controlKernel.context.update.useMutation();
  const updateContextMutation = { mutate: (data: any) => console.log('Mock update context', data) };

  const branches: Branch[] = branchesData?.map((b: any) => ({
    id: b.id,
    name: b.name,
    code: b.code || '',
  })) || [];

  // حفظ الاختيارات في localStorage
  const setSelectedBranchId = (branchId: number | null) => {
    setSelectedBranchIdState(branchId);
    if (typeof window !== 'undefined') {
      if (branchId !== null) {
        localStorage.setItem('selectedBranchId', branchId.toString());
      } else {
        localStorage.removeItem('selectedBranchId');
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
  const allowedModules = modulePermissions[selectedRole];
  const allowedHrSubPages = hrSubPermissions[selectedRole];

  // هل المستخدم مدير قسم؟
  const isDepartmentManager = selectedRole === 'department_manager';

  // تحديد الأدوار المتاحة للمستخدم بناءً على دوره الفعلي من السيرفر
  const allowedRoles: UserRoleType[] = (() => {
    const serverRole = ((authData?.role as string) || '').toLowerCase();
    const allRoles = Object.keys(roleLabels) as UserRoleType[];

    // OWNER و admin يرون كل الأدوار
    if (serverRole === 'owner' || serverRole === 'admin' || serverRole === 'system_admin') {
      return allRoles;
    }
    // المدير العام يرى كل الأدوار
    if (serverRole === 'general_manager') {
      return allRoles;
    }
    // مدير القسم يرى فقط دوره المرتبط بقسمه (بدون تغيير الصفة)
    if (serverRole === 'departement_manager' && currentEmployee) {
      const dept = currentEmployee.department;
      const deptCode = typeof dept === 'object' ? (dept?.code || dept?.nameAr || dept?.name) : dept;
      const mappedRole = departmentToRoleMap[deptCode] || 'department_manager';
      return [mappedRole];
    }
    if (serverRole === 'departement_manager') {
      return ['department_manager'];
    }
    // المشرف
    if (serverRole === 'supervisor') {
      return ['supervisor'];
    }
    // الموظف العادي والمندوب
    return ['employee'];
  })();

  const hasPermission = (permission: keyof typeof rolePermissions[UserRoleType]) => {
    return permissions[permission];
  };

  const canAccessModule = (module: ModuleType) => {
    return allowedModules.includes(module);
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
      allowedRoles,
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
