import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import {
  DollarSign,
  Download,
  Calculator,
  Wallet,
  TrendingUp,
  FileText,
  Plus,
  ArrowRight,
  Trash2,
  MinusCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, usePayroll, useCreatePayroll, useDeletePayroll, useBranches, useDepartments, usePayrollDeductions, useAddPayrollDeduction, useDeletePayrollDeduction } from '@/services/hrService';
import { useQueryClient } from '@tanstack/react-query';


interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  department?: string;
  branch?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  month: string;
  year: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
};

const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
  '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر',
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge className="bg-yellow-100 text-yellow-800">مسودة</Badge>;
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-800">معتمد</Badge>;
    case 'paid':
      return <Badge className="bg-green-100 text-green-800">تم الصرف</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = "list" | "new-payroll";

export default function Payroll() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState(2026);
  const [basicSalary, setBasicSalary] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

  const [filterBranchId, setFilterBranchId] = useState<string>('');
  const [filterDeptId, setFilterDeptId] = useState<string>('');

  const [detailsRecord, setDetailsRecord] = useState<PayrollRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [deductionForm, setDeductionForm] = useState({ reason: '', amount: '', type: 'absence' });
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calcMonth, setCalcMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [calcYear, setCalcYear] = useState(() => new Date().getFullYear());
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: employeesData } = useEmployees({ branchId: selectedBranchId });
  const employees = employeesData || [];
  const { data: branchesData } = useBranches();
  const branches = (branchesData || []).filter((b: any) => b.id);
  const { data: departmentsData } = useDepartments({ branchId: filterBranchId ? parseInt(filterBranchId) : null });
  const departments = departmentsData || [];
  const filteredEmployees = employees.filter((e: any) => {
    if (filterBranchId && String(e.branch?.id) !== filterBranchId) return false;
    if (filterDeptId && String(e.department?.id) !== filterDeptId) return false;
    return true;
  });

  const { data: payrollData, isLoading } = usePayroll(selectedBranchId || undefined);
  const records: PayrollRecord[] = (payrollData || []).map((p: any) => ({
    ...p,
    employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : `موظف #${p.employeeId}`,
    department: p.employee?.department?.nameAr || p.employee?.department?.name || '-',
    branch: p.employee?.branch?.nameAr || p.employee?.branch?.name || '-',
  }));

  const createPayrollMutation = useCreatePayroll();
  const deletePayrollMutation = useDeletePayroll();
  const { data: deductionsData, refetch: refetchDeductions } = usePayrollDeductions(detailsRecord?.id ?? null);
  const addDeductionMutation = useAddPayrollDeduction();
  const deleteDeductionMutation = useDeletePayrollDeduction();

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployee(empId);
    const emp = employees.find((e: any) => e.id.toString() === empId);
    if (emp) {
      setBasicSalary(emp.salary != null ? String(emp.salary) : '0');
      setHousingAllowance(emp.housingAllowance != null ? String(emp.housingAllowance) : '0');
      setTransportAllowance(emp.transportAllowance != null ? String(emp.transportAllowance) : '0');
      setOtherAllowances('');
      setDeductions('');
    }
  };

  const handleCreatePayroll = () => {
    if (!selectedEmployee) {
      toast.error('يرجى اختيار موظف');
      return;
    }
    createPayrollMutation.mutate({
      employeeId: parseInt(selectedEmployee),
      basicSalary: parseFloat(basicSalary) || 0,
      housingAllowance: parseFloat(housingAllowance) || 0,
      transportAllowance: parseFloat(transportAllowance) || 0,
      otherAllowances: parseFloat(otherAllowances) || 0,
      deductions: parseFloat(deductions) || 0,
      month,
      year,
      status: 'draft',
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء كشف الراتب بنجاح');
        queryClient.invalidateQueries({ queryKey: ['payroll'] });
        setViewMode("list");
        setSelectedEmployee('');
        setBasicSalary('');
        setHousingAllowance('');
        setTransportAllowance('');
        setOtherAllowances('');
        setDeductions('');
      },
      onError: (error: any) => {
        toast.error('فشل في إنشاء كشف الراتب: ' + error.message);
      },
    });
  };

  const handleDelete = (id: number) => {
    deletePayrollMutation.mutate(id, {
      onSuccess: () => {
        toast.success('تم حذف كشف الراتب بنجاح');
        setDeleteId(null);
      },
      onError: (error: any) => {
        toast.error('فشل في الحذف: ' + (error.response?.data?.message || error.message));
        setDeleteId(null);
      },
    });
  };

  const handleCalculateSalaries = async () => {
    const activeEmployees = employees.filter((e: any) => e.status === 'active' || e.status === 'Active');
    const alreadyCreated = new Set(
      records
        .filter((r) => r.month === calcMonth && r.year === calcYear)
        .map((r) => r.employeeId)
    );
    const toCreate = activeEmployees.filter((e: any) => !alreadyCreated.has(e.id) && (e.salary || e.housingAllowance || e.transportAllowance));
    if (toCreate.length === 0) {
      toast.info('جميع الموظفين لديهم كشف راتب لهذا الشهر بالفعل');
      setShowCalculateDialog(false);
      return;
    }
    setIsCalculating(true);
    let created = 0;
    for (const emp of toCreate) {
      try {
        await new Promise<void>((resolve, reject) => {
          createPayrollMutation.mutate({
            employeeId: emp.id,
            basicSalary: Number(emp.salary) || 0,
            housingAllowance: Number(emp.housingAllowance) || 0,
            transportAllowance: Number(emp.transportAllowance) || 0,
            otherAllowances: 0,
            deductions: 0,
            month: calcMonth,
            year: calcYear,
            status: 'draft',
          }, { onSuccess: () => { created++; resolve(); }, onError: () => resolve() });
        });
      } catch { /* continue */ }
    }
    setIsCalculating(false);
    setShowCalculateDialog(false);
    queryClient.invalidateQueries({ queryKey: ['payroll'] });
    toast.success(`تم إنشاء ${created} كشف راتب بنجاح`);
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.info('لا توجد سجلات للتصدير');
      return;
    }
    const headers = ['الموظف', 'الفرع', 'القسم', 'الراتب الأساسي', 'بدل السكن', 'بدل النقل', 'بدلات أخرى', 'الخصومات', 'صافي الراتب', 'الشهر', 'السنة', 'الحالة'];
    const rows = records.map((r) => [
      r.employeeName || '',
      r.branch || '',
      r.department || '',
      r.basicSalary || 0,
      r.housingAllowance || 0,
      r.transportAllowance || 0,
      r.otherAllowances || 0,
      r.deductions || 0,
      r.netSalary || 0,
      MONTH_NAMES[r.month] || r.month,
      r.year,
      r.status === 'draft' ? 'مسودة' : r.status === 'approved' ? 'معتمد' : 'تم الصرف',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${calcYear}_${calcMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح');
  };

  const totals = records.reduce((acc, r) => ({
    totalSalaries: acc.totalSalaries + (r.basicSalary || 0),
    totalAllowances: acc.totalAllowances + (r.housingAllowance || 0) + (r.transportAllowance || 0) + (r.otherAllowances || 0),
    totalDeductions: acc.totalDeductions + (r.deductions || 0),
    totalNet: acc.totalNet + (r.netSalary || 0),
  }), { totalSalaries: 0, totalAllowances: 0, totalDeductions: 0, totalNet: 0 });

  const columns: ColumnDef<PayrollRecord>[] = [
    { accessorKey: 'employeeName', header: 'الموظف' },
    { accessorKey: 'branch', header: 'الفرع' },
    { accessorKey: 'department', header: 'القسم' },
    {
      accessorKey: 'basicSalary',
      header: 'الراتب الأساسي',
      cell: ({ row }) => formatCurrency(row.original.basicSalary || 0),
    },
    {
      accessorKey: 'allowances',
      header: 'البدلات',
      cell: ({ row }) => {
        const total = (row.original.housingAllowance || 0) + (row.original.transportAllowance || 0) + (row.original.otherAllowances || 0);
        return <span className="text-green-600">{formatCurrency(total)}</span>;
      },
    },
    {
      accessorKey: 'deductions',
      header: 'الخصومات',
      cell: ({ row }) => <span className="text-red-600">{formatCurrency(row.original.deductions || 0)}</span>,
    },
    {
      accessorKey: 'netSalary',
      header: 'صافي الراتب',
      cell: ({ row }) => <span className="font-bold">{formatCurrency(row.original.netSalary || 0)}</span>,
    },
    {
      accessorKey: 'month',
      header: 'الشهر',
      cell: ({ row }) => `${MONTH_NAMES[row.original.month] || row.original.month} ${row.original.year}`,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            title="عرض التفاصيل"
            onClick={() => setDetailsRecord(row.original)}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            title="حذف"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const renderNewPayrollForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إنشاء كشف راتب جديد</h2>
          <p className="text-muted-foreground">أدخل بيانات كشف الراتب</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>بيانات كشف الراتب</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الفرع (تصفية)</Label>
                <Select value={filterBranchId} onValueChange={(v) => { const val = v === 'all' ? '' : v; setFilterBranchId(val); setFilterDeptId(''); setSelectedEmployee(''); }}>
                  <SelectTrigger><SelectValue placeholder="جميع الفروع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفروع</SelectItem>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nameAr || b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>القسم (تصفية)</Label>
                <Select value={filterDeptId} onValueChange={(v) => { setFilterDeptId(v === 'all' ? '' : v); setSelectedEmployee(''); }}>
                  <SelectTrigger><SelectValue placeholder="جميع الأقسام" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nameAr || d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الموظف</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MONTH_NAMES).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السنة</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYear(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">تفاصيل الراتب</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>بدلات أخرى</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخصومات</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>صافي الراتب (تلقائي)</Label>
                  <Input
                    readOnly
                    dir="ltr"
                    className="bg-gray-50 font-bold"
                    value={formatCurrency(
                      (parseFloat(basicSalary) || 0) +
                      (parseFloat(housingAllowance) || 0) +
                      (parseFloat(transportAllowance) || 0) +
                      (parseFloat(otherAllowances) || 0) -
                      (parseFloat(deductions) || 0)
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("list")}>إلغاء</Button>
              <Button onClick={handleCreatePayroll} disabled={createPayrollMutation.isPending}>
                {createPayrollMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء كشف الراتب'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الرواتب</h2>
          <p className="text-gray-500">كشوف الرواتب والمستحقات الشهرية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowCalculateDialog(true)}>
            <Calculator className="h-4 w-4" />
            احتساب الرواتب
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button className="gap-2" onClick={() => setViewMode("new-payroll")}>
            <Plus className="h-4 w-4" />
            كشف راتب جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50"><DollarSign className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalSalaries)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50"><TrendingUp className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي البدلات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalAllowances)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50"><Wallet className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalDeductions)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50"><DollarSign className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">صافي المستحقات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalNet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            كشوف الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              searchKey="employeeName"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد سجلات رواتب"
            />
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!detailsRecord} onOpenChange={(open) => { if (!open) { setDetailsRecord(null); setShowAddDeduction(false); setDeductionForm({ reason: '', amount: '', type: 'absence' }); } }}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل كشف الراتب
            </DialogTitle>
          </DialogHeader>
          {detailsRecord && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الموظف</span>
                  <span className="font-medium">{detailsRecord.employeeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الفرع</span>
                  <span className="font-medium">{detailsRecord.branch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">القسم</span>
                  <span className="font-medium">{detailsRecord.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الفترة</span>
                  <span className="font-medium">{MONTH_NAMES[detailsRecord.month] || detailsRecord.month} {detailsRecord.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">الحالة</span>
                  <span>{getStatusBadge(detailsRecord.status)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">تفاصيل الراتب</h4>
                <div className="border rounded-lg divide-y">
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">الراتب الأساسي</span>
                    <span className="font-medium">{formatCurrency(detailsRecord.basicSalary || 0)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">بدل السكن</span>
                    <span className="text-green-600">{formatCurrency(detailsRecord.housingAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">بدل النقل</span>
                    <span className="text-green-600">{formatCurrency(detailsRecord.transportAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">بدلات أخرى</span>
                    <span className="text-green-600">{formatCurrency(detailsRecord.otherAllowances || 0)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 text-sm">
                    <span className="text-gray-600">الخصومات</span>
                    <span className="text-red-600">({formatCurrency(detailsRecord.deductions || 0)})</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 font-bold bg-gray-50 rounded-b-lg">
                    <span>صافي الراتب</span>
                    <span className="text-primary">{formatCurrency(detailsRecord.netSalary || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Deduction Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                    <MinusCircle className="h-4 w-4 text-red-500" />
                    تفصيل الخصومات
                  </h4>
                  <Button size="sm" variant="outline" onClick={() => setShowAddDeduction(!showAddDeduction)}>
                    <Plus className="h-3 w-3 ms-1" />
                    إضافة خصم
                  </Button>
                </div>

                {showAddDeduction && (
                  <div className="border rounded-lg p-3 bg-red-50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">السبب</Label>
                        <Input
                          placeholder="غياب بدون عذر"
                          value={deductionForm.reason}
                          onChange={(e) => setDeductionForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">المبلغ (ريال)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={deductionForm.amount}
                          onChange={(e) => setDeductionForm(prev => ({ ...prev, amount: e.target.value }))}
                          className="h-8 text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">النوع</Label>
                      <Select value={deductionForm.type} onValueChange={(v) => setDeductionForm(prev => ({ ...prev, type: v }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="absence">غياب</SelectItem>
                          <SelectItem value="late">تأخر</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setShowAddDeduction(false)}>إلغاء</Button>
                      <Button
                        size="sm"
                        disabled={!deductionForm.reason || !deductionForm.amount || addDeductionMutation.isPending}
                        onClick={() => {
                          addDeductionMutation.mutate({
                            payrollRecordId: detailsRecord.id,
                            reason: deductionForm.reason,
                            amount: parseFloat(deductionForm.amount),
                            type: deductionForm.type,
                          }, {
                            onSuccess: () => {
                              toast.success('تم إضافة الخصم بنجاح');
                              setDeductionForm({ reason: '', amount: '', type: 'absence' });
                              setShowAddDeduction(false);
                              refetchDeductions();
                              // Update local record
                              setDetailsRecord(prev => prev ? {
                                ...prev,
                                deductions: (prev.deductions || 0) + parseFloat(deductionForm.amount),
                                netSalary: (prev.netSalary || 0) - parseFloat(deductionForm.amount),
                              } : null);
                            },
                            onError: () => toast.error('فشل إضافة الخصم'),
                          });
                        }}
                      >
                        حفظ الخصم
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {!deductionsData || (deductionsData as any[]).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">لا توجد خصومات مفصّلة</p>
                  ) : (
                    (deductionsData as any[]).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="text-gray-700">{d.reason}</span>
                          <span className="text-xs text-gray-400 ms-2">({d.type === 'absence' ? 'غياب' : d.type === 'late' ? 'تأخر' : 'أخرى'})</span>
                          {d.deductionDate && <span className="text-xs text-gray-400 ms-2">{d.deductionDate}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-medium">{formatCurrency(d.amount)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              deleteDeductionMutation.mutate(d.id, {
                                onSuccess: () => {
                                  toast.success('تم حذف الخصم');
                                  refetchDeductions();
                                  setDetailsRecord(prev => prev ? {
                                    ...prev,
                                    deductions: Math.max(0, (prev.deductions || 0) - d.amount),
                                    netSalary: (prev.netSalary || 0) + d.amount,
                                  } : null);
                                },
                                onError: () => toast.error('فشل حذف الخصم'),
                              });
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calculate Salaries Dialog */}
      <AlertDialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              احتساب الرواتب التلقائي
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنشاء كشوف راتب تلقائياً لجميع الموظفين النشطين الذين لا يملكون كشفاً لهذا الشهر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>الشهر</Label>
              <Select value={calcMonth} onValueChange={setCalcMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MONTH_NAMES).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السنة</Label>
              <Input
                type="number"
                value={calcYear}
                onChange={(e) => setCalcYear(parseInt(e.target.value))}
                dir="ltr"
              />
            </div>
          </div>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isCalculating}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCalculateSalaries} disabled={isCalculating}>
              {isCalculating ? 'جاري الاحتساب...' : 'احتساب'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف كشف الراتب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId !== null && handleDelete(deleteId)}
              disabled={deletePayrollMutation.isPending}
            >
              {deletePayrollMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  switch (viewMode) {
    case "new-payroll":
      return renderNewPayrollForm();
    default:
      return renderListView();
  }
}
