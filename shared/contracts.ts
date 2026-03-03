/**
 * Unified Contracts - عقود موحدة للـ input/output/errors
 * يوفر:
 * - تعريفات موحدة للمدخلات والمخرجات
 * - أكواد أخطاء موحدة
 * - رسائل خطأ موحدة بالعربية والإنجليزية
 */

import { z } from "zod";

// ============================================================================
// ERROR CODES - أكواد الأخطاء الموحدة
// ============================================================================

export const ErrorCodes = {
  // أخطاء المصادقة (1xxx)
  AUTH_REQUIRED: "AUTH_001",
  AUTH_INVALID_TOKEN: "AUTH_002",
  AUTH_EXPIRED_TOKEN: "AUTH_003",
  AUTH_INVALID_CREDENTIALS: "AUTH_004",
  AUTH_SESSION_EXPIRED: "AUTH_005",
  AUTH_LOGOUT_FAILED: "AUTH_006",
  
  // أخطاء الصلاحيات (2xxx)
  PERMISSION_DENIED: "PERM_001",
  PERMISSION_INSUFFICIENT_ROLE: "PERM_002",
  PERMISSION_BRANCH_ACCESS_DENIED: "PERM_003",
  PERMISSION_MODULE_ACCESS_DENIED: "PERM_004",
  PERMISSION_ACTION_NOT_ALLOWED: "PERM_005",
  
  // أخطاء التحقق (3xxx)
  VALIDATION_REQUIRED_FIELD: "VAL_001",
  VALIDATION_INVALID_FORMAT: "VAL_002",
  VALIDATION_OUT_OF_RANGE: "VAL_003",
  VALIDATION_DUPLICATE_VALUE: "VAL_004",
  VALIDATION_INVALID_REFERENCE: "VAL_005",
  
  // أخطاء قاعدة البيانات (4xxx)
  DB_CONNECTION_FAILED: "DB_001",
  DB_QUERY_FAILED: "DB_002",
  DB_RECORD_NOT_FOUND: "DB_003",
  DB_DUPLICATE_ENTRY: "DB_004",
  DB_FOREIGN_KEY_VIOLATION: "DB_005",
  
  // أخطاء الأعمال (5xxx)
  BUSINESS_RULE_VIOLATION: "BIZ_001",
  BUSINESS_WORKFLOW_ERROR: "BIZ_002",
  BUSINESS_APPROVAL_REQUIRED: "BIZ_003",
  BUSINESS_LIMIT_EXCEEDED: "BIZ_004",
  BUSINESS_INVALID_STATE: "BIZ_005",
  
  // أخطاء النظام (9xxx)
  SYSTEM_INTERNAL_ERROR: "SYS_001",
  SYSTEM_SERVICE_UNAVAILABLE: "SYS_002",
  SYSTEM_TIMEOUT: "SYS_003",
  SYSTEM_MAINTENANCE: "SYS_004",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// ERROR MESSAGES - رسائل الأخطاء
// ============================================================================

export const ErrorMessages: Record<ErrorCode, { ar: string; en: string }> = {
  // أخطاء المصادقة
  [ErrorCodes.AUTH_REQUIRED]: {
    ar: "يجب تسجيل الدخول للوصول إلى هذا المورد",
    en: "Authentication required to access this resource",
  },
  [ErrorCodes.AUTH_INVALID_TOKEN]: {
    ar: "رمز المصادقة غير صالح",
    en: "Invalid authentication token",
  },
  [ErrorCodes.AUTH_EXPIRED_TOKEN]: {
    ar: "انتهت صلاحية رمز المصادقة",
    en: "Authentication token has expired",
  },
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    ar: "بيانات الاعتماد غير صحيحة",
    en: "Invalid credentials",
  },
  [ErrorCodes.AUTH_SESSION_EXPIRED]: {
    ar: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى",
    en: "Session expired, please login again",
  },
  [ErrorCodes.AUTH_LOGOUT_FAILED]: {
    ar: "فشل تسجيل الخروج",
    en: "Logout failed",
  },
  
  // أخطاء الصلاحيات
  [ErrorCodes.PERMISSION_DENIED]: {
    ar: "ليس لديك صلاحية للقيام بهذا الإجراء",
    en: "Permission denied",
  },
  [ErrorCodes.PERMISSION_INSUFFICIENT_ROLE]: {
    ar: "صفتك الحالية لا تسمح بهذا الإجراء",
    en: "Insufficient role for this action",
  },
  [ErrorCodes.PERMISSION_BRANCH_ACCESS_DENIED]: {
    ar: "ليس لديك صلاحية الوصول إلى هذا الفرع",
    en: "Branch access denied",
  },
  [ErrorCodes.PERMISSION_MODULE_ACCESS_DENIED]: {
    ar: "ليس لديك صلاحية الوصول إلى هذه الوحدة",
    en: "Module access denied",
  },
  [ErrorCodes.PERMISSION_ACTION_NOT_ALLOWED]: {
    ar: "هذا الإجراء غير مسموح به",
    en: "Action not allowed",
  },
  
  // أخطاء التحقق
  [ErrorCodes.VALIDATION_REQUIRED_FIELD]: {
    ar: "هذا الحقل مطلوب",
    en: "This field is required",
  },
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: {
    ar: "صيغة البيانات غير صحيحة",
    en: "Invalid data format",
  },
  [ErrorCodes.VALIDATION_OUT_OF_RANGE]: {
    ar: "القيمة خارج النطاق المسموح",
    en: "Value out of allowed range",
  },
  [ErrorCodes.VALIDATION_DUPLICATE_VALUE]: {
    ar: "هذه القيمة موجودة مسبقاً",
    en: "Duplicate value",
  },
  [ErrorCodes.VALIDATION_INVALID_REFERENCE]: {
    ar: "المرجع غير صالح",
    en: "Invalid reference",
  },
  
  // أخطاء قاعدة البيانات
  [ErrorCodes.DB_CONNECTION_FAILED]: {
    ar: "فشل الاتصال بقاعدة البيانات",
    en: "Database connection failed",
  },
  [ErrorCodes.DB_QUERY_FAILED]: {
    ar: "فشل تنفيذ الاستعلام",
    en: "Query execution failed",
  },
  [ErrorCodes.DB_RECORD_NOT_FOUND]: {
    ar: "السجل غير موجود",
    en: "Record not found",
  },
  [ErrorCodes.DB_DUPLICATE_ENTRY]: {
    ar: "السجل موجود مسبقاً",
    en: "Duplicate entry",
  },
  [ErrorCodes.DB_FOREIGN_KEY_VIOLATION]: {
    ar: "لا يمكن الحذف، هناك سجلات مرتبطة",
    en: "Cannot delete, related records exist",
  },
  
  // أخطاء الأعمال
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: {
    ar: "مخالفة لقواعد العمل",
    en: "Business rule violation",
  },
  [ErrorCodes.BUSINESS_WORKFLOW_ERROR]: {
    ar: "خطأ في سير العمل",
    en: "Workflow error",
  },
  [ErrorCodes.BUSINESS_APPROVAL_REQUIRED]: {
    ar: "يتطلب موافقة",
    en: "Approval required",
  },
  [ErrorCodes.BUSINESS_LIMIT_EXCEEDED]: {
    ar: "تم تجاوز الحد المسموح",
    en: "Limit exceeded",
  },
  [ErrorCodes.BUSINESS_INVALID_STATE]: {
    ar: "حالة غير صالحة للعملية",
    en: "Invalid state for operation",
  },
  
  // أخطاء النظام
  [ErrorCodes.SYSTEM_INTERNAL_ERROR]: {
    ar: "خطأ داخلي في النظام",
    en: "Internal system error",
  },
  [ErrorCodes.SYSTEM_SERVICE_UNAVAILABLE]: {
    ar: "الخدمة غير متاحة حالياً",
    en: "Service unavailable",
  },
  [ErrorCodes.SYSTEM_TIMEOUT]: {
    ar: "انتهت مهلة الطلب",
    en: "Request timeout",
  },
  [ErrorCodes.SYSTEM_MAINTENANCE]: {
    ar: "النظام تحت الصيانة",
    en: "System under maintenance",
  },
};

// ============================================================================
// API RESPONSE - استجابة API موحدة
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    messageAr: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============================================================================
// COMMON SCHEMAS - مخططات مشتركة
// ============================================================================

// مخطط الصفحات
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// مخطط الفرز
export const SortSchema = z.object({
  field: z.string(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// مخطط البحث
export const SearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  fields: z.array(z.string()).optional(),
});

// مخطط الفلترة حسب التاريخ
export const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

// مخطط السياق (الفرع والصفة)
export const ContextSchema = z.object({
  branchId: z.number().int().positive().optional(),
  roleId: z.number().int().positive().optional(),
});

// ============================================================================
// ENTITY SCHEMAS - مخططات الكيانات
// ============================================================================

// مخطط الموظف
export const EmployeeInputSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  nameAr: z.string().min(2).max(100),
  nameEn: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  nationalId: z.string().max(20).optional(),
  departmentId: z.number().int().positive().optional(),
  positionId: z.number().int().positive().optional(),
  branchId: z.number().int().positive(),
  managerId: z.number().int().positive().optional(),
  hireDate: z.date(),
  status: z.enum(["active", "inactive", "terminated"]).default("active"),
});

// مخطط الإجازة
export const LeaveInputSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().max(500).optional(),
  attachmentUrl: z.string().url().optional(),
});

// مخطط الطلب
export const RequestInputSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  attachments: z.array(z.string().url()).optional(),
});

// ============================================================================
// HELPER FUNCTIONS - دوال مساعدة
// ============================================================================

/**
 * إنشاء استجابة ناجحة
 */
export function successResponse<T>(data: T, meta?: ApiResponse<T>["meta"]): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * إنشاء استجابة خطأ
 */
export function errorResponse(
  code: ErrorCode,
  details?: Record<string, unknown>,
  lang: "ar" | "en" = "ar"
): ApiResponse {
  const messages = ErrorMessages[code];
  return {
    success: false,
    error: {
      code,
      message: messages.en,
      messageAr: messages.ar,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * إنشاء استجابة مع صفحات
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number }
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    },
  };
}

/**
 * التحقق من صلاحية الفرع
 */
export function validateBranchAccess(
  userBranchId: number | undefined,
  targetBranchId: number,
  canViewAllBranches: boolean
): boolean {
  if (canViewAllBranches) return true;
  return userBranchId === targetBranchId;
}

/**
 * التحقق من صلاحية الصفة
 */
export function validateRoleAccess(
  userRoleLevel: number,
  requiredRoleLevel: number
): boolean {
  return userRoleLevel <= requiredRoleLevel;
}
