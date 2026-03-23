import { formatDate, formatDateTime } from '@/lib/formatDate';
import React, { useState } from "react";
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Receipt,
  Plus,
  Download,
  TrendingUp,
  Wallet,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { financeService, Expense } from '@/services/financeService';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const formatCurrency = (amount: string | number | null | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(num);
};

const getCategoryBadge = (category: string | null | undefined) => {
  const categories: Record<string, { label: string; color: string }> = {
    travel: { label: 'سفر', color: 'bg-blue-100 text-blue-800' },
    office: { label: 'مكتبية', color: 'bg-green-100 text-green-800' },
    equipment: { label: 'معدات', color: 'bg-purple-100 text-purple-800' },
    marketing: { label: 'تسويق', color: 'bg-orange-100 text-orange-800' },
    utilities: { label: 'خدمات', color: 'bg-gray-100 text-gray-800' },
    other: { label: 'أخرى', color: 'bg-yellow-100 text-yellow-800' },
  };
  const c = categories[category || 'other'] || { label: category || 'أخرى', color: 'bg-gray-100 text-gray-800' };
  return <Badge className={c.color}>{c.label}</Badge>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
    case 'submitted':
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-800">معتمد</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Expenses() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "general_manager" || userRole === "finance_manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add'>('list');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [amount, setAmount] = useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  const queryClient = useQueryClient();

  // جلب المصروفات
  const { data: expenses = [], isLoading, isError, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => financeService.getExpenses(),
  });

  // إنشاء مصروف جديد
  const createExpenseMutation = useMutation({
    mutationFn: (data: Expense) => financeService.createExpense(data),
    onSuccess: () => {
      toast.success('تم إضافة المصروف بنجاح');
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setView('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إضافة المصروف: ' + error.message);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Expense }) => financeService.updateExpense(id, data),
    onSuccess: () => {
      toast.success('تم تحديث المصروف بنجاح');
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث المصروف: ' + error.message);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteExpense(id),
    onSuccess: () => {
      toast.success('تم حذف المصروف بنجاح');
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      toast.error('فشل في حذف المصروف: ' + error.message);
    },
  });

  const [detailItem, setDetailItem] = useState<Expense | null>(null);

  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleEditOpen = (expense: Expense) => {
    setEditItem(expense);
    setDescription(expense.description || '');
    setCategory(expense.category || 'other');
    setAmount(expense.amount?.toString() || '');
    setDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!amount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }
    if (editItem?.id) {
      updateExpenseMutation.mutate({
        id: editItem.id,
        data: { ...editItem, description, category, amount: parseFloat(amount) },
      });
      setDialogOpen(false);
      setEditItem(null);
      resetForm();
    }
  };

  const handleExport = () => {
    if (expenses.length === 0) {
      toast.error("لا توجد مصروفات للتصدير");
      return;
    }
    const statusLabels: Record<string, string> = {
      draft: "مسودة", pending: "قيد المراجعة", submitted: "قيد المراجعة",
      approved: "معتمد", rejected: "مرفوض", paid: "مدفوع",
    };
    const categoryLabels: Record<string, string> = {
      travel: "سفر", office: "مكتبية", equipment: "معدات",
      marketing: "تسويق", utilities: "خدمات", other: "أخرى",
    };
    const BOM = "\uFEFF";
    const header = ["الوصف", "التصنيف", "المبلغ", "التاريخ", "الحالة"];
    const rows = expenses.map(e => [
      e.description || "-",
      categoryLabels[e.category || "other"] || e.category || "-",
      parseFloat(e.amount?.toString() || "0").toFixed(2),
      e.expenseDate ? String(e.expenseDate).split("T")[0] : "-",
      statusLabels[e.status] || e.status,
    ]);
    const csv = BOM + [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `مصروفات_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير المصروفات بنجاح");
  };

  const resetForm = () => {
    setDescription('');
    setCategory('other');
    setAmount('');
  };

  const handleSubmit = () => {
    if (!amount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }

    createExpenseMutation.mutate({
      description: description || 'مصروف جديد',
      category: category,
      amount: parseFloat(amount),
      status: 'pending',
      expenseDate: new Date().toISOString(),
    });
  };

  const handleApprove = (id: number) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      updateExpenseMutation.mutate({
        id,
        data: { ...expense, status: 'approved' }
      });
    }
  };

  const handleReject = (id: number) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      updateExpenseMutation.mutate({
        id,
        data: { ...expense, status: 'rejected' }
      });
    }
  };

  // حساب الإحصائيات
  const totals = {
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0),
    pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0),
    approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0),
    thisMonth: expenses.reduce((sum, e) => sum + parseFloat(e.amount?.toString() || '0'), 0),
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: 'category',
      header: 'التصنيف',
      cell: ({ row }) => getCategoryBadge(row.original.category),
    },
    {
      accessorKey: 'amount',
      header: 'المبلغ',
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: 'expenseDate',
      header: 'التاريخ',
      cell: ({ row }) => row.original.expenseDate ? (typeof row.original.expenseDate === 'string' ? row.original.expenseDate.split('T')[0] : row.original.expenseDate.toLocaleDateString('ar-SA')) : '-',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.status === 'pending' && row.original.id && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600"
                onClick={() => handleApprove(row.original.id!)}
                title="اعتماد"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => handleReject(row.original.id!)}
                title="رفض"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDetailItem(row.original)}>
                <Eye className="ml-2 h-4 w-4" />
                عرض التفاصيل
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => handleEditOpen(row.original)}>
                  <Edit className="ml-2 h-4 w-4" />
                  تعديل
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => row.original.id && handleDelete(row.original.id)}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // عرض نموذج إضافة مصروف جديد
  if (view === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات: {(error as any)?.message}</div>;

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إضافة مصروف جديد</h2>
            <p className="text-gray-500">أدخل بيانات المصروف الجديد</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              بيانات المصروف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف المصروف..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">سفر</SelectItem>
                      <SelectItem value="office">مكتبية</SelectItem>
                      <SelectItem value="equipment">معدات</SelectItem>
                      <SelectItem value="marketing">تسويق</SelectItem>
                      <SelectItem value="utilities">خدمات</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مثال: 1500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? 'جاري الإضافة...' : 'إضافة المصروف'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة المصروفات
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المصروفات</h2>
          <p className="text-gray-500">تتبع وإدارة مصروفات المنظمة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button className="gap-2" onClick={() => setView('add')}>
            <Plus className="h-4 w-4" />
            مصروف جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Receipt className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-xl font-bold">{formatCurrency(totals.pending)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">معتمد</p>
              <p className="text-xl font-bold">{formatCurrency(totals.approved)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">هذا الشهر</p>
              <p className="text-xl font-bold">{formatCurrency(totals.thisMonth)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            سجل المصروفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={expenses}
              searchKey="description"
              searchPlaceholder="بحث بالوصف..."
              emptyMessage="لا توجد مصروفات"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog for Edit */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف المصروف..."
              />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">سفر</SelectItem>
                  <SelectItem value="office">مكتبية</SelectItem>
                  <SelectItem value="equipment">معدات</SelectItem>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="utilities">خدمات</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditItem(null); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleEditSubmit} disabled={updateExpenseMutation.isPending}>
              {updateExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Details */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المصروف</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="text-gray-500">الوصف:</span>
                <span className="font-medium">{detailItem.description || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التصنيف:</span>
                {getCategoryBadge(detailItem.category)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المبلغ:</span>
                <span className="font-bold text-primary">{formatCurrency(detailItem.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ:</span>
                <span>{detailItem.expenseDate ? String(detailItem.expenseDate).split("T")[0] : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الحالة:</span>
                {getStatusBadge(detailItem.status)}
              </div>
              {(detailItem as any).notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ملاحظات:</span>
                  <span>{(detailItem as any).notes}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailItem(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
