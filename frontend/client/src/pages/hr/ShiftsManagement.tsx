import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAttendancePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useSeedShifts,
  useSeedPolicies
} from "@/services/hrService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, Edit2, Trash2, Settings, AlertCircle, CheckCircle2, Sun, Moon, Sunrise, RefreshCw, Users, Timer, Shield } from "lucide-react";

// أنواع الورديات
const shiftTypes = [
  { value: 'regular', label: 'وردية عادية', icon: Sun, color: 'text-amber-500' },
  { value: 'flexible', label: 'وردية مرنة', icon: RefreshCw, color: 'text-blue-500' },
  { value: 'night', label: 'وردية ليلية', icon: Moon, color: 'text-purple-500' },
  { value: 'split', label: 'وردية مقسمة', icon: Sunrise, color: 'text-orange-500' },
  { value: 'rotating', label: 'وردية متناوبة', icon: RefreshCw, color: 'text-green-500' },
];

// أيام الأسبوع
const weekDays = [
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
];

export default function ShiftsManagement() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState("shifts");
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  // جلب الورديات
  const { data: shifts, isLoading: shiftsLoading, refetch: refetchShifts, isError } = useShifts();

  // جلب السياسات
  const { data: policies, isLoading: policiesLoading, refetch: refetchPolicies } = useAttendancePolicies();

  // إنشاء وردية
  const createShiftMutation = useCreateShift();

  // تحديث وردية
  const updateShiftMutation = useUpdateShift();

  // حذف وردية
  const deleteShiftMutation = useDeleteShift();

  // إنشاء سياسة
  const createPolicyMutation = useCreatePolicy();

  // تحديث سياسة
  const updatePolicyMutation = useUpdatePolicy();

  // حذف سياسة
  const deletePolicyMutation = useDeletePolicy();

  // تهيئة البيانات الافتراضية
  const seedShiftsMutation = useSeedShifts();
  const seedPoliciesMutation = useSeedPolicies();

  const handleSeedDefaults = async () => {
    try {
      await seedShiftsMutation.mutateAsync({});
      await seedPoliciesMutation.mutateAsync({});
      toast.success("تم تهيئة البيانات الافتراضية بنجاح");
      refetchShifts();
      refetchPolicies();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تهيئة البيانات");
    }
  };

  // نموذج الوردية
  const [shiftForm, setShiftForm] = useState({
    code: '',
    name: '',
    nameEn: '',
    description: '',
    shiftType: 'regular' as 'regular' | 'flexible' | 'night' | 'split' | 'rotating',
    startTime: '08:00',
    endTime: '16:00',
    flexibleStartMin: '07:30',
    flexibleStartMax: '09:00',
    flexibleEndMin: '15:30',
    flexibleEndMax: '17:00',
    graceMinutesBefore: 30,
    graceMinutesAfter: 30,
    earlyLeaveGrace: 15,
    requiredWorkHours: '8.00',
    minWorkHours: '6.00',
    breakDurationMinutes: 60,
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    isBreakPaid: false,
    workDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    allowOvertime: true,
    maxOvertimeHours: '4.00',
    overtimeMultiplier: '1.50',
    isActive: true,
    isDefault: false,
  });

  // نموذج السياسة
  const [policyForm, setPolicyForm] = useState({
    code: '',
    name: '',
    description: '',
    lateThresholdMinutes: 15,
    severeLateThresholdMinutes: 60,
    maxLateMinutesPerMonth: 60,
    earlyLeaveThresholdMinutes: 15,
    severeEarlyLeaveMinutes: 60,
    absenceAfterLateMinutes: 240,
    consecutiveAbsenceDays: 3,
    enableAutoDeduction: true,
    lateDeductionPerMinute: '0.00',
    lateDeductionFixed: '50.00',
    absenceDeductionDays: '1.00',
    enableAutoViolation: true,
    requireCheckInLocation: false,
    allowedLocationRadius: 100,
    isActive: true,
    isDefault: false,
  });

  const handleShiftSubmit = async () => {
    try {
      if (editingShift) {
        await updateShiftMutation.mutateAsync({ id: editingShift.id, ...shiftForm });
        toast.success("تم تحديث الوردية بنجاح");
      } else {
        await createShiftMutation.mutateAsync(shiftForm);
        toast.success("تم إنشاء الوردية بنجاح");
      }
      setIsShiftDialogOpen(false);
      setEditingShift(null);
      refetchShifts();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handlePolicySubmit = async () => {
    try {
      if (editingPolicy) {
        await updatePolicyMutation.mutateAsync({ id: editingPolicy.id, ...policyForm });
        toast.success("تم تحديث السياسة بنجاح");
      } else {
        await createPolicyMutation.mutateAsync(policyForm);
        toast.success("تم إنشاء السياسة بنجاح");
      }
      setIsPolicyDialogOpen(false);
      setEditingPolicy(null);
      refetchPolicies();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const openEditShift = (shift: any) => {
    setEditingShift(shift);
    setShiftForm({
      code: shift.code || '',
      name: shift.name || '',
      nameEn: shift.nameEn || '',
      description: shift.description || '',
      shiftType: shift.shiftType || 'regular',
      startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '16:00',
      flexibleStartMin: shift.flexibleStartMin || '07:30',
      flexibleStartMax: shift.flexibleStartMax || '09:00',
      flexibleEndMin: shift.flexibleEndMin || '15:30',
      flexibleEndMax: shift.flexibleEndMax || '17:00',
      graceMinutesBefore: shift.graceMinutesBefore || 30,
      graceMinutesAfter: shift.graceMinutesAfter || 30,
      earlyLeaveGrace: shift.earlyLeaveGrace || 15,
      requiredWorkHours: shift.requiredWorkHours || '8.00',
      minWorkHours: shift.minWorkHours || '6.00',
      breakDurationMinutes: shift.breakDurationMinutes || 60,
      breakStartTime: shift.breakStartTime || '12:00',
      breakEndTime: shift.breakEndTime || '13:00',
      isBreakPaid: shift.isBreakPaid || false,
      workDays: shift.workDays || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      allowOvertime: shift.allowOvertime ?? true,
      maxOvertimeHours: shift.maxOvertimeHours || '4.00',
      overtimeMultiplier: shift.overtimeMultiplier || '1.50',
      isActive: shift.isActive ?? true,
      isDefault: shift.isDefault || false,
    });
    setIsShiftDialogOpen(true);
  };

  const openEditPolicy = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyForm({
      code: policy.code || '',
      name: policy.name || '',
      description: policy.description || '',
      lateThresholdMinutes: policy.lateThresholdMinutes || 15,
      severeLateThresholdMinutes: policy.severeLateThresholdMinutes || 60,
      maxLateMinutesPerMonth: policy.maxLateMinutesPerMonth || 60,
      earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes || 15,
      severeEarlyLeaveMinutes: policy.severeEarlyLeaveMinutes || 60,
      absenceAfterLateMinutes: policy.absenceAfterLateMinutes || 240,
      consecutiveAbsenceDays: policy.consecutiveAbsenceDays || 3,
      enableAutoDeduction: policy.enableAutoDeduction ?? true,
      lateDeductionPerMinute: policy.lateDeductionPerMinute || '0.00',
      lateDeductionFixed: policy.lateDeductionFixed || '50.00',
      absenceDeductionDays: policy.absenceDeductionDays || '1.00',
      enableAutoViolation: policy.enableAutoViolation ?? true,
      requireCheckInLocation: policy.requireCheckInLocation || false,
      allowedLocationRadius: policy.allowedLocationRadius || 100,
      isActive: policy.isActive ?? true,
      isDefault: policy.isDefault || false,
    });
    setIsPolicyDialogOpen(true);
  };

  const getShiftTypeInfo = (type: string) => {
    return shiftTypes.find(t => t.value === type) || shiftTypes[0];
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الورديات والسياسات</h2>
          <p className="text-muted-foreground">تحكم في أوقات العمل وسياسات الحضور والانصراف</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSeedDefaults}
          disabled={seedShiftsMutation.isPending || seedPoliciesMutation.isPending}
        >
          <Settings className="h-4 w-4 ms-2" />
          تهيئة البيانات الافتراضية
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الورديات النشطة</p>
                <p className="text-2xl font-bold">{shifts?.filter((s: any) => s.isActive).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السياسات النشطة</p>
                <p className="text-2xl font-bold">{policies?.filter((p: any) => p.isActive).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الوردية الافتراضية</p>
                <p className="text-lg font-medium truncate">
                  {shifts?.find((s: any) => s.isDefault)?.name || 'غير محددة'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">السياسة الافتراضية</p>
                <p className="text-lg font-medium truncate">
                  {policies?.find((p: any) => p.isDefault)?.name || 'غير محددة'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            الورديات
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            سياسات الحضور
          </TabsTrigger>
        </TabsList>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">قائمة الورديات</h3>
            {isShiftDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">

              <div>
                <div className="mb-4 border-b pb-3">
                  <h3 className="text-lg font-bold">{editingShift ? 'تعديل الوردية' : 'إضافة وردية جديدة'}</h3>
                </div>
                <div className="grid gap-4 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الكود</Label>
                      <Input
                        value={shiftForm.code}
                        onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value })}
                        placeholder="أدخل..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع الوردية</Label>
                      <Select
                        value={shiftForm.shiftType}
                        onValueChange={(value: any) => setShiftForm({ ...shiftForm, shiftType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`h-4 w-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الوردية (عربي)</Label>
                      <Input
                        value={shiftForm.name}
                        onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                        placeholder="الوردية الصباحية"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الوردية (إنجليزي)</Label>
                      <Input
                        value={shiftForm.nameEn}
                        onChange={(e) => setShiftForm({ ...shiftForm, nameEn: e.target.value })}
                        placeholder="أدخل..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={shiftForm.description}
                      onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                      placeholder="وصف الوردية..."
                    />
                  </div>

                  {/* Time Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">أوقات العمل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>وقت البداية</Label>
                          <Input
                            type="time"
                            value={shiftForm.startTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>وقت النهاية</Label>
                          <Input
                            type="time"
                            value={shiftForm.endTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                          />
                        </div>
                      </div>

                      {shiftForm.shiftType === 'flexible' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>أقل وقت حضور مرن</Label>
                              <Input
                                type="time"
                                value={shiftForm.flexibleStartMin}
                                onChange={(e) => setShiftForm({ ...shiftForm, flexibleStartMin: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>أقصى وقت حضور مرن</Label>
                              <Input
                                type="time"
                                value={shiftForm.flexibleStartMax}
                                onChange={(e) => setShiftForm({ ...shiftForm, flexibleStartMax: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>أقل وقت انصراف مرن</Label>
                              <Input
                                type="time"
                                value={shiftForm.flexibleEndMin}
                                onChange={(e) => setShiftForm({ ...shiftForm, flexibleEndMin: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>أقصى وقت انصراف مرن</Label>
                              <Input
                                type="time"
                                value={shiftForm.flexibleEndMax}
                                onChange={(e) => setShiftForm({ ...shiftForm, flexibleEndMax: e.target.value })}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Grace Period Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">فترات السماح</CardTitle>
                      <CardDescription>تحديد فترات السماح للحضور والانصراف</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>سماح قبل الوردية (دقيقة)</Label>
                          <Input
                            type="number"
                            value={shiftForm.graceMinutesBefore}
                            onChange={(e) => setShiftForm({ ...shiftForm, graceMinutesBefore: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">مسموح الحضور قبل {shiftForm.graceMinutesBefore} دقيقة</p>
                        </div>
                        <div className="space-y-2">
                          <Label>سماح بعد الوردية (دقيقة)</Label>
                          <Input
                            type="number"
                            value={shiftForm.graceMinutesAfter}
                            onChange={(e) => setShiftForm({ ...shiftForm, graceMinutesAfter: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">مسموح الحضور بعد {shiftForm.graceMinutesAfter} دقيقة</p>
                        </div>
                        <div className="space-y-2">
                          <Label>سماح الانصراف المبكر (دقيقة)</Label>
                          <Input
                            type="number"
                            value={shiftForm.earlyLeaveGrace}
                            onChange={(e) => setShiftForm({ ...shiftForm, earlyLeaveGrace: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Hours */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">ساعات العمل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>ساعات العمل المطلوبة</Label>
                          <Input
                            value={shiftForm.requiredWorkHours}
                            onChange={(e) => setShiftForm({ ...shiftForm, requiredWorkHours: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>الحد الأدنى للساعات</Label>
                          <Input
                            value={shiftForm.minWorkHours}
                            onChange={(e) => setShiftForm({ ...shiftForm, minWorkHours: e.target.value })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Break Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">فترة الاستراحة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>مدة الاستراحة (دقيقة)</Label>
                          <Input
                            type="number"
                            value={shiftForm.breakDurationMinutes}
                            onChange={(e) => setShiftForm({ ...shiftForm, breakDurationMinutes: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>بداية الاستراحة</Label>
                          <Input
                            type="time"
                            value={shiftForm.breakStartTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, breakStartTime: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>نهاية الاستراحة</Label>
                          <Input
                            type="time"
                            value={shiftForm.breakEndTime}
                            onChange={(e) => setShiftForm({ ...shiftForm, breakEndTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={shiftForm.isBreakPaid}
                          onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isBreakPaid: checked })}
                        />
                        <Label>الاستراحة مدفوعة</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Days */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">أيام العمل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => (
                          <Badge
                            key={day.value}
                            variant={shiftForm.workDays.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (shiftForm.workDays.includes(day.value)) {
                                setShiftForm({
                                  ...shiftForm,
                                  workDays: shiftForm.workDays.filter(d => d !== day.value)
                                });
                              } else {
                                setShiftForm({
                                  ...shiftForm,
                                  workDays: [...shiftForm.workDays, day.value]
                                });
                              }
                            }}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overtime Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">العمل الإضافي</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={shiftForm.allowOvertime}
                          onCheckedChange={(checked) => setShiftForm({ ...shiftForm, allowOvertime: checked })}
                        />
                        <Label>السماح بالعمل الإضافي</Label>
                      </div>
                      {shiftForm.allowOvertime && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>الحد الأقصى للساعات الإضافية</Label>
                            <Input
                              value={shiftForm.maxOvertimeHours}
                              onChange={(e) => setShiftForm({ ...shiftForm, maxOvertimeHours: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>معامل الساعة الإضافية</Label>
                            <Input
                              value={shiftForm.overtimeMultiplier}
                              onChange={(e) => setShiftForm({ ...shiftForm, overtimeMultiplier: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={shiftForm.isActive}
                        onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isActive: checked })}
                      />
                      <Label>نشط</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={shiftForm.isDefault}
                        onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isDefault: checked })}
                      />
                      <Label>الوردية الافتراضية</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                  <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleShiftSubmit} disabled={createShiftMutation.isPending || updateShiftMutation.isPending}>
                    {editingShift ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </div>
            </div>)}
          </div>

          {/* Shifts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>وقت البداية</TableHead>
                    <TableHead>وقت النهاية</TableHead>
                    <TableHead>فترة السماح</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        جاري التحميل...
                      </TableCell>
                    </TableRow>
                  ) : shifts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                          <p>لا توجد ورديات</p>
                          <Button variant="outline" size="sm" onClick={() => seedDefaultsMutation.mutate({})}>
                            تهيئة البيانات الافتراضية
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    shifts?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((shift: any) => {
                      const typeInfo = getShiftTypeInfo(shift.shiftType);
                      return (
                        <TableRow key={shift.id}>
                          <TableCell className="font-mono">{shift.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {shift.name}
                              {shift.isDefault && (
                                <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
                              {typeInfo.label}
                            </div>
                          </TableCell>
                          <TableCell>{shift.startTime}</TableCell>
                          <TableCell>{shift.endTime}</TableCell>
                          <TableCell>
                            <span className="text-xs">
                              قبل {shift.graceMinutesBefore}د / بعد {shift.graceMinutesAfter}د
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={shift.isActive ? "default" : "secondary"}>
                              {shift.isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditShift(shift)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                if (confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
                                    try {
                                await deleteShiftMutation.mutateAsync(shift.id);
                              toast.success("تم حذف الوردية بنجاح");
                              refetchShifts();
                                    } catch (error: any) {
                                toast.error(error.message || "حدث خطأ");
                                    }
                                  }
                                }}
                              >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                );
                    })
                  )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Policies Tab */}
      <TabsContent value="policies" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">سياسات الحضور والانصراف</h3>
          {isPolicyDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">

            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">{editingPolicy ? 'تعديل السياسة' : 'إضافة سياسة جديدة'}</h3>
              </div>
              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكود</Label>
                    <Input
                      value={policyForm.code}
                      onChange={(e) => setPolicyForm({ ...policyForm, code: e.target.value })}
                      placeholder="أدخل..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم السياسة</Label>
                    <Input
                      value={policyForm.name}
                      onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                      placeholder="السياسة الافتراضية"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={policyForm.description}
                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                    placeholder="وصف السياسة..."
                  />
                </div>

                {/* Late Thresholds */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      حدود التأخير
                    </CardTitle>
                    <CardDescription>تحديد متى يُعتبر الموظف متأخراً</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>حد التأخير (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.lateThresholdMinutes}
                          onChange={(e) => setPolicyForm({ ...policyForm, lateThresholdMinutes: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">بعد {policyForm.lateThresholdMinutes} دقيقة = تأخير</p>
                      </div>
                      <div className="space-y-2">
                        <Label>حد التأخير الشديد (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.severeLateThresholdMinutes}
                          onChange={(e) => setPolicyForm({ ...policyForm, severeLateThresholdMinutes: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">بعد {policyForm.severeLateThresholdMinutes} دقيقة = تأخير شديد</p>
                      </div>
                      <div className="space-y-2">
                        <Label>حد الغياب (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.absenceAfterLateMinutes}
                          onChange={(e) => setPolicyForm({ ...policyForm, absenceAfterLateMinutes: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">بعد {policyForm.absenceAfterLateMinutes} دقيقة = غياب</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>الحد الأقصى للتأخير الشهري (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.maxLateMinutesPerMonth}
                          onChange={(e) => setPolicyForm({ ...policyForm, maxLateMinutesPerMonth: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>أيام الغياب المتتالية للإنذار</Label>
                        <Input
                          type="number"
                          value={policyForm.consecutiveAbsenceDays}
                          onChange={(e) => setPolicyForm({ ...policyForm, consecutiveAbsenceDays: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Early Leave */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">الانصراف المبكر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>حد الانصراف المبكر (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.earlyLeaveThresholdMinutes}
                          onChange={(e) => setPolicyForm({ ...policyForm, earlyLeaveThresholdMinutes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>حد الانصراف المبكر الشديد (دقيقة)</Label>
                        <Input
                          type="number"
                          value={policyForm.severeEarlyLeaveMinutes}
                          onChange={(e) => setPolicyForm({ ...policyForm, severeEarlyLeaveMinutes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deductions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">الخصومات التلقائية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={policyForm.enableAutoDeduction}
                        onCheckedChange={(checked) => setPolicyForm({ ...policyForm, enableAutoDeduction: checked })}
                      />
                      <Label>تفعيل الخصم التلقائي</Label>
                    </div>
                    {policyForm.enableAutoDeduction && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>خصم لكل دقيقة تأخير</Label>
                          <Input
                            value={policyForm.lateDeductionPerMinute}
                            onChange={(e) => setPolicyForm({ ...policyForm, lateDeductionPerMinute: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>خصم ثابت للتأخير</Label>
                          <Input
                            value={policyForm.lateDeductionFixed}
                            onChange={(e) => setPolicyForm({ ...policyForm, lateDeductionFixed: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>خصم الغياب (أيام)</Label>
                          <Input
                            value={policyForm.absenceDeductionDays}
                            onChange={(e) => setPolicyForm({ ...policyForm, absenceDeductionDays: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Auto Violation */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">المخالفات التلقائية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={policyForm.enableAutoViolation}
                        onCheckedChange={(checked) => setPolicyForm({ ...policyForm, enableAutoViolation: checked })}
                      />
                      <Label>تفعيل إنشاء المخالفات تلقائياً</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">التحقق من الموقع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={policyForm.requireCheckInLocation}
                        onCheckedChange={(checked) => setPolicyForm({ ...policyForm, requireCheckInLocation: checked })}
                      />
                      <Label>إلزام التسجيل من موقع محدد</Label>
                    </div>
                    {policyForm.requireCheckInLocation && (
                      <div className="space-y-2">
                        <Label>نطاق الموقع المسموح (متر)</Label>
                        <Input
                          type="number"
                          value={policyForm.allowedLocationRadius}
                          onChange={(e) => setPolicyForm({ ...policyForm, allowedLocationRadius: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policyForm.isActive}
                      onCheckedChange={(checked) => setPolicyForm({ ...policyForm, isActive: checked })}
                    />
                    <Label>نشط</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policyForm.isDefault}
                      onCheckedChange={(checked) => setPolicyForm({ ...policyForm, isDefault: checked })}
                    />
                    <Label>السياسة الافتراضية</Label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => setIsPolicyDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handlePolicySubmit} disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}>
                  {editingPolicy ? 'تحديث' : 'إنشاء'}
                </Button>
              </div>
            </div>
          </div>)}
        </div>

        {/* Policies Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>حد التأخير</TableHead>
                  <TableHead>حد الغياب</TableHead>
                  <TableHead>الخصم التلقائي</TableHead>
                  <TableHead>المخالفات التلقائية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policiesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : policies?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-8 w-8 text-muted-foreground" />
                        <p>لا توجد سياسات</p>
                        <Button variant="outline" size="sm" onClick={handleSeedDefaults}>
                          تهيئة البيانات الافتراضية
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  policies?.map((policy: any) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono">{policy.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {policy.name}
                          {policy.isDefault && (
                            <Badge variant="secondary" className="text-xs">افتراضي</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{policy.lateThresholdMinutes} دقيقة</TableCell>
                      <TableCell>{policy.absenceAfterLateMinutes} دقيقة</TableCell>
                      <TableCell>
                        {policy.enableAutoDeduction ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {policy.enableAutoViolation ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditPolicy(policy)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            if (confirm('هل أنت متأكد من حذف هذه السياسة؟')) {
                                try {
                            await deletePolicyMutation.mutateAsync(policy.id);
                          toast.success("تم حذف السياسة بنجاح");
                          refetchPolicies();
                                } catch (error: any) {
                            toast.error(error.message || "حدث خطأ");
                                }
                              }
                          >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
              ))
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
    </Tabs >
    </div >
  );
}
