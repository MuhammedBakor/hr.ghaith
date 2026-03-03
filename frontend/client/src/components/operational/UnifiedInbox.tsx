/**
 * UnifiedInbox - صندوق الوارد التشغيلي الموحد
 * 
 * يعرض:
 * - المهام المطلوبة من المستخدم
 * - مرتبة حسب الأولوية و SLA
 * - مفلترة حسب الدور والقسم
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Inbox, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  Users,
  Car,
  Scale,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InboxItem {
  id: string;
  /** نوع العنصر */
  type: 'approval' | 'review' | 'action' | 'notification' | 'escalation';
  /** الوحدة المصدر */
  module: 'hr' | 'finance' | 'fleet' | 'legal' | 'projects' | 'system';
  /** العنوان */
  title: string;
  /** الوصف */
  description?: string;
  /** الأولوية */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** حالة SLA */
  slaStatus?: 'ok' | 'warning' | 'violated';
  /** الوقت المتبقي */
  timeRemaining?: string;
  /** تاريخ الإنشاء */
  createdAt: Date;
  /** المرسل */
  sender?: {
    name: string;
    role?: string;
  };
  /** رابط الإجراء */
  actionUrl?: string;
  /** الإجراء المطلوب */
  requiredAction?: string;
}

export interface UnifiedInboxProps {
  /** قائمة العناصر */
  items: InboxItem[];
  /** الدور الحالي */
  currentRole?: string;
  /** عند النقر على عنصر */
  onItemClick?: (item: InboxItem) => void;
  /** className إضافي */
  className?: string;
}

const moduleConfig = {
  hr: { icon: Users, label: 'الموارد البشرية', color: 'text-blue-600' },
  finance: { icon: DollarSign, label: 'المالية', color: 'text-green-600' },
  fleet: { icon: Car, label: 'الأسطول', color: 'text-purple-600' },
  legal: { icon: Scale, label: 'القانونية', color: 'text-amber-600' },
  projects: { icon: FileText, label: 'المشاريع', color: 'text-cyan-600' },
  system: { icon: Inbox, label: 'النظام', color: 'text-gray-600' },
};

const priorityConfig = {
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800 border-red-200' },
  high: { label: 'عالي', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'منخفض', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const typeConfig = {
  approval: { label: 'اعتماد', icon: CheckCircle2 },
  review: { label: 'مراجعة', icon: FileText },
  action: { label: 'إجراء', icon: ArrowLeft },
  notification: { label: 'إشعار', icon: Inbox },
  escalation: { label: 'تصعيد', icon: AlertTriangle },
};

export function UnifiedInbox({
  items,
  currentRole,
  onItemClick,
  className,
}: UnifiedInboxProps) {
  // تصنيف العناصر
  const criticalItems = items.filter(i => i.priority === 'critical' || i.slaStatus === 'violated');
  const pendingApprovals = items.filter(i => i.type === 'approval');
  const pendingReviews = items.filter(i => i.type === 'review');
  const otherItems = items.filter(i => !['approval', 'review'].includes(i.type));

  const renderItem = (item: InboxItem) => {
    const moduleInfo = moduleConfig[item.module];
    const priorityInfo = priorityConfig[item.priority];
    const typeInfo = typeConfig[item.type];
    const ModuleIcon = moduleInfo.icon;
    const TypeIcon = typeInfo.icon;

    return (
      <div
        key={item.id}
        className={cn(
          'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
          item.slaStatus === 'violated' && 'border-red-300 bg-red-50',
          item.slaStatus === 'warning' && 'border-yellow-300 bg-yellow-50',
          !item.slaStatus && 'hover:border-primary/50'
        )}
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* العنوان والنوع */}
            <div className="flex items-center gap-2 mb-1">
              <ModuleIcon className={cn('h-4 w-4', moduleInfo.color)} />
              <span className="font-medium truncate">{item.title}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                <TypeIcon className="h-3 w-3 ms-1" />
                {typeInfo.label}
              </Badge>
            </div>
            
            {/* الوصف */}
            {item.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {item.description}
              </p>
            )}
            
            {/* المرسل والتاريخ */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.sender && (
                <span>من: {item.sender.name}</span>
              )}
              <span>{item.createdAt.toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
          
          {/* الأولوية و SLA */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={priorityInfo.color}>
              {priorityInfo.label}
            </Badge>
            
            {item.slaStatus && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                item.slaStatus === 'violated' && 'text-red-600',
                item.slaStatus === 'warning' && 'text-yellow-600',
                item.slaStatus === 'ok' && 'text-green-600'
              )}>
                <Clock className="h-3 w-3" />
                {item.timeRemaining || (item.slaStatus === 'violated' ? 'متأخر' : 'في الوقت')}
              </div>
            )}
          </div>
        </div>
        
        {/* الإجراء المطلوب */}
        {item.requiredAction && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                المطلوب: <span className="font-medium text-foreground">{item.requiredAction}</span>
              </span>
              <Button size="sm" variant="outline">
                تنفيذ
                <ArrowLeft className="h-4 w-4 me-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            صندوق الوارد
            {items.length > 0 && (
              <Badge variant="secondary">{items.length}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4 ms-1" />
            تصفية
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* تنبيه العناصر الحرجة */}
        {criticalItems.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              {criticalItems.length} عنصر يتطلب اهتمام فوري
            </div>
          </div>
        )}
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="all">
              الكل ({items.length})
            </TabsTrigger>
            <TabsTrigger value="approvals">
              اعتمادات ({pendingApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              مراجعات ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              أخرى ({otherItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد مهام معلقة</p>
                <p className="text-sm">أنت على اطلاع بكل شيء!</p>
              </div>
            ) : (
              items.map(renderItem)
            )}
          </TabsContent>
          
          <TabsContent value="approvals" className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد اعتمادات معلقة</p>
              </div>
            ) : (
              pendingApprovals.map(renderItem)
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-3">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد مراجعات معلقة</p>
              </div>
            ) : (
              pendingReviews.map(renderItem)
            )}
          </TabsContent>
          
          <TabsContent value="other" className="space-y-3">
            {otherItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عناصر أخرى</p>
              </div>
            ) : (
              otherItems.map(renderItem)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default UnifiedInbox;
