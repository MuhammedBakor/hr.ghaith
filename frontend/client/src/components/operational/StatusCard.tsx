/**
 * StatusCard - مكون عرض الحالة التشغيلية
 * 
 * يعرض:
 * - الحالة الحالية
 * - سبب الوصول لهذه الحالة
 * - المتطلبات الناقصة (Blocking Reasons)
 * - المالك الحالي
 * - الخطوة التالية
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  ArrowLeft,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BlockingReason {
  id: string;
  reason: string;
  severity: 'critical' | 'warning' | 'info';
  canOverride?: boolean;
}

export interface StatusCardProps {
  /** الحالة الحالية */
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'posted' | 'cancelled' | 'on_hold';
  /** عنوان الحالة بالعربي */
  statusLabel?: string;
  /** سبب الوصول لهذه الحالة */
  reason?: string;
  /** المتطلبات الناقصة */
  blockingReasons?: BlockingReason[];
  /** المالك الحالي */
  currentOwner?: {
    name: string;
    role: string;
  };
  /** الخطوة التالية */
  nextStep?: {
    label: string;
    action?: string;
  };
  /** تاريخ آخر تحديث */
  lastUpdated?: Date;
  /** هل يمكن التقدم؟ */
  canProceed?: boolean;
  /** className إضافي */
  className?: string;
}

const statusConfig = {
  draft: {
    label: 'مسودة',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
  },
  pending: {
    label: 'قيد المراجعة',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  approved: {
    label: 'معتمد',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'مرفوض',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  posted: {
    label: 'مرحّل',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'ملغي',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
  on_hold: {
    label: 'موقوف',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
  },
};

export function StatusCard({
  status,
  statusLabel,
  reason,
  blockingReasons = [],
  currentOwner,
  nextStep,
  lastUpdated,
  canProceed = true,
  className,
}: StatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const hasBlockers = blockingReasons.length > 0;
  const criticalBlockers = blockingReasons.filter(b => b.severity === 'critical');

  return (
    <Card className={cn('border-2', config.color.split(' ')[2], className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={cn('h-5 w-5', config.color.split(' ')[1])} />
            الحالة
          </CardTitle>
          <Badge className={config.color}>
            {statusLabel || config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* سبب الحالة */}
        {reason && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">السبب:</span> {reason}
          </div>
        )}

        {/* المتطلبات الناقصة */}
        {hasBlockers && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-destructive flex items-center gap-1">
              <Lock className="h-4 w-4" />
              لا يمكن المتابعة - المتطلبات الناقصة:
            </div>
            <ul className="space-y-1">
              {blockingReasons.map((blocker) => (
                <li 
                  key={blocker.id}
                  className={cn(
                    'text-sm flex items-center gap-2 p-2 rounded',
                    blocker.severity === 'critical' && 'bg-red-50 text-red-700',
                    blocker.severity === 'warning' && 'bg-yellow-50 text-yellow-700',
                    blocker.severity === 'info' && 'bg-blue-50 text-blue-700'
                  )}
                >
                  {blocker.severity === 'critical' && <XCircle className="h-4 w-4" />}
                  {blocker.severity === 'warning' && <AlertTriangle className="h-4 w-4" />}
                  {blocker.severity === 'info' && <Clock className="h-4 w-4" />}
                  <span>{blocker.reason}</span>
                  {blocker.canOverride && (
                    <Badge variant="outline" className="text-xs">قابل للتجاوز</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* المالك الحالي */}
        {currentOwner && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">المسؤول الحالي:</span>
            <span className="font-medium">{currentOwner.name}</span>
            <Badge variant="outline" className="text-xs">{currentOwner.role}</Badge>
          </div>
        )}

        {/* الخطوة التالية */}
        {nextStep && canProceed && !hasBlockers && (
          <div className="flex items-center gap-2 text-sm bg-primary/5 p-3 rounded-lg">
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">الخطوة التالية:</span>
            <span className="font-medium text-primary">{nextStep.label}</span>
          </div>
        )}

        {/* حالة الإمكانية */}
        {canProceed && !hasBlockers ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Unlock className="h-4 w-4" />
            <span>جاهز للمتابعة</span>
          </div>
        ) : criticalBlockers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <Lock className="h-4 w-4" />
            <span>يجب معالجة {criticalBlockers.length} متطلب(ات) أولاً</span>
          </div>
        )}

        {/* آخر تحديث */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            آخر تحديث: {lastUpdated.toLocaleString('ar-SA')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatusCard;
