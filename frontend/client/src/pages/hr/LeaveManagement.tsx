import { formatDate } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  useLeaves,
  useEmployees,
  useCreateLeave,
  useDepartments,
  useApproveLeaveByDeptManager,
  useRejectLeaveByDeptManager,
  useApproveLeaveByHrManager,
  useRejectLeaveByHrManager,
  useApproveLeaveByGM,
  useRejectLeaveByGM,
  useCancelLeave,
  useLeaveBalances,
  useLeaveBalancesByEmployee,
  useSetLeaveBalance,
  useUpdateLeaveBalance,
  useDeleteLeaveBalance,
} from '@/services/hrService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Loader2, Search, ArrowRight, Building2, User, Users, Pencil, Trash2 } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

type ViewMode = 'list' | 'add' | 'balances';

export default function LeaveManagement() {
  const { selectedRole, currentEmployeeId, currentUserId } = useAppContext();

  const isEmployee = selectedRole === 'employee';
  const isDeptManager = selectedRole === 'department_manager' || selectedRole === 'supervisor';
  const isHrManager = selectedRole === 'hr_manager';
  const isGM = selectedRole === 'general_manager';
  const isAdmin = selectedRole === 'admin';

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [remarksModal, setRemarksModal] = useState<{ leaveId: number; action: string } | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [newLeave, setNewLeave] = useState({
    employeeId: 0,
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Balance management state
  const [balSearchTerm, setBalSearchTerm] = useState('');
  const [balDeptFilter, setBalDeptFilter] = useState<string>('all');
  const [showBalModal, setShowBalModal] = useState(false);
  const [balEditId, setBalEditId] = useState<number | null>(null);
  const [balForm, setBalForm] = useState({ employeeId: '', leaveType: 'annual', totalBalance: '' });

  const { data: leavesData, isLoading, isError } = useLeaves();
  const { data: employeesData } = useEmployees();
  const { data: departmentsData } = useDepartments();
  const { data: balancesData } = useLeaveBalances();
  const { data: myBalances } = useLeaveBalancesByEmployee(currentEmployeeId || 0);
  const setBalanceMut = useSetLeaveBalance();
  const updateBalanceMut = useUpdateLeaveBalance();
  const deleteBalanceMut = useDeleteLeaveBalance();

  const createLeaveMutation = useCreateLeave();
  const approveDeptMgr = useApproveLeaveByDeptManager();
  const rejectDeptMgr = useRejectLeaveByDeptManager();
  const approveHr = useApproveLeaveByHrManager();
  const rejectHr = useRejectLeaveByHrManager();
  const approveGm = useApproveLeaveByGM();
  const rejectGm = useRejectLeaveByGM();
  const cancelLeaveMut = useCancelLeave();

  const leaves = (leavesData || []) as any[];
  const employees = (employeesData || []) as any[];
  const departments = (departmentsData || []) as any[];

  const currentEmployee = employees.find((e: any) => e.id === currentEmployeeId);
  const currentDepartmentId = currentEmployee?.department?.id || currentEmployee?.departmentId;

  // Filter leaves based on role
  const getFilteredLeaves = () => {
    let filtered = leaves;

    // Role-based filtering
    if (isEmployee) {
      filtered = filtered.filter((l: any) => (l.employee?.id || l.employeeId) === currentEmployeeId);
    } else if (isDeptManager && currentDepartmentId) {
      filtered = filtered.filter((l: any) => {
        const empDeptId = l.employee?.department?.id || l.employee?.departmentId;
        return empDeptId === currentDepartmentId;
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((l: any) => {
        const name = l.employee ? `${l.employee.firstName} ${l.employee.lastName}`.toLowerCase() : '';
        const num = (l.employee?.employeeNumber || '').toLowerCase();
        return name.includes(term) || num.includes(term);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.status === statusFilter);
    }

    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.approvalStage === stageFilter);
    }

    // Department filter (for HR/GM/Admin)
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((l: any) => {
        const empDeptId = l.employee?.department?.id || l.employee?.departmentId;
        return String(empDeptId) === departmentFilter;
      });
    }

    return filtered;
  };

  const filteredLeaves = getFilteredLeaves();

  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة',
      unpaid: 'بدون راتب', maternity: 'أمومة', paternity: 'أبوة',
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">موافق عليه</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800">قيد المراجعة</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">ملغاة</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-800">بانتظار الموافقة</Badge>;
      case 'PENDING_DEPT_MANAGER': return <Badge className="bg-blue-100 text-blue-800">مدير القسم</Badge>;
      case 'PENDING_HR': return <Badge className="bg-purple-100 text-purple-800">الموارد البشرية</Badge>;
      case 'PENDING_GM': return <Badge className="bg-orange-100 text-orange-800">المدير العام</Badge>;
      case 'APPROVED': return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      default: return <Badge variant="outline">{stage}</Badge>;
    }
  };

  const handleApproval = (leaveId: number, action: string) => {
    setRemarksModal({ leaveId, action });
    setRemarksText('');
  };

  const executeApproval = () => {
    if (!remarksModal) return;
    const { leaveId, action } = remarksModal;
    const managerId = currentEmployeeId || currentUserId || 0;
    const remarks = remarksText || undefined;

    const onSuccess = () => {
      toast.success(action.includes('approve') ? 'تمت الموافقة بنجاح' : 'تم الرفض بنجاح');
      setRemarksModal(null);
    };
    const onError = (e: any) => toast.error(e?.response?.data?.error || e.message || 'حدث خطأ');

    switch (action) {
      case 'approve-dept': approveDeptMgr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
      case 'reject-dept': rejectDeptMgr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
      case 'approve-hr': approveHr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
      case 'reject-hr': rejectHr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
      case 'approve-gm': approveGm.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
      case 'reject-gm': rejectGm.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError }); break;
    }
  };

  const getActionButtons = (leave: any) => {
    const stage = leave.approvalStage;
    if (leave.status !== 'pending') return null;

    if (isEmployee && (leave.employee?.id || leave.employeeId) === currentEmployeeId) {
      return (
        <Button size="sm" variant="outline" className="text-gray-600"
          onClick={() => {
            if (!window.confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
            cancelLeaveMut.mutate({ id: leave.id, employeeId: currentEmployeeId! }, {
              onSuccess: () => toast.success('تم إلغاء الطلب'),
              onError: (e: any) => toast.error(e?.response?.data?.error || 'حدث خطأ'),
            });
          }}>
          إلغاء
        </Button>
      );
    }

    // Any of dept manager, HR manager, or GM can approve/reject directly when stage is PENDING
    if (stage === 'PENDING') {
      let approveAction = '';
      let rejectAction = '';

      if (isDeptManager || isAdmin) {
        approveAction = 'approve-dept';
        rejectAction = 'reject-dept';
      } else if (isHrManager) {
        approveAction = 'approve-hr';
        rejectAction = 'reject-hr';
      } else if (isGM) {
        approveAction = 'approve-gm';
        rejectAction = 'reject-gm';
      }

      if (approveAction) {
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApproval(leave.id, approveAction)}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleApproval(leave.id, rejectAction)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }

    return null;
  };

  const resetForm = () => {
    setNewLeave({ employeeId: 0, leaveType: 'annual', startDate: '', endDate: '', reason: '' });
  };

  const handleCreateLeave = () => {
    const empId = isEmployee ? currentEmployeeId : newLeave.employeeId;
    if (!empId || !newLeave.startDate || !newLeave.endDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createLeaveMutation.mutate({
      employeeId: empId,
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason || undefined,
    }, {
      onSuccess: () => {
        toast.success('تم تقديم طلب الإجازة بنجاح');
        setViewMode('list');
        resetForm();
      },
      onError: (e: any) => {
        const msg = e?.response?.data?.message || e.message || 'فشل في تقديم الطلب';
        toast.error(msg);
      },
    });
  };

  const stats = {
    total: filteredLeaves.length,
    pending: filteredLeaves.filter((l: any) => l.status === 'pending').length,
    approved: filteredLeaves.filter((l: any) => l.status === 'approved').length,
    rejected: filteredLeaves.filter((l: any) => l.status === 'rejected').length,
  };

  const getPageTitle = () => {
    if (isEmployee) return 'إجازاتي';
    if (isDeptManager) return 'إدارة إجازات القسم';
    if (isHrManager) return 'إدارة الإجازات - الموارد البشرية';
    if (isGM) return 'إدارة الإجازات - المدير العام';
    return 'إدارة الإجازات';
  };

  // Balance helpers
  const leaveTypeLabels: Record<string, string> = {
    annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', maternity: 'أمومة',
  };
  const leaveTypeColors: Record<string, string> = {
    annual: 'bg-blue-100 text-blue-800', sick: 'bg-red-100 text-red-800',
    emergency: 'bg-orange-100 text-orange-800', unpaid: 'bg-gray-100 text-gray-800', maternity: 'bg-pink-100 text-pink-800',
  };
  const canEditBalance = isHrManager || isAdmin;

  const closeBalModal = () => { setShowBalModal(false); setBalEditId(null); setBalForm({ employeeId: '', leaveType: 'annual', totalBalance: '' }); };
  const openBalNew = (employeeId?: number) => {
    setBalForm({ employeeId: employeeId ? String(employeeId) : '', leaveType: 'annual', totalBalance: '' });
    setBalEditId(null); setShowBalModal(true);
  };
  const handleBalEdit = (balance: any) => {
    setBalForm({ employeeId: String(balance.employee?.id || balance.employeeId), leaveType: balance.leaveType, totalBalance: String(balance.totalBalance) });
    setBalEditId(balance.id); setShowBalModal(true);
  };
  const handleBalSave = () => {
    if (!balForm.employeeId || !balForm.leaveType || !balForm.totalBalance) { toast.error('يرجى ملء جميع الحقول'); return; }
    if (balEditId) {
      updateBalanceMut.mutate({ id: balEditId, totalBalance: parseInt(balForm.totalBalance) }, {
        onSuccess: () => { toast.success('تم تحديث الرصيد بنجاح'); closeBalModal(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
      });
    } else {
      setBalanceMut.mutate({ employeeId: parseInt(balForm.employeeId), leaveType: balForm.leaveType, totalBalance: parseInt(balForm.totalBalance) }, {
        onSuccess: () => { toast.success('تم تعيين الرصيد بنجاح'); closeBalModal(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
      });
    }
  };
  const handleBalDelete = (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرصيد؟')) return;
    deleteBalanceMut.mutate(id, {
      onSuccess: () => toast.success('تم حذف الرصيد'),
      onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
    });
  };

  const getRoleBadge = (emp: any) => {
    const role = emp.user?.role || emp.role;
    const roleLabels: Record<string, string> = { OWNER: 'مالك', GENERAL_MANAGER: 'مدير عام', DEPARTEMENT_MANAGER: 'مدير قسم', SUPERVISOR: 'مشرف', EMPLOYEE: 'موظف', AGENT: 'مندوب' };
    return <Badge variant="outline" className="text-xs">{roleLabels[role] || role || 'موظف'}</Badge>;
  };

  // Balances view
  if (viewMode === 'balances') {
    const balances = (balancesData || []) as any[];
    const employeeMap = new Map(employees.map((e: any) => [e.id, e]));
    const employeeBalances = new Map<number, { employee: any; balances: any[] }>();
    balances.forEach((b: any) => {
      const empId = b.employee?.id || b.employeeId;
      if (!employeeBalances.has(empId)) {
        const emp = b.employee || employeeMap.get(empId) || { id: empId, firstName: 'موظف', lastName: `#${empId}` };
        employeeBalances.set(empId, { employee: emp, balances: [] });
      }
      employeeBalances.get(empId)!.balances.push(b);
    });
    employees.forEach((emp: any) => { if (!employeeBalances.has(emp.id)) employeeBalances.set(emp.id, { employee: emp, balances: [] }); });

    let empList = Array.from(employeeBalances.values());
    if (balDeptFilter && balDeptFilter !== 'all') {
      empList = empList.filter(item => String(item.employee?.department?.id || item.employee?.departmentId) === balDeptFilter);
    }
    if (balSearchTerm) {
      const term = balSearchTerm.toLowerCase();
      empList = empList.filter(item => {
        const name = `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.toLowerCase();
        return name.includes(term) || (item.employee.employeeNumber || '').toLowerCase().includes(term);
      });
    }
    empList.sort((a, b) => `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(`${b.employee.firstName} ${b.employee.lastName}`, 'ar'));

    const totalEmp = empList.length;
    const withBal = empList.filter(e => e.balances.length > 0).length;

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">ادارة رصيد اجازات الموظفيين</h1>
            <p className="text-muted-foreground">إدارة أرصدة الإجازات لجميع الموظفين</p>
          </div>
          {canEditBalance && (
            <Button className="gap-2" onClick={() => openBalNew()}>
              <Plus className="h-4 w-4" />
              تعيين رصيد جديد
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-50"><Users className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">إجمالي الموظفين</p><p className="text-2xl font-bold">{totalEmp}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50"><Calendar className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">لديهم رصيد</p><p className="text-2xl font-bold">{withBal}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-50"><Users className="h-6 w-6 text-red-600" /></div>
              <div><p className="text-sm text-muted-foreground">بدون رصيد</p><p className="text-2xl font-bold">{totalEmp - withBal}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="بحث بالاسم أو رقم الموظف..." value={balSearchTerm} onChange={(e) => setBalSearchTerm(e.target.value)} className="pr-10" />
              </div>
              <div className="w-full md:w-64">
                <Select value={balDeptFilter} onValueChange={setBalDeptFilter}>
                  <SelectTrigger><SelectValue placeholder="جميع الأقسام" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Balance Cards */}
        <div className="space-y-4">
          {empList.map(({ employee: emp, balances: empBalances }) => (
            <Card key={emp.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 md:w-80 bg-gray-50 border-b md:border-b-0 md:border-l">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-white border"><Users className="h-5 w-5 text-gray-500" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-xs text-gray-500">{emp.employeeNumber}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getRoleBadge(emp)}
                        {(emp.department?.nameAr || emp.department?.name) && (
                          <Badge variant="outline" className="text-xs"><Building2 className="h-3 w-3 ml-1" />{emp.department?.nameAr || emp.department?.name}</Badge>
                        )}
                      </div>
                      {emp.manager && <p className="text-xs text-gray-400 mt-1">المدير: {emp.manager.firstName} {emp.manager.lastName}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  {empBalances.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {empBalances.map((bal: any) => (
                        <div key={bal.id} className="border rounded-lg p-3 relative group">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={leaveTypeColors[bal.leaveType] || 'bg-gray-100 text-gray-800'}>{leaveTypeLabels[bal.leaveType] || bal.leaveType}</Badge>
                            {canEditBalance && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleBalEdit(bal)} className="text-blue-500 hover:text-blue-700 p-1"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => handleBalDelete(bal.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{bal.totalBalance - bal.usedBalance}</p>
                            <p className="text-xs text-gray-400">من {bal.totalBalance} يوم ({bal.usedBalance} مستخدم)</p>
                          </div>
                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${(bal.usedBalance / bal.totalBalance) > 0.8 ? 'bg-red-500' : (bal.usedBalance / bal.totalBalance) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, (bal.usedBalance / bal.totalBalance) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                      {canEditBalance && (
                        <button onClick={() => openBalNew(emp.id)} className="border border-dashed rounded-lg p-3 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
                          <Plus className="h-5 w-5 ml-1" />إضافة رصيد
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-sm">لم يتم تعيين رصيد إجازات</span>
                      {canEditBalance && (
                        <Button size="sm" variant="outline" onClick={() => openBalNew(emp.id)}><Plus className="h-4 w-4 ml-1" />تعيين رصيد</Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {empList.length === 0 && (
          <Card><CardContent className="p-8 text-center text-gray-400">لا توجد بيانات مطابقة للبحث</CardContent></Card>
        )}

        {/* Balance Modal */}
        {showBalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeBalModal}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" dir="rtl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{balEditId ? 'تعديل رصيد الإجازة' : 'تعيين رصيد إجازة جديد'}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الموظف</Label>
                  <Select value={balForm.employeeId} onValueChange={(v) => setBalForm({ ...balForm, employeeId: v })} disabled={!!balEditId}>
                    <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName} - {emp.department?.nameAr || emp.department?.name || ''} ({emp.employeeNumber})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع الإجازة</Label>
                  <Select value={balForm.leaveType} onValueChange={(v) => setBalForm({ ...balForm, leaveType: v })} disabled={!!balEditId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input type="number" min="0" placeholder="أدخل عدد الأيام" value={balForm.totalBalance} onChange={(e) => setBalForm({ ...balForm, totalBalance: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={closeBalModal}>إلغاء</Button>
                <Button onClick={handleBalSave} disabled={setBalanceMut.isPending || updateBalanceMut.isPending}>
                  {(setBalanceMut.isPending || updateBalanceMut.isPending) ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add form
  if (viewMode === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">طلب إجازة جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات طلب الإجازة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              بيانات الإجازة
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!isEmployee && (
                <div className="space-y-2">
                  <Label>الموظف *</Label>
                  <Select value={newLeave.employeeId.toString()} onValueChange={(v) => setNewLeave({ ...newLeave, employeeId: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName} - {emp.department?.nameAr || emp.department?.name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الإجازة</Label>
                  <Select value={newLeave.leaveType} onValueChange={(v) => setNewLeave({ ...newLeave, leaveType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>السبب</Label>
                  <Input value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="سبب الإجازة" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من تاريخ *</Label>
                  <Input type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ *</Label>
                  <Input type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>إلغاء</Button>
              <Button onClick={handleCreateLeave} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin ms-2" /> جاري التقديم...</>
                ) : (
                  <><Plus className="h-4 w-4 ms-2" /> تقديم الطلب</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{getPageTitle()}</h2>
          <p className="text-muted-foreground">
            {isEmployee ? 'عرض وإدارة طلبات إجازاتك' : 'مراجعة والموافقة على طلبات الإجازات'}
          </p>
        </div>
        <div className="flex gap-2">
          {(isHrManager || isAdmin || isGM) && (
            <Button variant="outline" onClick={() => setViewMode('balances')}>
              <Users className="h-4 w-4 ms-2" />
              ادارة رصيد اجازات الموظفيين
            </Button>
          )}
          {isEmployee && (
            <Button onClick={() => setViewMode('add')}>
              <Plus className="h-4 w-4 ms-2" />
              طلب إجازة
            </Button>
          )}
        </div>
      </div>

      {/* Approval flow info */}
      {!isEmployee && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-semibold">مسار الموافقة:</span>
              <span>الموظف يقدم الطلب</span>
              <ArrowRight className="h-3 w-3 rotate-180" />
              <span className="text-green-600 font-medium">
                أي من (مدير القسم / الموارد البشرية / المدير العام) يوافق أو يرفض مباشرة
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Balance Cards */}
      {isEmployee && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(myBalances as any[] || []).length > 0 ? (
            (myBalances as any[]).map((b: any) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {{ annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', maternity: 'أمومة' }[b.leaveType as string] || b.leaveType}
                      </p>
                      <p className="text-2xl font-bold text-green-600">{b.totalBalance - b.usedBalance}</p>
                      <p className="text-xs text-gray-400">من {b.totalBalance} يوم ({b.usedBalance} مستخدم)</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-4 text-center text-gray-500">
                لم يتم تعيين رصيد إجازات لك بعد. الرجاء مراجعة قسم الموارد البشرية.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50"><Calendar className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50"><Clock className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">موافق عليها</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50"><XCircle className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">مرفوضة</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالموظف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pe-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">موافق عليها</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
            {!isEmployee && (
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="مرحلة الموافقة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراحل</SelectItem>
                  <SelectItem value="PENDING">بانتظار الموافقة</SelectItem>
                  <SelectItem value="APPROVED">مكتمل</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            )}
            {(isHrManager || isGM || isAdmin) && (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="القسم" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departments.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            طلبات الإجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد طلبات إجازات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!isEmployee && <TableHead className="text-end">الموظف</TableHead>}
                  {!isEmployee && <TableHead className="text-end">القسم</TableHead>}
                  {!isEmployee && <TableHead className="text-end">المنصب</TableHead>}
                  <TableHead className="text-end">نوع الإجازة</TableHead>
                  <TableHead className="text-end">من</TableHead>
                  <TableHead className="text-end">إلى</TableHead>
                  <TableHead className="text-end">الأيام</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">المرحلة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    {!isEmployee && (
                      <TableCell className="font-medium">
                        <div>
                          {leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '-'}
                          <div className="text-xs text-gray-400">{leave.employee?.employeeNumber}</div>
                        </div>
                      </TableCell>
                    )}
                    {!isEmployee && (
                      <TableCell>{leave.employee?.department?.nameAr || leave.employee?.department?.name || '-'}</TableCell>
                    )}
                    {!isEmployee && (
                      <TableCell>{leave.employee?.position?.title || '-'}</TableCell>
                    )}
                    <TableCell>{getLeaveTypeName(leave.leaveType)}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{leave.daysCount || '-'}</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>{getStageBadge(leave.approvalStage)}</TableCell>
                    <TableCell>{getActionButtons(leave)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remarks Modal */}
      {remarksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setRemarksModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">
              {remarksModal.action.includes('approve') ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  placeholder="أدخل ملاحظاتك..."
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setRemarksModal(null)}>إلغاء</Button>
              <Button
                onClick={executeApproval}
                className={remarksModal.action.includes('approve') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {remarksModal.action.includes('approve') ? 'موافقة' : 'رفض'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
