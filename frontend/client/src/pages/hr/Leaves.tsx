import { formatDate } from '@/lib/formatDate';
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Hourglass,
  ArrowRight,
  User,
  Building2,
  Clock,
  Ban
} from 'lucide-react';
import {
  useLeaves,
  useCreateLeave,
  useLeavesByEmployee,
  useEmployees,
  useLeaveBalancesByEmployee,
  useApproveLeaveByDeptManager,
  useRejectLeaveByDeptManager,
  useApproveLeaveByHrManager,
  useRejectLeaveByHrManager,
  useApproveLeaveByGM,
  useRejectLeaveByGM,
  useCancelLeave,
  useEmployeeLeaveStats,
} from '@/services/hrService';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from '@/contexts/AppContext';

const getLeaveTypeBadge = (type: string) => {
  const types: Record<string, { label: string; color: string }> = {
    annual: { label: 'سنوية', color: 'bg-blue-100 text-blue-800' },
    sick: { label: 'مرضية', color: 'bg-red-100 text-red-800' },
    emergency: { label: 'طارئة', color: 'bg-orange-100 text-orange-800' },
    unpaid: { label: 'بدون راتب', color: 'bg-gray-100 text-gray-800' },
    maternity: { label: 'أمومة', color: 'bg-pink-100 text-pink-800' },
  };
  const t = types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  return <Badge className={t.color}>{t.label}</Badge>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">موافق عليها</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">مرفوضة</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800">ملغاة</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getApprovalStageBadge = (stage: string) => {
  switch (stage) {
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-800">بانتظار الموافقة</Badge>;
    case 'PENDING_DEPT_MANAGER':
      return <Badge className="bg-blue-100 text-blue-800">بانتظار مدير القسم</Badge>;
    case 'PENDING_HR':
      return <Badge className="bg-purple-100 text-purple-800">بانتظار الموارد البشرية</Badge>;
    case 'PENDING_GM':
      return <Badge className="bg-orange-100 text-orange-800">بانتظار المدير العام</Badge>;
    case 'APPROVED':
      return <Badge className="bg-green-100 text-green-800">تمت الموافقة النهائية</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
    default:
      return <Badge variant="outline">{stage}</Badge>;
  }
};

type ViewMode = "list" | "new-leave";

export default function Leaves() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [remarksModal, setRemarksModal] = useState<{ leaveId: number; action: string } | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    leaveType: 'annual' as const,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { selectedRole, currentEmployeeId, currentUserId } = useAppContext();

  // Determine the user's role capabilities
  const isEmployee = selectedRole === 'employee';
  const isDeptManager = selectedRole === 'department_manager' || selectedRole === 'supervisor';
  const isHrManager = selectedRole === 'hr_manager';
  const isGM = selectedRole === 'general_manager';
  const isAdmin = selectedRole === 'admin';
  const canApprove = isDeptManager || isHrManager || isGM || isAdmin;

  // Fetch data
  const { data: allLeavesData, isLoading: loadingAll } = useLeaves();
  const { data: myLeavesData, isLoading: loadingMy } = useLeavesByEmployee(currentEmployeeId || 0);
  const { data: employeesData } = useEmployees();
  const { data: myBalances } = useLeaveBalancesByEmployee(currentEmployeeId || 0);
  const { data: myStats } = useEmployeeLeaveStats(currentEmployeeId || 0);

  // Mutations
  const createLeaveMutation = useCreateLeave();
  const approveDeptMgr = useApproveLeaveByDeptManager();
  const rejectDeptMgr = useRejectLeaveByDeptManager();
  const approveHr = useApproveLeaveByHrManager();
  const rejectHr = useRejectLeaveByHrManager();
  const approveGm = useApproveLeaveByGM();
  const rejectGm = useRejectLeaveByGM();
  const cancelLeave = useCancelLeave();

  // Get current employee data
  const currentEmployee = employeesData?.find((e: any) => e.id === currentEmployeeId);
  const currentDepartmentId = currentEmployee?.department?.id || currentEmployee?.departmentId;

  // Determine which leaves to show based on role
  const getLeavesForRole = () => {
    const allLeaves = allLeavesData || [];

    if (isEmployee) {
      return myLeavesData || [];
    }
    if (isDeptManager && currentDepartmentId) {
      // Show leaves from employees in the same department
      return allLeaves.filter((l: any) => {
        const empDeptId = l.employee?.department?.id || l.employee?.departmentId;
        return empDeptId === currentDepartmentId;
      });
    }
    // HR, GM, Admin see all
    return allLeaves;
  };

  const leavesData = getLeavesForRole();
  const loading = loadingAll || loadingMy;

  // Handle approval actions
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
      setRemarksText('');
    };
    const onError = (e: any) => toast.error(e?.response?.data?.error || e.message || "حدث خطأ");

    switch (action) {
      case 'approve-dept':
        approveDeptMgr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
      case 'reject-dept':
        rejectDeptMgr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
      case 'approve-hr':
        approveHr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
      case 'reject-hr':
        rejectHr.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
      case 'approve-gm':
        approveGm.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
      case 'reject-gm':
        rejectGm.mutate({ id: leaveId, managerId, remarks }, { onSuccess, onError });
        break;
    }
  };

  const handleCancel = (leaveId: number) => {
    if (!currentEmployeeId) return;
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    cancelLeave.mutate({ id: leaveId, employeeId: currentEmployeeId }, {
      onSuccess: () => toast.success('تم إلغاء الطلب'),
      onError: (e: any) => toast.error(e?.response?.data?.error || e.message || "حدث خطأ"),
    });
  };

  const handleCreateLeave = () => {
    const empId = isEmployee ? currentEmployeeId : parseInt(newLeave.employeeId);
    if (!empId || !newLeave.startDate || !newLeave.endDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createLeaveMutation.mutate({
      employeeId: empId,
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason,
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء طلب الإجازة بنجاح');
        setViewMode("list");
        setNewLeave({ employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      },
      onError: (e: any) => {
        const msg = e?.response?.data?.message || e.message || "حدث خطأ";
        toast.error(msg);
      }
    });
  };

  // Map leave data for the table
  const requests = (leavesData || []).map((leave: any) => ({
    id: leave.id,
    employeeId: leave.employee?.id || leave.employeeId,
    employeeName: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : `موظف #${leave.employeeId}`,
    employeeNumber: leave.employee?.employeeNumber || '',
    departmentName: leave.employee?.department?.nameAr || leave.employee?.department?.name || '-',
    positionTitle: leave.employee?.position?.title || '-',
    managerName: leave.employee?.manager ? `${leave.employee.manager.firstName} ${leave.employee.manager.lastName}` : '-',
    leaveType: leave.leaveType || 'annual',
    startDate: leave.startDate,
    endDate: leave.endDate,
    daysCount: leave.daysCount || Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    status: leave.status || 'pending',
    approvalStage: leave.approvalStage || 'PENDING',
    reason: leave.reason || '',
    deptManagerRemarks: leave.deptManagerRemarks,
    hrManagerRemarks: leave.hrManagerRemarks,
    gmRemarks: leave.gmRemarks,
  }));

  // Stats
  const stats = {
    pending: requests.filter((r: any) => r.status === 'pending').length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    rejected: requests.filter((r: any) => r.status === 'rejected').length,
  };

  // Get action buttons based on role and approval stage
  const getActionButtons = (row: any) => {
    const stage = row.approvalStage;
    const status = row.status;

    if (status !== 'pending') return null;

    // Employee can only cancel
    if (isEmployee && row.employeeId === currentEmployeeId) {
      return (
        <Button size="sm" variant="outline" className="text-gray-600" onClick={() => handleCancel(row.id)}>
          <Ban className="h-4 w-4 ml-1" /> إلغاء
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
            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700"
              onClick={() => handleApproval(row.id, approveAction)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
              onClick={() => handleApproval(row.id, rejectAction)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }

    return null;
  };

  // Table columns
  const columns: ColumnDef<any>[] = [
    ...(isEmployee ? [] : [
      {
        accessorKey: 'employeeName',
        header: 'الموظف',
        cell: ({ row }: any) => (
          <div>
            <div className="font-medium">{row.original.employeeName}</div>
            <div className="text-xs text-gray-500">{row.original.employeeNumber}</div>
          </div>
        ),
      } as ColumnDef<any>,
      {
        accessorKey: 'departmentName',
        header: 'القسم',
      } as ColumnDef<any>,
      {
        accessorKey: 'positionTitle',
        header: 'المنصب',
      } as ColumnDef<any>,
    ]),
    {
      accessorKey: 'leaveType',
      header: 'نوع الإجازة',
      cell: ({ row }: any) => getLeaveTypeBadge(row.original.leaveType),
    },
    {
      accessorKey: 'startDate',
      header: 'من تاريخ',
      cell: ({ row }: any) => formatDate(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'إلى تاريخ',
      cell: ({ row }: any) => formatDate(row.original.endDate),
    },
    {
      accessorKey: 'daysCount',
      header: 'عدد الأيام',
      cell: ({ row }: any) => `${row.original.daysCount} يوم`,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'approvalStage',
      header: 'مرحلة الموافقة',
      cell: ({ row }: any) => getApprovalStageBadge(row.original.approvalStage),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      enableSorting: false,
      cell: ({ row }: any) => getActionButtons(row.original),
    },
  ];

  // Employee balance cards
  const renderBalanceCards = () => {
    if (!isEmployee || !myBalances) return null;
    const balances = myBalances || [];
    const leaveTypeLabels: Record<string, string> = {
      annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', maternity: 'أمومة',
    };

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {balances.map((b: any) => (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{leaveTypeLabels[b.leaveType] || b.leaveType}</p>
                  <p className="text-2xl font-bold">{b.totalBalance - b.usedBalance}</p>
                  <p className="text-xs text-gray-400">من {b.totalBalance} يوم (استخدم {b.usedBalance})</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {balances.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-4 text-center text-gray-500">
              لم يتم تعيين رصيد إجازات لك بعد. الرجاء مراجعة قسم الموارد البشرية.
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Employee stats cards
  const renderMyStats = () => {
    if (!isEmployee) return null;
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Hourglass className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">موافق عليها</p>
              <p className="text-2xl font-bold">{myStats?.approved || stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مرفوضة</p>
              <p className="text-2xl font-bold">{myStats?.rejected || stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Manager stats
  const renderManagerStats = () => {
    if (isEmployee) return null;
    const pendingCount = requests.filter((r: any) => r.approvalStage === 'PENDING').length;

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-50">
              <Hourglass className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">بانتظار الموافقة</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">موافق عليها</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مرفوضة</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // New Leave Form
  const renderNewLeaveForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">طلب إجازة جديد</h2>
          <p className="text-muted-foreground">أدخل بيانات طلب الإجازة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الإجازة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Employee select - only for non-employees */}
            {!isEmployee && (
              <div className="space-y-2">
                <Label>الموظف</Label>
                <Select
                  value={newLeave.employeeId}
                  onValueChange={(v) => setNewLeave({ ...newLeave, employeeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {(employeesData || []).map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName} {emp.lastName} - {emp.department?.nameAr || emp.department?.name || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>نوع الإجازة</Label>
              <Select
                value={newLeave.leaveType}
                onValueChange={(v: any) => setNewLeave({ ...newLeave, leaveType: v })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={newLeave.startDate}
                  onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={newLeave.endDate}
                  onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                />
              </div>
            </div>
            {newLeave.startDate && newLeave.endDate && (
              <div className="text-sm text-muted-foreground">
                عدد الأيام: {Math.ceil((new Date(newLeave.endDate).getTime() - new Date(newLeave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} يوم
              </div>
            )}
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea
                placeholder="أدخل سبب الإجازة"
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("list")}>إلغاء</Button>
              <Button onClick={handleCreateLeave} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الطلب'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Role-specific title
  const getPageTitle = () => {
    if (isEmployee) return 'إجازاتي';
    if (isDeptManager) return 'إدارة إجازات القسم';
    if (isHrManager) return 'إدارة الإجازات - الموارد البشرية';
    if (isGM) return 'إدارة الإجازات - المدير العام';
    return 'إدارة الإجازات';
  };

  const getPageSubtitle = () => {
    if (isEmployee) return 'عرض طلبات إجازاتك ورصيدك';
    if (isDeptManager) return 'مراجعة والموافقة على طلبات إجازات موظفي القسم';
    if (isHrManager) return 'مراجعة والموافقة على جميع طلبات الإجازات';
    if (isGM) return 'الموافقة النهائية على طلبات الإجازات';
    return 'طلبات الإجازات والموافقات';
  };

  // List View
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{getPageTitle()}</h2>
          <p className="text-gray-500">{getPageSubtitle()}</p>
        </div>
        {/* Only employees can create leave requests */}
        {isEmployee && (
          <Button className="gap-2" onClick={() => setViewMode("new-leave")}>
            <Plus className="h-4 w-4" />
            طلب إجازة جديد
          </Button>
        )}
      </div>

      {/* Employee Balance Cards */}
      {renderBalanceCards()}

      {/* Stats Cards */}
      {isEmployee ? renderMyStats() : renderManagerStats()}

      {/* Approval Flow Info */}
      {!isEmployee && (
        <Card>
          <CardContent className="p-4">
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

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEmployee ? 'طلبات إجازاتي' : 'طلبات الإجازات'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              searchKey="employeeName"
              searchPlaceholder="بحث..."
              emptyMessage="لا توجد طلبات إجازات"
            />
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

  switch (viewMode) {
    case "new-leave":
      return renderNewLeaveForm();
    default:
      return renderListView();
  }
}
