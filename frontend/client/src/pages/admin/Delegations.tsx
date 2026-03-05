import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from 'sonner';
import { Plus, Ban, Shield, Clock } from 'lucide-react';

export default function Delegations() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [editingItem, setEditingItem] = useState<any>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/delegations/${data.id}`).then(r => r.data),
    onSuccess: () => { refetch(); },
  });

  const { data: currentUser, isError, error} = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isOpen, setIsOpen] = useState(false);
  const { data: delegations, isLoading, refetch } = useQuery({
    queryKey: ["delegation", "list"],
    queryFn: () => api.get("/delegations").then(r => r.data),
  });
  const { data: usersList } = useQuery({
    queryKey: ["kernel", "users", "list"],
    queryFn: () => api.get("/users").then(r => r.data),
  });

  const [form, setForm] = useState({
    delegatorId: 0, delegateId: 0,
    delegationType: 'approval_only' as 'full' | 'specific' | 'approval_only',
    reason: '', startDate: '', endDate: '',
    maxAmount: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/delegations", data).then(r => r.data),
    onSuccess: () => { toast.success('تم إنشاء التفويض بنجاح'); setIsOpen(false); queryClient.invalidateQueries({ queryKey: ["delegation", "list"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (data: any) => api.post(`/delegations/${data.id}/revoke`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم إلغاء التفويض'); queryClient.invalidateQueries({ queryKey: ["delegation", "list"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    revoked: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold">إدارة التفويضات</h2>
          <p className="text-gray-500">تفويض الصلاحيات بين المستخدمين</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> تفويض جديد
        </Button>
      </div>

      {/* قائمة التفويضات */}
      <div className="grid gap-4">
        {isLoading && <p className="text-center text-gray-500">جاري التحميل...</p>}
        {delegations?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((d: any) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Shield className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-semibold">
                      تفويض {d.delegationType === 'full' ? 'كامل' : d.delegationType === 'specific' ? 'محدد' : 'موافقات فقط'}
                    </p>
                    <p className="text-sm text-gray-500">
                      من: {d.delegatorId} → إلى: {d.delegateId}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs text-gray-400">
                        {formatDate(d.startDate)} — {formatDate(d.endDate)}
                      </span>
                    </div>
                    {d.reason && <p className="text-sm text-gray-600 mt-1">{d.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[d.status] || ''}>
                    {d.status === 'active' ? 'نشط' : d.status === 'expired' ? 'منتهي' : d.status === 'revoked' ? 'ملغي' : 'معلق'}
                  </Badge>
                  {d.status === 'active' && (
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (confirm('هل تريد إلغاء هذا التفويض؟')) revokeMutation.mutate({ id: d.id });
                    }}>
                      <Ban className="h-4 w-4 ms-1" /> إلغاء
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(d)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: d.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </Card>
        ))}
        {delegations?.length === 0 && (
          <Card><CardContent className="p-4 md:p-8 text-center text-gray-500">لا توجد تفويضات حالية</CardContent></Card>
        )}
      </div>

      {/* Dialog إنشاء تفويض */}
      {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3"><h3 className="text-lg font-bold">تفويض جديد</h3></div>
          <div className="space-y-4">
            <div>
              <Label>المفوِّض (من)</Label>
              <Select onValueChange={(v) => setForm({ ...form, delegatorId: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="اختر المفوِّض" /></SelectTrigger>
                <SelectContent>
                  {usersList?.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المفوَّض إليه (إلى)</Label>
              <Select onValueChange={(v) => setForm({ ...form, delegateId: parseInt(v) })}>
                <SelectTrigger><SelectValue placeholder="اختر المفوَّض إليه" /></SelectTrigger>
                <SelectContent>
                  {usersList?.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع التفويض</Label>
              <Select value={form.delegationType} onValueChange={(v: any) => setForm({ ...form, delegationType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">كامل (كل الصلاحيات)</SelectItem>
                  <SelectItem value="specific">محدد (وحدات معينة)</SelectItem>
                  <SelectItem value="approval_only">موافقات فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>الحد الأقصى للمبالغ (اختياري)</Label>
              <Input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="بدون حد" />
            </div>
            <div>
              <Label>السبب</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="إجازة، سفر عمل..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
            <Button onClick={() => {
              if (!form.delegatorId || !form.delegateId || !form.startDate || !form.endDate) {
                toast.error('يرجى ملء جميع الحقول المطلوبة'); return;
              }
              createMutation.mutate({
                ...form,
                startDate: new Date(form.startDate),
                endDate: new Date(form.endDate),
                maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
              });
            }} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء التفويض'}
            </Button>
          </div>
        </div>
      </div>)}
    </div>
    </>
  );
}