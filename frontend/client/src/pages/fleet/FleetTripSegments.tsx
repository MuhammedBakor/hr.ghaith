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
import { toast } from 'sonner';
import { 
  Loader2, 
  Inbox, 
  Route, 
  Plus, 
  CheckCircle,
  XCircle,
  Play,
  MoreHorizontal,
  Pencil,
  Trash2,
  Gauge,
  Fuel,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TripSegment {
  id: number;
  tripId: number;
  vehicleId: number;
  startLocation: string | null;
  endLocation: string | null;
  distance: string | null;
  duration: number | null;
  avgSpeed: string | null;
  maxSpeed: string | null;
  fuelConsumed: string | null;
  status: string;
  sequence: number | null;
  createdAt: Date;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 ms-1" />مكتمل</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-700"><Play className="h-3 w-3 ms-1" />جاري</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 ms-1" />ملغي</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function FleetTripSegments() {
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
  const [editingSegment, setEditingSegment] = useState<TripSegment | null>(null);
  const [formData, setFormData] = useState({
    tripId: 0,
    vehicleId: 0,
    startLocation: '',
    endLocation: '',
    distance: '',
    duration: 0,
    avgSpeed: '',
    maxSpeed: '',
    fuelConsumed: '',
    status: 'in_progress' as const,
  });

  const { data: segmentsData, isLoading, refetch } = useQuery({
    queryKey: ['fleet', 'trip-segments'],
    queryFn: () => api.get('/api/fleet/trip-segments').then(r => r.data),
  });
  const { data: tripsData } = useQuery({
    queryKey: ['fleet-extended', 'trips'],
    queryFn: () => api.get('/api/fleet-extended/trips').then(r => r.data),
  });
  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });
  
  const segments = (segmentsData || []) as TripSegment[];
  const trips = tripsData || [];
  const vehicles = vehiclesData || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet/trip-segments', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة مقطع الرحلة بنجاح');
      setIsAddOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/fleet/trip-segments/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث مقطع الرحلة بنجاح');
      setEditingSegment(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/api/fleet/trip-segments/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف مقطع الرحلة بنجاح');
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
      startLocation: '',
      endLocation: '',
      distance: '',
      duration: 0,
      avgSpeed: '',
      maxSpeed: '',
      fuelConsumed: '',
      status: 'in_progress',
    });
  };

  const handleEdit = (segment: TripSegment) => {
    setEditingSegment(segment);
    setFormData({
      tripId: segment.tripId,
      vehicleId: segment.vehicleId,
      startLocation: segment.startLocation || '',
      endLocation: segment.endLocation || '',
      distance: segment.distance || '',
      duration: segment.duration || 0,
      avgSpeed: segment.avgSpeed || '',
      maxSpeed: segment.maxSpeed || '',
      fuelConsumed: segment.fuelConsumed || '',
      status: segment.status as any,
    });
  };

  const handleSubmit = () => {
    if (!formData.tripId || !formData.vehicleId) {
      toast.error('يرجى اختيار الرحلة والمركبة');
      return;
    }

    if (editingSegment) {
      updateMutation.mutate({
        id: editingSegment.id,
        startLocation: formData.startLocation || undefined,
        endLocation: formData.endLocation || undefined,
        distance: formData.distance || undefined,
        duration: formData.duration || undefined,
        avgSpeed: formData.avgSpeed || undefined,
        maxSpeed: formData.maxSpeed || undefined,
        fuelConsumed: formData.fuelConsumed || undefined,
        status: formData.status,
      });
    } else {
      createMutation.mutate({
        tripId: formData.tripId,
        vehicleId: formData.vehicleId,
        startLocation: formData.startLocation || undefined,
        endLocation: formData.endLocation || undefined,
        distance: formData.distance || undefined,
        duration: formData.duration || undefined,
        avgSpeed: formData.avgSpeed || undefined,
        maxSpeed: formData.maxSpeed || undefined,
        fuelConsumed: formData.fuelConsumed || undefined,
        status: formData.status,
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

  const columns: ColumnDef<TripSegment>[] = [
    {
      accessorKey: 'sequence',
      header: '#',
      cell: ({ row }) => row.original.sequence || row.index + 1,
    },
    {
      accessorKey: 'vehicleId',
      header: 'المركبة',
      cell: ({ row }) => (
        <span className="font-mono">{getVehiclePlate(row.original.vehicleId)}</span>
      ),
    },
    {
      accessorKey: 'startLocation',
      header: 'من',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-green-500" />
          <span className="truncate max-w-[150px]">{row.original.startLocation || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'endLocation',
      header: 'إلى',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-red-500" />
          <span className="truncate max-w-[150px]">{row.original.endLocation || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'distance',
      header: 'المسافة',
      cell: ({ row }) => row.original.distance ? `${row.original.distance} كم` : '-',
    },
    {
      accessorKey: 'duration',
      header: 'المدة',
      cell: ({ row }) => row.original.duration ? `${row.original.duration} دقيقة` : '-',
    },
    {
      accessorKey: 'avgSpeed',
      header: 'السرعة المتوسطة',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Gauge className="h-4 w-4 text-blue-500" />
          <span>{row.original.avgSpeed ? `${row.original.avgSpeed} كم/س` : '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'fuelConsumed',
      header: 'الوقود',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Fuel className="h-4 w-4 text-orange-500" />
          <span>{row.original.fuelConsumed ? `${row.original.fuelConsumed} لتر` : '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
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
    total: segments.length,
    completed: segments.filter(s => s.status === 'completed').length,
    inProgress: segments.filter(s => s.status === 'in_progress').length,
    totalDistance: segments.reduce((sum, s) => sum + (parseFloat(s.distance || '0') || 0), 0),
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مقاطع الرحلات</h2>
          <p className="text-gray-500">إدارة ومتابعة مقاطع الرحلات</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مقطع
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المقاطع</p>
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
            <div className="p-3 rounded-xl bg-blue-50">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">جارية</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Route className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المسافة</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalDistance.toFixed(1)} كم</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة مقاطع الرحلات</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد مقاطع رحلات</p>
              <p className="text-sm text-gray-400">أضف مقاطع جديدة للرحلات</p>
            </div>
          ) : (
            <DataTable columns={columns} data={segments} />
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={isAddOpen || !!editingSegment} onOpenChange={(open) => {
        if (!open) {
          setIsAddOpen(false);
          setEditingSegment(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'تعديل مقطع الرحلة' : 'إضافة مقطع رحلة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الرحلة</Label>
              <Select
                value={formData.tripId.toString()}
                onValueChange={(value) => setFormData({ ...formData, tripId: parseInt(value) })}
                disabled={!!editingSegment}
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
                disabled={!!editingSegment}
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
              <Label>نقطة البداية</Label>
              <Input
                value={formData.startLocation}
                onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                placeholder="العنوان أو الإحداثيات"
               required/>
            </div>
            <div>
              <Label>نقطة النهاية</Label>
              <Input
                value={formData.endLocation}
                onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                placeholder="العنوان أو الإحداثيات"
               required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المسافة (كم)</Label>
                <Input
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                />
              </div>
              <div>
                <Label>المدة (دقيقة)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>السرعة المتوسطة (كم/س)</Label>
                <Input
                  value={formData.avgSpeed}
                  onChange={(e) => setFormData({ ...formData, avgSpeed: e.target.value })}
                />
              </div>
              <div>
                <Label>السرعة القصوى (كم/س)</Label>
                <Input
                  value={formData.maxSpeed}
                  onChange={(e) => setFormData({ ...formData, maxSpeed: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الوقود المستهلك (لتر)</Label>
                <Input
                  value={formData.fuelConsumed}
                  onChange={(e) => setFormData({ ...formData, fuelConsumed: e.target.value })}
                />
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
                    <SelectItem value="in_progress">جاري</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddOpen(false);
              setEditingSegment(null);
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
              {editingSegment ? 'تحديث' : 'إضافة'}
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