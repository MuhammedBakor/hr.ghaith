import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Clock, LogIn, LogOut, AlertTriangle, Loader2, RefreshCw, Users, CheckCircle, XCircle,
  MapPin, UserCheck, Timer, ClipboardList, AlertCircle, ArrowRight, Calendar
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import {
  useEmployees, useDepartments, useEmployeeByUserId,
  useCheckIn, useCheckOut, useManualAttendance, useSubordinates, useRequestEarlyLeave,
} from '@/services/hrService';
import { useAuth } from '@/_core/hooks/useAuth';
import { formatDate } from '@/lib/formatDate';
import { toast } from 'sonner';

type ViewMode = 'list' | 'manual-entry';

export default function AttendanceMonitoring() {
  const { selectedRole, selectedBranchId, branches } = useAppContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const selectedBranch = branches?.find((b: any) => b.id === selectedBranchId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showEarlyLeaveDialog, setShowEarlyLeaveDialog] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // تحديث الوقت كل ثانية
  const isAdminOrGM = selectedRole === 'admin' || selectedRole === 'general_manager';
  useEffect(() => {
    if (isAdminOrGM) return; // لا حاجة للساعة لمدير النظام والمدير العام
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAdminOrGM]);

  const { data: employeesData } = useEmployees();
  const { data: departmentsData } = useDepartments();
  const { data: currentEmployee, isError: isEmployeeError, isLoading: isEmployeeLoading } = useEmployeeByUserId(user?.id || 0);
  const { data: subordinates } = useSubordinates(currentEmployee?.id || 0);

  const isTopRole = ['admin', 'general_manager', 'hr_manager'].includes(selectedRole);
  const isDeptManagerRole = ['department_manager', 'finance_manager', 'fleet_manager', 'legal_manager', 'projects_manager', 'store_manager'].includes(selectedRole);
  const isManager = isTopRole || isDeptManagerRole || selectedRole === 'supervisor';
  const canSeeSubordinates = isManager;

  const myDeptId = currentEmployee
    ? (typeof currentEmployee.department === 'object' ? currentEmployee.department?.id : currentEmployee.departmentId)
    : null;

  // قائمة الموظفين المتاحين للتسجيل اليدوي
  const manualEntryEmployees = useMemo(() => {
    if (isTopRole) return employeesData || [];
    return subordinates || [];
  }, [isTopRole, employeesData, subordinates]);

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-monitoring', selectedDate],
    queryFn: () => api.get('/hr/attendance', { params: { date: selectedDate } }).then(r => r.data),
    refetchInterval: 30000,
  });

  // التحقق من حالة حضور الموظف الحالي اليوم
  const todayAttendance = useMemo(() => {
    if (!currentEmployee || !attendanceData || isAdminOrGM) return null;
    const today = new Date().toISOString().split('T')[0];
    return (attendanceData as any[]).find((att: any) => {
      const attEmpId = att.employeeId || att.employee?.id;
      return attEmpId === currentEmployee.id &&
        new Date(att.date).toISOString().split('T')[0] === today;
    });
  }, [currentEmployee, attendanceData, isAdminOrGM]);

  // Mutations
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const manualAttendanceMutation = useManualAttendance();
  const earlyLeaveMutation = useRequestEarlyLeave();

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

  // الحصول على الموقع الجغرافي
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('المتصفح لا يدعم تحديد الموقع'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  const handleLocationError = (error: any) => {
    if (error.code === 1) {
      toast.error('تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.');
    } else if (error.code === 2) {
      toast.error('تعذر تحديد الموقع. يرجى التأكد من تفعيل GPS.');
    } else if (error.code === 3) {
      toast.error('انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.');
    } else {
      toast.error('حدث خطأ في تحديد الموقع: ' + error.message);
    }
  };

  // تسجيل الحضور بالموقع
  const handleCheckIn = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      if (!currentEmployee?.id) {
        toast.error('لا يوجد سجل موظف مرتبط بحسابك. يرجى التواصل مع قسم الموارد البشرية.');
        return;
      }
      checkInMutation.mutate({
        employeeId: currentEmployee.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, {
        onSuccess: () => { toast.success('تم تسجيل الحضور بنجاح'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
        onError: (e: any) => toast.error('حدث خطأ: ' + e.message),
      });
    } catch (error: any) {
      handleLocationError(error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // تسجيل الانصراف بالموقع
  const handleCheckOut = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      if (!todayAttendance?.id) return;
      checkOutMutation.mutate({
        id: todayAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, {
        onSuccess: () => { toast.success('تم تسجيل الانصراف بنجاح'); refetch(); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
        onError: (e: any) => toast.error('حدث خطأ: ' + e.message),
      });
    } catch (error: any) {
      handleLocationError(error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // طلب الخروج المبكر
  const handleEarlyLeaveRequest = () => {
    if (!earlyLeaveReason.trim()) {
      toast.error('يرجى كتابة سبب الخروج المبكر');
      return;
    }
    earlyLeaveMutation.mutate({
      reason: earlyLeaveReason,
      employeeId: currentEmployee?.id,
    }, {
      onSuccess: () => {
        toast.success('تم تقديم طلب الخروج المبكر بنجاح');
        setShowEarlyLeaveDialog(false);
        setEarlyLeaveReason('');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      },
      onError: (e: any) => toast.error('حدث خطأ: ' + e.message),
    });
  };

  // State للتسجيل اليدوي
  const [manualEntry, setManualEntry] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '',
    notes: '',
  });

  // التسجيل اليدوي
  const handleManualAttendance = () => {
    if (!manualEntry.employeeId) {
      toast.error('يرجى اختيار الموظف');
      return;
    }
    const isAllowed = (manualEntryEmployees as any[])?.some((s: any) => s.id === parseInt(manualEntry.employeeId));
    if (!isAllowed) {
      toast.error('لا يمكنك تسجيل حضور لهذا الموظف');
      return;
    }
    const [checkInHours, checkInMinutes] = manualEntry.checkIn.split(':').map(Number);
    const checkInDate = new Date(manualEntry.date);
    checkInDate.setHours(checkInHours, checkInMinutes, 0, 0);
    let checkOutDate;
    if (manualEntry.checkOut) {
      const [checkOutHours, checkOutMinutes] = manualEntry.checkOut.split(':').map(Number);
      checkOutDate = new Date(manualEntry.date);
      checkOutDate.setHours(checkOutHours, checkOutMinutes, 0, 0);
    }
    manualAttendanceMutation.mutate({
      employeeId: parseInt(manualEntry.employeeId),
      date: manualEntry.date,
      checkIn: checkInDate.toISOString(),
      checkOut: checkOutDate?.toISOString(),
      notes: manualEntry.notes,
    }, {
      onSuccess: () => {
        toast.success('تم تسجيل الحضور اليدوي بنجاح - بانتظار موافقة الموارد البشرية');
        setViewMode('list');
        refetch();
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      },
      onError: (e: any) => toast.error('حدث خطأ: ' + e.message),
    });
  };

  // تحويل بيانات الحضور
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
        checkInLatitude: att.checkInLatitude,
        checkInLongitude: att.checkInLongitude,
        checkOutLatitude: att.checkOutLatitude,
        checkOutLongitude: att.checkOutLongitude,
      };
    });
  }, [attendanceData, employeesData]);

  // فلترة حسب الدور
  const roleFilteredRecords = useMemo(() => {
    if (isTopRole) return records;
    if (isDeptManagerRole && myDeptId) {
      return records.filter(r => r.departmentId === myDeptId);
    }
    if (selectedRole === 'supervisor') {
      const subordinateIds = (subordinates || []).map((s: any) => s.id);
      return records.filter(r => r.employeeId === currentEmployee?.id || subordinateIds.includes(r.employeeId));
    }
    // موظف عادي: يرى فقط سجله
    return records.filter(r => r.employeeId === currentEmployee?.id);
  }, [records, isTopRole, isDeptManagerRole, selectedRole, myDeptId, currentEmployee, subordinates]);

  // فلترة إضافية
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
      if (statusFilter === 'checked_in') result = result.filter(r => r.status === 'checked_in');
      else if (statusFilter === 'checked_out') result = result.filter(r => r.status === 'present' && r.checkOut);
      else if (statusFilter === 'early_leave') result = result.filter(r => r.status === 'early_leave' || r.status === 'pending_early_leave');
      else if (statusFilter === 'late') result = result.filter(r => r.status === 'late');
      else if (statusFilter === 'pending') result = result.filter(r => r.status === 'pending_approval' || r.status === 'pending_early_leave');
      else if (statusFilter === 'absent') result = result.filter(r => r.status === 'absent');
      else if (statusFilter === 'on_leave') result = result.filter(r => r.status === 'on_leave');
    }
    return result;
  }, [roleFilteredRecords, selectedDepartment, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: roleFilteredRecords.length,
    checkedIn: roleFilteredRecords.filter(r => r.status === 'checked_in').length,
    present: roleFilteredRecords.filter(r => r.status === 'present' || r.status === 'checked_in').length,
    checkedOut: roleFilteredRecords.filter(r => r.status === 'present' && r.checkOut).length,
    absent: roleFilteredRecords.filter(r => r.status === 'absent').length,
    late: roleFilteredRecords.filter(r => r.status === 'late').length,
    earlyLeave: roleFilteredRecords.filter(r => r.status === 'early_leave' || r.status === 'pending_early_leave').length,
    onLeave: roleFilteredRecords.filter(r => r.status === 'on_leave').length,
    pending: roleFilteredRecords.filter(r => r.status === 'pending_approval' || r.status === 'pending_early_leave').length,
  }), [roleFilteredRecords]);

  const getStatusBadge = (record: any) => {
    if (record.status === 'pending_early_leave') return <Badge className="bg-amber-100 text-amber-800">طلب خروج مبكر</Badge>;
    if (record.status === 'early_leave') return <Badge className="bg-orange-100 text-orange-800">خروج مبكر</Badge>;
    if (record.status === 'pending_approval') return <Badge className="bg-amber-100 text-amber-800">بانتظار الموافقة</Badge>;
    if (record.status === 'late') return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
    if (record.status === 'rejected') return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
    if (record.status === 'absent') return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
    if (record.status === 'on_leave') return <Badge className="bg-blue-100 text-blue-800">في إجازة</Badge>;
    if (record.status === 'holiday') return <Badge className="bg-purple-100 text-purple-800">عطلة</Badge>;
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

  // Manual Entry Form
  if (viewMode === 'manual-entry') {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تسجيل حضور يدوي</h2>
            <p className="text-muted-foreground">سجل حضور موظف تابع لك يدوياً (يتطلب موافقة الموارد البشرية)</p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">التسجيل اليدوي سيبقى معلقاً حتى موافقة مدير الموارد البشرية</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>الموظف (التابعين لك فقط)</Label>
                <Select value={manualEntry.employeeId} onValueChange={(v) => setManualEntry({ ...manualEntry, employeeId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                  <SelectContent>
                    {(manualEntryEmployees || []).map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={manualEntry.date} onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت الحضور</Label>
                  <Input type="time" value={manualEntry.checkIn} onChange={(e) => setManualEntry({ ...manualEntry, checkIn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>وقت الانصراف</Label>
                  <Input type="time" value={manualEntry.checkOut} onChange={(e) => setManualEntry({ ...manualEntry, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات (سبب التسجيل اليدوي)</Label>
                <Textarea value={manualEntry.notes} onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })} placeholder="اكتب سبب التسجيل اليدوي..." />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setViewMode('list')}>إلغاء</Button>
                <Button onClick={handleManualAttendance} disabled={manualAttendanceMutation.isPending}>
                  {manualAttendanceMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            الحضور والانصراف
          </h2>
          <p className="text-gray-500">
            {isTopRole
              ? 'متابعة حضور وانصراف جميع الموظفين'
              : isDeptManagerRole
                ? 'متابعة حضور وانصراف موظفي القسم'
                : selectedRole === 'supervisor'
                  ? 'متابعة حضور وانصراف الموظفين التابعين لك'
                  : 'سجل الحضور والانصراف الخاص بك'}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* بطاقة تسجيل الحضور - مخفية لمدير النظام والمدير العام */}
      {!isAdminOrGM && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-emerald-100">
                    <UserCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'جاري التحميل...'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {(typeof currentEmployee?.position === 'object' ? currentEmployee?.position?.title : currentEmployee?.position) || 'موظف'} - {selectedBranch?.name || 'الفرع الرئيسي'}
                    </p>
                  </div>
                </div>
                <div className="text-start">
                  <div className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
                    <Timer className="h-6 w-6" />
                    {currentTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {isEmployeeError && !isAdminOrGM && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" />
                  <p>لا يوجد سجل موظف مرتبط بحسابك. يرجى التواصل مع إدارة الموارد البشرية لتفعيل وظائف الحضور والانصراف.</p>
                </div>
              )}

              {isAdminOrGM && !currentEmployee && !isEmployeeLoading && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>تنبيه: أنت داخل بحساب إداري لا يوجد له سجل موظف. يمكنك المراقبة ولكن لا يمكنك تسجيل الحضور لنفسك.</p>
                </div>
              )}

              {todayAttendance && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">تم تسجيل الحضور اليوم</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      الدخول: {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      {todayAttendance.checkOut && (
                        <span className="me-4">
                          الخروج: {new Date(todayAttendance.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleCheckIn}
                  disabled={isGettingLocation || checkInMutation.isPending || !!todayAttendance?.checkIn}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGettingLocation || checkInMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  تسجيل حضور
                </Button>
                <Button
                  onClick={handleCheckOut}
                  disabled={isGettingLocation || checkOutMutation.isPending || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                  variant="outline"
                  className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {isGettingLocation || checkOutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  تسجيل انصراف
                </Button>
                <Button
                  onClick={() => setShowEarlyLeaveDialog(true)}
                  disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut || todayAttendance?.status === 'pending_early_leave' || todayAttendance?.status === 'early_leave'}
                  variant="outline"
                  className="gap-2 border-amber-300 text-amber-600 hover:bg-amber-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {todayAttendance?.status === 'pending_early_leave' ? 'بانتظار الموافقة' : todayAttendance?.status === 'early_leave' ? 'تمت الموافقة' : 'طلب خروج مبكر'}
                </Button>
              </div>
            </div>
            {currentLocation && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-600">
                  <MapPin className="h-4 w-4 inline-block ms-1 text-emerald-600" />
                  آخر موقع مسجل: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <p className="text-xs text-gray-500">حاضرون</p>
              <p className="text-xl font-bold text-green-600">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">غائبون</p>
              <p className="text-xl font-bold text-red-600">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">متأخرون</p>
              <p className="text-xl font-bold text-yellow-600">{stats.late}</p>
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
            <SelectItem value="absent">غائب</SelectItem>
            <SelectItem value="late">متأخر</SelectItem>
            <SelectItem value="early_leave">خروج مبكر</SelectItem>
            <SelectItem value="on_leave">في إجازة</SelectItem>
            <SelectItem value="pending">بانتظار الموافقة</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="بحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[200px]" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            سجل الحضور - {formatDate(selectedDate)}
          </CardTitle>
          {canSeeSubordinates && (
            <Button variant="outline" className="gap-2" onClick={() => setViewMode('manual-entry')}>
              <ClipboardList className="h-4 w-4" />
              تسجيل يدوي (للتابعين)
            </Button>
          )}
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
                            {record.checkInLatitude && <MapPin className="h-3 w-3 text-green-600" />}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {record.checkOut ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <LogOut className="h-3.5 w-3.5" />
                            {formatTime(record.checkOut)}
                            {record.checkOutLatitude && <MapPin className="h-3 w-3 text-red-600" />}
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
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:bg-green-50"
                                onClick={() => approveEarlyLeaveMut.mutate(record.id)} disabled={approveEarlyLeaveMut.isPending} title="موافقة">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50"
                                onClick={() => rejectEarlyLeaveMut.mutate(record.id)} disabled={rejectEarlyLeaveMut.isPending} title="رفض">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {record.status === 'pending_approval' && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:bg-green-50"
                                onClick={() => approveAttendanceMut.mutate(record.id)} disabled={approveAttendanceMut.isPending} title="موافقة">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50"
                                onClick={() => rejectAttendanceMut.mutate(record.id)} disabled={rejectAttendanceMut.isPending} title="رفض">
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

      {/* Dialog طلب الخروج المبكر */}
      {showEarlyLeaveDialog && !isAdminOrGM && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
          <div>
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">طلب خروج مبكر</h3>
              <p className="text-sm text-gray-500">سيتم إرسال طلبك للموافقة حسب الصلاحيات المحددة في النظام</p>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>سبب الخروج المبكر</Label>
                <Textarea value={earlyLeaveReason} onChange={(e) => setEarlyLeaveReason(e.target.value)} placeholder="اكتب سبب طلب الخروج المبكر..." rows={4} />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
              <Button variant="outline" onClick={() => setShowEarlyLeaveDialog(false)}>إلغاء</Button>
              <Button onClick={handleEarlyLeaveRequest} disabled={earlyLeaveMutation.isPending}>
                {earlyLeaveMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
