
import { z } from 'zod';

// ═══ Reusable validation schemas for common ERP patterns ═══

export const saudiPhoneSchema = z.string().regex(/^(05|5|\+9665)\d{8}$/, 'رقم جوال سعودي غير صالح');
export const ibanSchema = z.string().regex(/^SA\d{22}$/, 'رقم IBAN غير صالح');
export const nationalIdSchema = z.string().regex(/^[12]\d{9}$/, 'رقم هوية غير صالح');
export const crNumberSchema = z.string().regex(/^\d{10}$/, 'رقم سجل تجاري غير صالح');
export const vatNumberSchema = z.string().regex(/^3\d{14}$/, 'رقم ضريبي غير صالح');
export const emailSchema = z.string().email('بريد إلكتروني غير صالح');

export const moneySchema = z.number().nonnegative('المبلغ لا يمكن أن يكون سالب').finite();
export const percentSchema = z.number().min(0).max(100, 'النسبة يجب أن تكون بين 0 و 100');

export const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
}).refine(d => new Date(d.from) <= new Date(d.to), 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});

// ═══ Saudi-specific calculators ═══

/** حساب نهاية الخدمة */
export function calculateEndOfService(
  basicSalary: number,
  yearsOfService: number,
  resignationType: 'resignation' | 'termination' | 'retirement'
): number {
  if (yearsOfService <= 0) return 0;
  
  let reward = 0;
  
  if (yearsOfService <= 5) {
    reward = (basicSalary / 2) * yearsOfService; // نصف راتب عن كل سنة
  } else {
    reward = (basicSalary / 2) * 5; // أول 5 سنوات
    reward += basicSalary * (yearsOfService - 5); // الباقي راتب كامل
  }
  
  // تعديل حسب نوع إنهاء الخدمة
  if (resignationType === 'resignation') {
    if (yearsOfService < 2) return 0;
    if (yearsOfService < 5) return reward / 3;
    if (yearsOfService < 10) return (reward * 2) / 3;
  }
  
  return Math.round(reward * 100) / 100;
}

/** حساب ضريبة القيمة المضافة */
export function calculateVAT(amount: number, rate: number = 15): {
  net: number; vat: number; total: number;
} {
  const vat = Math.round(amount * (rate / 100) * 100) / 100;
  return { net: amount, vat, total: amount + vat };
}

/** حساب الزكاة التقريبي */
export function calculateZakat(netWorth: number, rate: number = 2.5): number {
  if (netWorth <= 0) return 0;
  return Math.round(netWorth * (rate / 100) * 100) / 100;
}

/** حساب أيام الإجازة المستحقة */
export function calculateLeaveEntitlement(
  yearsOfService: number,
  contractType: 'fulltime' | 'parttime' = 'fulltime'
): number {
  if (contractType === 'parttime') return 0;
  if (yearsOfService < 5) return 21;
  return 30;
}

export default {
  calculateEndOfService,
  calculateVAT,
  calculateZakat,
  calculateLeaveEntitlement,
};
