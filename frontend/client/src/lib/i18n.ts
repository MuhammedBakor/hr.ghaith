/**
 * i18n Framework - إطار الترجمة والتعريب
 * 
 * يدعم:
 * - عربي (افتراضي)
 * - إنجليزي
 * - قابل للتوسع لأي لغة
 * 
 * الاستخدام:
 * ```tsx
 * import { t, setLocale } from '@/lib/i18n';
 * <span>{t('hr.employees.title')}</span>
 * ```
 */

type Locale = 'ar' | 'en';

interface TranslationMap {
  [key: string]: string | TranslationMap;
}

// ========================================
// Arabic translations (default)
// ========================================
const ar: TranslationMap = {
  common: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    yes: 'نعم',
    no: 'لا',
    actions: 'إجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    name: 'الاسم',
    description: 'الوصف',
    notes: 'ملاحظات',
    total: 'الإجمالي',
    amount: 'المبلغ',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ',
    required: 'حقل مطلوب',
  },
  modules: {
    hr: 'الموارد البشرية',
    finance: 'المالية',
    fleet: 'الأسطول',
    property: 'العقارات',
    store: 'المتجر',
    marketing: 'التسويق',
    governance: 'الحوكمة',
    legal: 'الشؤون القانونية',
    documents: 'المستندات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    bi: 'ذكاء الأعمال',
  },
  hr: {
    employees: {
      title: 'إدارة الموظفين',
      add: 'إضافة موظف',
      name: 'اسم الموظف',
      department: 'القسم',
      position: 'المسمى الوظيفي',
      status: { active: 'نشط', inactive: 'غير نشط', on_leave: 'في إجازة', terminated: 'منتهي الخدمة' },
    },
    leaves: {
      title: 'إدارة الإجازات',
      request: 'طلب إجازة',
      type: { annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب' },
      status: { pending: 'قيد الانتظار', approved: 'معتمدة', rejected: 'مرفوضة' },
    },
    attendance: { title: 'الحضور والانصراف', checkIn: 'تسجيل حضور', checkOut: 'تسجيل انصراف' },
    payroll: { title: 'الرواتب', process: 'معالجة الرواتب', slip: 'كشف الراتب' },
  },
  finance: {
    accounts: { title: 'شجرة الحسابات', add: 'إضافة حساب' },
    journal: { title: 'القيود اليومية', add: 'إنشاء قيد' },
    invoices: { title: 'الفواتير', add: 'إنشاء فاتورة' },
    budget: { title: 'الميزانية', add: 'إنشاء ميزانية' },
    commitments: { title: 'الالتزامات المالية', add: 'إنشاء التزام' },
    vat: 'ضريبة القيمة المضافة',
    currency: 'ر.س',
  },
  fleet: {
    vehicles: { title: 'المركبات', add: 'إضافة مركبة' },
    drivers: { title: 'السائقون', add: 'إضافة سائق' },
    trips: { title: 'الرحلات', add: 'إنشاء رحلة' },
    maintenance: { title: 'الصيانة', schedule: 'جدولة صيانة' },
  },
  store: {
    products: { title: 'المنتجات', add: 'إضافة منتج' },
    orders: { title: 'الطلبات' },
    cart: { title: 'سلة المشتريات', checkout: 'إتمام الشراء', empty: 'السلة فارغة' },
    inventory: { title: 'المخزون' },
  },
  auth: {
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    unauthorized: 'غير مصرح',
    forbidden: 'ممنوع الوصول',
  },
  validation: {
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'بريد إلكتروني غير صالح',
    invalidPhone: 'رقم هاتف غير صالح',
    minLength: 'الحد الأدنى {min} أحرف',
    maxLength: 'الحد الأقصى {max} حرف',
    positiveNumber: 'يجب أن يكون رقم موجب',
  },
};

// ========================================
// English translations
// ========================================
const en: TranslationMap = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    loading: 'Loading...',
    noData: 'No data available',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    yes: 'Yes',
    no: 'No',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    description: 'Description',
    notes: 'Notes',
    total: 'Total',
    amount: 'Amount',
    success: 'Operation completed successfully',
    error: 'An error occurred',
    required: 'Required field',
  },
  modules: {
    hr: 'Human Resources',
    finance: 'Finance',
    fleet: 'Fleet',
    property: 'Property',
    store: 'Store',
    marketing: 'Marketing',
    governance: 'Governance',
    legal: 'Legal',
    documents: 'Documents',
    reports: 'Reports',
    settings: 'Settings',
    bi: 'Business Intelligence',
  },
  hr: {
    employees: {
      title: 'Employee Management',
      add: 'Add Employee',
      name: 'Employee Name',
      department: 'Department',
      position: 'Position',
      status: { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave', terminated: 'Terminated' },
    },
    leaves: {
      title: 'Leave Management',
      request: 'Request Leave',
      type: { annual: 'Annual', sick: 'Sick', emergency: 'Emergency', unpaid: 'Unpaid' },
      status: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
    },
    attendance: { title: 'Attendance', checkIn: 'Check In', checkOut: 'Check Out' },
    payroll: { title: 'Payroll', process: 'Process Payroll', slip: 'Pay Slip' },
  },
  finance: {
    accounts: { title: 'Chart of Accounts', add: 'Add Account' },
    journal: { title: 'Journal Entries', add: 'Create Entry' },
    invoices: { title: 'Invoices', add: 'Create Invoice' },
    budget: { title: 'Budget', add: 'Create Budget' },
    commitments: { title: 'Financial Commitments', add: 'Create Commitment' },
    vat: 'VAT',
    currency: 'SAR',
  },
  fleet: {
    vehicles: { title: 'Vehicles', add: 'Add Vehicle' },
    drivers: { title: 'Drivers', add: 'Add Driver' },
    trips: { title: 'Trips', add: 'Create Trip' },
    maintenance: { title: 'Maintenance', schedule: 'Schedule Maintenance' },
  },
  store: {
    products: { title: 'Products', add: 'Add Product' },
    orders: { title: 'Orders' },
    cart: { title: 'Shopping Cart', checkout: 'Checkout', empty: 'Cart is empty' },
    inventory: { title: 'Inventory' },
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    unauthorized: 'Unauthorized',
    forbidden: 'Access Denied',
  },
  validation: {
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    minLength: 'Minimum {min} characters',
    maxLength: 'Maximum {max} characters',
    positiveNumber: 'Must be a positive number',
  },
};

// ========================================
// i18n Engine
// ========================================
const translations: Record<Locale, TranslationMap> = { ar, en };

let currentLocale: Locale = 'ar';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key path like 'hr.employees.title'
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let result: any = translations[currentLocale];
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      // Fallback to Arabic
      result = translations.ar;
      for (const k2 of keys) {
        if (result && typeof result === 'object' && k2 in result) {
          result = result[k2];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  if (typeof result !== 'string') return key;
  
  // Replace params like {min}, {max}
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      result
    );
  }
  
  return result;
}

export default { t, setLocale, getLocale };
