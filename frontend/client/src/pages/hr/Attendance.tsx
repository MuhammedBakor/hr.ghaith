import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut, Calendar, AlertTriangle, CheckCircle2, XCircle, MapPin, Loader2, ArrowRight, UserCheck, ClipboardList, Timer, AlertCircle } from 'lucide-react';
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
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext } from '@/contexts/AppContext';
import {
  useEmployees,
  useAttendance,
  useCheckIn,
  useCheckOut,
  useManualAttendance,
  useEmployeeByUserId,
  useSubordinates,
  useRequestEarlyLeave
} from '@/services/hrService';
import { useQueryClient } from '@tanstack/react-query';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: number;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  approvalStatus?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'present':
      return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
    case 'absent':
      return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
    case 'late':
      return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
    case 'early_leave':
      return <Badge className="bg-orange-100 text-orange-800">خروج مبكر</Badge>;
    case 'on_leave':
      return <Badge className="bg-blue-100 text-blue-800">في إجازة</Badge>;
    case 'holiday':
      return <Badge className="bg-purple-100 text-purple-800">عطلة</Badge>;
    case 'checked_in':
      return <Badge className="bg-emerald-100 text-emerald-800">مسجل دخول</Badge>;
    case 'pending_approval':
      return <Badge className="bg-amber-100 text-amber-800">بانتظار الموافقة</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = "list" | "manual-entry" | "early-leave-request";

export default function Attendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedBranchId, branches, selectedRole } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showEarlyLeaveDialog, setShowEarlyLeaveDialog] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // جلب بيانات الموظف الحالي
  const { data: currentEmployee } = useEmployeeByUserId(user?.id || 0);

  // جلب الموظفين التابعين للمدير (إذا كان مديراً)
  const canSeeSubordinates = selectedRole === 'department_manager' || selectedRole === 'hr_manager' || selectedRole === 'admin' || selectedRole === 'general_manager';
  const { data: subordinates } = useSubordinates(currentEmployee?.id || 0);

  // جلب الموظفين مع فلترة الفرع
  const { data: employeesData } = useEmployees();

  // جلب سجلات الحضور الفعلية من API
  const { data: attendanceData, isLoading: isLoadingAttendance } = useAttendance(selectedDate);

  // التحقق من حالة حضور الموظف الحالي اليوم
  const todayAttendance = useMemo(() => {
    if (!currentEmployee || !attendanceData) return null;
    const today = new Date().toISOString().split('T')[0];
    return (attendanceData as any[]).find((att: any) =>
      att.employee?.id === currentEmployee.id &&
      new Date(att.date).toISOString().split('T')[0] === today
    );
  }, [currentEmployee, attendanceData]);

  // Mutations
  const checkInWithLocationMutation = useCheckIn();
  const checkOutWithLocationMutation = useCheckOut();
  const manualAttendanceMutation = useManualAttendance();
  const earlyLeaveMutation = useRequestEarlyLeave();

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

  // تسجيل الحضور بالموقع
  const handleCheckInWithLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      checkInWithLocationMutation.mutate({
        employeeId: currentEmployee?.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, {
        onSuccess: () => {
          toast.success('تم تسجيل الحضور بنجاح');
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
        onError: (error: any) => {
          toast.error('حدث خطأ: ' + error.message);
        }
      });
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.');
      } else if (error.code === 2) {
        toast.error('تعذر تحديد الموقع. يرجى التأكد من تفعيل GPS.');
      } else if (error.code === 3) {
        toast.error('انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.');
      } else {
        toast.error('حدث خطأ في تحديد الموقع: ' + error.message);
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // تسجيل الانصراف بالموقع
  const handleCheckOutWithLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentLocation();
      if (!todayAttendance?.id) return;

      checkOutWithLocationMutation.mutate({
        id: todayAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }, {
        onSuccess: () => {
          toast.success('تم تسجيل الانصراف بنجاح');
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
        onError: (error: any) => {
          toast.error('حدث خطأ: ' + error.message);
        }
      });
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('تم رفض الوصول للموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.');
      } else if (error.code === 2) {
        toast.error('تعذر تحديد الموقع. يرجى التأكد من تفعيل GPS.');
      } else if (error.code === 3) {
        toast.error('انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.');
      } else {
        toast.error('حدث خطأ في تحديد الموقع: ' + error.message);
      }
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
    }, {
      onSuccess: () => {
        toast.success('تم تقديم طلب الخروج المبكر بنجاح');
        setShowEarlyLeaveDialog(false);
        setEarlyLeaveReason('');
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      },
      onError: (error: any) => {
        toast.error('حدث خطأ: ' + error.message);
      }
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

  // التسجيل اليدوي (للمدير المباشر فقط)
  const handleManualAttendance = () => {
    if (!manualEntry.employeeId) {
      toast.error('يرجى اختيار الموظف');
      return;
    }

    // التحقق من أن الموظف تابع للمدير
    const isSubordinate = (subordinates as any[])?.some((s: any) => s.id === parseInt(manualEntry.employeeId));
    if (!isSubordinate && selectedRole !== 'hr_manager' && selectedRole !== 'admin') {
      toast.error('لا يمكنك تسجيل حضور لموظف غير تابع لك');
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
        setViewMode("list");
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      },
      onError: (error: any) => {
        toast.error('حدث خطأ: ' + error.message);
      }
    });
  };

  // تحويل البيانات من API إلى الشكل المطلوب
  const records: AttendanceRecord[] = (attendanceData || []).map((att: any) => {
    const employee = (employeesData as any[])?.find((e: any) => e.id === att.employeeId);
    return {
      id: att.id,
      employeeId: att.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : (att.employee ? `${att.employee.firstName} ${att.employee.lastName}` : `موظف #${att.employeeId}`),
      date: att.date ? new Date(att.date).toISOString().split('T')[0] : selectedDate,
      checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : null,
      checkOut: att.checkOut ? new Date(att.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : null,
      status: att.status || 'present',
      workHours: att.workHours ? parseFloat(att.workHours) : 0,
      checkInLatitude: att.checkInLatitude,
      checkInLongitude: att.checkInLongitude,
      checkOutLatitude: att.checkOutLatitude,
      checkOutLongitude: att.checkOutLongitude,
      approvalStatus: att.approvalStatus,
    };
  });

  // حساب الإحصائيات
  const stats = {
    present: records.filter(r => r.status === 'present' || r.status === 'checked_in').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: 'employeeName',
      header: 'الموظف',
    },
    {
      accessorKey: 'date',
      header: 'التاريخ',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'checkIn',
      header: 'وقت الحضور',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.checkIn || '-'}
          {row.original.checkInLatitude && (
            <MapPin className="h-3 w-3 text-green-600" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'checkOut',
      header: 'وقت الانصراف',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.checkOut || '-'}
          {row.original.checkOutLatitude && (
            <MapPin className="h-3 w-3 text-red-600" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'workHours',
      header: 'ساعات العمل',
      cell: ({ row }) => `${row.original.workHours.toFixed(1)} ساعة`,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  // Render Manual Entry Form (للمدير المباشر فقط)
  const renderManualEntryForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
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
              <Select
                value={manualEntry.employeeId}
                onValueChange={(v) => setManualEntry({ ...manualEntry, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {(subordinates || []).map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={manualEntry.date}
                onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت الحضور</Label>
                <Input
                  type="time"
                  value={manualEntry.checkIn}
                  onChange={(e) => setManualEntry({ ...manualEntry, checkIn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>وقت الانصراف</Label>
                <Input
                  type="time"
                  value={manualEntry.checkOut}
                  onChange={(e) => setManualEntry({ ...manualEntry, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات (سبب التسجيل اليدوي)</Label>
              <Textarea
                value={manualEntry.notes}
                onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                placeholder="اكتب سبب التسجيل اليدوي..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("list")}>إلغاء</Button>
              <Button onClick={handleManualAttendance} disabled={manualAttendanceMutation.isPending}>
                {manualAttendanceMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
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
          <h2 className="text-2xl font-bold tracking-tight">الحضور والانصراف</h2>
          <p className="text-gray-500">متابعة حضور وانصراف الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* بطاقة تسجيل الحضور للموظف الحالي */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* معلومات الموظف والوقت */}
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

            {/* حالة الحضور اليوم */}
            {todayAttendance && (
              <div className="p-3 bg-white rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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

            {/* أزرار التسجيل */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleCheckInWithLocation}
                disabled={isGettingLocation || checkInWithLocationMutation.isPending || !!todayAttendance?.checkIn}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isGettingLocation || checkInWithLocationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                تسجيل حضور
              </Button>
              <Button
                onClick={handleCheckOutWithLocation}
                disabled={isGettingLocation || checkOutWithLocationMutation.isPending || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                variant="outline"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                {isGettingLocation || checkOutWithLocationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                تسجيل انصراف
              </Button>
              <Button
                onClick={() => setShowEarlyLeaveDialog(true)}
                disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut}
                variant="outline"
                className="gap-2 border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                <AlertTriangle className="h-4 w-4" />
                طلب خروج مبكر
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حاضرون</p>
              <p className="text-2xl font-bold">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">غائبون</p>
              <p className="text-2xl font-bold">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متأخرون</p>
              <p className="text-2xl font-bold">{stats.late}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">في إجازة</p>
              <p className="text-2xl font-bold">{stats.onLeave}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            سجل الحضور - {formatDate(selectedDate)}
          </CardTitle>
          {canSeeSubordinates && (
            <Button variant="outline" className="gap-2" onClick={() => setViewMode("manual-entry")}>
              <ClipboardList className="h-4 w-4" />
              تسجيل يدوي (للتابعين)
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingAttendance ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              searchKey="employeeName"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد سجلات حضور لهذا التاريخ"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog طلب الخروج المبكر */}
      {showEarlyLeaveDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">طلب خروج مبكر</h3>
            <p className="text-sm text-gray-500">
              سيتم إرسال طلبك للموافقة حسب الصلاحيات المحددة في النظام
            </p>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>سبب الخروج المبكر</Label>
              <Textarea
                value={earlyLeaveReason}
                onChange={(e) => setEarlyLeaveReason(e.target.value)}
                placeholder="اكتب سبب طلب الخروج المبكر..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowEarlyLeaveDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleEarlyLeaveRequest}
              disabled={earlyLeaveMutation.isPending}
            >
              {earlyLeaveMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );

  // Main render
  switch (viewMode) {
    case "manual-entry":
      return renderManualEntryForm();
    default:
      return renderListView();
  }
}
