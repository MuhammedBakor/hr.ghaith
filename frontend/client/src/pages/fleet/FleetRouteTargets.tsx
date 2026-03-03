import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Progress } from '@/components/ui/progress';
import { Loader2, Inbox, Target, Plus, Edit, Trash2, TrendingUp, Car, Fuel, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function FleetRouteTargets() {
  const { data: currentUser, isError, error } = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const { data: vehiclesData, isLoading: vehiclesLoading } = trpc.fleet.vehicles.list.useQuery();
  const { data: targetsData, isLoading: targetsLoading, refetch } = trpc.fleet.routeTargets.list.useQuery({
    vehicleId: filterVehicle ? parseInt(filterVehicle) : undefined,
    status: filterStatus || undefined,
  });
  const { data: statsData } = trpc.fleet.routeTargets.stats.useQuery();

  const createMutation = trpc.fleet.routeTargets.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء الهدف بنجاح');
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الهدف: ' + error.message);
    },
  });

  const updateMutation = trpc.fleet.routeTargets.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث الهدف بنجاح');
      setIsEditOpen(false);
      setSelectedTarget(null);
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في تحديث الهدف: ' + error.message);
    },
  });

  const deleteMutation = trpc.fleet.routeTargets.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف الهدف بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في حذف الهدف: ' + error.message);
    },
  });

  const vehicles = (vehiclesData || []) as any[];
  const targets = (targetsData || []) as any[];
  const stats = statsData || { total: 0, active: 0, completed: 0, avgProgress: 0 };

  const isLoading = vehiclesLoading || targetsLoading;

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;


    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} - ${vehicle.plateNumber}` : `مركبة #${vehicleId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'نشط', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
      expired: { label: 'منتهي', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTargetTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      quarterly: 'ربع سنوي',
      yearly: 'سنوي',
      custom: 'مخصص',
    };
    return typeMap[type] || type;
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      vehicleId: parseInt(formData.get('vehicleId') as string),
      driverId: formData.get('driverId') ? parseInt(formData.get('driverId') as string) : undefined,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetType: formData.get('targetType') as any,
      targetDistance: formData.get('targetDistance') as string,
      targetTrips: formData.get('targetTrips') ? parseInt(formData.get('targetTrips') as string) : undefined,
      targetFuelEfficiency: formData.get('targetFuelEfficiency') as string,
      targetDrivingHours: formData.get('targetDrivingHours') ? parseInt(formData.get('targetDrivingHours') as string) : undefined,
      targetSafetyScore: formData.get('targetSafetyScore') ? parseInt(formData.get('targetSafetyScore') as string) : undefined,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
    });
  };

  const handleEdit = (target: any) => {
    setSelectedTarget(target);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTarget) return;

    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: selectedTarget.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      targetDistance: formData.get('targetDistance') as string,
      actualDistance: formData.get('actualDistance') as string,
      targetTrips: formData.get('targetTrips') ? parseInt(formData.get('targetTrips') as string) : undefined,
      actualTrips: formData.get('actualTrips') ? parseInt(formData.get('actualTrips') as string) : undefined,
      progress: formData.get('progress') ? parseInt(formData.get('progress') as string) : undefined,
      status: formData.get('status') as any,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أهداف المسارات</h2>
          <p className="text-gray-500">إدارة ومتابعة أهداف الأداء للمركبات</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 ms-2" />
          إضافة هدف جديد
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الأهداف</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">أهداف نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">أهداف مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط الإنجاز</p>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>المركبة</Label>
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المركبات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المركبات</SelectItem>
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.make} {v.model} - {v.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الأهداف */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأهداف</CardTitle>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد أهداف</p>
              <p className="text-sm text-gray-400">ابدأ بإضافة هدف جديد للمركبات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {targets.map((target: any) => (
                <div key={target.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{target.name || `هدف #${target.id}`}</h4>
                        {getStatusBadge(target.status)}
                        <Badge variant="outline">{getTargetTypeLabel(target.targetType)}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        <Car className="h-4 w-4 inline ms-1" />
                        {getVehicleName(target.vehicleId)}
                      </p>
                      {target.description && (
                        <p className="text-sm text-gray-600 mb-3">{target.description}</p>
                      )}

                      {/* مؤشرات الأداء */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {target.targetDistance && (
                          <div className="text-sm">
                            <span className="text-gray-500">المسافة:</span>
                            <span className="font-medium me-1">
                              {target.actualDistance || 0} / {target.targetDistance} كم
                            </span>
                          </div>
                        )}
                        {target.targetTrips && (
                          <div className="text-sm">
                            <span className="text-gray-500">الرحلات:</span>
                            <span className="font-medium me-1">
                              {target.actualTrips || 0} / {target.targetTrips}
                            </span>
                          </div>
                        )}
                        {target.targetFuelEfficiency && (
                          <div className="text-sm">
                            <Fuel className="h-4 w-4 inline ms-1 text-gray-400" />
                            <span className="text-gray-500">الكفاءة:</span>
                            <span className="font-medium me-1">
                              {target.actualFuelEfficiency || '-'} / {target.targetFuelEfficiency} كم/لتر
                            </span>
                          </div>
                        )}
                        {target.targetSafetyScore && (
                          <div className="text-sm">
                            <Shield className="h-4 w-4 inline ms-1 text-gray-400" />
                            <span className="text-gray-500">السلامة:</span>
                            <span className="font-medium me-1">
                              {target.actualSafetyScore || '-'} / {target.targetSafetyScore}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* شريط التقدم */}
                      <div className="flex items-center gap-2">
                        <Progress value={target.progress || 0} className="flex-1" />
                        <span className="text-sm font-medium">{target.progress || 0}%</span>
                      </div>

                      <div className="text-xs text-gray-400 mt-2">
                        الفترة: {formatDate(target.startDate)} - {formatDate(target.endDate)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(target)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(target.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog إنشاء هدف جديد */}
      {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة هدف جديد</h3>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleId">المركبة *</Label>
                  <Select name="vehicleId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v: any) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.make} {v.model} - {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetType">نوع الهدف</Label>
                  <Select name="targetType" defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                      <SelectItem value="custom">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="name">اسم الهدف</Label>
                <Input id="name" name="name" placeholder="مثال: هدف الأداء الشهري" />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input id="description" name="description" placeholder="وصف الهدف..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">تاريخ البداية *</Label>
                  <Input id="startDate" name="startDate" type="date" required placeholder="أدخل القيمة" />
                </div>
                <div>
                  <Label htmlFor="endDate">تاريخ النهاية *</Label>
                  <Input id="endDate" name="endDate" type="date" required placeholder="أدخل القيمة" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetDistance">المسافة المستهدفة (كم)</Label>
                  <Input id="targetDistance" name="targetDistance" type="number" step="0.01" placeholder="1000" />
                </div>
                <div>
                  <Label htmlFor="targetTrips">عدد الرحلات المستهدف</Label>
                  <Input id="targetTrips" name="targetTrips" type="number" placeholder="50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetFuelEfficiency">كفاءة الوقود المستهدفة (كم/لتر)</Label>
                  <Input id="targetFuelEfficiency" name="targetFuelEfficiency" type="number" step="0.01" placeholder="12.5" />
                </div>
                <div>
                  <Label htmlFor="targetSafetyScore">درجة السلامة المستهدفة (0-100)</Label>
                  <Input id="targetSafetyScore" name="targetSafetyScore" type="number" min="0" max="100" placeholder="85" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
                إنشاء الهدف
              </Button>
            </div>
          </form>
        </div>
      </div>)}

      {/* Dialog تعديل هدف */}
      {isEditOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل الهدف</h3>
          </div>
          {selectedTarget && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="edit-name">اسم الهدف</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedTarget.name} placeholder="الاسم" />
                </div>
                <div>
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Input id="edit-description" name="description" defaultValue={selectedTarget.description} placeholder="أدخل القيمة" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-targetDistance">المسافة المستهدفة (كم)</Label>
                    <Input id="edit-targetDistance" name="targetDistance" type="number" step="0.01" defaultValue={selectedTarget.targetDistance} placeholder="أدخل القيمة" />
                  </div>
                  <div>
                    <Label htmlFor="edit-actualDistance">المسافة الفعلية (كم)</Label>
                    <Input id="edit-actualDistance" name="actualDistance" type="number" step="0.01" defaultValue={selectedTarget.actualDistance} placeholder="أدخل القيمة" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-targetTrips">الرحلات المستهدفة</Label>
                    <Input id="edit-targetTrips" name="targetTrips" type="number" defaultValue={selectedTarget.targetTrips} placeholder="أدخل القيمة" />
                  </div>
                  <div>
                    <Label htmlFor="edit-actualTrips">الرحلات الفعلية</Label>
                    <Input id="edit-actualTrips" name="actualTrips" type="number" defaultValue={selectedTarget.actualTrips} placeholder="أدخل القيمة" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-progress">نسبة الإنجاز (%)</Label>
                    <Input id="edit-progress" name="progress" type="number" min="0" max="100" defaultValue={selectedTarget.progress} placeholder="أدخل القيمة" />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">الحالة</Label>
                    <Select name="status" defaultValue={selectedTarget.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                        <SelectItem value="expired">منتهي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>)}

      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الهدف؟ لا يمكن التراجع عن هذا الإجراء.
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
