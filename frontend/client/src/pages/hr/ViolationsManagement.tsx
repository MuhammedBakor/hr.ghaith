import { formatDate } from '@/lib/formatDate';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, AlertTriangle, Eye, Trash2, Edit, Loader2, Inbox, Mail, Calendar, User, Bot, UserCheck, MessageSquareWarning } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, useBranches, useDepartments } from '@/services/hrService';
import { PrintButton } from '@/components/PrintButton';

const VIOLATION_TYPES = [
  'تأخر عن العمل',
  'غياب بدون إذن',
  'مخالفة قواعد اللباس',
  'إهمال في العمل',
  'سلوك غير لائق',
  'مخالفة سياسة الاستخدام',
  'تسريب معلومات سرية',
  'عدم الالتزام بتعليمات السلامة',
  'أخرى',
];

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  sent: 'مُرسلة',
  acknowledged: 'تم الاستلام',
};

export default function ViolationsManagement() {
  const { selectedRole, currentUserId } = useAppContext();
  const queryClient = useQueryClient();

  const isTopAdmin = selectedRole === 'admin' || selectedRole === 'general_manager';
  const isAdmin = isTopAdmin || selectedRole === 'hr_manager';
  const isDeptManager = selectedRole === 'department_manager';

  const [showCreate, setShowCreate] = useState(false);
  const [viewViolation, setViewViolation] = useState<any>(null);
  const [editViolation, setEditViolation] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Branch/dept filters for the create dialog (admin/GM only)
  const [filterBranchId, setFilterBranchId] = useState<string>('');
  const [filterDeptId, setFilterDeptId] = useState<string>('');

  const emptyForm = { employeeId: '', violationType: '', description: '', violationDate: '' };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ violationType: '', description: '', violationDate: '', status: '' });

  // Fetch violations: admin/GM see all, dept manager sees only their sent
  const violationsQuery = useQuery({
    queryKey: ['violations', isAdmin ? 'all' : currentUserId],
    queryFn: () => {
      if (isAdmin) return api.get('/hr/violations').then(r => r.data);
      return api.get('/hr/violations', { params: { sentByUserId: currentUserId } }).then(r => r.data);
    },
    enabled: !!currentUserId || isAdmin,
  });

  const violations: any[] = violationsQuery.data || [];

  // Branches and departments for dialog filters (admin/GM only)
  const { data: branches = [] } = useBranches();
  const activeBranchId = filterBranchId && filterBranchId !== 'all' ? parseInt(filterBranchId) : null;
  const activeDeptId = filterDeptId && filterDeptId !== 'all' ? parseInt(filterDeptId) : null;
  const { data: departments = [] } = useDepartments(
    activeBranchId ? { branchId: activeBranchId } : undefined
  );

  // Employees filtered by branch+dept when admin/GM, otherwise unfiltered
  const { data: employees = [] } = useEmployees(
    isTopAdmin
      ? { branchId: activeBranchId, departmentId: activeDeptId }
      : undefined
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/violations', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إرسال المخالفة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setShowCreate(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/hr/violations/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث المخالفة');
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setEditViolation(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hr/violations/${id}`),
    onSuccess: () => {
      toast.success('تم حذف المخالفة');
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const [appealId, setAppealId] = useState<number | null>(null);
  const [appealReason, setAppealReason] = useState('');

  const appealMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/hr/violations/${id}/appeal`, { reason }).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تقديم الاستئناف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setAppealId(null);
      setAppealReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ في تقديم الاستئناف'),
  });

  // Check if a violation is within the 15-day appeal window
  const isWithinAppealWindow = (v: any) => {
    if (!v.createdAt && !v.violationDate) return false;
    const refDate = new Date(v.createdAt || v.violationDate);
    const diffDays = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 15;
  };

  const handleCreate = () => {
    if (!form.employeeId || !form.violationType || !form.violationDate) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createMutation.mutate({
      employeeId: Number(form.employeeId),
      violationType: form.violationType,
      description: form.description,
      violationDate: form.violationDate,
    });
  };

  const handleEdit = (v: any) => {
    setEditViolation(v);
    setEditForm({
      violationType: v.violationType || '',
      description: v.description || '',
      violationDate: v.violationDate || '',
      status: v.status || 'sent',
    });
  };

  const handleUpdate = () => {
    if (!editViolation) return;
    updateMutation.mutate({ id: editViolation.id, data: editForm });
  };

  const filtered = violations.filter((v: any) => {
    if (!searchTerm) return true;
    const name = `${v.employee?.firstName || ''} ${v.employee?.lastName || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || (v.violationType || '').includes(searchTerm);
  });

  const stats = {
    total: violations.length,
    sent: violations.filter((v: any) => v.status === 'sent').length,
    acknowledged: violations.filter((v: any) => v.status === 'acknowledged').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المخالفات والجزاءات</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'عرض وإدارة جميع المخالفات' : 'المخالفات التي أرسلتها'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 ms-2" />
          إنشاء مخالفة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المخالفات</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مُرسلة</p>
              <h3 className="text-2xl font-bold">{stats.sent}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تم الاستلام</p>
              <h3 className="text-2xl font-bold">{stats.acknowledged}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <User className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة المخالفات</CardTitle>
              <PrintButton title="قائمة المخالفات" />
              <CardDescription>{isAdmin ? 'جميع المخالفات في النظام' : 'المخالفات التي أرسلتها'}</CardDescription>
            </div>
            <input
              type="text"
              placeholder="بحث بالاسم أو النوع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {violationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">لا توجد مخالفات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>نوع المخالفة</TableHead>
                  <TableHead>المصدر</TableHead>
                  <TableHead>تاريخ المخالفة</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>أُرسلت بواسطة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      {v.employee ? `${v.employee.firstName} ${v.employee.lastName}` : '-'}
                    </TableCell>
                    <TableCell>{v.violationType || '-'}</TableCell>
                    <TableCell>
                      {v.source === 'auto'
                        ? <Badge className="bg-purple-100 text-purple-800 gap-1"><Bot className="h-3 w-3" />تلقائي</Badge>
                        : <Badge className="bg-gray-100 text-gray-700 gap-1"><UserCheck className="h-3 w-3" />يدوي</Badge>
                      }
                    </TableCell>
                    <TableCell>{v.violationDate ? formatDate(v.violationDate) : '-'}</TableCell>
                    <TableCell>{v.createdAt ? formatDate(v.createdAt) : '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{v.sentByName || '-'}</p>
                        {v.sentByRole && <p className="text-muted-foreground text-xs">{v.sentByRole}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[v.status] || 'bg-gray-100 text-gray-700'}>
                        {statusLabels[v.status] || v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewViolation(v)} title="عرض">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(v)} title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isWithinAppealWindow(v) && v.status !== 'appealed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            onClick={() => { setAppealId(v.id); setAppealReason(''); }}
                            title="استئناف (متاح لمدة 15 يوم)"
                          >
                            <MessageSquareWarning className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(v.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => {
        if (!o) {
          setShowCreate(false);
          setForm(emptyForm);
          setFilterBranchId('');
          setFilterDeptId('');
        }
      }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              إنشاء مخالفة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Branch + Dept filters — admin/GM only */}
            {isTopAdmin && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">تصفية بالفرع</Label>
                  <Select
                    value={filterBranchId}
                    onValueChange={(v) => {
                      setFilterBranchId(v);
                      setFilterDeptId('');
                      setForm({ ...form, employeeId: '' });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="جميع الفروع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
                      {(branches as any[]).map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">تصفية بالقسم</Label>
                  <Select
                    value={filterDeptId}
                    onValueChange={(v) => {
                      setFilterDeptId(v);
                      setForm({ ...form, employeeId: '' });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="جميع الأقسام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأقسام</SelectItem>
                      {(departments as any[]).map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>
                  {(employees as any[]).map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.firstName} {emp.lastName}
                      {emp.department ? ` — ${emp.department.nameAr || emp.department.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نوع المخالفة <span className="text-red-500">*</span></Label>
              <Select value={form.violationType} onValueChange={(v) => setForm({ ...form, violationType: v })}>
                <SelectTrigger><SelectValue placeholder="اختر نوع المخالفة" /></SelectTrigger>
                <SelectContent>
                  {VIOLATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ المخالفة <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.violationDate}
                onChange={(e) => setForm({ ...form, violationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف والتفاصيل</Label>
              <Textarea
                placeholder="اكتب تفاصيل المخالفة..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(emptyForm); }}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إرسال المخالفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewViolation} onOpenChange={(o) => { if (!o) setViewViolation(null); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المخالفة</DialogTitle>
          </DialogHeader>
          {viewViolation && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">الموظف</p>
                  <p className="font-semibold">
                    {viewViolation.employee
                      ? `${viewViolation.employee.firstName} ${viewViolation.employee.lastName}`
                      : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">نوع المخالفة</p>
                  <p className="font-semibold">{viewViolation.violationType || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">تاريخ المخالفة</p>
                  <p className="font-semibold">{viewViolation.violationDate ? formatDate(viewViolation.violationDate) : '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge className={statusColors[viewViolation.status] || 'bg-gray-100 text-gray-700'}>
                    {statusLabels[viewViolation.status] || viewViolation.status}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">أُرسلت بواسطة</p>
                  <p className="font-semibold">{viewViolation.sentByName || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-semibold">{viewViolation.createdAt ? formatDate(viewViolation.createdAt) : '-'}</p>
                </div>
              </div>
              {viewViolation.description && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                  <p className="text-sm">{viewViolation.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewViolation(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editViolation} onOpenChange={(o) => { if (!o) setEditViolation(null); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المخالفة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع المخالفة</Label>
              <Select value={editForm.violationType} onValueChange={(v) => setEditForm({ ...editForm, violationType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VIOLATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ المخالفة</Label>
              <Input
                type="date"
                value={editForm.violationDate}
                onChange={(e) => setEditForm({ ...editForm, violationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sent">مُرسلة</SelectItem>
                  <SelectItem value="acknowledged">تم الاستلام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setEditViolation(null)}>إلغاء</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appeal Dialog */}
      <Dialog open={appealId !== null} onOpenChange={(o) => { if (!o) { setAppealId(null); setAppealReason(''); } }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-amber-500" />
              تقديم استئناف على المخالفة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">يمكنك تقديم استئناف على هذه المخالفة خلال 15 يوماً من تاريخ إصدارها.</p>
            <div className="space-y-2">
              <Label>سبب الاستئناف <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="اكتب سبب الاستئناف بالتفصيل..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setAppealId(null); setAppealReason(''); }}>إلغاء</Button>
            <Button
              onClick={() => appealId && appealReason.trim() && appealMutation.mutate({ id: appealId, reason: appealReason })}
              disabled={!appealReason.trim() || appealMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {appealMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              تقديم الاستئناف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه المخالفة؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
