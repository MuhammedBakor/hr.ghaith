import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  useLeaves,
  useEmployees,
  useCreateLeave,
  useUpdateLeave
} from '@/services/hrService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Loader2, Search, ArrowRight } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

// دالة توليد رقم طلب الإجازة التلقائي
const generateLeaveCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `LV-${timestamp.slice(-4)}${random}`;
};

type ViewMode = 'list' | 'add';

export default function LeaveManagement() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || (userRole as string) === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [leaveCode] = useState(generateLeaveCode());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newLeave, setNewLeave] = useState({
    employeeId: 0,
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { data: leavesData, isLoading, isError } = useLeaves();
  const { data: employeesData } = useEmployees();

  const createLeaveMutation = useCreateLeave();
  const updateLeaveMutation = useUpdateLeave();

  const leaves = (leavesData || []) as any[];
  const employees = employeesData || [];

  const filteredLeaves = leaves.filter(leave => {
    const empId = leave.employeeId || leave.employee?.id;
    const employee = employees.find((e: any) => e.id === empId);
    const empName = employee ? `${(employee as any).firstName || ''} ${(employee as any).lastName || ''}`.trim() : '';
    const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (emp: any) => {
    if (emp.employee) return `${emp.employee.firstName || ''} ${emp.employee.lastName || ''}`.trim();
    const employee = employees.find((e: any) => e.id === emp.employeeId);
    return employee ? `${(employee as any).firstName || ''} ${(employee as any).lastName || ''}`.trim() || '-' : '-';
  };

  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: 'سنوية',
      sick: 'مرضية',
      emergency: 'طارئة',
      unpaid: 'بدون راتب',
      maternity: 'أمومة',
      paternity: 'أبوة',
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">موافق عليه</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800">قيد المراجعة</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const resetForm = () => {
    setNewLeave({ employeeId: 0, leaveType: 'annual', startDate: '', endDate: '', reason: '' });
  };

  const handleCreateLeave = () => {
    if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createLeaveMutation.mutate({
      employeeId: newLeave.employeeId,
      leaveType: newLeave.leaveType as 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'emergency',
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason || undefined,
    }, {
      onSuccess: () => {
        toast.success('تم تقديم طلب الإجازة بنجاح');
        setViewMode('list');
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في تقديم الطلب');
      },
    });
  };

  const handleApprove = (leaveId: number) => {
    updateLeaveMutation.mutate({ id: leaveId, status: 'approved' as any }, {
      onSuccess: () => toast.success('تم تحديث حالة الطلب'),
      onError: (error: any) => toast.error(error.message || 'فشل في تحديث الحالة')
    });
  };

  const handleReject = (leaveId: number) => {
    updateLeaveMutation.mutate({ id: leaveId, status: 'rejected' as any }, {
      onSuccess: () => toast.success('تم تحديث حالة الطلب'),
      onError: (error: any) => toast.error(error.message || 'فشل في تحديث الحالة')
    });
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  // نموذج إضافة طلب إجازة
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الطلب (تلقائي)</Label>
                  <Input
                    value={leaveCode}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>الموظف *</Label>
                  <Select value={newLeave.employeeId.toString()} onValueChange={(v) => setNewLeave({ ...newLeave, employeeId: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp: any) => (
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
                  <Label>نوع الإجازة</Label>
                  <Select value={newLeave.leaveType} onValueChange={(v) => setNewLeave({ ...newLeave, leaveType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">سنوية</SelectItem>
                      <SelectItem value="sick">مرضية</SelectItem>
                      <SelectItem value="emergency">طارئة</SelectItem>
                      <SelectItem value="unpaid">بدون راتب</SelectItem>
                      <SelectItem value="maternity">أمومة</SelectItem>
                      <SelectItem value="paternity">أبوة</SelectItem>
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
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateLeave} disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التقديم...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    تقديم الطلب
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الإجازات</h2>
          <p className="text-muted-foreground">إدارة طلبات الإجازات والموافقات</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          طلب إجازة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">موافق عليها</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">موافق عليها</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
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
              <Button variant="link" onClick={() => setViewMode('add')}>
                تقديم طلب إجازة جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الموظف</TableHead>
                  <TableHead className="text-end">نوع الإجازة</TableHead>
                  <TableHead className="text-end">من</TableHead>
                  <TableHead className="text-end">إلى</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{getEmployeeName(leave)}</TableCell>
                    <TableCell>{getLeaveTypeName(leave.leaveType)}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(leave.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(leave.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
