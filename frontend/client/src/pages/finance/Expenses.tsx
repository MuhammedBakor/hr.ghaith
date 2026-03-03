import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { Dialog } from "@/components/ui/dialog";


interface Expense {
  id: number;
  description?: string | null;
  category?: string | null;
  amount: string;
  expenseDate?: Date | null;
  employeeId?: number | null;
  status: string;
}

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
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add'>('list');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [amount, setAmount] = useState('');
  
  const utils = trpc.useUtils();

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);
  
  // جلب المصروفات
  const { data: expensesData, isLoading, isError, error} = trpc.financeExtended.expenses.list.useQuery({
    branchId: selectedBranchId || undefined,
  });
  const expenses: Expense[] = expensesData || [];
  
  // إنشاء مصروف جديد
  const createExpenseMutation = trpc.financeExtended.expenses.create.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة المصروف بنجاح');
      utils.financeExtended.expenses.list.invalidate();
      setView('list');
      resetForm();
    },
    onError: (error: { message: string }) => {
      toast.error('فشل في إضافة المصروف: ' + error.message);
    },
  });
  
  // اعتماد/رفض المصروف
  const updateExpenseMutation = trpc.financeExtended.expenses.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث حالة المصروف');
      utils.financeExtended.expenses.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error('فشل في تحديث المصروف: ' + error.message);
    },
  });
  
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
      amount: amount,
      expenseDate: new Date(),
    });
  };
  
  // حساب الإحصائيات
  const totals = {
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0),
    pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0),
    approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0),
    thisMonth: expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0),
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
      cell: ({ row }) => row.original.expenseDate ? formatDate(row.original.expenseDate) : '-',
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
          {row.original.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-green-600"
                onClick={() => updateExpenseMutation.mutate({ id: row.original.id, status: 'approved' })}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600"
                onClick={() => updateExpenseMutation.mutate({ id: row.original.id, status: 'rejected' })}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // عرض نموذج إضافة مصروف جديد
  if (view === 'add') {
    
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
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
          <Button variant="outline" className="gap-2">
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
    
      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
