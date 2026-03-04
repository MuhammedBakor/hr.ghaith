import api from "../lib/api";

/**
 * Settings Service - خدمة الإعدادات
 * 
 * هذا الملف يوفر واجهة موحدة للتعامل مع إعدادات النظام عبر REST API
 */

export interface SystemSetting {
  id?: number;
  settingKey: string;
  settingValue: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchSettings {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export const settingsService = {
  // جلب جميع الإعدادات
  getAllSettings: async (): Promise<SystemSetting[]> => {
    const response = await api.get<SystemSetting[]>("/settings");
    return response.data;
  },

  // جلب إعداد معين بواسطة المفتاح
  getSetting: async (key: string): Promise<SystemSetting | null> => {
    try {
      const response = await api.get<SystemSetting>(`/settings/${key}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // تحديث أو إنشاء إعداد
  setSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const response = await api.post<SystemSetting>("/settings/set", { key, value });
    return response.data;
  },

  // الفروع (يتم جلبها حالياً من HrBranchController)
  getBranches: async () => {
    const response = await api.get("/hr-branches");
    return response.data;
  }
};

export default settingsService;
