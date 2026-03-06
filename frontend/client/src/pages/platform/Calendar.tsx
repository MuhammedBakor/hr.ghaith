import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Loader2, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  allDay: boolean | null;
  location: string | null;
  eventType: string | null;
  color: string | null;
}

export default function Calendar() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);

  const { data: currentUser } = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    location: '',
    eventType: 'other' as const,
    color: '#3B82F6',
  });

  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({ queryKey: ['calendar-events'], queryFn: () => api.get('/platform/calendar').then(r => r.data) });
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/platform/notifications').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/platform/calendar', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء الحدث بنجاح');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء الحدث: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/platform/calendar/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف الحدث بنجاح');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setViewingEvent(null);
    },
    onError: (error: any) => {
      toast.error('فشل في حذف الحدث: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      allDay: false,
      location: '',
      eventType: 'other',
      color: '#3B82F6',
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.startDate) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    const startDateTime = formData.allDay 
      ? new Date(formData.startDate)
      : new Date(`${formData.startDate}T${formData.startTime}`);
    
    const endDateTime = formData.endDate 
      ? (formData.allDay 
          ? new Date(formData.endDate)
          : new Date(`${formData.endDate}T${formData.endTime}`))
      : undefined;

    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      allDay: formData.allDay,
      location: formData.location || undefined,
      eventType: formData.eventType,
      color: formData.color,
    });
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setFormData({
      ...formData,
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getEventTypeLabel = (type: string | null) => {
    switch (type) {
      case 'meeting': return 'اجتماع';
      case 'task': return 'مهمة';
      case 'reminder': return 'تذكير';
      case 'holiday': return 'إجازة';
      default: return 'أخرى';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">التقويم</h2>
          <p className="text-gray-500">عرض المواعيد والأحداث</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          حدث جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="السابق"><ChevronRight className="h-4 w-4" /></Button>
            <CardTitle>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronLeft className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayNames.map(day => <div key={day} className="p-2 font-semibold text-gray-500">{day}</div>)}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() &&
                              currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <div 
                  key={day} 
                  className={`p-2 rounded hover:bg-primary/10 cursor-pointer min-h-[60px] ${isToday ? 'bg-primary text-white' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="font-medium">{day}</div>
                  {dayEvents.slice(0, 2).map((event: CalendarEvent) => (
                    <div 
                      key={event.id}
                      className="text-xs truncate rounded px-1 mt-1"
                      style={{ backgroundColor: event.color || '#3B82F6', color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingEvent(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 mt-1">+{dayEvents.length - 2} المزيد</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>التذكيرات ({notifications?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className="p-3 border rounded flex justify-between items-center">
                  <span>{n.title}</span>
                  <span className="text-sm text-gray-500">{n.createdAt ? formatDate(n.createdAt) : ''}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-500 py-4">لا توجد تذكيرات</p>}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حدث جديد</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>عنوان الحدث *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان الحدث"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الحدث"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              />
              <Label htmlFor="allDay">طوال اليوم</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div className="space-y-2">
                  <Label>وقت البداية</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              {!formData.allDay && (
                <div className="space-y-2">
                  <Label>وقت النهاية</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الحدث</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">اجتماع</SelectItem>
                    <SelectItem value="task">مهمة</SelectItem>
                    <SelectItem value="reminder">تذكير</SelectItem>
                    <SelectItem value="holiday">إجازة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اللون</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="موقع الحدث"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={!!viewingEvent} onOpenChange={() => setViewingEvent(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحدث</DialogTitle>
          </DialogHeader>
          
          {viewingEvent && (
            <div className="space-y-4 py-4">
              <div 
                className="h-2 rounded"
                style={{ backgroundColor: viewingEvent.color || '#3B82F6' }}
              />
              
              <div>
                <h3 className="text-xl font-bold">{viewingEvent.title}</h3>
                <p className="text-sm text-gray-500">{getEventTypeLabel(viewingEvent.eventType)}</p>
              </div>
              
              {viewingEvent.description && (
                <p className="text-gray-600">{viewingEvent.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDate(viewingEvent.startDate)}
                  {viewingEvent.endDate && ` - ${formatDate(viewingEvent.endDate)}`}
                </span>
              </div>
              
              {viewingEvent.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{viewingEvent.location}</span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => viewingEvent && deleteMutation.mutate({ id: viewingEvent.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حذف
            </Button>
            <Button variant="outline" onClick={() => setViewingEvent(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
