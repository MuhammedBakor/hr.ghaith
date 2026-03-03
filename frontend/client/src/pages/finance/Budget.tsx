import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PieChart,
  Plus,
  TrendingDown,
  DollarSign,
  Target,
  ArrowRight,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";


interface BudgetItem {
  id: number;
  name: string;
  department?: string | null;
  fiscalYear: number;
  plannedAmount: string;
  actualAmount?: string | null;
  status: string;
}

const formatCurrency = (amount: string | number | null | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(num);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
    case 'closed':
      return <Badge className="bg-red-100 text-red-800">مغلق</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = 'list' | 'add';

export default function Budget() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [totalAmount, setTotalAmount] = useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  const utils = trpc.useUtils();

  // جلب الميزانيات
  const { data: budgetsData, isLoading, isError, error } = trpc.finance.budgets.list.useQuery();
  const budgets: BudgetItem[] = budgetsData || [];

  // إنشاء ميزانية جديدة
  const createBudgetMutation = trpc.finance.budgets.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء الميزانية بنجاح');
      utils.finance.budgets.list.invalidate();
      setViewMode('list');
      resetForm();
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الميزانية: ' + error.message);
    },
  });

  const resetForm = () => {
    setName('');
    setDepartment('');
    setFiscalYear(new Date().getFullYear().toString());
    setTotalAmount('');
  };

  const handleSubmit = () => {
    if (!name || !totalAmount) {
      toast.error('يرجى إدخال اسم الميزانية والمبلغ');
      return;
    }

    createBudgetMutation.mutate({
      name: name,
      department: department || undefined,
      fiscalYear: parseInt(fiscalYear),
      plannedAmount: totalAmount,
    });
  };

  // حساب الإحصائيات
  const totals = {
    totalAllocated: budgets.reduce((sum, b) => sum + parseFloat(b.plannedAmount || '0'), 0),
    totalSpent: budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount || '0'), 0),
    totalRemaining: budgets.reduce((sum, b) => {
      const total = parseFloat(b.plannedAmount || '0');
      const spent = parseFloat(b.actualAmount || '0');
      return sum + (total - spent);
    }, 0),
    overallPercentage: budgets.length > 0
      ? Math.round((budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount || '0'), 0) /
        budgets.reduce((sum, b) => sum + parseFloat(b.plannedAmount || '0'), 0)) * 100) || 0
      : 0,
  };

  const columns: ColumnDef<BudgetItem>[] = [
    {
      accessorKey: 'name',
      header: 'اسم الميزانية',
    },
    {
      accessorKey: 'department',
      header: 'القسم',
      cell: ({ row }) => row.original.department || '-',
    },
    {
      accessorKey: 'fiscalYear',
      header: 'السنة المالية',
    },
    {
      accessorKey: 'totalAmount',
      header: 'المبلغ الإجمالي',
      cell: ({ row }) => formatCurrency(row.original.plannedAmount),
    },
    {
      accessorKey: 'spentAmount',
      header: 'المصروف',
      cell: ({ row }) => formatCurrency(row.original.actualAmount),
    },
    {
      accessorKey: 'remaining',
      header: 'المتبقي',
      cell: ({ row }) => {
        const total = parseFloat(row.original.plannedAmount || '0');
        const spent = parseFloat(row.original.actualAmount || '0');
        const remaining = total - spent;
        return (
          <span className={remaining < 0 ? 'text-red-600' : 'text-green-600'}>
            {formatCurrency(remaining)}
          </span>
        );
      },
    },
    {
      accessorKey: 'percentage',
      header: 'نسبة الاستهلاك',
      cell: ({ row }) => {
        const total = parseFloat(row.original.plannedAmount || '0');
        const spent = parseFloat(row.original.actualAmount || '0');
        const percentage = total > 0 ? Math.round((spent / (total || 1)) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(percentage, 100)}
              className={`w-20 h-2 ${percentage > 100 ? '[&>div]:bg-red-500' : percentage > 80 ? '[&>div]:bg-yellow-500' : ''}`}
            />
            <span className="text-sm">{percentage}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  // نموذج إنشاء ميزانية جديدة
  if (viewMode === 'add') {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء ميزانية جديدة</h1>
            <p className="text-gray-500">أدخل بيانات الميزانية الجديدة</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم الميزانية *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: ميزانية الموارد البشرية"
                />
              </div>
              <div className="space-y-2">
                <Label>القسم</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="مثال: الموارد البشرية"
                />
              </div>
              <div className="space-y-2">
                <Label>السنة المالية</Label>
                <Select value={fiscalYear} onValueChange={setFiscalYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ الإجمالي *</Label>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="مثال: 500000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createBudgetMutation.isPending}
              >
                {createBudgetMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الميزانية'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الميزانية</h2>
          <p className="text-gray-500">متابعة الميزانية السنوية والمصروفات</p>
        </div>
        <Button className="gap-2" onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4" />
          ميزانية جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalAllocated)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصروف</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalSpent)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المتبقي</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalRemaining)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نسبة الاستهلاك</p>
              <p className="text-xl font-bold">{totals.overallPercentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            تفاصيل الميزانية - {new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={budgets}
              searchKey="name"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد ميزانيات"
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
