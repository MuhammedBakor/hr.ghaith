/**
 * ActionButton - زر إجراء ذكي مع التحقق من السياسات
 * 
 * يعرض:
 * - الزر معطل إذا لم تتحقق الشروط
 * - سبب التعطيل عند التحويم
 * - تأكيد قبل الإجراءات الحساسة
 */

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface BlockingCondition {
  id: string;
  reason: string;
  canOverride?: boolean;
}

export interface ActionButtonProps {
  /** نص الزر */
  label: string;
  /** أيقونة الزر */
  icon?: React.ReactNode;
  /** دالة التنفيذ */
  onClick: () => void | Promise<void>;
  /** شروط الحظر */
  blockingConditions?: BlockingCondition[];
  /** هل يتطلب تأكيد؟ */
  requiresConfirmation?: boolean;
  /** رسالة التأكيد */
  confirmationMessage?: string;
  /** عنوان التأكيد */
  confirmationTitle?: string;
  /** نوع الزر */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** حجم الزر */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** حالة التحميل */
  loading?: boolean;
  /** className إضافي */
  className?: string;
  /** هل هو الإجراء الرئيسي؟ */
  isPrimary?: boolean;
}

export function ActionButton({
  label,
  icon,
  onClick,
  blockingConditions = [],
  requiresConfirmation = false,
  confirmationMessage = 'هل أنت متأكد من هذا الإجراء؟',
  confirmationTitle = 'تأكيد الإجراء',
  variant = 'default',
  size = 'default',
  loading = false,
  className,
  isPrimary = false,
}: ActionButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const isBlocked = blockingConditions.length > 0;
  const isDisabled = isBlocked || loading || isExecuting;

  const handleClick = async () => {
    if (isDisabled) return;
    
    setIsExecuting(true);
    try {
      await onClick();
    } finally {
      setIsExecuting(false);
    }
  };

  const buttonContent = (
    <Button
      variant={isBlocked ? 'outline' : variant}
      size={size}
      disabled={isDisabled}
      onClick={requiresConfirmation ? undefined : handleClick}
      className={cn(
        isPrimary && !isBlocked && 'ring-2 ring-primary ring-offset-2',
        isBlocked && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {(loading || isExecuting) ? (
        <Loader2 className="h-4 w-4 animate-spin ms-2" />
      ) : isBlocked ? (
        <Lock className="h-4 w-4 ms-2 text-muted-foreground" />
      ) : icon ? (
        <span className="ms-2">{icon}</span>
      ) : null}
      {label}
    </Button>
  );

  // إذا كان محظوراً، نعرض tooltip مع الأسباب
  if (isBlocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                لا يمكن تنفيذ هذا الإجراء
              </div>
              <ul className="text-sm space-y-1">
                {blockingConditions.map((condition) => (
                  <li key={condition.id} className="flex items-center gap-1">
                    <span className="text-destructive">•</span>
                    {condition.reason}
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // إذا كان يتطلب تأكيد
  if (requiresConfirmation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {buttonContent}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleClick}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return buttonContent;
}

export default ActionButton;
