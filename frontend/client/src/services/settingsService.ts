/**
 * Settings Service - خدمة الإعدادات
 * 
 * هذا الملف يوفر واجهة موحدة للتعامل مع إعدادات النظام
 * جميع الاستدعاءات تتم عبر trpc مباشرة
 * 
 * ملاحظة: يُفضل استخدام trpc hooks مباشرة في المكونات بدلاً من هذه الخدمة
 * مثال: trpc.hr.roles.list.useQuery()
 */

export interface BranchSettings {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Permission {
  id: number;
  key: string;
  name: string;
  description?: string;
  category?: string;
}

export interface Role {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  key?: string;
  description?: string;
  isSystem?: boolean;
  is_system?: number;
  permissions?: Permission[];
  permissionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * خدمة إعدادات الفروع
 * 
 * استخدم trpc مباشرة:
 * - trpc.hr.branches.list.useQuery()
 * - trpc.hr.branches.create.useMutation()
 * - trpc.hr.branches.update.useMutation()
 */
export const settingsService = {
  // استخدم trpc.hr.branches.list.useQuery() بدلاً من هذه الدالة
  getBranchSettings: async (): Promise<BranchSettings | null> => {
    console.warn('استخدم trpc.hr.branches.list.useQuery() بدلاً من settingsService.getBranchSettings()');
    return null;
  },
  
  // استخدم trpc.hr.branches.update.useMutation() بدلاً من هذه الدالة
  updateBranchSettings: async (settings: Partial<BranchSettings>): Promise<BranchSettings | null> => {
    console.warn('استخدم trpc.hr.branches.update.useMutation() بدلاً من settingsService.updateBranchSettings()');
    return null;
  },
};

/**
 * خدمة الأدوار والصلاحيات
 * 
 * استخدم trpc مباشرة:
 * - trpc.hr.roles.list.useQuery()
 * - trpc.hr.roles.getById.useQuery({ id })
 * - trpc.hr.roles.create.useMutation()
 * - trpc.hr.roles.update.useMutation()
 * - trpc.hr.roles.delete.useMutation()
 * - trpc.hr.permissions.list.useQuery()
 * - trpc.hr.permissions.getRolePermissions.useQuery({ roleId })
 * - trpc.hr.permissions.grant.useMutation()
 * - trpc.hr.permissions.revoke.useMutation()
 */
export const roleService = {
  // استخدم trpc.hr.roles.list.useQuery() بدلاً من هذه الدالة
  getAll: async (): Promise<Role[]> => {
    console.warn('استخدم trpc.hr.roles.list.useQuery() بدلاً من roleService.getAll()');
    return [];
  },
  
  // استخدم trpc.hr.roles.getById.useQuery({ id }) بدلاً من هذه الدالة
  getById: async (id: number): Promise<Role | null> => {
    console.warn('استخدم trpc.hr.roles.getById.useQuery({ id }) بدلاً من roleService.getById()');
    return null;
  },
  
  // استخدم trpc.hr.roles.create.useMutation() بدلاً من هذه الدالة
  create: async (data: Partial<Role>): Promise<Role | null> => {
    console.warn('استخدم trpc.hr.roles.create.useMutation() بدلاً من roleService.create()');
    return null;
  },
  
  // استخدم trpc.hr.roles.update.useMutation() بدلاً من هذه الدالة
  update: async (id: number, data: Partial<Role>): Promise<Role | null> => {
    console.warn('استخدم trpc.hr.roles.update.useMutation() بدلاً من roleService.update()');
    return null;
  },
  
  // استخدم trpc.hr.roles.delete.useMutation() بدلاً من هذه الدالة
  delete: async (id: number): Promise<boolean> => {
    console.warn('استخدم trpc.hr.roles.delete.useMutation() بدلاً من roleService.delete()');
    return false;
  },
  
  // استخدم trpc.hr.permissions.list.useQuery() بدلاً من هذه الدالة
  getAllPermissions: async (): Promise<Permission[]> => {
    console.warn('استخدم trpc.hr.permissions.list.useQuery() بدلاً من roleService.getAllPermissions()');
    return [];
  },
  
  // استخدم trpc.hr.permissions.getRolePermissions.useQuery({ roleId }) بدلاً من هذه الدالة
  getPermissions: async (roleId: number): Promise<Permission[]> => {
    console.warn('استخدم trpc.hr.permissions.getRolePermissions.useQuery({ roleId }) بدلاً من roleService.getPermissions()');
    return [];
  },
  
  // استخدم trpc.hr.permissions.grant/revoke.useMutation() بدلاً من هذه الدالة
  setPermissions: async (roleId: number, permissionKeys: string[]): Promise<boolean> => {
    console.warn('استخدم trpc.hr.permissions.grant/revoke.useMutation() بدلاً من roleService.setPermissions()');
    return false;
  },
};

export default settingsService;
