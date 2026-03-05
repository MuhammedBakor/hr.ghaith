import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, AlertTriangle, Loader2, Shield, Gauge, Zap, Inbox, Eye, Trash2, CheckCircle } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

export default function FleetTripRisk() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });
  const { data: driversData } = useQuery({
    queryKey: ['fleet-extended', 'drivers'],
    queryFn: () => api.get('/api/fleet-extended/drivers').then(r => r.data),
  });
  const { data: assessmentsData, isLoading, refetch } = useQuery({
    queryKey: ['fleet', 'risk-assessments', filterLevel],
    queryFn: () => api.get('/api/fleet/risk-assessments', { params: filterLevel !== 'all' ? { riskLevel: filterLevel } : undefined }).then(r => r.data),
  });
  const { data: statsData } = useQuery({
    queryKey: ['fleet', 'risk-assessments', 'stats'],
    queryFn: () => api.get('/api/fleet/risk-assessments/stats').then(r => r.data),
  });

  const vehicles = vehiclesData || [];
  const drivers = driversData || [];
  const assessments = assessmentsData || [];
  const stats = statsData || { total: 0, low: 0, medium: 0, high: 0, critical: 0, avgScore: 0 };

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    riskScore: '50',
    speedingScore: '0',
    brakingScore: '0',
    accelerationScore: '0',
    corneringScore: '0',
    fatigueScore: '0',
    tripDistance: '',
    tripDuration: '',
    maxSpeed: '',
    avgSpeed: '',
    speedingEvents: '0',
    harshBrakingEvents: '0',
    harshAccelerationEvents: '0',
    harshCorneringEvents: '0',
    recommendations: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet/risk-assessments', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء تقييم المخاطر بنجاح');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/fleet/risk-assessments/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث التقييم بنجاح');
      setSelectedAssessment(null);
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/api/fleet/risk-assessments/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف التقييم بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      riskScore: '50',
      speedingScore: '0',
      brakingScore: '0',
      accelerationScore: '0',
      corneringScore: '0',
      fatigueScore: '0',
      tripDistance: '',
      tripDuration: '',
      maxSpeed: '',
      avgSpeed: '',
      speedingEvents: '0',
      harshBrakingEvents: '0',
      harshAccelerationEvents: '0',
      harshCorneringEvents: '0',
      recommendations: '',
    });
  };

  const handleCreate = () => {
    if (!formData.vehicleId) {
      toast.error('يرجى اختيار المركبة');
      return;
    }
    createMutation.mutate({
      vehicleId: parseInt(formData.vehicleId),
      driverId: formData.driverId ? parseInt(formData.driverId) : undefined,
      riskScore: parseInt(formData.riskScore),
      speedingScore: parseInt(formData.speedingScore),
      brakingScore: parseInt(formData.brakingScore),
      accelerationScore: parseInt(formData.accelerationScore),
      corneringScore: parseInt(formData.corneringScore),
      fatigueScore: parseInt(formData.fatigueScore),
      tripDistance: formData.tripDistance || undefined,
      tripDuration: formData.tripDuration ? parseInt(formData.tripDuration) : undefined,
      maxSpeed: formData.maxSpeed ? parseInt(formData.maxSpeed) : undefined,
      avgSpeed: formData.avgSpeed ? parseInt(formData.avgSpeed) : undefined,
      speedingEvents: parseInt(formData.speedingEvents),
      harshBrakingEvents: parseInt(formData.harshBrakingEvents),
      harshAccelerationEvents: parseInt(formData.harshAccelerationEvents),
      harshCorneringEvents: parseInt(formData.harshCorneringEvents),
      recommendations: formData.recommendations || undefined,
    });
  };

  const handleMarkReviewed = (id: number) => {
    updateMutation.mutate({ id, status: 'reviewed' });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const getVehiclePlate = (vehicleId: number) => {
    const vehicle = vehicles.find((v: any) => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '-';
  };

  const getDriverName = (driverId: number | null) => {
    if (!driverId) return '-';
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver ? driver.licenseNumber : '-';
  };

  const getRiskLevelBadge = (level: string, score: number) => {
    const levels: Record<string, { label: string; color: string }> = {
      low: { label: 'منخفض', color: 'bg-green-100 text-green-800' },
      medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'مرتفع', color: 'bg-orange-100 text-orange-800' },
      critical: { label: 'حرج', color: 'bg-red-100 text-red-800' },
    };
    const l = levels[level] || levels.low;
    return <Badge className={l.color}>{l.label} ({score}%)</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
      reviewed: { label: 'تمت المراجعة', color: 'bg-blue-100 text-blue-800' },
      actioned: { label: 'تم اتخاذ إجراء', color: 'bg-green-100 text-green-800' },
    };
    const s = statuses[status] || statuses.pending;
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" dir="rtl"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تقييم مخاطر الرحلات</h2>
          <p className="text-muted-foreground">تحليل وتقييم مخاطر رحلات الأسطول</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصفية حسب المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="low">منخفض</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">مرتفع</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ms-2" />
            تقييم جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Gauge className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مخاطر منخفضة</p>
              <p className="text-2xl font-bold">{stats.low}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مخاطر مرتفعة/حرجة</p>
              <p className="text-2xl font-bold">{stats.high + stats.critical}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوسط الدرجة</p>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل التقييمات</CardTitle>
              <PrintButton title="سجل التقييمات" />
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لا توجد تقييمات مخاطر</p>
              <p className="text-sm mt-2">انقر على "تقييم جديد" لإضافة تقييم</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المركبة</TableHead>
                  <TableHead>السائق</TableHead>
                  <TableHead>درجة المخاطر</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment: any) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{getVehiclePlate(assessment.vehicleId)}</TableCell>
                    <TableCell>{getDriverName(assessment.driverId)}</TableCell>
                    <TableCell>{assessment.riskScore}%</TableCell>
                    <TableCell>{getRiskLevelBadge(assessment.riskLevel, assessment.riskScore)}</TableCell>
                    <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                    <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAssessment(assessment)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {assessment.status === 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkReviewed(assessment.id)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(assessment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء تقييم جديد */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تقييم مخاطر جديد</DialogTitle>
            <DialogDescription>أدخل بيانات تقييم المخاطر للرحلة</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المركبة *</Label>
                <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.plateNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السائق</Label>
                <Select value={formData.driverId} onValueChange={(v) => setFormData({ ...formData, driverId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السائق" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.licenseNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>درجة المخاطر الإجمالية (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.riskScore}
                  onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>درجة تجاوز السرعة</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.speedingScore}
                  onChange={(e) => setFormData({ ...formData, speedingScore: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>درجة الفرملة الحادة</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.brakingScore}
                  onChange={(e) => setFormData({ ...formData, brakingScore: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>درجة التسارع الحاد</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.accelerationScore}
                  onChange={(e) => setFormData({ ...formData, accelerationScore: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>درجة الانعطاف الحاد</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.corneringScore}
                  onChange={(e) => setFormData({ ...formData, corneringScore: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>درجة الإرهاق</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fatigueScore}
                  onChange={(e) => setFormData({ ...formData, fatigueScore: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>أحداث تجاوز السرعة</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.speedingEvents}
                  onChange={(e) => setFormData({ ...formData, speedingEvents: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>أحداث الفرملة الحادة</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.harshBrakingEvents}
                  onChange={(e) => setFormData({ ...formData, harshBrakingEvents: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>أحداث التسارع الحاد</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.harshAccelerationEvents}
                  onChange={(e) => setFormData({ ...formData, harshAccelerationEvents: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>أحداث الانعطاف الحاد</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.harshCorneringEvents}
                  onChange={(e) => setFormData({ ...formData, harshCorneringEvents: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التوصيات</Label>
              <Input
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                placeholder="أدخل التوصيات لتحسين السلامة..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              إنشاء التقييم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة عرض تفاصيل التقييم */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل تقييم المخاطر</DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">المركبة</p>
                  <p className="font-medium">{getVehiclePlate(selectedAssessment.vehicleId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السائق</p>
                  <p className="font-medium">{getDriverName(selectedAssessment.driverId)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">درجة المخاطر</p>
                  <p className="font-medium text-2xl">{selectedAssessment.riskScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المستوى</p>
                  {getRiskLevelBadge(selectedAssessment.riskLevel, selectedAssessment.riskScore)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {getStatusBadge(selectedAssessment.status)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">السرعة</p>
                  <p className="font-bold">{selectedAssessment.speedingScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">الفرملة</p>
                  <p className="font-bold">{selectedAssessment.brakingScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">التسارع</p>
                  <p className="font-bold">{selectedAssessment.accelerationScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">الانعطاف</p>
                  <p className="font-bold">{selectedAssessment.corneringScore || 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">الإرهاق</p>
                  <p className="font-bold">{selectedAssessment.fatigueScore || 0}%</p>
                </div>
              </div>
              {selectedAssessment.recommendations && (
                <div>
                  <p className="text-sm text-muted-foreground">التوصيات</p>
                  <p className="font-medium">{selectedAssessment.recommendations}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssessment(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}