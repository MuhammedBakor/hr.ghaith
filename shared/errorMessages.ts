// ═══ Arabic Error Message Mapper ═══
// Converts common English errors to Arabic user-friendly messages

const errorMap: Record<string, string> = {
  // Auth
  'Invalid credentials': 'بيانات الدخول غير صحيحة',
  'Unauthorized': 'غير مصرح بالوصول',
  'Token expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
  'Access denied': 'الوصول مرفوض',
  'Session expired': 'انتهت الجلسة',
  'Account locked': 'الحساب مقفل، تواصل مع المسؤول',
  'Account disabled': 'الحساب معطل',
  
  // CRUD
  'Not found': 'العنصر غير موجود',
  'Record not found': 'السجل غير موجود',
  'Already exists': 'العنصر موجود مسبقاً',
  'Duplicate entry': 'إدخال مكرر',
  'Cannot delete': 'لا يمكن حذف هذا العنصر',
  'Update failed': 'فشل التحديث',
  'Create failed': 'فشل الإنشاء',
  
  // Validation
  'Required field': 'حقل مطلوب',
  'Invalid input': 'مدخل غير صالح',
  'Invalid email': 'بريد إلكتروني غير صالح',
  'Invalid phone': 'رقم هاتف غير صالح',
  'Too short': 'قصير جداً',
  'Too long': 'طويل جداً',
  'Invalid date': 'تاريخ غير صالح',
  'Invalid format': 'تنسيق غير صالح',
  
  // Business
  'Insufficient balance': 'رصيد غير كافٍ',
  'Budget exceeded': 'تم تجاوز الميزانية',
  'Already approved': 'تم الاعتماد مسبقاً',
  'Already rejected': 'تم الرفض مسبقاً',
  'Cannot modify approved': 'لا يمكن تعديل عنصر معتمد',
  'Period closed': 'الفترة المالية مغلقة',
  'Limit exceeded': 'تم تجاوز الحد المسموح',
  
  // System
  'Internal server error': 'خطأ في الخادم، حاول مرة أخرى',
  'Database error': 'خطأ في قاعدة البيانات',
  'Network error': 'خطأ في الاتصال',
  'Timeout': 'انتهت مهلة الطلب',
  'Too many requests': 'طلبات كثيرة جداً، انتظر قليلاً',
  'Service unavailable': 'الخدمة غير متاحة حالياً',
};

export function toArabicError(message: string): string {
  // Exact match
  if (errorMap[message]) return errorMap[message];
  
  // Case-insensitive match
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lower.includes(key.toLowerCase())) return value;
  }
  
  // Already Arabic
  if (/[\u0600-\u06FF]/.test(message)) return message;
  
  // Generic fallback
  return 'حدث خطأ غير متوقع';
}

export default { toArabicError, errorMap };
