import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, MapPin, Clock, Car, Loader2, Search, Filter, Route as RouteIcon, ArrowRight } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface Trip {
  id: number;
  vehicleId: number;
  driverId: number;
  startLocation: string | null;
  endLocation: string | null;
  startMileage: number | null;
  endMileage: number | null;
  purpose: string | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  createdAt: Date;
}

// دالة توليد رقم الرحلة التلقائي
const generateTripCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `TRP-${timestamp.slice(-4)}${random}`;
};

type ViewMode = 'list' | 'add';

export default function FleetTrips() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tripCode] = useState(generateTripCode());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTrip, setNewTrip] = useState({
    vehicleId: 0,
    driverId: 0,
    startLocation: '',
    endLocation: '',
    startOdometer: '',
    purpose: '',
  });

  const { data: tripsData, isLoading, refetch, isError, error} = trpc.fleetExtended.trips.list.useQuery({});
  const { data: vehiclesData } = trpc.fleet.vehicles.list.useQuery();
  const { data: driversData } = trpc.fleetExtended.drivers.list.useQuery();

  const createTripMutation = trpc.fleetExtended.trips.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء الرحلة بنجاح');
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في إنشاء الرحلة');
    },
  });

  const updateTripMutation = trpc.fleetExtended.trips.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث الرحلة بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث الرحلة');
    },
  });

  const trips = (tripsData || []) as Trip[];
  const vehicles = vehiclesData || [];
  const drivers = driversData || [];

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.startLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.endLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">قيد التنفيذ</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800">مكتملة</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">ملغاة</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVehiclePlate = (vehicleId: number) => {
    const vehicle = vehicles.find((v: any) => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '-';
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver ? `سائق #${driver.id}` : '-';
  };

  const resetForm = () => {
    setNewTrip({ vehicleId: 0, driverId: 0, startLocation: '', endLocation: '', startOdometer: '', purpose: '' });
  };

  const handleCreateTrip = () => {
    if (!newTrip.vehicleId || !newTrip.driverId || !newTrip.startLocation) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createTripMutation.mutate({
      vehicleId: newTrip.vehicleId,
      driverId: newTrip.driverId,
      startLocation: newTrip.startLocation,
      endLocation: newTrip.endLocation || undefined,
      startOdometer: newTrip.startOdometer ? parseInt(newTrip.startOdometer) : undefined,
      purpose: newTrip.purpose || undefined,
    });
  };

  const handleCompleteTrip = (tripId: number) => {
    updateTripMutation.mutate({
      id: tripId,
      status: 'completed',
      endTime: new Date(),
    });
  };

  const handleCancelTrip = (tripId: number) => {
    updateTripMutation.mutate({
      id: tripId,
      status: 'cancelled',
    });
  };

  const stats = {
    total: trips.length,
    inProgress: trips.filter(t => t.status === 'in_progress').length,
    completed: trips.filter(t => t.status === 'completed').length,
    cancelled: trips.filter(t => t.status === 'cancelled').length,
  };

  // نموذج إضافة رحلة جديدة
  if (viewMode === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء رحلة جديدة</h1>
            <p className="text-muted-foreground">أدخل بيانات الرحلة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              بيانات الرحلة
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الرحلة (تلقائي)</Label>
                  <Input 
                    value={tripCode} 
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>المركبة *</Label>
                  <Select value={newTrip.vehicleId.toString()} onValueChange={(v) => setNewTrip({...newTrip, vehicleId: parseInt(v)})}>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السائق *</Label>
                  <Select value={newTrip.driverId.toString()} onValueChange={(v) => setNewTrip({...newTrip, driverId: parseInt(v)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السائق" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()}>سائق #{d.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قراءة العداد (كم)</Label>
                  <Input type="number" value={newTrip.startOdometer} onChange={(e) => setNewTrip({...newTrip, startOdometer: e.target.value})} placeholder="قراءة العداد الحالية" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نقطة الانطلاق *</Label>
                  <Input value={newTrip.startLocation} onChange={(e) => setNewTrip({...newTrip, startLocation: e.target.value})} placeholder="أدخل نقطة الانطلاق" />
                </div>
                <div className="space-y-2">
                  <Label>الوجهة</Label>
                  <Input value={newTrip.endLocation} onChange={(e) => setNewTrip({...newTrip, endLocation: e.target.value})} placeholder="أدخل الوجهة" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الغرض</Label>
                <Input value={newTrip.purpose} onChange={(e) => setNewTrip({...newTrip, purpose: e.target.value})} placeholder="الغرض من الرحلة" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateTrip} disabled={createTripMutation.isPending}>
                {createTripMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء الرحلة
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الرحلات</h2>
          <p className="text-muted-foreground">إدارة ومتابعة رحلات الأسطول</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          رحلة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <RouteIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرحلات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <MapPin className="h-6 w-6 text-green-600" />
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
              <Car className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ملغاة</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pe-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ms-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            قائمة الرحلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <RouteIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد رحلات</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء رحلة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">المركبة</TableHead>
                  <TableHead className="text-end">السائق</TableHead>
                  <TableHead className="text-end">نقطة الانطلاق</TableHead>
                  <TableHead className="text-end">الوجهة</TableHead>
                  <TableHead className="text-end">الغرض</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{getVehiclePlate(trip.vehicleId)}</TableCell>
                    <TableCell>{getDriverName(trip.driverId)}</TableCell>
                    <TableCell>{trip.startLocation || '-'}</TableCell>
                    <TableCell>{trip.endLocation || '-'}</TableCell>
                    <TableCell>{trip.purpose || '-'}</TableCell>
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    <TableCell>
                      {trip.status === 'in_progress' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleCompleteTrip(trip.id)}>إنهاء</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCancelTrip(trip.id)}>إلغاء</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
