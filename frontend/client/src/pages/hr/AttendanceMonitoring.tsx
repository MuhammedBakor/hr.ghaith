import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, AlertTriangle, Loader2, RefreshCw, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, useDepartments, useEmployeeByUserId } from '@/services/hrService';
import { useAuth } from '@/_core/hooks/useAuth';
import { formatDate } from '@/lib/formatDate';
import { toast } from 'sonner';

export default function AttendanceMonitoring() {
  const { selectedRole } = useAppContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: employeesData } = useEmployees();
  const { data: departmentsData } = useDepartments();
  const { data: currentEmployee } = useEmployeeByUserId(user?.id || 0);

  const isTopRole = ['admin', 'general_manager', 'hr_manager'].includes(selectedRole);
  const isManager = isTopRole || ['department_manager', 'supervisor'].includes(selectedRole);

  // Department manager's own department
  const myDeptId = currentEmployee
    ? (typeof currentEmployee.department === 'object' ? currentEmployee.department?.id : currentEmployee.departmentId)
    : null;

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-monitoring', selectedDate],
    queryFn: () => api.get('/hr/attendance', { params: { date: selectedDate } }).then(r => r.data),
    refetchInterval: 30000,
  });

  // Approve/reject mutations
  const approveEarlyLeaveMut = useMutation({
    mutationFn: (id: number) => api.post(`/hr/attendance/${id}/approve-early-leave`).then(r => r.data),
    onSuccess: () => { toast.success('تمت الموافقة على طلب الخروج المبكر'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
  });
  const rejectEarlyLeaveMut = useMutation({
    mutationFn: (id: number) => api.post(`/hr/attendance/${id}/reject-early-leave`).then(r => r.data),
    onSuccess: () => { toast.success('تم رفض طلب الخروج المبكر'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
  });
  const approveAttendanceMut = useMutation({
    mutationFn: (id: number) => api.post(`/hr/attendance/${id}/approve`).then(r => r.data),
    onSuccess: () => { toast.success('تمت الموافقة على الحضور'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
  });
  const rejectAttendanceMut = useMutation({
    mutationFn: (id: number) => api.post(`/hr/attendance/${id}/reject`).then(r => r.data),
    onSuccess: () => { toast.success('تم رفض الحضور'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'حدث خطأ'),
  });

  const records = useMemo(() => {
    const raw = (attendanceData || []) as any[];
    return raw.map((att: any) => {
      const empId = att.employeeId || att.employee?.id;
      const employee = (employeesData as any[])?.find((e: any) => e.id === empId);
      const emp = employee || att.employee;
      const deptId = emp ? (typeof emp.department === 'object' ? emp.department?.id : emp.departmentId) : null;
      const deptName = emp ? (typeof emp.department === 'object' ? (emp.department?.nameAr || emp.department?.name) : '') : '';
      const role = emp?.jobTitle || emp?.role || (typeof emp?.position === 'object' ? emp?.position?.title : emp?.position) || '';

      return {
        id: att.id,
        employeeId: empId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : (att.employee ? `${att.employee.firstName} ${att.employee.lastName}` : `#${empId}`),
        role,
        departmentId: deptId,
        departmentName: deptName,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        status: att.status || 'unknown',
        approvalStatus: att.approvalStatus,
        workHours: att.workHours != null ? parseFloat(att.workHours) : 0,
        notes: att.notes || '',
      };
    });
  }, [attendanceData, employeesData]);

  // Apply role-based filtering first
  const roleFilteredRecords = useMemo(() => {
    if (isTopRole) return records; // GM, HR, admin see all
    if (selectedRole === 'department_manager' && myDeptId) {
      return records.filter(r => r.departmentId === myDeptId);
    }
    return records; // supervisors see all (filtered by attendance-monitoring permission)
  }, [records, isTopRole, selectedRole, myDeptId]);

  const filteredRecords = useMemo(() => {
    let result = roleFilteredRecords;
    if (selectedDepartment !== 'all') {
      result = result.filter(r => String(r.departmentId) === selectedDepartment);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(r => r.employeeName.toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'checked_in') {
        result = result.filter(r => r.status === 'checked_in');
      } else if (statusFilter === 'checked_out') {
        result = result.filter(r => r.status === 'present' && r.checkOut);
      } else if (statusFilter === 'early_leave') {
        result = result.filter(r => r.status === 'early_leave' || r.status === 'pending_early_leave');
      } else if (statusFilter === 'late') {
        result = result.filter(r => r.status === 'late');
      } else if (statusFilter === 'pending') {
        result = result.filter(r => r.status === 'pending_approval' || r.status === 'pending_early_leave');
      }
    }
    return result;
  }, [records, selectedDepartment, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: roleFilteredRecords.length,
    checkedIn: roleFilteredRecords.filter(r => r.status === 'checked_in').length,
    checkedOut: roleFilteredRecords.filter(r => r.status === 'present' && r.checkOut).length,
    earlyLeave: roleFilteredRecords.filter(r => r.status === 'early_leave' || r.status === 'pending_early_leave').length,
    pending: roleFilteredRecords.filter(r => r.status === 'pending_approval' || r.status === 'pending_early_leave').length,
  }), [roleFilteredRecords]);

  const getStatusBadge = (record: any) => {
    if (record.status === 'pending_early_leave') return <Badge className="bg-amber-100 text-amber-800">طلب خروج مبكر</Badge>;
    if (record.status === 'early_leave') return <Badge className="bg-orange-100 text-orange-800">خروج مبكر</Badge>;
    if (record.status === 'pending_approval') return <Badge className="bg-amber-100 text-amber-800">بانتظار الموافقة</Badge>;
    if (record.status === 'late') return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
    if (record.status === 'rejected') return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
    if (record.status === 'present' && record.checkOut) return <Badge className="bg-blue-100 text-blue-800">انصرف</Badge>;
    if (record.status === 'checked_in') return <Badge className="bg-green-100 text-green-800">مسجل دخول</Badge>;
    if (record.status === 'present') return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{record.status}</Badge>;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const needsAction = (record: any) => {
    return record.status === 'pending_early_leave' || record.status === 'pending_approval';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            مراقبة الحضور والانصراف
          </h2>
          <p className="text-gray-500">
            {isTopRole ? 'متابعة تسجيل دخول وخروج جميع الموظفين' :
             selectedRole === 'department_manager' ? 'متابعة تسجيل دخول وخروج موظفي القسم' :
             'متابعة تسجيل دخول وخروج الموظفين'}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">إجمالي السجلات</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50"><LogIn className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">مسجلين دخول</p>
              <p className="text-xl font-bold text-green-600">{stats.checkedIn}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50"><LogOut className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">انصرفوا</p>
              <p className="text-xl font-bold text-blue-600">{stats.checkedOut}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">خروج مبكر</p>
              <p className="text-xl font-bold text-orange-600">{stats.earlyLeave}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pending > 0 ? 'border-amber-300 bg-amber-50/30' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-gray-500">بانتظار الموافقة</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
        {isTopRole && (
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="جميع الأقسام" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {(departmentsData || []).map((dept: any) => (
                <SelectItem key={dept.id} value={String(dept.id)}>{dept.nameAr || dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="جميع الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="checked_in">مسجل دخول</SelectItem>
            <SelectItem value="checked_out">انصرف</SelectItem>
            <SelectItem value="early_leave">خروج مبكر</SelectItem>
            <SelectItem value="pending">بانتظار الموافقة</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="بحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[200px]" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            سجل الحضور - {formatDate(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">اسم الموظف</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الوظيفة</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">القسم</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">تسجيل الدخول</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">تسجيل الخروج</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">ساعات العمل</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">ملاحظات</th>
                    {isManager && <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${needsAction(record) ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{record.employeeName}</td>
                      <td className="px-4 py-3 text-gray-600">{record.role || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{record.departmentName || '-'}</td>
                      <td className="px-4 py-3">
                        {record.checkIn ? (
                          <span className="flex items-center gap-1 text-green-700">
                            <LogIn className="h-3.5 w-3.5" />
                            {formatTime(record.checkIn)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {record.checkOut ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <LogOut className="h-3.5 w-3.5" />
                            {formatTime(record.checkOut)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {record.workHours > 0 ? `${record.workHours.toFixed(1)} ساعة` : '-'}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(record)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate" title={record.notes}>
                        {record.notes || '-'}
                      </td>
                      {isManager && (
                        <td className="px-4 py-3">
                          {record.status === 'pending_early_leave' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-600 hover:bg-green-50"
                                onClick={() => approveEarlyLeaveMut.mutate(record.id)}
                                disabled={approveEarlyLeaveMut.isPending}
                                title="موافقة"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-600 hover:bg-red-50"
                                onClick={() => rejectEarlyLeaveMut.mutate(record.id)}
                                disabled={rejectEarlyLeaveMut.isPending}
                                title="رفض"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {record.status === 'pending_approval' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-600 hover:bg-green-50"
                                onClick={() => approveAttendanceMut.mutate(record.id)}
                                disabled={approveAttendanceMut.isPending}
                                title="موافقة"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-600 hover:bg-red-50"
                                onClick={() => rejectAttendanceMut.mutate(record.id)}
                                disabled={rejectAttendanceMut.isPending}
                                title="رفض"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={isManager ? 9 : 8} className="px-4 py-12 text-center text-gray-400">
                        لا توجد سجلات حضور لهذا التاريخ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
