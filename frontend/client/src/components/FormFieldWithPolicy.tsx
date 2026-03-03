/**
 * FormFieldWithPolicy - حقل نموذج مع تلميحات السياسة
 * 
 * يوفر تجربة مستخدم محسنة:
 * - عرض تلميحات السياسة بجانب الحقل
 * - تحقق فوري من القيم
 * - رسائل خطأ واضحة
 */

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPES
// ============================================================================

export interface PolicyHint {
  id: string;
  message: string;
  type: 'requirement' | 'recommendation' | 'info';
  satisfied?: boolean;
}

export interface FormFieldWithPolicyProps {
  /** معرف الحقل */
  id: string;
  
  /** عنوان الحقل */
  label: string;
  
  /** هل الحقل مطلوب؟ */
  required?: boolean;
  
  /** نوع الحقل */
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'date';
  
  /** القيمة الحالية */
  value?: string | number;
  
  /** دالة التغيير */
  onChange?: (value: string) => void;
  
  /** placeholder */
  placeholder?: string;
  
  /** تلميحات السياسة */
  policyHints?: PolicyHint[];
  
  /** رسالة الخطأ */
  error?: string;
  
  /** هل الحقل معطل؟ */
  disabled?: boolean;
  
  /** سبب التعطيل */
  disabledReason?: string;
  
  /** وصف إضافي */
  description?: string;
  
  /** className إضافي */
  className?: string;
  
  /** الحد الأدنى للقيمة (للأرقام) */
  min?: number;
  
  /** الحد الأقصى للقيمة (للأرقام) */
  max?: number;
  
  /** عدد الصفوف (للـ textarea) */
  rows?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormFieldWithPolicy({
  id,
  label,
  required = false,
  type = 'text',
  value,
  onChange,
  placeholder,
  policyHints = [],
  error,
  disabled = false,
  disabledReason,
  description,
  className,
  min,
  max,
  rows = 3,
}: FormFieldWithPolicyProps) {
  const hasError = !!error;
  const unsatisfiedRequirements = policyHints.filter(
    h => h.type === 'requirement' && h.satisfied === false
  );
  const hasUnsatisfiedRequirements = unsatisfiedRequirements.length > 0;
  
  const inputClasses = cn(
    "w-full",
    hasError && "border-red-500 focus:ring-red-500",
    hasUnsatisfiedRequirements && !hasError && "border-yellow-500 focus:ring-yellow-500",
    disabled && "opacity-50 cursor-not-allowed"
  );
  
  const renderInput = () => {
    const commonProps = {
      id,
      value: value ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        onChange?.(e.target.value),
      placeholder,
      disabled,
      className: inputClasses,
    };
    
    if (type === 'textarea') {
      return <Textarea {...commonProps} rows={rows} />;
    }
    
    return (
      <Input
        {...commonProps}
        type={type}
        min={min}
        max={max}
      />
    );
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label with policy hints tooltip */}
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {policyHints.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "p-1 rounded-full hover:bg-muted",
                    hasUnsatisfiedRequirements ? "text-yellow-500" : "text-muted-foreground"
                  )}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">متطلبات السياسة</p>
                  {policyHints.map(hint => (
                    <div
                      key={hint.id}
                      className={cn(
                        "flex items-start gap-2 text-sm",
                        hint.type === 'requirement' && hint.satisfied === false && "text-yellow-600",
                        hint.type === 'requirement' && hint.satisfied === true && "text-green-600",
                        hint.type === 'recommendation' && "text-blue-600",
                        hint.type === 'info' && "text-muted-foreground"
                      )}
                    >
                      {hint.type === 'requirement' ? (
                        hint.satisfied ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        )
                      ) : (
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      )}
                      <span>{hint.message}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {/* Input with disabled tooltip */}
      {disabled && disabledReason ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-not-allowed">{renderInput()}</div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        renderInput()
      )}
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Unsatisfied requirements (inline) */}
      {!error && hasUnsatisfiedRequirements && (
        <div className="space-y-1">
          {unsatisfiedRequirements.map(hint => (
            <div
              key={hint.id}
              className="flex items-center gap-1 text-sm text-yellow-600"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{hint.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET POLICY HINTS
// ============================================================================

export const COMMON_POLICY_HINTS = {
  // المبالغ المالية
  amount: {
    positive: (value: number): PolicyHint => ({
      id: 'amount_positive',
      message: 'المبلغ يجب أن يكون أكبر من صفر',
      type: 'requirement',
      satisfied: value > 0,
    }),
    maxBudget: (value: number, max: number): PolicyHint => ({
      id: 'amount_max_budget',
      message: `المبلغ يجب ألا يتجاوز الميزانية المتاحة (${max.toLocaleString()} ر.س)`,
      type: 'requirement',
      satisfied: value <= max,
    }),
    requiresApproval: (value: number, threshold: number): PolicyHint => ({
      id: 'amount_requires_approval',
      message: `المبالغ أكثر من ${threshold.toLocaleString()} ر.س تتطلب موافقة إضافية`,
      type: 'recommendation',
      satisfied: value <= threshold,
    }),
  },
  
  // التواريخ
  date: {
    notPast: (date: Date): PolicyHint => ({
      id: 'date_not_past',
      message: 'التاريخ يجب ألا يكون في الماضي',
      type: 'requirement',
      satisfied: date >= new Date(new Date().setHours(0, 0, 0, 0)),
    }),
    withinRange: (date: Date, minDays: number, maxDays: number): PolicyHint => ({
      id: 'date_within_range',
      message: `التاريخ يجب أن يكون خلال ${minDays} إلى ${maxDays} يوم`,
      type: 'requirement',
      satisfied: (() => {
        const now = new Date();
        const min = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
        const max = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);
        return date >= min && date <= max;
      })(),
    }),
  },
  
  // النصوص
  text: {
    minLength: (value: string, min: number): PolicyHint => ({
      id: 'text_min_length',
      message: `يجب إدخال ${min} حرف على الأقل`,
      type: 'requirement',
      satisfied: value.length >= min,
    }),
    maxLength: (value: string, max: number): PolicyHint => ({
      id: 'text_max_length',
      message: `يجب ألا يتجاوز ${max} حرف`,
      type: 'requirement',
      satisfied: value.length <= max,
    }),
  },
  
  // المرفقات
  attachment: {
    required: (hasAttachment: boolean): PolicyHint => ({
      id: 'attachment_required',
      message: 'يجب إرفاق مستند داعم',
      type: 'requirement',
      satisfied: hasAttachment,
    }),
    maxSize: (sizeInMB: number, maxMB: number): PolicyHint => ({
      id: 'attachment_max_size',
      message: `حجم الملف يجب ألا يتجاوز ${maxMB} ميجابايت`,
      type: 'requirement',
      satisfied: sizeInMB <= maxMB,
    }),
  },
};

export default FormFieldWithPolicy;
