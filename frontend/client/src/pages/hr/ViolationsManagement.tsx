import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Plus, AlertTriangle, Gavel, TrendingUp, FileText, Search, Filter, MoreHorizontal, Eye, CheckCircle, XCircle, Scale, Settings, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { PrintButton } from "@/components/PrintButton";

// Types
interface ViolationType {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  category: string;
  severity: string;
  isActive: boolean;
}

interface PenaltyType {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  level: number;
  deductionType: string;
  deductionValue: string | null;
  isActive: boolean;
}

interface EmployeeViolation {
  id: number;
  violationNumber: string;
  employeeId: number;
  violationTypeId: number;
  violationDate: Date;
  status: string;
  occurrenceCount: number;
}

interface EmployeePenalty {
  id: number;
  penaltyNumber: string;
  employeeId: number;
  penaltyTypeId: number;
  penaltyDate: Date;
  status: string;
  deductionAmount: string | null;
}

const severityColors: Record<string, string> = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  reported: 'bg-gray-100 text-gray-800',
  investigating: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-red-100 text-red-800',
  dismissed: 'bg-green-100 text-green-800',
  appealed: 'bg-purple-100 text-purple-800',
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  executed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  reported: 'تم الإبلاغ',
  investigating: 'قيد التحقيق',
  confirmed: 'مؤكدة',
  dismissed: 'مرفوضة',
  appealed: 'مستأنفة',
  draft: 'مسودة',
  pending_approval: 'بانتظار الموافقة',
  approved: 'معتمد',
  executed: 'منفذ',
  cancelled: 'ملغي',
};

// Role-based permissions
type UserRole = 'admin' | 'hr_manager' | 'supervisor' | 'employee';

interface RolePermissions {
  canViewAll: boolean;
  canRegisterViolation: boolean;
  canConfirmViolation: boolean;
  canApprovePenalty: boolean;
  canExecutePenalty: boolean;
  canManageTypes: boolean;
  canManageEscalation: boolean;
  canDecideAppeal: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAll: true,
    canRegisterViolation: true,
    canConfirmViolation: true,
    canApprovePenalty: true,
    canExecutePenalty: true,
    canManageTypes: true,
    canManageEscalation: true,
    canDecideAppeal: true,
  },
  hr_manager: {
    canViewAll: true,
    canRegisterViolation: true,
    canConfirmViolation: true,
    canApprovePenalty: true,
    canExecutePenalty: true,
    canManageTypes: true,
    canManageEscalation: true,
    canDecideAppeal: true,
  },
  supervisor: {
    canViewAll: false, // Only their team
    canRegisterViolation: true,
    canConfirmViolation: false,
    canApprovePenalty: false,
    canExecutePenalty: false,
    canManageTypes: false,
    canManageEscalation: false,
    canDecideAppeal: false,
  },
  employee: {
    canViewAll: false,
    canRegisterViolation: false,
    canConfirmViolation: false,
    canApprovePenalty: false,
    canExecutePenalty: false,
    canManageTypes: false,
    canManageEscalation: false,
    canDecideAppeal: false,
  },
};

export default function ViolationsManagement() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('violations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddViolationOpen, setIsAddViolationOpen] = useState(false);
  const [isAddPenaltyOpen, setIsAddPenaltyOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [newViolation, setNewViolation] = useState({
    employeeId: 0,
    violationTypeId: 0,
    violationDate: '',
    description: ''
  });

  // Determine user role and permissions
  const userRole: UserRole = (user?.role as UserRole) || 'employee';
  const permissions = rolePermissions[userRole] || rolePermissions.employee;

  // Fetch data
  const { data: violationTypes, isLoading: loadingViolationTypes, isError, error} = useQuery({
    queryKey: ['violationTypes'],
    queryFn: () => api.get('/hr/control-kernel/violation-types').then(res => res.data),
  });
  const { data: penaltyTypes, isLoading: loadingPenaltyTypes } = useQuery({
    queryKey: ['penaltyTypes'],
    queryFn: () => api.get('/hr/control-kernel/penalty-types').then(res => res.data),
  });
  const { data: violations, isLoading: loadingViolations, refetch: refetchViolations } = useQuery({
    queryKey: ['violations'],
    queryFn: () => api.get('/hr/control-kernel/violations').then(res => res.data),
  });
  const { data: penalties, isLoading: loadingPenalties, refetch: refetchPenalties } = useQuery({
    queryKey: ['penalties'],
    queryFn: () => api.get('/hr/control-kernel/penalties').then(res => res.data),
  });
  const { data: escalationRules } = useQuery({
    queryKey: ['escalationRules'],
    queryFn: () => api.get('/hr/control-kernel/escalation').then(res => res.data),
  });

  // Mutations
  const confirmViolation = useMutation({
    mutationFn: (data: { id: number }) => api.post(`/hr/control-kernel/violations/${data.id}/confirm`).then(res => res.data),
    onSuccess: () => {
      toast.success('تم تأكيد المخالفة وإنشاء الجزاء');
      refetchViolations();
      refetchPenalties();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const approvePenalty = useMutation({
    mutationFn: (data: { id: number }) => api.post(`/hr/control-kernel/penalties/${data.id}/approve`).then(res => res.data),
    onSuccess: () => {
      toast.success('تم اعتماد الجزاء');
      refetchPenalties();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const executePenalty = useMutation({
    mutationFn: (data: { id: number }) => api.post(`/hr/control-kernel/penalties/${data.id}/execute`).then(res => res.data),
    onSuccess: () => {
      toast.success('تم تنفيذ الجزاء');
      refetchPenalties();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const createViolation = useMutation({
    mutationFn: (data: any) => api.post('/hr/control-kernel/violations', data).then(res => res.data),
    onSuccess: () => {
      toast.success('تم تسجيل المخالفة بنجاح');
      setIsAddViolationOpen(false);
      setNewViolation({ employeeId: 0, violationTypeId: 0, violationDate: '', description: '' });
      refetchViolations();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const handleCreateViolation = () => {
    if (!newViolation.employeeId || !newViolation.violationTypeId || !newViolation.violationDate) {
      toast.error('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }
    createViolation.mutate({
      employeeId: newViolation.employeeId,
      violationTypeId: newViolation.violationTypeId,
      violationDate: new Date(newViolation.violationDate),
      description: newViolation.description,
    });
  };

  // Stats
  const stats = {
    totalViolations: violations?.length || 0,
    pendingViolations: violations?.filter(v => v.status === 'reported' || v.status === 'investigating').length || 0,
    confirmedViolations: violations?.filter(v => v.status === 'confirmed').length || 0,
    totalPenalties: penalties?.length || 0,
    pendingPenalties: penalties?.filter(p => p.status === 'pending_approval').length || 0,
    executedPenalties: penalties?.filter(p => p.status === 'executed').length || 0,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hr">
            <Button variant="ghost" size="icon" aria-label="إضافة">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">نواة التحكم - المخالفات والجزاءات</h1>
            <p className="text-muted-foreground">إدارة المخالفات والجزاءات وسلم العقوبات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hr/violations/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 ms-2" />
              الإعدادات
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي المخالفات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalViolations}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingViolations} قيد المراجعة
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">المخالفات المؤكدة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.confirmedViolations}</h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-50">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الجزاءات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalPenalties}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingPenalties} بانتظار الموافقة
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <Gavel className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الجزاءات المنفذة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.executedPenalties}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <Scale className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>سجل المخالفات والجزاءات</CardTitle>
              <PrintButton title="سجل المخالفات والجزاءات" />
              <CardDescription>إدارة ومتابعة المخالفات والجزاءات</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon" aria-label="تصفية">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="violations" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                المخالفات
              </TabsTrigger>
              <TabsTrigger value="penalties" className="gap-2">
                <Gavel className="h-4 w-4" />
                الجزاءات
              </TabsTrigger>
              {permissions.canManageTypes && (
              <TabsTrigger value="types" className="gap-2">
                <FileText className="h-4 w-4" />
                الأنواع
              </TabsTrigger>
              )}
              {permissions.canManageEscalation && (
              <TabsTrigger value="escalation" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                سلم العقوبات
              </TabsTrigger>
              )}
            </TabsList>

            {/* Violations Tab */}
            <TabsContent value="violations">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="ms-2">
                    <Shield className="h-3 w-3 ms-1" />
                    {userRole === 'admin' ? 'مدير النظام' : 
                     userRole === 'hr_manager' ? 'مدير الموارد البشرية' :
                     userRole === 'supervisor' ? 'مشرف' : 'موظف'}
                  </Badge>
                </div>
                {permissions.canRegisterViolation && (
                <Dialog open={isAddViolationOpen} onOpenChange={setIsAddViolationOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ms-2" />
                      تسجيل مخالفة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>تسجيل مخالفة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات المخالفة
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>الموظف</Label>
                        <Select 
                          value={newViolation.employeeId ? String(newViolation.employeeId) : ''} 
                          onValueChange={(v) => setNewViolation({...newViolation, employeeId: Number(v)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">أحمد محمد</SelectItem>
                            <SelectItem value="2">سارة علي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>نوع المخالفة</Label>
                        <Select
                          value={newViolation.violationTypeId ? String(newViolation.violationTypeId) : ''}
                          onValueChange={(v) => setNewViolation({...newViolation, violationTypeId: Number(v)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المخالفة" />
                          </SelectTrigger>
                          <SelectContent>
                            {violationTypes?.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>تاريخ المخالفة</Label>
                        <Input 
                          type="date" 
                          value={newViolation.violationDate}
                          onChange={(e) => setNewViolation({...newViolation, violationDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الوصف</Label>
                        <Textarea 
                          placeholder="وصف المخالفة..." 
                          value={newViolation.description}
                          onChange={(e) => setNewViolation({...newViolation, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddViolationOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleCreateViolation} disabled={createViolation.isPending}>
                        تسجيل
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>

              {loadingViolations ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : violations && violations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المخالفة</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>نوع المخالفة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>التكرار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="font-medium">{violation.violationNumber}</TableCell>
                        <TableCell>موظف #{violation.employeeId}</TableCell>
                        <TableCell>
                          {violationTypes?.find(t => t.id === violation.violationTypeId)?.nameAr || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(violation.violationDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{violation.occurrenceCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[violation.status] || 'bg-gray-100'}>
                            {statusLabels[violation.status] || violation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="إضافة">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailItem(violation)}>
                                <Eye className="h-4 w-4 ms-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              {violation.status === 'reported' && permissions.canConfirmViolation && (
                                <DropdownMenuItem
                                  onClick={() => confirmViolation.mutate({ id: violation.id })}
                                >
                                  <CheckCircle className="h-4 w-4 ms-2" />
                                  تأكيد المخالفة
                                </DropdownMenuItem>
                              )}
                              {permissions.canConfirmViolation && (
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="h-4 w-4 ms-2" />
                                رفض المخالفة
                              </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">لا توجد مخالفات</h3>
                  <p className="text-muted-foreground">لم يتم تسجيل أي مخالفات بعد</p>
                </div>
              )}
            </TabsContent>

            {/* Penalties Tab */}
            <TabsContent value="penalties">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  {!permissions.canApprovePenalty && (
                    <span className="text-yellow-600">ليس لديك صلاحية اعتماد الجزاءات</span>
                  )}
                </div>
                {permissions.canApprovePenalty && (
                <Dialog open={isAddPenaltyOpen} onOpenChange={setIsAddPenaltyOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ms-2" />
                      إضافة جزاء
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة جزاء جديد</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات الجزاء
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>الموظف</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">أحمد محمد</SelectItem>
                            <SelectItem value="2">سارة علي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>نوع الجزاء</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الجزاء" />
                          </SelectTrigger>
                          <SelectContent>
                            {penaltyTypes?.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>السبب</Label>
                        <Textarea placeholder="سبب الجزاء..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPenaltyOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={() => {
                        toast.success('تم إضافة الجزاء');
                        setIsAddPenaltyOpen(false);
                      }}>
                        إضافة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>

              {loadingPenalties ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : penalties && penalties.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الجزاء</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>نوع الجزاء</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[100px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {penalties.map((penalty) => (
                      <TableRow key={penalty.id}>
                        <TableCell className="font-medium">{penalty.penaltyNumber}</TableCell>
                        <TableCell>موظف #{penalty.employeeId}</TableCell>
                        <TableCell>
                          {penaltyTypes?.find(t => t.id === penalty.penaltyTypeId)?.nameAr || '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(penalty.penaltyDate)}
                        </TableCell>
                        <TableCell>
                          {penalty.deductionAmount ? `${penalty.deductionAmount} ر.س` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[penalty.status] || 'bg-gray-100'}>
                            {statusLabels[penalty.status] || penalty.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="عرض">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailItem(penalty)}>
                                <Eye className="h-4 w-4 ms-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              {penalty.status === 'pending_approval' && permissions.canApprovePenalty && (
                                <DropdownMenuItem
                                  onClick={() => approvePenalty.mutate({ id: penalty.id })}
                                >
                                  <CheckCircle className="h-4 w-4 ms-2" />
                                  اعتماد الجزاء
                                </DropdownMenuItem>
                              )}
                              {penalty.status === 'approved' && permissions.canExecutePenalty && (
                                <DropdownMenuItem
                                  onClick={() => executePenalty.mutate({ id: penalty.id })}
                                >
                                  <Scale className="h-4 w-4 ms-2" />
                                  تنفيذ الجزاء
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">لا توجد جزاءات</h3>
                  <p className="text-muted-foreground">لم يتم تسجيل أي جزاءات بعد</p>
                </div>
              )}
            </TabsContent>

            {/* Types Tab */}
            <TabsContent value="types">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Violation Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      أنواع المخالفات
                    </CardTitle>
                    <CardDescription>
                      {violationTypes?.length || 0} نوع مخالفة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingViolationTypes ? (
                      <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
                    ) : violationTypes && violationTypes.length > 0 ? (
                      <div className="space-y-3">
                        {violationTypes.map((type) => (
                          <div key={type.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{type.nameAr}</p>
                              <p className="text-sm text-muted-foreground">{type.code}</p>
                            </div>
                            <Badge className={severityColors[type.severity] || 'bg-gray-100'}>
                              {type.severity === 'minor' && 'بسيطة'}
                              {type.severity === 'moderate' && 'متوسطة'}
                              {type.severity === 'major' && 'كبيرة'}
                              {type.severity === 'critical' && 'حرجة'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        لا توجد أنواع مخالفات
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Penalty Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-purple-500" />
                      أنواع الجزاءات
                    </CardTitle>
                    <CardDescription>
                      {penaltyTypes?.length || 0} نوع جزاء
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPenaltyTypes ? (
                      <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
                    ) : penaltyTypes && penaltyTypes.length > 0 ? (
                      <div className="space-y-3">
                        {penaltyTypes.map((type) => (
                          <div key={type.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{type.nameAr}</p>
                              <p className="text-sm text-muted-foreground">
                                المستوى {type.level}
                                {type.deductionValue && ` - ${type.deductionValue} ${type.deductionType === 'days' ? 'يوم' : 'ر.س'}`}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {type.code}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        لا توجد أنواع جزاءات
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Escalation Tab */}
            <TabsContent value="escalation">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    سلم العقوبات التصاعدي
                  </CardTitle>
                  <CardDescription>
                    يحدد الجزاء المناسب تلقائياً حسب عدد تكرارات المخالفة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {escalationRules && escalationRules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نوع المخالفة</TableHead>
                          <TableHead>رقم التكرار</TableHead>
                          <TableHead>الجزاء</TableHead>
                          <TableHead>الفترة (شهر)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {escalationRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>
                              {violationTypes?.find(t => t.id === rule.violationTypeId)?.nameAr || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">التكرار {rule.occurrenceNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              {penaltyTypes?.find(t => t.id === rule.penaltyTypeId)?.nameAr || '-'}
                            </TableCell>
                            <TableCell>{rule.periodMonths || 12}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">لا توجد قواعد تصعيد</h3>
                      <p className="text-muted-foreground mb-4">
                        قم بتهيئة البيانات الافتراضية لإنشاء سلم العقوبات
                      </p>
                      <SeedDefaultsButton />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* تفاصيل المخالفة/الجزاء */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{detailItem.violationType ? 'تفاصيل المخالفة' : 'تفاصيل الجزاء'}</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {detailItem.violationType && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">نوع المخالفة</span><p className="font-bold">{detailItem.violationType}</p></div>}
                {detailItem.penaltyType && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">نوع الجزاء</span><p className="font-bold">{detailItem.penaltyType}</p></div>}
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الحالة</span><p className="font-bold">{detailItem.status || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">التاريخ</span><p className="font-bold">{detailItem.createdAt ? formatDate(detailItem.createdAt) : '—'}</p></div>
                {detailItem.employeeId && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم الموظف</span><p className="font-bold">{detailItem.employeeId}</p></div>}
                {detailItem.deductionAmount && <div className="bg-red-50 p-3 rounded"><span className="text-sm text-red-500">مبلغ الخصم</span><p className="font-bold text-red-700">{detailItem.deductionAmount} ر.س</p></div>}
              </div>
              {detailItem.description && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الوصف</span><p>{detailItem.description}</p></div>}
              {detailItem.notes && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">ملاحظات</span><p>{detailItem.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeedDefaultsButton() {
  const seedDefaults = useMutation({
    mutationFn: (data: any) => api.post('/hr/control-kernel/seed-defaults', data).then(res => res.data),
    onSuccess: (data) => {
      toast.success('تم تهيئة البيانات الافتراضية بنجاح');
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  return (
    <Button disabled={seedDefaults.isPending}
      onClick={() => seedDefaults.mutate({})}
      disabled={seedDefaults.isPending}
    >
      {seedDefaults.isPending ? 'جاري التهيئة...' : 'تهيئة البيانات الافتراضية'}
    </Button>
  );
}
