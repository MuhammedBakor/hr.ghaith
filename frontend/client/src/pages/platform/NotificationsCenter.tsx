/**
 * ════════════════════════════════════════════════════════════════════════
 * NOTIFICATIONS CENTER v3 — مركز الإشعارات الذكي الشامل
 * ════════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, BellRing, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle2, Loader2, Inbox, Search, Filter, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

// ─── نوع الإشعار ──────────────────────────────
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  category: string;
  read: boolean;
  priority: string;
  link?: string;
  createdAt: number;
}

// ─── بطاقة الإشعار ───────────────────────────
function NotifCard({ notif, onMarkRead, onDelete }: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <Info className="w-4 h-4 text-blue-600" />,
  };
  const colors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  };
  const priorityBadge: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: '', low: '',
  };

  const typeColor = colors[notif.type] ?? colors.info;
  const relativeTime = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 60_000) return 'الآن';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} د`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} س`;
    return `${Math.floor(diff / 86400_000)} ي`;
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${notif.read ? 'bg-white border-gray-100' : `${typeColor} border`}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
        {icons[notif.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {priorityBadge[notif.priority] && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityBadge[notif.priority]}`}>
                {notif.priority === 'urgent' ? 'عاجل' : 'مهم'}
              </span>
            )}
            <span className="text-xs text-gray-400">{relativeTime(notif.createdAt)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs px-1.5 py-0">{notif.category}</Badge>
          {notif.link && (
            <Link href={notif.link}>
              <button className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                عرض <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!notif.read && (
          <button onClick={() => onMarkRead(notif.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="تحديد كمقروء">
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => { if (window.confirm("هل أنت متأكد من الحذف؟")) onDelete(notif.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="حذف">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
export default function NotificationsCenter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [tab, setTab] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', showUnreadOnly, tab, category],
    queryFn: () => api.get('/platform/notifications', { params: { limit: 50, unreadOnly: showUnreadOnly || tab === 'unread', category: category || undefined } }).then(r => r.data),
  });

  const { data: unreadCount } = useQuery({ queryKey: ['notifications-unread-count'], queryFn: () => api.get('/platform/notifications/unread-count').then(r => r.data) });

  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: (data: any) => api.put(`/platform/notifications/${data.id}/read`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (data: any) => api.delete(`/platform/notifications/${data.id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('تم حذف الإشعار');
    },
  });

  const handleMarkRead = (id: string) => markRead.mutate({ notificationId: id });
  const handleMarkAllRead = () => markRead.mutate({ notificationId: 'all' });
  const handleDelete = (id: string) => deleteNotif.mutate({ notificationId: id });

  const notifications: Notification[] = (data?.notifications ?? []) as any[];

  const filtered = notifications.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unread = filtered.filter(n => !n.read);
  const categoryCounts = notifications.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = [
    { key: 'hr', label: '👥 الموارد البشرية' },
    { key: 'finance', label: '💰 المالية' },
    { key: 'support', label: '🎫 الدعم' },
    { key: 'fleet', label: '🚗 الأسطول' },
    { key: 'legal', label: '⚖️ القانوني' },
    { key: 'projects', label: '📁 المشاريع' },
    { key: 'property', label: '🏢 العقارات' },
    { key: 'governance', label: '🏛️ الحوكمة' },
    { key: 'system', label: '⚙️ النظام' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">مركز الإشعارات</h1>
            <p className="text-sm text-gray-500">
              {(unreadCount?.count ?? 0) > 0 ? (
                <span className="text-blue-600 font-medium">{unreadCount?.count} إشعار غير مقروء</span>
              ) : 'لا توجد إشعارات غير مقروءة'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(unreadCount?.count ?? 0) > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead} disabled={markRead.isPending}>
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-100 p-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute end-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input className="pe-9 border-0 shadow-none focus-visible:ring-0 text-sm" placeholder="ابحث في الإشعارات..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44 border-0 shadow-none focus:ring-0">
            <SelectValue placeholder="جميع الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.filter(c => categoryCounts[c.key]).map(c => (
              <SelectItem key={c.key} value={c.key}>
                {c.label} ({categoryCounts[c.key]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${showUnreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          <BellRing className="w-4 h-4" />
          غير المقروءة
        </button>
      </div>

      {/* Category Chips */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            الكل ({notifications.length})
          </button>
          {categories.filter(c => categoryCounts[c.key]).map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key === category ? '' : c.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c.label.split(' ')[0]} {categoryCounts[c.key]}
            </button>
          ))}
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-medium text-gray-700 mb-1">لا توجد إشعارات</h3>
          <p className="text-sm text-gray-400">
            {search ? 'لا توجد نتائج للبحث' : showUnreadOnly ? 'جميع الإشعارات مقروءة' : 'لم تصلك أي إشعارات بعد'}
          </p>
        </div>
      ) : (
        <>
          {/* Unread Section */}
          {unread.length > 0 && !showUnreadOnly && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                غير مقروء ({unread.length})
              </h3>
              <div className="space-y-2">
                {unread.map(n => (
                  <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Read Section */}
          {!showUnreadOnly && filtered.filter(n => n.read).length > 0 && (
            <div>
              {unread.length > 0 && <div className="border-t border-gray-100 my-4" />}
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                مقروء ({filtered.filter(n => n.read).length})
              </h3>
              <div className="space-y-2">
                {filtered.filter(n => n.read).map(n => (
                  <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Unread Only Mode */}
          {showUnreadOnly && (
            <div className="space-y-2">
              {filtered.map(n => (
                <NotifCard key={n.id} notif={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
