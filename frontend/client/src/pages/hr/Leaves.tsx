import { formatDate, formatDateTime } from '@/lib/formatDate';
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
  ArrowRight
} from 'lucide-react';
import {
  useLeaves,
  useCreateLeave,
  useUpdateLeave,
  useEmployees
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

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
}

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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = "list" | "new-leave";

export default function Leaves() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    leaveType: 'annual' as const,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { selectedBranchId, branches } = useAppContext();

  const { data: leavesData, isLoading: loading } = useLeaves();
  const { data: employeesData } = useEmployees();

  const createLeaveMutation = useCreateLeave();
  const updateLeaveMutation = useUpdateLeave();

  const handleApprove = (id: number) => {
    updateLeaveMutation.mutate({ id, status: 'approved' }, {
      onSuccess: () => toast.success('تمت الموافقة على الإجازة'),
      onError: (e: any) => toast.error(e.message || "حدث خطأ")
    });
  };

  const handleReject = (id: number) => {
    updateLeaveMutation.mutate({ id, status: 'rejected' }, {
      onSuccess: () => toast.success('تم رفض الإجازة'),
      onError: (e: any) => toast.error(e.message || "حدث خطأ")
    });
  };

  const handleCreateLeave = () => {
    if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createLeaveMutation.mutate({
      employeeId: parseInt(newLeave.employeeId),
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason,
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء طلب الإجازة بنجاح');
        setViewMode("list");
        setNewLeave({
          employeeId: '',
          leaveType: 'annual',
          startDate: '',
          endDate: '',
          reason: '',
        });
      },
      onError: (e: any) => toast.error(e.message || "حدث خطأ")
    });
  };

  const requests: LeaveRequest[] = (leavesData || []).map((leave: any) => {
    return {
      id: String(leave.id),
      employeeId: String(leave.employee?.id || leave.employeeId),
      employeeName: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : `موظف #${leave.employeeId}`,
      leaveType: leave.leaveType || 'annual',
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: leave.days || Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      status: leave.status || 'pending',
      reason: leave.reason || '',
    };
  });

  // حساب الإحصائيات
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: 'employeeName',
      header: 'الموظف',
    },
    {
      accessorKey: 'leaveType',
      header: 'نوع الإجازة',
      cell: ({ row }) => getLeaveTypeBadge(row.original.leaveType),
    },
    {
      accessorKey: 'startDate',
      header: 'من تاريخ',
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'إلى تاريخ',
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: 'days',
      header: 'عدد الأيام',
      cell: ({ row }) => `${row.original.days} يوم`,
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
        row.original.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700"
              onClick={() => handleApprove(parseInt(row.original.id))}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => handleReject(parseInt(row.original.id))}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )
      ),
    },
  ];

  // Render New Leave Form (in same page)
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
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

  // Render List View
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الإجازات</h2>
          <p className="text-gray-500">طلبات الإجازات والموافقات</p>
        </div>
        <Button className="gap-2" onClick={() => setViewMode("new-leave")}>
          <Plus className="h-4 w-4" />
          طلب إجازة جديد
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            طلبات الإجازات
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
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد طلبات إجازات"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Main render
  switch (viewMode) {
    case "new-leave":
      return renderNewLeaveForm();
    default:
      return renderListView();
  }
}
