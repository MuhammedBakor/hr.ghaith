import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Truck, Loader2, CheckCircle, XCircle, Clock, Inbox, Navigation } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

export default function FleetDispatchRecs() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: vehiclesData } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/fleet/vehicles').then(r => r.data) });
  const { data: driversData } = useQuery({ queryKey: ['drivers'], queryFn: () => api.get('/fleet/drivers').then(r => r.data) });
  const { data: recommendationsData, isLoading, refetch } = useQuery({ queryKey: ['dispatch-recs', filterStatus], queryFn: () => api.get('/fleet/dispatch', { params: filterStatus !== 'all' ? { status: filterStatus } : undefined }).then(r => r.data) });
  const { data: statsData } = useQuery({ queryKey: ['dispatch-recs-stats'], queryFn: () => api.get('/fleet/dispatch/stats').then(r => r.data) });

  const vehicles = vehiclesData || [];
  const drivers = driversData || [];
  const recommendations = recommendationsData || [];
  const stats = statsData || { total: 0, pending: 0, accepted: 0, completed: 0, rejected: 0 };

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    recommendationType: 'delivery',
    priority: 'medium',
    originAddress: '',
    destinationAddress: '',
    estimatedDistance: '',
    estimatedDuration: '',
    reason: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet/dispatch', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء التوصية بنجاح');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (data: any) => api.post(`/fleet/dispatch/${data.id}/accept`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم قبول التوصية بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: any) => api.post(`/fleet/dispatch/${data.id}/reject`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم رفض التوصية');
      refetch();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: any) => api.post(`/fleet/dispatch/${data.id}/complete`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إكمال التوصية بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      recommendationType: 'delivery',
      priority: 'medium',
      originAddress: '',
      destinationAddress: '',
      estimatedDistance: '',
      estimatedDuration: '',
      reason: '',
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
      recommendationType: formData.recommendationType as any,
      priority: formData.priority as any,
      originAddress: formData.originAddress || undefined,
      destinationAddress: formData.destinationAddress || undefined,
      estimatedDistance: formData.estimatedDistance || undefined,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      reason: formData.reason || undefined,
    });
  };

  const getVehiclePlate = (vehicleId: number) => {
    const vehicle = (vehicles as any[]).find((v: any) => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '-';
  };

  const getDriverName = (driverId: number | null) => {
    if (!driverId) return '-';
    const driver = (drivers as any[]).find((d: any) => d.id === driverId);
    return driver ? driver.licenseNumber : '-';
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      delivery: { label: 'توصيل', color: 'bg-blue-100 text-blue-800' },
      pickup: { label: 'استلام', color: 'bg-green-100 text-green-800' },
      service: { label: 'خدمة', color: 'bg-purple-100 text-purple-800' },
      maintenance: { label: 'صيانة', color: 'bg-orange-100 text-orange-800' },
    };
    const t = types[type] || types.delivery;
    return <Badge className={t.color}>{t.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorities: Record<string, { label: string; color: string }> = {
      low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'متوسطة', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'عالية', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'عاجلة', color: 'bg-red-100 text-red-800' },
    };
    const p = priorities[priority] || priorities.medium;
    return <Badge className={p.color}>{p.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'مقبولة', color: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-800' },
      completed: { label: 'مكتملة', color: 'bg-green-100 text-green-800' },
      expired: { label: 'منتهية', color: 'bg-gray-100 text-gray-800' },
    };
    const s = statuses[status] || statuses.pending;
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" dir="rtl"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">توصيات التوزيع الذكي</h2>
          <p className="text-muted-foreground">توصيات تلقائية لتوزيع المهام على الأسطول</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="accepted">مقبولة</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 ms-2" />
            توصية جديدة
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Navigation className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مقبولة</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>قائمة التوصيات</CardTitle>
              <PrintButton title="قائمة التوصيات" />
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لا توجد توصيات</p>
              <p className="text-sm mt-2">انقر على "توصية جديدة" لإضافة توصية</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المركبة</TableHead>
                  <TableHead>السائق</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الوجهة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec: any) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{getVehiclePlate(rec.vehicleId)}</TableCell>
                    <TableCell>{getDriverName(rec.driverId)}</TableCell>
                    <TableCell>{getTypeBadge(rec.recommendationType)}</TableCell>
                    <TableCell>{getPriorityBadge(rec.priority)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{rec.destinationAddress || '-'}</TableCell>
                    <TableCell>{getStatusBadge(rec.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {rec.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600"
                              onClick={() => acceptMutation.mutate({ id: rec.id })}
                              disabled={acceptMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 ms-1" />
                              قبول
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => rejectMutation.mutate({ id: rec.id })}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 ms-1" />
                              رفض
                            </Button>
                          </>
                        )}
                        {rec.status === 'accepted' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600"
                            onClick={() => completeMutation.mutate({ id: rec.id })}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 ms-1" />
                            إكمال
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء توصية جديدة */}
      {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">توصية توزيع جديدة</h3>
            <p className="text-sm text-gray-500">أدخل بيانات توصية التوزيع</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المركبة *</Label>
                <Select value={formData.vehicleId} onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vehicles as any[]).map((v: any) => (
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
                    {(drivers as any[]).map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع التوصية</Label>
                <Select value={formData.recommendationType} onValueChange={(v) => setFormData({ ...formData, recommendationType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">توصيل</SelectItem>
                    <SelectItem value="pickup">استلام</SelectItem>
                    <SelectItem value="service">خدمة</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>عنوان نقطة الانطلاق</Label>
              <Input
                value={formData.originAddress}
                onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                placeholder="أدخل عنوان نقطة الانطلاق..."
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان الوجهة</Label>
              <Input
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                placeholder="أدخل عنوان الوجهة..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المسافة التقديرية (كم)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDistance}
                  onChange={(e) => setFormData({ ...formData, estimatedDistance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوقت التقديري (دقيقة)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>سبب التوصية</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="أدخل سبب التوصية..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              إنشاء التوصية
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
