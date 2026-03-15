import { useAppContext } from '@/contexts/AppContext';
import { generateNextCode } from '@/lib/generateCode';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Edit2, Trash2, Settings, CheckCircle2, XCircle, Sun, Moon, Sunrise, RefreshCw, Users, Timer, Shield } from "lucide-react";

const shiftTypes = [
  { value: 'regular', label: 'وردية عادية', icon: Sun, color: 'text-amber-500' },
  { value: 'flexible', label: 'وردية مرنة', icon: RefreshCw, color: 'text-blue-500' },
  { value: 'night', label: 'وردية ليلية', icon: Moon, color: 'text-purple-500' },
  { value: 'split', label: 'وردية مقسمة', icon: Sunrise, color: 'text-orange-500' },
  { value: 'rotating', label: 'وردية متناوبة', icon: RefreshCw, color: 'text-green-500' },
];

const weekDays = [
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
];

const defaultShiftForm = {
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
  policyId: '' as string | number,
};

const defaultPolicyForm = {
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
  absenceDeductionAmount: '0.00',
  enableAutoViolation: true,
  requireCheckInLocation: false,
  allowedLocationRadius: 100,
  isActive: true,
  isDefault: false,
};

export default function ShiftsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();

  const [activeTab, setActiveTab] = useState("shifts");
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  const { data: shifts, isLoading: shiftsLoading, refetch: refetchShifts, isError } = useShifts();
  const { data: policies, isLoading: policiesLoading, refetch: refetchPolicies } = useAttendancePolicies();

  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();
  const createPolicyMutation = useCreatePolicy();
  const updatePolicyMutation = useUpdatePolicy();
  const deletePolicyMutation = useDeletePolicy();
  const seedShiftsMutation = useSeedShifts();
  const seedPoliciesMutation = useSeedPolicies();

  const [shiftForm, setShiftForm] = useState(defaultShiftForm);
  const [policyForm, setPolicyForm] = useState(defaultPolicyForm);

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

  const openNewShift = () => {
    setEditingShift(null);
    setShiftForm({ ...defaultShiftForm, code: generateNextCode('SHIFT', shifts || []) });
    setIsShiftDialogOpen(true);
  };

  const openNewPolicy = () => {
    setEditingPolicy(null);
    setPolicyForm({ ...defaultPolicyForm, code: generateNextCode('APOL', policies || []) });
    setIsPolicyDialogOpen(true);
  };

  const handleShiftSubmit = async () => {
    try {
      const payload = {
        ...shiftForm,
        policyId: shiftForm.policyId !== '' ? shiftForm.policyId : null,
      };
      if (editingShift) {
        await updateShiftMutation.mutateAsync({ id: editingShift.id, ...payload });
        toast.success("تم تحديث الوردية بنجاح");
      } else {
        await createShiftMutation.mutateAsync(payload);
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
      policyId: shift.policy?.id || '',
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
      absenceDeductionAmount: policy.absenceDeductionAmount || '0.00',
      enableAutoViolation: policy.enableAutoViolation ?? true,
      requireCheckInLocation: policy.requireCheckInLocation || false,
      allowedLocationRadius: policy.allowedLocationRadius || 100,
      isActive: policy.isActive ?? true,
      isDefault: policy.isDefault || false,
    });
    setIsPolicyDialogOpen(true);
  };

  const getShiftTypeInfo = (type: string) => shiftTypes.find(t => t.value === type) || shiftTypes[0];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الورديات والسياسات</h2>
          <p className="text-muted-foreground">تحكم في أوقات العمل وسياسات الحضور والانصراف</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button variant="outline" onClick={handleSeedDefaults} disabled={seedShiftsMutation.isPending || seedPoliciesMutation.isPending}>
            <Settings className="h-4 w-4 ms-2" />
            تهيئة البيانات
          </Button>
          <Button onClick={openNewShift}>إضافة وردية</Button>
          <Button variant="secondary" onClick={openNewPolicy}>إضافة سياسة</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
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
              <div className="p-2 bg-green-100 rounded-lg"><Shield className="h-5 w-5 text-green-600" /></div>
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
              <div className="p-2 bg-amber-100 rounded-lg"><Users className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">الوردية الافتراضية</p>
                <p className="text-lg font-medium truncate">{shifts?.find((s: any) => s.isDefault)?.name || 'غير محددة'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Timer className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">السياسة الافتراضية</p>
                <p className="text-lg font-medium truncate">{policies?.find((p: any) => p.isDefault)?.name || 'غير محددة'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Dialog */}
      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShift ? 'تعديل الوردية' : 'إضافة وردية جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input value={shiftForm.code} readOnly={!editingShift} className={!editingShift ? "bg-muted font-mono" : "font-mono"} onChange={(e) => editingShift && setShiftForm({ ...shiftForm, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>نوع الوردية</Label>
                <Select value={shiftForm.shiftType} onValueChange={(v: any) => setShiftForm({ ...shiftForm, shiftType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} placeholder="الوردية الصباحية" />
              </div>
              <div className="space-y-2">
                <Label>اسم الوردية (إنجليزي)</Label>
                <Input value={shiftForm.nameEn} onChange={(e) => setShiftForm({ ...shiftForm, nameEn: e.target.value })} placeholder="Morning Shift" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>سياسة الحضور</Label>
              <Select
                value={shiftForm.policyId !== '' ? String(shiftForm.policyId) : 'none'}
                onValueChange={(v) => setShiftForm({ ...shiftForm, policyId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر سياسة الحضور (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون سياسة</SelectItem>
                  {policies?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={shiftForm.description} onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })} placeholder="وصف الوردية..." />
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">أوقات العمل</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت البداية</Label>
                    <Input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت النهاية</Label>
                    <Input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} />
                  </div>
                </div>
                {shiftForm.shiftType === 'flexible' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>أقل وقت حضور مرن</Label>
                      <Input type="time" value={shiftForm.flexibleStartMin} onChange={(e) => setShiftForm({ ...shiftForm, flexibleStartMin: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>أقصى وقت حضور مرن</Label>
                      <Input type="time" value={shiftForm.flexibleStartMax} onChange={(e) => setShiftForm({ ...shiftForm, flexibleStartMax: e.target.value })} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">فترات السماح</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>سماح قبل (دقيقة)</Label>
                    <Input type="number" value={shiftForm.graceMinutesBefore} onChange={(e) => setShiftForm({ ...shiftForm, graceMinutesBefore: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>سماح بعد (دقيقة)</Label>
                    <Input type="number" value={shiftForm.graceMinutesAfter} onChange={(e) => setShiftForm({ ...shiftForm, graceMinutesAfter: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>سماح انصراف مبكر</Label>
                    <Input type="number" value={shiftForm.earlyLeaveGrace} onChange={(e) => setShiftForm({ ...shiftForm, earlyLeaveGrace: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">أيام العمل</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Badge
                      key={day.value}
                      variant={shiftForm.workDays.includes(day.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (shiftForm.workDays.includes(day.value)) {
                          setShiftForm({ ...shiftForm, workDays: shiftForm.workDays.filter(d => d !== day.value) });
                        } else {
                          setShiftForm({ ...shiftForm, workDays: [...shiftForm.workDays, day.value] });
                        }
                      }}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={shiftForm.isActive} onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isActive: checked })} />
                <Label>نشط</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={shiftForm.isDefault} onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isDefault: checked })} />
                <Label>الوردية الافتراضية</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t justify-end">
              <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleShiftSubmit} disabled={createShiftMutation.isPending || updateShiftMutation.isPending}>
                {editingShift ? 'تحديث الوردية' : 'إنشاء الوردية'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'تعديل السياسة' : 'إضافة سياسة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input value={policyForm.code} readOnly={!editingPolicy} className={!editingPolicy ? "bg-muted font-mono" : "font-mono"} onChange={(e) => editingPolicy && setPolicyForm({ ...policyForm, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>اسم السياسة</Label>
                <Input value={policyForm.name} onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })} placeholder="السياسة الافتراضية" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={policyForm.description} onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })} placeholder="وصف السياسة..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حد التأخير (دقيقة)</Label>
                <Input type="number" value={policyForm.lateThresholdMinutes} onChange={(e) => setPolicyForm({ ...policyForm, lateThresholdMinutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>حد الغياب (دقيقة)</Label>
                <Input type="number" value={policyForm.absenceAfterLateMinutes} onChange={(e) => setPolicyForm({ ...policyForm, absenceAfterLateMinutes: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>خصم ثابت للتأخير (ريال)</Label>
                <Input value={policyForm.lateDeductionFixed} onChange={(e) => setPolicyForm({ ...policyForm, lateDeductionFixed: e.target.value })} placeholder="50.00" />
              </div>
              <div className="space-y-2">
                <Label>خصم الغياب بدون عذر (ريال)</Label>
                <Input value={policyForm.absenceDeductionAmount} onChange={(e) => setPolicyForm({ ...policyForm, absenceDeductionAmount: e.target.value })} placeholder="0.00" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={policyForm.enableAutoDeduction} onCheckedChange={(checked) => setPolicyForm({ ...policyForm, enableAutoDeduction: checked })} />
                <Label>تفعيل الخصم التلقائي</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={policyForm.isActive} onCheckedChange={(checked) => setPolicyForm({ ...policyForm, isActive: checked })} />
                <Label>نشط</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={policyForm.isDefault} onCheckedChange={(checked) => setPolicyForm({ ...policyForm, isDefault: checked })} />
                <Label>السياسة الافتراضية</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t justify-end">
              <Button variant="outline" onClick={() => setIsPolicyDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handlePolicySubmit} disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}>
                {editingPolicy ? 'تحديث السياسة' : 'إنشاء السياسة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full sm:w-64 grid-cols-2">
          <TabsTrigger value="shifts">الورديات</TabsTrigger>
          <TabsTrigger value="policies">السياسات</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>البداية</TableHead>
                    <TableHead>النهاية</TableHead>
                    <TableHead>السياسة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftsLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
                  ) : shifts?.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد ورديات مسجلة</TableCell></TableRow>
                  ) : (
                    shifts?.filter((s: any) => !searchTerm || s.name?.includes(searchTerm) || s.code?.includes(searchTerm)).map((shift: any) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-mono">{shift.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {shift.name}
                            {shift.isDefault && <Badge variant="secondary" className="text-[10px]">افتراضي</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{getShiftTypeInfo(shift.shiftType).label}</TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.endTime}</TableCell>
                        <TableCell>
                          {shift.policy ? (
                            <Badge variant="outline" className="text-xs">{shift.policy.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.isActive ? "default" : "secondary"}>
                            {shift.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-start">
                            <Button variant="ghost" size="icon" onClick={() => openEditShift(shift)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={async () => {
                              if (confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
                                try {
                                  await deleteShiftMutation.mutateAsync(shift.id);
                                  toast.success("تم حذف الوردية بنجاح");
                                  refetchShifts();
                                } catch (error: any) {
                                  toast.error(error.message || "حدث خطأ");
                                }
                              }
                            }}>
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

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>حد التأخير</TableHead>
                    <TableHead>حد الغياب</TableHead>
                    <TableHead>خصم الغياب (ريال)</TableHead>
                    <TableHead>خصم آلي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policiesLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10">جاري التحميل...</TableCell></TableRow>
                  ) : policies?.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد سياسات مسجلة</TableCell></TableRow>
                  ) : (
                    policies?.filter((p: any) => !searchTerm || p.name?.includes(searchTerm) || p.code?.includes(searchTerm)).map((policy: any) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-mono">{policy.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {policy.name}
                            {policy.isDefault && <Badge variant="secondary" className="text-[10px]">افتراضي</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{policy.lateThresholdMinutes} دقيقة</TableCell>
                        <TableCell>{policy.absenceAfterLateMinutes} دقيقة</TableCell>
                        <TableCell>{policy.absenceDeductionAmount ?? '-'}</TableCell>
                        <TableCell>
                          {policy.enableAutoDeduction ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <Badge variant={policy.isActive ? "default" : "secondary"}>
                            {policy.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-start">
                            <Button variant="ghost" size="icon" onClick={() => openEditPolicy(policy)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={async () => {
                              if (confirm('هل أنت متأكد من حذف هذه السياسة؟')) {
                                try {
                                  await deletePolicyMutation.mutateAsync(policy.id);
                                  toast.success("تم حذف السياسة بنجاح");
                                  refetchPolicies();
                                } catch (error: any) {
                                  toast.error(error.message || "حدث خطأ");
                                }
                              }
                            }}>
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
      </Tabs>
    </div>
  );
}
