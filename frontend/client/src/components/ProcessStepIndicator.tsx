/**
 * ProcessStepIndicator - مؤشر خطوات المسار
 * 
 * يعرض تقدم المسار بشكل مرئي:
 * - الخطوات المكتملة
 * - الخطوة الحالية
 * - الخطوات المتبقية
 */

import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from "lucide-react";
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

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface ProcessStep {
  id: string;
  name: string;
  status: StepStatus;
  description?: string;
  completedAt?: string;
  assignedTo?: string;
  result?: Record<string, unknown>;
}

export interface ProcessStepIndicatorProps {
  /** قائمة الخطوات */
  steps: ProcessStep[];
  
  /** الخطوة الحالية */
  currentStepId?: string;
  
  /** نسبة الإكمال */
  progressPercent?: number;
  
  /** الاتجاه */
  direction?: 'horizontal' | 'vertical';
  
  /** الحجم */
  size?: 'sm' | 'md' | 'lg';
  
  /** إظهار التفاصيل */
  showDetails?: boolean;
  
  /** className إضافي */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProcessStepIndicator({
  steps,
  currentStepId,
  progressPercent,
  direction = 'horizontal',
  size = 'md',
  showDetails = false,
  className,
}: ProcessStepIndicatorProps) {
  const sizeClasses = {
    sm: { icon: 'h-4 w-4', text: 'text-xs', gap: 'gap-1' },
    md: { icon: 'h-5 w-5', text: 'text-sm', gap: 'gap-2' },
    lg: { icon: 'h-6 w-6', text: 'text-base', gap: 'gap-3' },
  };
  
  const sizes = sizeClasses[size];
  
  const getStepIcon = (step: ProcessStep) => {
    const iconClass = cn(sizes.icon);
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />;
      case 'in_progress':
        return <Loader2 className={cn(iconClass, "text-primary animate-spin")} />;
      case 'failed':
        return <AlertCircle className={cn(iconClass, "text-red-500")} />;
      case 'skipped':
        return <Circle className={cn(iconClass, "text-muted-foreground")} />;
      default:
        return <Circle className={cn(iconClass, "text-muted-foreground")} />;
    }
  };
  
  const getStepColor = (step: ProcessStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-primary font-medium';
      case 'failed':
        return 'text-red-600';
      case 'skipped':
        return 'text-muted-foreground line-through';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getConnectorColor = (step: ProcessStep, nextStep?: ProcessStep) => {
    if (step.status === 'completed') {
      return 'bg-green-500';
    }
    if (step.status === 'in_progress') {
      return 'bg-primary/50';
    }
    return 'bg-muted';
  };
  
  if (direction === 'vertical') {
    return (
      <div className={cn("space-y-0", className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex">
            {/* Icon and connector */}
            <div className="flex flex-col items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1">{getStepIcon(step)}</div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div>
                      <p className="font-medium">{step.name}</p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}
                      {step.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          اكتمل: {new Date(step.completedAt).toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-8",
                    getConnectorColor(step, steps[index + 1])
                  )}
                />
              )}
            </div>
            
            {/* Step name */}
            <div className={cn("ms-3 pb-8", sizes.gap)}>
              <p className={cn(sizes.text, getStepColor(step))}>
                {step.name}
              </p>
              {showDetails && step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Horizontal layout
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      {progressPercent !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>التقدم</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div className="p-1">{getStepIcon(step)}</div>
                    <p className={cn(sizes.text, getStepColor(step), "mt-1 text-center max-w-[80px] truncate")}>
                      {step.name}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-medium">{step.name}</p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    )}
                    {step.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        اكتمل: {new Date(step.completedAt).toLocaleString('ar-SA')}
                      </p>
                    )}
                    {step.assignedTo && (
                      <p className="text-xs text-muted-foreground">
                        مسند إلى: {step.assignedTo}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  getConnectorColor(step, steps[index + 1])
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

interface CompactStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  currentStepName?: string;
  className?: string;
}

export function CompactStepIndicator({
  currentStep,
  totalSteps,
  currentStepName,
  className,
}: CompactStepIndicatorProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        {currentStep}/{totalSteps}
        {currentStepName && (
          <span className="text-foreground ms-2">{currentStepName}</span>
        )}
      </div>
    </div>
  );
}

export default ProcessStepIndicator;
