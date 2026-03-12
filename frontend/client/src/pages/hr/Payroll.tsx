import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Download,
  Calculator,
  Wallet,
  TrendingUp,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, usePayroll, useCreatePayroll } from '@/services/hrService';
import { useQueryClient } from '@tanstack/react-query';


interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  department?: string;
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
  const { selectedRole: userRole, selectedBranchId } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState(2026);

  // جلب قائمة الموظفين - مفلترة بالفرع الحالي
  const { data: employeesData } = useEmployees({ branchId: selectedBranchId });
  const employees = employeesData || [];

  // جلب كشوف الرواتب
  const { data: payrollData, isLoading } = usePayroll(selectedBranchId || undefined);
  const records: PayrollRecord[] = (payrollData || []).map((p: any) => ({
    ...p,
    employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : `موظف #${p.employeeId}`,
    department: p.employee?.department?.nameAr || p.employee?.department?.name || '-'
  }));

  // إنشاء كشف راتب جديد
  const createPayrollMutation = useCreatePayroll();

  const handleCreatePayroll = () => {
    if (!selectedEmployee) {
      toast.error('يرجى اختيار موظف');
      return;
    }

    const employee = employees.find((e: any) => e.id.toString() === selectedEmployee);
    if (!employee) return;

    createPayrollMutation.mutate({
      employeeId: parseInt(selectedEmployee),
      basicSalary: parseFloat(employee.salary) || 5000,
      housingAllowance: (parseFloat(employee.salary) || 5000) * 0.25,
      transportAllowance: 500,
      otherAllowances: 0,
      deductions: 0,
      month: month,
      year: year,
      status: 'draft'
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء كشف الراتب بنجاح');
        queryClient.invalidateQueries({ queryKey: ['payroll'] });
        setViewMode("list");
        setSelectedEmployee('');
      },
      onError: (error: any) => {
        toast.error('فشل في إنشاء كشف الراتب: ' + error.message);
      }
    });
  };

  // حساب الإجماليات
  const totals = records.reduce((acc, record) => ({
    totalSalaries: acc.totalSalaries + (record.basicSalary || 0),
    totalAllowances: acc.totalAllowances + (record.housingAllowance || 0) + (record.transportAllowance || 0) + (record.otherAllowances || 0),
    totalDeductions: acc.totalDeductions + (record.deductions || 0),
    totalNet: acc.totalNet + (record.netSalary || 0),
  }), { totalSalaries: 0, totalAllowances: 0, totalDeductions: 0, totalNet: 0 });

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      accessorKey: 'employeeName',
      header: 'الموظف',
    },
    {
      accessorKey: 'department',
      header: 'القسم',
    },
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
      }
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
      cell: ({ row }) => `${row.original.month}/${row.original.year}`,
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
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Render New Payroll Form
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
        <CardHeader>
          <CardTitle>بيانات كشف الراتب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">يناير</SelectItem>
                    <SelectItem value="02">فبراير</SelectItem>
                    <SelectItem value="03">مارس</SelectItem>
                    <SelectItem value="04">أبريل</SelectItem>
                    <SelectItem value="05">مايو</SelectItem>
                    <SelectItem value="06">يونيو</SelectItem>
                    <SelectItem value="07">يوليو</SelectItem>
                    <SelectItem value="08">أغسطس</SelectItem>
                    <SelectItem value="09">سبتمبر</SelectItem>
                    <SelectItem value="10">أكتوبر</SelectItem>
                    <SelectItem value="11">نوفمبر</SelectItem>
                    <SelectItem value="12">ديسمبر</SelectItem>
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
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("list")}>إلغاء</Button>
              <Button
                onClick={handleCreatePayroll}
                disabled={createPayrollMutation.isPending}
              >
                {createPayrollMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء كشف الراتب'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الرواتب</h2>
          <p className="text-gray-500">كشوف الرواتب والمستحقات الشهرية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calculator className="h-4 w-4" />
            احتساب الرواتب
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button className="gap-2" onClick={() => setViewMode("new-payroll")}>
            <Plus className="h-4 w-4" />
            كشف راتب جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalSalaries)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي البدلات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalAllowances)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <Wallet className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalDeductions)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">صافي المستحقات</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalNet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
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
    </div>
  );

  // Main render
  switch (viewMode) {
    case "new-payroll":
      return renderNewPayrollForm();
    default:
      return renderListView();
  }
}
