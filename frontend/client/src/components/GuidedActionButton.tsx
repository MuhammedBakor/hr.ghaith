/**
 * GuidedActionButton - زر إجراء موجه
 * 
 * يوفر تجربة مستخدم محسنة:
 * - تعطيل الزر عند عدم استيفاء الشروط
 * - عرض تلميحات السياسة عند التمرير
 * - إظهار سبب التعطيل بوضوح
 */

import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Lock, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface PolicyCheck {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GuidedActionButtonProps extends Omit<ButtonProps, 'disabled'> {
  /** قائمة التحققات من السياسات */
  policyChecks?: PolicyCheck[];
  
  /** هل الزر معطل؟ */
  disabled?: boolean;
  
  /** سبب التعطيل (إذا لم تكن هناك تحققات) */
  disabledReason?: string;
  
  /** هل يتم التحميل؟ */
  loading?: boolean;
  
  /** نص التحميل */
  loadingText?: string;
  
  /** هل يتطلب صلاحية معينة؟ */
  requiredPermission?: string;
  
  /** هل المستخدم لديه الصلاحية؟ */
  hasPermission?: boolean;
  
  /** هل يتطلب تأكيد؟ */
  requiresConfirmation?: boolean;
  
  /** رسالة التأكيد */
  confirmationMessage?: string;
  
  /** دالة التأكيد */
  onConfirm?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GuidedActionButton({
  children,
  policyChecks = [],
  disabled = false,
  disabledReason,
  loading = false,
  loadingText = "جاري التنفيذ...",
  requiredPermission,
  hasPermission = true,
  requiresConfirmation = false,
  confirmationMessage,
  onConfirm,
  className,
  onClick,
  ...props
}: GuidedActionButtonProps) {
  // حساب حالة التعطيل
  const failedChecks = policyChecks.filter(c => !c.passed);
  const hasErrors = failedChecks.some(c => c.severity === 'error');
  const hasWarnings = failedChecks.some(c => c.severity === 'warning');
  
  const isDisabled = disabled || loading || hasErrors || !hasPermission;
  
  // تحديد سبب التعطيل
  const getDisabledReason = (): string | null => {
    if (!hasPermission && requiredPermission) {
      return `ليس لديك صلاحية: ${requiredPermission}`;
    }
    if (hasErrors) {
      const errorCheck = failedChecks.find(c => c.severity === 'error');
      return errorCheck?.message || errorCheck?.name || 'لم تستوفِ الشروط المطلوبة';
    }
    if (disabledReason) {
      return disabledReason;
    }
    return null;
  };
  
  const reason = getDisabledReason();
  
  // معالجة النقر
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (requiresConfirmation && onConfirm) {
      const confirmed = window.confirm(confirmationMessage || 'هل أنت متأكد؟');
      if (confirmed) {
        onConfirm();
      }
      return;
    }
    onClick?.(e);
  };
  
  // محتوى الزر
  const buttonContent = (
    <Button
      className={cn(
        "relative",
        hasWarnings && !isDisabled && "border-yellow-500",
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin me-2">⏳</span>
          {loadingText}
        </>
      ) : (
        <>
          {!hasPermission && <Lock className="h-4 w-4 me-2" />}
          {hasWarnings && !hasErrors && <AlertCircle className="h-4 w-4 me-2 text-yellow-500" />}
          {children}
        </>
      )}
    </Button>
  );
  
  // إذا كان معطلاً، أظهر tooltip
  if (isDisabled && reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-not-allowed">
              {buttonContent}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">غير متاح</p>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // إذا كان هناك تحذيرات، أظهر tooltip
  if (hasWarnings && !isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-yellow-600">تحذيرات</p>
              {failedChecks
                .filter(c => c.severity === 'warning')
                .map(check => (
                  <div key={check.id} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>{check.message || check.name}</span>
                  </div>
                ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return buttonContent;
}

// ============================================================================
// POLICY CHECKS DISPLAY
// ============================================================================

interface PolicyChecksDisplayProps {
  checks: PolicyCheck[];
  showAll?: boolean;
}

export function PolicyChecksDisplay({ checks, showAll = false }: PolicyChecksDisplayProps) {
  const displayChecks = showAll ? checks : checks.filter(c => !c.passed);
  
  if (displayChecks.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle2 className="h-4 w-4" />
        <span>جميع الشروط مستوفاة</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {displayChecks.map(check => (
        <div
          key={check.id}
          className={cn(
            "flex items-start gap-2 text-sm p-2 rounded-md",
            check.passed && "bg-green-50 text-green-700",
            !check.passed && check.severity === 'error' && "bg-red-50 text-red-700",
            !check.passed && check.severity === 'warning' && "bg-yellow-50 text-yellow-700",
            !check.passed && check.severity === 'info' && "bg-blue-50 text-blue-700"
          )}
        >
          {check.passed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : check.severity === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : check.severity === 'warning' ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{check.name}</p>
            {check.message && <p className="text-xs opacity-80">{check.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook لإنشاء تحققات السياسة
 */
export function usePolicyChecks(checks: Array<{
  id: string;
  name: string;
  condition: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}>): PolicyCheck[] {
  return checks.map(check => ({
    id: check.id,
    name: check.name,
    passed: check.condition,
    message: check.message,
    severity: check.severity || 'error',
  }));
}

export default GuidedActionButton;
