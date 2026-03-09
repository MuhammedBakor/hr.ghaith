import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  Search,
} from 'lucide-react';
import {
  useEmployees,
  useLeaveBalances,
  useSetLeaveBalance,
  useUpdateLeaveBalance,
  useDeleteLeaveBalance,
  useDepartments,
} from '@/services/hrService';
import { toast } from 'sonner';

const leaveTypeLabels: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  emergency: 'طارئة',
  unpaid: 'بدون راتب',
  maternity: 'أمومة',
};

const leaveTypeColors: Record<string, string> = {
  annual: 'bg-blue-100 text-blue-800',
  sick: 'bg-red-100 text-red-800',
  emergency: 'bg-orange-100 text-orange-800',
  unpaid: 'bg-gray-100 text-gray-800',
  maternity: 'bg-pink-100 text-pink-800',
};

export default function LeaveBalancesPage() {
  const { selectedRole } = useAppContext();
  const isHr = selectedRole === 'hr_manager' || selectedRole === 'admin';
  const isGM = selectedRole === 'general_manager';
  const isDeptManager = selectedRole === 'department_manager' || selectedRole === 'supervisor';
  const canEdit = isHr || selectedRole === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    leaveType: 'annual',
    totalBalance: '',
  });

  const { data: balancesData, isLoading: loadingBalances } = useLeaveBalances();
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees();
  const { data: departmentsData } = useDepartments();

  const setBalanceMut = useSetLeaveBalance();
  const updateBalanceMut = useUpdateLeaveBalance();
  const deleteBalanceMut = useDeleteLeaveBalance();

  const balances = (balancesData || []) as any[];
  const employees = (employeesData || []) as any[];
  const departments = (departmentsData || []) as any[];

  // Build a map of employees for quick lookup
  const employeeMap = new Map(employees.map((e: any) => [e.id, e]));

  // Group balances by employee
  const employeeBalances = new Map<number, { employee: any; balances: any[] }>();
  balances.forEach((b: any) => {
    const empId = b.employee?.id || b.employeeId;
    if (!employeeBalances.has(empId)) {
      const emp = b.employee || employeeMap.get(empId) || { id: empId, firstName: 'موظف', lastName: `#${empId}` };
      employeeBalances.set(empId, { employee: emp, balances: [] });
    }
    employeeBalances.get(empId)!.balances.push(b);
  });

  // Also add employees without balances
  employees.forEach((emp: any) => {
    if (!employeeBalances.has(emp.id)) {
      employeeBalances.set(emp.id, { employee: emp, balances: [] });
    }
  });

  // Convert to array and filter
  let employeeList = Array.from(employeeBalances.values());

  // Filter by department
  if (filterDepartment && filterDepartment !== 'all') {
    employeeList = employeeList.filter(item => {
      const deptId = item.employee?.department?.id || item.employee?.departmentId;
      return String(deptId) === filterDepartment;
    });
  }

  // Filter by search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    employeeList = employeeList.filter(item => {
      const emp = item.employee;
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const num = (emp.employeeNumber || '').toLowerCase();
      return name.includes(term) || num.includes(term);
    });
  }

  // Sort by employee name
  employeeList.sort((a, b) => {
    const nameA = `${a.employee.firstName} ${a.employee.lastName}`;
    const nameB = `${b.employee.firstName} ${b.employee.lastName}`;
    return nameA.localeCompare(nameB, 'ar');
  });

  const handleSave = () => {
    if (!form.employeeId || !form.leaveType || !form.totalBalance) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (editId) {
      updateBalanceMut.mutate({ id: editId, totalBalance: parseInt(form.totalBalance) }, {
        onSuccess: () => {
          toast.success('تم تحديث الرصيد بنجاح');
          closeModal();
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
      });
    } else {
      setBalanceMut.mutate({
        employeeId: parseInt(form.employeeId),
        leaveType: form.leaveType,
        totalBalance: parseInt(form.totalBalance),
      }, {
        onSuccess: () => {
          toast.success('تم تعيين الرصيد بنجاح');
          closeModal();
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرصيد؟')) return;
    deleteBalanceMut.mutate(id, {
      onSuccess: () => toast.success('تم حذف الرصيد'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
    });
  };

  const handleEdit = (balance: any) => {
    setForm({
      employeeId: String(balance.employee?.id || balance.employeeId),
      leaveType: balance.leaveType,
      totalBalance: String(balance.totalBalance),
    });
    setEditId(balance.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ employeeId: '', leaveType: 'annual', totalBalance: '' });
  };

  const openNew = (employeeId?: number) => {
    setForm({
      employeeId: employeeId ? String(employeeId) : '',
      leaveType: 'annual',
      totalBalance: '',
    });
    setEditId(null);
    setShowModal(true);
  };

  // Stats
  const totalEmployees = employeeList.length;
  const employeesWithBalance = employeeList.filter(e => e.balances.length > 0).length;
  const employeesWithoutBalance = totalEmployees - employeesWithBalance;

  const getRoleBadge = (emp: any) => {
    const role = emp.user?.role || emp.role;
    const roleLabels: Record<string, string> = {
      OWNER: 'مالك',
      GENERAL_MANAGER: 'مدير عام',
      DEPARTEMENT_MANAGER: 'مدير قسم',
      SUPERVISOR: 'مشرف',
      EMPLOYEE: 'موظف',
      AGENT: 'مندوب',
    };
    return <Badge variant="outline" className="text-xs">{roleLabels[role] || role || 'موظف'}</Badge>;
  };

  if (loadingBalances || loadingEmployees) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 p-1" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة أرصدة الإجازات</h2>
          <p className="text-gray-500">
            {isHr ? 'إدارة أرصدة الإجازات لجميع الموظفين' :
             isDeptManager ? 'عرض أرصدة إجازات موظفي القسم' :
             'عرض أرصدة الإجازات'}
          </p>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => openNew()}>
            <Plus className="h-4 w-4" />
            تعيين رصيد جديد
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
              <p className="text-2xl font-bold">{totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">لديهم رصيد</p>
              <p className="text-2xl font-bold">{employeesWithBalance}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">بدون رصيد</p>
              <p className="text-2xl font-bold">{employeesWithoutBalance}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.nameAr || dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Balance Cards */}
      <div className="space-y-4">
        {employeeList.map(({ employee: emp, balances: empBalances }) => (
          <Card key={emp.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Employee Info */}
              <div className="p-4 md:w-80 bg-gray-50 border-b md:border-b-0 md:border-l">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white border">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-xs text-gray-500">{emp.employeeNumber}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getRoleBadge(emp)}
                      {(emp.department?.nameAr || emp.department?.name) && (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 ml-1" />
                          {emp.department?.nameAr || emp.department?.name}
                        </Badge>
                      )}
                    </div>
                    {emp.position && (
                      <p className="text-xs text-gray-400 mt-1">{emp.position?.title || emp.position}</p>
                    )}
                    {emp.manager && (
                      <p className="text-xs text-gray-400 mt-1">
                        المدير: {emp.manager.firstName} {emp.manager.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="flex-1 p-4">
                {empBalances.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {empBalances.map((bal: any) => (
                      <div key={bal.id} className="border rounded-lg p-3 relative group">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={leaveTypeColors[bal.leaveType] || 'bg-gray-100 text-gray-800'}>
                            {leaveTypeLabels[bal.leaveType] || bal.leaveType}
                          </Badge>
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(bal)} className="text-blue-500 hover:text-blue-700 p-1">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDelete(bal.id)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {bal.totalBalance - bal.usedBalance}
                          </p>
                          <p className="text-xs text-gray-400">
                            من {bal.totalBalance} يوم ({bal.usedBalance} مستخدم)
                          </p>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (bal.usedBalance / bal.totalBalance) > 0.8 ? 'bg-red-500' :
                              (bal.usedBalance / bal.totalBalance) > 0.5 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (bal.usedBalance / bal.totalBalance) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {canEdit && (
                      <button
                        onClick={() => openNew(emp.id)}
                        className="border border-dashed rounded-lg p-3 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="h-5 w-5 ml-1" />
                        إضافة رصيد
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-sm">لم يتم تعيين رصيد إجازات</span>
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => openNew(emp.id)}>
                        <Plus className="h-4 w-4 ml-1" />
                        تعيين رصيد
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {employeeList.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-400">
            لا توجد بيانات مطابقة للبحث
          </CardContent>
        </Card>
      )}

      {/* Modal for adding/editing balance */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editId ? 'تعديل رصيد الإجازة' : 'تعيين رصيد إجازة جديد'}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الموظف</Label>
                <Select
                  value={form.employeeId}
                  onValueChange={(v) => setForm({ ...form, employeeId: v })}
                  disabled={!!editId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName} {emp.lastName} - {emp.department?.nameAr || emp.department?.name || ''} ({emp.employeeNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع الإجازة</Label>
                <Select
                  value={form.leaveType}
                  onValueChange={(v) => setForm({ ...form, leaveType: v })}
                  disabled={!!editId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">سنوية</SelectItem>
                    <SelectItem value="sick">مرضية</SelectItem>
                    <SelectItem value="emergency">طارئة</SelectItem>
                    <SelectItem value="unpaid">بدون راتب</SelectItem>
                    <SelectItem value="maternity">أمومة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>إجمالي الرصيد (أيام)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="أدخل عدد الأيام"
                  value={form.totalBalance}
                  onChange={(e) => setForm({ ...form, totalBalance: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeModal}>إلغاء</Button>
              <Button
                onClick={handleSave}
                disabled={setBalanceMut.isPending || updateBalanceMut.isPending}
              >
                {(setBalanceMut.isPending || updateBalanceMut.isPending) ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
