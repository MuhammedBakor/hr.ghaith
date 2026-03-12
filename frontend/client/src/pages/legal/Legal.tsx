import { formatDate, formatDateTime } from '@/lib/formatDate';
/**
 * ════════════════════════════════════════════════════════════════════════
 * LEGAL v4 — لوحة التحكم القانونية الشاملة
 * إحصاءات • عقود • قضايا • وثائق • تنبيهات
 * ════════════════════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Scale, Briefcase, Plus, Search, Edit2, Trash2, Clock, CheckCircle2, Loader2, RefreshCw, TrendingUp, FileCheck, Bell } from 'lucide-react';
import { toast } from 'sonner';

// ─── مساعدات ─────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', review: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700', expired: 'bg-red-100 text-red-700',
  terminated: 'bg-gray-100 text-gray-500',
  open: 'bg-blue-100 text-blue-700', in_progress: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600', won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  draft: 'مسودة', review: 'مراجعة', active: 'نشط', expired: 'منتهي', terminated: 'مُنهى',
  open: 'مفتوح', in_progress: 'قيد المعالجة', closed: 'مغلق', won: 'فوز', lost: 'خسارة',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, color = 'blue', alert = false }: {
  title: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string; alert?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600', yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <Card className={alert ? 'border-red-300 bg-red-50/30' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════
// CONTRACTS SECTION
// ═══════════════════════════════════════════════
function ContractsSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['legal-contracts', page, status, search],
    queryFn: () => api.get('/legal/contracts', { params: { page, pageSize: 15, status: (status === 'all' || !status) ? undefined : status, search: search || undefined } }).then(r => r.data),
  });

  const createM = useMutation({
    mutationFn: (data: any) => api.post('/legal/contracts', data).then(r => r.data),
    onSuccess: () => { toast.success('تم إنشاء العقد'); setOpenCreate(false); refetch(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/legal/contracts/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم تحديث العقد'); setEditData(null); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const deleteM = useMutation({
    mutationFn: ({ id }: any) => api.delete(`/legal/contracts/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('تم حذف العقد'); setDeleteId(null); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const renewM = useMutation({
    mutationFn: ({ id, ...data }: any) => api.post(`/legal/contracts/${id}/renew`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم تجديد العقد'); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });

  const [form, setForm] = useState({ title: '', partyA: '', partyB: '', contractType: '', startDate: '', endDate: '', value: '', status: 'draft', description: '' });
  const resetForm = () => setForm({ title: '', partyA: '', partyB: '', contractType: '', startDate: '', endDate: '', value: '', status: 'draft', description: '' });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.partyA.trim() || !form.partyB.trim()) return toast.error('يرجى ملء الحقول المطلوبة');
    createM.mutate(form as any);
  };

  const handleUpdate = () => {
    if (!editData?.id) return;
    updateM.mutate({ id: editData.id, ...editData });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute end-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input className="pe-9 text-sm" placeholder="بحث في العقود..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {['draft', 'review', 'active', 'expired', 'terminated'].map(s => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />عقد جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إنشاء عقد جديد</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
              <div><Label>عنوان العقد *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان العقد" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الطرف الأول *</Label><Input value={form.partyA} onChange={e => setForm(f => ({ ...f, partyA: e.target.value }))} placeholder="الطرف الأول" /></div>
                <div><Label>الطرف الثاني *</Label><Input value={form.partyB} onChange={e => setForm(f => ({ ...f, partyB: e.target.value }))} placeholder="الطرف الثاني" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>نوع العقد</Label><Input value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} placeholder="توريد / خدمات..." /></div>
                <div><Label>القيمة (ر.س)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0.00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ البدء</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['draft', 'review', 'active'].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={createM.isPending}>
                {createM.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
                إنشاء العقد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="overflow-x-auto w-full rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['عنوان العقد', 'الطرف الأول', 'الطرف الثاني', 'القيمة', 'تاريخ الانتهاء', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-end text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map(c => {
                const isExpiringSoon = c.endDate && new Date(c.endDate).getTime() - Date.now() < 30 * 86400_000 && c.status === 'active';
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isExpiringSoon ? 'bg-orange-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.title}
                      {isExpiringSoon && <span className="me-2 text-xs text-orange-600 font-normal">⚠️ قريب الانتهاء</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(c as any).partyA}</td>
                    <td className="px-4 py-3 text-gray-600">{(c as any).partyB}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {(c as any).value ? Number((c as any).value).toLocaleString('ar-SA') + ' ر.س' : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.endDate ? formatDate(c.endDate) : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => setEditData(c)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {c.status === 'active' && isExpiringSoon && (
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-green-600" title="تجديد"
                            onClick={() => renewM.mutate({ id: c.id, newEndDate: '', newValue: '' })}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-red-500" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(data?.items ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">لا توجد عقود</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(data?.pagination?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">إجمالي {data?.pagination?.total} عقد</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <span className="text-sm px-3 py-1">{page} / {data?.pagination?.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= (data?.pagination?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editData} onOpenChange={v => !v && setEditData(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>تعديل العقد</DialogTitle></DialogHeader>
          {editData && (
            <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
              <div><Label>عنوان العقد</Label><Input value={editData.title} onChange={e => setEditData((d: any) => ({ ...d, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الطرف الأول</Label><Input value={editData.partyA ?? ''} onChange={e => setEditData((d: any) => ({ ...d, partyA: e.target.value }))} /></div>
                <div><Label>الطرف الثاني</Label><Input value={editData.partyB ?? ''} onChange={e => setEditData((d: any) => ({ ...d, partyB: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ الانتهاء</Label><Input type="date" value={editData.endDate?.split('T')[0] ?? ''} onChange={e => setEditData((d: any) => ({ ...d, endDate: e.target.value }))} /></div>
                <div><Label>القيمة</Label><Input type="number" value={editData.value ?? ''} onChange={e => setEditData((d: any) => ({ ...d, value: e.target.value }))} /></div>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={editData.status} onValueChange={v => setEditData((d: any) => ({ ...d, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['draft', 'review', 'active', 'expired', 'terminated'].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditData(null)}>إلغاء</Button>
            <Button onClick={handleUpdate} disabled={updateM.isPending}>
              {updateM.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العقد</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteId && deleteM.mutate({ id: deleteId })} disabled={deleteM.isPending}>
              {deleteM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CASES SECTION
// ═══════════════════════════════════════════════
function CasesSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['legal-cases', page, status, search],
    queryFn: () => api.get('/legal/cases', { params: { page, pageSize: 15, status: (status === 'all' || !status) ? undefined : status, search: search || undefined } }).then(r => r.data),
  });

  const createM = useMutation({
    mutationFn: (data: any) => api.post('/legal/cases', data).then(r => r.data),
    onSuccess: () => { toast.success('تم إنشاء القضية'); setOpenCreate(false); refetch(); resetForm(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const updateM = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/legal/cases/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم تحديث القضية'); setEditData(null); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const deleteM = useMutation({
    mutationFn: ({ id }: any) => api.delete(`/legal/cases/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('تم حذف القضية'); setDeleteId(null); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });

  const [form, setForm] = useState({ title: '', caseNumber: '', caseType: '', description: '', status: 'open', hearingDate: '', court: '', claimAmount: '' });
  const resetForm = () => setForm({ title: '', caseNumber: '', caseType: '', description: '', status: 'open', hearingDate: '', court: '', claimAmount: '' });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute end-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input className="pe-9 text-sm" placeholder="بحث في القضايا..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="جميع الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {['open', 'in_progress', 'closed', 'won', 'lost'].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />قضية جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إنشاء قضية جديدة</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
              <div><Label>عنوان القضية *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>رقم القضية *</Label><Input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} /></div>
                <div><Label>نوع القضية</Label><Input value={form.caseType} onChange={e => setForm(f => ({ ...f, caseType: e.target.value }))} placeholder="تجاري / عمالي..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} /></div>
                <div><Label>قيمة المطالبة</Label><Input type="number" value={form.claimAmount} onChange={e => setForm(f => ({ ...f, claimAmount: e.target.value }))} /></div>
              </div>
              <div><Label>تاريخ الجلسة</Label><Input type="date" value={form.hearingDate} onChange={e => setForm(f => ({ ...f, hearingDate: e.target.value }))} /></div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div>
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['open', 'in_progress'].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</Button>
              <Button disabled={createM.isPending} onClick={() => {
                if (!form.title.trim() || !form.caseNumber.trim()) return toast.error('يرجى ملء الحقول المطلوبة');
                createM.mutate(form as any);
              }}>
                {createM.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="overflow-x-auto w-full rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['رقم القضية', 'عنوان القضية', 'النوع', 'المحكمة', 'تاريخ الجلسة', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} className="px-4 py-3 text-end text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.caseNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{c.caseType ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(c as any).court ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {(c as any).hearingDate ? new Date((c as any).hearingDate).toLocaleDateString('ar-SA') : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => setEditData(c)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-red-500" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">لا توجد قضايا</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(data?.pagination?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">إجمالي {data?.pagination?.total} قضية</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <span className="text-sm px-3 py-1">{page} / {data?.pagination?.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= (data?.pagination?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editData} onOpenChange={v => !v && setEditData(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>تعديل القضية</DialogTitle></DialogHeader>
          {editData && (
            <div className="space-y-3 max-h-80 overflow-y-auto pe-1">
              <div><Label>عنوان القضية</Label><Input value={editData.title} onChange={e => setEditData((d: any) => ({ ...d, title: e.target.value }))} /></div>
              <div><Label>تاريخ الجلسة</Label><Input type="date" value={editData.hearingDate?.split('T')[0] ?? ''} onChange={e => setEditData((d: any) => ({ ...d, hearingDate: e.target.value }))} /></div>
              <div><Label>الحالة</Label>
                <Select value={editData.status} onValueChange={v => setEditData((d: any) => ({ ...d, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['open', 'in_progress', 'closed', 'won', 'lost'].map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الوصف</Label><Textarea value={editData.description ?? ''} onChange={e => setEditData((d: any) => ({ ...d, description: e.target.value }))} rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditData(null)}>إلغاء</Button>
            <Button onClick={() => updateM.mutate({ id: editData.id, ...editData })} disabled={updateM.isPending}>
              {updateM.isPending && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف القضية</AlertDialogTitle><AlertDialogDescription>هل تريد حذف هذه القضية؟</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteId && deleteM.mutate({ id: deleteId })}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
export default function Legal() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['legal-stats'],
    queryFn: () => api.get('/legal/stats').then(r => r.data),
  });
  const { data: expiring } = useQuery({
    queryKey: ['legal-contracts-expiring'],
    queryFn: () => api.get('/legal/contracts/expiring', { params: { days: 30 } }).then(r => r.data),
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-7 h-7 text-purple-600" />
            الإدارة القانونية
          </h1>
          <p className="text-gray-500 text-sm mt-1">إدارة العقود والقضايا والوثائق القانونية</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetchStats()}>
          <RefreshCw className="w-4 h-4" />تحديث
        </Button>
      </div>

      {/* Expiring Alert */}
      {(expiring ?? []).length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {expiring!.length} عقد ينتهي خلال 30 يوماً
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {expiring!.slice(0, 3).map(c => c.title).join('، ')}
              {expiring!.length > 3 && `... و${expiring!.length - 3} آخرين`}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {statsLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="إجمالي العقود" value={stats?.contracts?.total?.toLocaleString()} icon={FileCheck} color="blue" />
          <StatCard title="عقود نشطة" value={stats?.contracts?.active} icon={CheckCircle2} color="green" />
          <StatCard title="تنتهي قريباً" value={stats?.contracts?.expiring} icon={Clock} color="yellow" alert={stats?.contracts?.expiring > 0} />
          <StatCard title="قضايا مفتوحة" value={stats?.cases?.open} icon={Briefcase} color="purple" />
          <StatCard title="نسبة الفوز" value={`${stats?.cases?.winRate}%`} sub={`من ${stats?.cases?.total?.toLocaleString()} قضية`} icon={TrendingUp} color="green" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="contracts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileCheck className="w-4 h-4 ms-2" />العقود
            {stats?.contracts.active ? <Badge className="me-2 bg-green-100 text-green-700 hover:bg-green-100">{stats?.contracts?.active}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="cases" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Scale className="w-4 h-4 ms-2" />القضايا
            {stats?.cases.open ? <Badge className="me-2 bg-purple-100 text-purple-700 hover:bg-purple-100">{stats?.cases?.open}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts"><ContractsSection /></TabsContent>
        <TabsContent value="cases"><CasesSection /></TabsContent>
      </Tabs>
    </div>
  );
}
