/**
 * i18n Framework - طبقة الترجمة لنظام غيث ERP
 * 
 * يدعم:
 * - العربية (ar) - اللغة الافتراضية
 * - الإنجليزية (en)
 * - قابل للتوسع لأي لغة
 * 
 * الاستخدام:
 * ```tsx
 * import { t, useI18n } from '@/lib/i18n';
 * 
 * // في React
 * const { t, locale, setLocale } = useI18n();
 * <h1>{t('hr.employees.title')}</h1>
 * 
 * // مباشرة
 * t('common.save') // → "حفظ" أو "Save"
 * ```
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Locale = 'ar' | 'en';
export type TranslationKey = string;
type NestedRecord = { [key: string]: string | NestedRecord };

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations: Record<Locale, NestedRecord> = {
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      import: 'استيراد',
      print: 'طباعة',
      refresh: 'تحديث',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      confirm: 'تأكيد',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      yes: 'نعم',
      no: 'لا',
      all: 'الكل',
      active: 'نشط',
      inactive: 'غير نشط',
      pending: 'قيد الانتظار',
      approved: 'معتمد',
      rejected: 'مرفوض',
      completed: 'مكتمل',
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
    },
    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
    },
    hr: {
      title: 'الموارد البشرية',
      employees: {
        title: 'الموظفون',
        add: 'إضافة موظف',
        firstName: 'الاسم الأول',
        lastName: 'اسم العائلة',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        department: 'القسم',
        position: 'المنصب',
        hireDate: 'تاريخ التوظيف',
        salary: 'الراتب',
      },
      leaves: {
        title: 'الإجازات',
        request: 'طلب إجازة',
        type: 'نوع الإجازة',
        startDate: 'تاريخ البداية',
        endDate: 'تاريخ النهاية',
        balance: 'الرصيد',
        annual: 'سنوية',
        sick: 'مرضية',
        emergency: 'طارئة',
      },
      attendance: {
        title: 'الحضور والانصراف',
        checkIn: 'تسجيل حضور',
        checkOut: 'تسجيل انصراف',
        late: 'متأخر',
        absent: 'غائب',
        present: 'حاضر',
      },
      payroll: {
        title: 'الرواتب',
        process: 'معالجة الرواتب',
        basicSalary: 'الراتب الأساسي',
        allowances: 'البدلات',
        deductions: 'الخصومات',
        netSalary: 'صافي الراتب',
      },
    },
    finance: {
      title: 'المالية',
      accounts: {
        title: 'شجرة الحسابات',
        add: 'إضافة حساب',
        balance: 'الرصيد',
      },
      journal: {
        title: 'القيود اليومية',
        debit: 'مدين',
        credit: 'دائن',
      },
      invoices: {
        title: 'الفواتير',
        create: 'إنشاء فاتورة',
        customer: 'العميل',
        dueDate: 'تاريخ الاستحقاق',
        paid: 'مدفوعة',
        unpaid: 'غير مدفوعة',
        overdue: 'متأخرة',
      },
      budget: {
        title: 'الميزانية',
        allocated: 'المخصص',
        spent: 'المصروف',
        remaining: 'المتبقي',
      },
      commitments: {
        title: 'الالتزامات المالية',
      },
    },
    fleet: {
      title: 'الأسطول',
      vehicles: {
        title: 'المركبات',
        plateNumber: 'رقم اللوحة',
        model: 'الموديل',
        year: 'السنة',
        mileage: 'المسافة المقطوعة',
      },
      trips: {
        title: 'الرحلات',
        start: 'نقطة البداية',
        end: 'نقطة النهاية',
        distance: 'المسافة',
      },
      maintenance: {
        title: 'الصيانة',
        scheduled: 'مجدولة',
        type: 'نوع الصيانة',
        cost: 'التكلفة',
      },
    },
    store: {
      title: 'المتجر',
      products: { title: 'المنتجات' },
      orders: { title: 'الطلبات' },
      cart: {
        title: 'السلة',
        checkout: 'إتمام الشراء',
        empty: 'السلة فارغة',
        subtotal: 'المجموع الفرعي',
        vat: 'ضريبة القيمة المضافة',
        total: 'الإجمالي',
      },
    },
    governance: {
      title: 'الحوكمة',
      policies: { title: 'السياسات' },
      risks: { title: 'المخاطر' },
      audit: { title: 'التدقيق' },
    },
    settings: {
      title: 'الإعدادات',
      users: { title: 'المستخدمون' },
      roles: { title: 'الأدوار' },
      branches: { title: 'الفروع' },
    },
    dashboard: {
      title: 'لوحة التحكم',
      welcome: 'مرحباً بك في نظام غيث',
      stats: 'الإحصائيات',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      print: 'Print',
      refresh: 'Refresh',
      loading: 'Loading...',
      noData: 'No data available',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
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
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      username: 'Username',
      password: 'Password',
      forgotPassword: 'Forgot password?',
    },
    hr: {
      title: 'Human Resources',
      employees: {
        title: 'Employees',
        add: 'Add Employee',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone',
        department: 'Department',
        position: 'Position',
        hireDate: 'Hire Date',
        salary: 'Salary',
      },
      leaves: {
        title: 'Leaves',
        request: 'Request Leave',
        type: 'Leave Type',
        startDate: 'Start Date',
        endDate: 'End Date',
        balance: 'Balance',
        annual: 'Annual',
        sick: 'Sick',
        emergency: 'Emergency',
      },
      attendance: {
        title: 'Attendance',
        checkIn: 'Check In',
        checkOut: 'Check Out',
        late: 'Late',
        absent: 'Absent',
        present: 'Present',
      },
      payroll: {
        title: 'Payroll',
        process: 'Process Payroll',
        basicSalary: 'Basic Salary',
        allowances: 'Allowances',
        deductions: 'Deductions',
        netSalary: 'Net Salary',
      },
    },
    finance: {
      title: 'Finance',
      accounts: { title: 'Chart of Accounts', add: 'Add Account', balance: 'Balance' },
      journal: { title: 'Journal Entries', debit: 'Debit', credit: 'Credit' },
      invoices: { title: 'Invoices', create: 'Create Invoice', customer: 'Customer', dueDate: 'Due Date', paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue' },
      budget: { title: 'Budget', allocated: 'Allocated', spent: 'Spent', remaining: 'Remaining' },
      commitments: { title: 'Financial Commitments' },
    },
    fleet: {
      title: 'Fleet',
      vehicles: { title: 'Vehicles', plateNumber: 'Plate Number', model: 'Model', year: 'Year', mileage: 'Mileage' },
      trips: { title: 'Trips', start: 'Start', end: 'End', distance: 'Distance' },
      maintenance: { title: 'Maintenance', scheduled: 'Scheduled', type: 'Type', cost: 'Cost' },
    },
    store: {
      title: 'Store',
      products: { title: 'Products' },
      orders: { title: 'Orders' },
      cart: { title: 'Cart', checkout: 'Checkout', empty: 'Cart is empty', subtotal: 'Subtotal', vat: 'VAT', total: 'Total' },
    },
    governance: {
      title: 'Governance',
      policies: { title: 'Policies' },
      risks: { title: 'Risks' },
      audit: { title: 'Audit' },
    },
    settings: {
      title: 'Settings',
      users: { title: 'Users' },
      roles: { title: 'Roles' },
      branches: { title: 'Branches' },
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to Ghaith ERP',
      stats: 'Statistics',
    },
  },
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

let currentLocale: Locale = 'ar';

function getNestedValue(obj: NestedRecord, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current?.[key] === undefined) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export function t(key: string, locale?: Locale): string {
  return getNestedValue(translations[locale || currentLocale], key);
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getAvailableLocales(): { code: Locale; name: string; dir: 'rtl' | 'ltr' }[] {
  return [
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'en', name: 'English', dir: 'ltr' },
  ];
}

// ============================================================================
// REACT CONTEXT
// ============================================================================

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ar',
  setLocale: () => {},
  t: (key) => key,
  dir: 'rtl',
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocale(newLocale);
  }, []);

  const translate = useCallback((key: string) => t(key, locale), [locale]);

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale: handleSetLocale,
      t: translate,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default { t, setLocale, getLocale, getAvailableLocales, I18nProvider, useI18n };
