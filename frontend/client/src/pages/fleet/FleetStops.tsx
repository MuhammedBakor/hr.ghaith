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
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Loader2, 
  Inbox, 
  MapPin, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Fuel,
  Package,
  Coffee,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TripStop {
  id: number;
  tripId: number;
  vehicleId: number;
  name: string | null;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  arrivalTime: Date | null;
  departureTime: Date | null;
  plannedArrival: Date | null;
  plannedDeparture: Date | null;
  duration: number | null;
  idleTime: number | null;
  stopType: string;
  status: string;
  notes: string | null;
  sequence: number | null;
  createdAt: Date;
}

const getStopTypeIcon = (type: string) => {
  switch (type) {
    case 'fuel':
      return <Fuel className="h-4 w-4 text-orange-500" />;
    case 'delivery':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'pickup':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'rest':
      return <Coffee className="h-4 w-4 text-purple-500" />;
    default:
      return <MapPin className="h-4 w-4 text-gray-500" />;
  }
};

const getStopTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    scheduled: 'مجدولة',
    unscheduled: 'غير مجدولة',
    rest: 'استراحة',
    fuel: 'تزويد وقود',
    delivery: 'توصيل',
    pickup: 'استلام',
    other: 'أخرى',
  };
  return types[type] || type;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ms-1" />مكتملة</Badge>;
    case 'arrived':
      return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 ms-1" />وصلت</Badge>;
    case 'skipped':
      return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 ms-1" />تم تخطيها</Badge>;
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-700"><Pause className="h-3 w-3 ms-1" />قيد الانتظار</Badge>;
  }
};

export default function FleetStops() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [editingStop, setEditingStop] = useState<TripStop | null>(null);
  const [formData, setFormData] = useState({
    tripId: 0,
    vehicleId: 0,
    name: '',
    location: '',
    stopType: 'scheduled' as const,
    status: 'pending' as const,
    notes: '',
    duration: 0,
    sequence: 0,
  });

  const { data: stopsData, isLoading, refetch } = useQuery({
    queryKey: ['fleet', 'trip-stops'],
    queryFn: () => api.get('/api/fleet/trip-stops').then(r => r.data),
  });
  const { data: tripsData } = useQuery({
    queryKey: ['fleet-extended', 'trips'],
    queryFn: () => api.get('/api/fleet-extended/trips').then(r => r.data),
  });
  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });
  
  const stops = (stopsData || []) as TripStop[];
  const trips = tripsData || [];
  const vehicles = vehiclesData || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet/trip-stops', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة محطة التوقف بنجاح');
      setIsAddOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/fleet/trip-stops/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث محطة التوقف بنجاح');
      setEditingStop(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/api/fleet/trip-stops/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف محطة التوقف بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      tripId: 0,
      vehicleId: 0,
      name: '',
      location: '',
      stopType: 'scheduled',
      status: 'pending',
      notes: '',
      duration: 0,
      sequence: 0,
    });
  };

  const handleEdit = (stop: TripStop) => {
    setEditingStop(stop);
    setFormData({
      tripId: stop.tripId,
      vehicleId: stop.vehicleId,
      name: stop.name || '',
      location: stop.location || '',
      stopType: stop.stopType as any,
      status: stop.status as any,
      notes: stop.notes || '',
      duration: stop.duration || 0,
      sequence: stop.sequence || 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.tripId || !formData.vehicleId) {
      toast.error('يرجى اختيار الرحلة والمركبة');
      return;
    }

    if (editingStop) {
      updateMutation.mutate({
        id: editingStop.id,
        name: formData.name || undefined,
        location: formData.location || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        duration: formData.duration || undefined,
      });
    } else {
      createMutation.mutate({
        tripId: formData.tripId,
        vehicleId: formData.vehicleId,
        name: formData.name || undefined,
        location: formData.location || undefined,
        stopType: formData.stopType,
        status: formData.status,
        notes: formData.notes || undefined,
        duration: formData.duration || undefined,
        sequence: formData.sequence || undefined,
      });
    }
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
    return vehicle?.plateNumber || '-';
  };

  const columns: ColumnDef<TripStop>[] = [
    {
      accessorKey: 'sequence',
      header: '#',
      cell: ({ row }) => row.original.sequence || row.index + 1,
    },
    {
      accessorKey: 'name',
      header: 'اسم المحطة',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStopTypeIcon(row.original.stopType)}
          <span>{row.original.name || 'محطة بدون اسم'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'vehicleId',
      header: 'المركبة',
      cell: ({ row }) => (
        <span className="font-mono">{getVehiclePlate(row.original.vehicleId)}</span>
      ),
    },
    {
      accessorKey: 'stopType',
      header: 'النوع',
      cell: ({ row }) => getStopTypeLabel(row.original.stopType),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'duration',
      header: 'المدة',
      cell: ({ row }) => row.original.duration ? `${row.original.duration} دقيقة` : '-',
    },
    {
      accessorKey: 'location',
      header: 'الموقع',
      cell: ({ row }) => row.original.location || '-',
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4 ms-2" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 ms-2" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    total: stops.length,
    completed: stops.filter(s => s.status === 'completed').length,
    pending: stops.filter(s => s.status === 'pending').length,
    skipped: stops.filter(s => s.status === 'skipped').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">محطات التوقف</h2>
          <p className="text-gray-500">إدارة ومتابعة محطات التوقف للرحلات</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة محطة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المحطات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مكتملة</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">قيد الانتظار</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تم تخطيها</p>
              <p className="text-2xl font-bold text-red-600">{stats.skipped}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة محطات التوقف</CardTitle>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد محطات توقف</p>
              <p className="text-sm text-gray-400">أضف محطات توقف جديدة للرحلات</p>
            </div>
          ) : (
            <DataTable columns={columns} data={stops} />
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={isAddOpen || !!editingStop} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditingStop(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingStop ? 'تعديل محطة التوقف' : 'إضافة محطة توقف'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الرحلة</Label>
              <Select
                value={formData.tripId.toString()}
                onValueChange={(value) => setFormData({ ...formData, tripId: parseInt(value) })}
                disabled={!!editingStop}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip: any) => (
                    <SelectItem key={trip.id} value={trip.id.toString()}>
                      رحلة #{trip.id} - {trip.purpose || 'بدون وصف'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المركبة</Label>
              <Select
                value={formData.vehicleId.toString()}
                onValueChange={(value) => setFormData({ ...formData, vehicleId: parseInt(value) })}
                disabled={!!editingStop}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركبة" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>اسم المحطة</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: محطة الوقود - طريق الملك فهد"
              />
            </div>
            <div>
              <Label>الموقع</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="العنوان أو الإحداثيات"
               required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع المحطة</Label>
                <Select
                  value={formData.stopType}
                  onValueChange={(value: any) => setFormData({ ...formData, stopType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">مجدولة</SelectItem>
                    <SelectItem value="unscheduled">غير مجدولة</SelectItem>
                    <SelectItem value="rest">استراحة</SelectItem>
                    <SelectItem value="fuel">تزويد وقود</SelectItem>
                    <SelectItem value="delivery">توصيل</SelectItem>
                    <SelectItem value="pickup">استلام</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="arrived">وصلت</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                    <SelectItem value="skipped">تم تخطيها</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>المدة (بالدقائق)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddOpen(false);
              setEditingStop(null);
              resetForm();
            }}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              )}
              {editingStop ? 'تحديث' : 'إضافة'}
            </Button>
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