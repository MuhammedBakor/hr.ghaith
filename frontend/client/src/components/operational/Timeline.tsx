/**
 * Timeline - مكون عرض تاريخ العملية
 * 
 * يعرض:
 * - من بدأ الطلب
 * - ماذا حصل في كل خطوة
 * - من عطّله ولماذا
 * - الأدلة المرفقة
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  ArrowLeft,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  id: string;
  /** نوع الحدث */
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'modified' | 'comment' | 'escalated' | 'completed' | 'cancelled';
  /** عنوان الحدث */
  title: string;
  /** وصف الحدث */
  description?: string;
  /** المستخدم الذي قام بالإجراء */
  actor: {
    name: string;
    role?: string;
  };
  /** تاريخ الحدث */
  timestamp: Date;
  /** الأدلة المرفقة */
  evidence?: {
    type: 'document' | 'comment' | 'system';
    content: string;
    url?: string;
  }[];
  /** بيانات إضافية */
  metadata?: Record<string, string | number>;
}

export interface TimelineProps {
  /** قائمة الأحداث */
  events: TimelineEvent[];
  /** عنوان المكون */
  title?: string;
  /** className إضافي */
  className?: string;
  /** إظهار الأحداث بترتيب عكسي */
  reversed?: boolean;
}

const eventConfig = {
  created: {
    icon: FileText,
    color: 'text-blue-600 bg-blue-100',
    label: 'إنشاء',
  },
  submitted: {
    icon: ArrowLeft,
    color: 'text-purple-600 bg-purple-100',
    label: 'تقديم',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-100',
    label: 'اعتماد',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
    label: 'رفض',
  },
  modified: {
    icon: FileText,
    color: 'text-yellow-600 bg-yellow-100',
    label: 'تعديل',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-gray-600 bg-gray-100',
    label: 'تعليق',
  },
  escalated: {
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100',
    label: 'تصعيد',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-100',
    label: 'اكتمال',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-600 bg-gray-100',
    label: 'إلغاء',
  },
};

export function Timeline({
  events,
  title = 'سجل العملية',
  className,
  reversed = false,
}: TimelineProps) {
  const sortedEvents = reversed 
    ? [...events].reverse() 
    : events;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* الخط العمودي */}
          <div className="absolute end-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const config = eventConfig[event.type];
              const EventIcon = config.icon;
              const isLast = index === sortedEvents.length - 1;
              
              return (
                <div key={event.id} className="relative pe-10">
                  {/* الأيقونة */}
                  <div 
                    className={cn(
                      'absolute end-0 w-8 h-8 rounded-full flex items-center justify-center',
                      config.color
                    )}
                  >
                    <EventIcon className="h-4 w-4" />
                  </div>
                  
                  {/* المحتوى */}
                  <div className={cn(
                    'bg-muted/30 rounded-lg p-3',
                    !isLast && 'mb-2'
                  )}>
                    {/* العنوان والتاريخ */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    {/* الوصف */}
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                    )}
                    
                    {/* المستخدم */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{event.actor.name}</span>
                      {event.actor.role && (
                        <Badge variant="secondary" className="text-xs">
                          {event.actor.role}
                        </Badge>
                      )}
                    </div>
                    
                    {/* الأدلة */}
                    {event.evidence && event.evidence.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        <span className="text-xs font-medium">المرفقات:</span>
                        {event.evidence.map((ev, i) => (
                          <div key={i} className="text-xs flex items-center gap-1">
                            {ev.type === 'document' && <FileText className="h-3 w-3" />}
                            {ev.type === 'comment' && <MessageSquare className="h-3 w-3" />}
                            {ev.type === 'system' && <Clock className="h-3 w-3" />}
                            {ev.url ? (
                              <a href={ev.url} className="text-primary hover:underline">
                                {ev.content}
                              </a>
                            ) : (
                              <span>{ev.content}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* البيانات الإضافية */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {events.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أحداث مسجلة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Timeline;
