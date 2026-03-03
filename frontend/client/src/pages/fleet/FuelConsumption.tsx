import { formatDate, formatDateTime } from '@/lib/formatDate';
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
import { Plus, Fuel, Car, TrendingUp, DollarSign, Loader2, Search, ArrowRight } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface FuelLog {
  id: number;
  vehicleId: number;
  driverId: number | null;
  fuelType: string;
  quantity: string;
  unitPrice?: string;
  totalCost?: string;
  cost?: string;
  mileage?: number | null;
  odometer?: number | null;
  station: string | null;
  receiptNumber?: string | null;
  fuelDate?: Date;
  date?: Date | null;
  createdAt: Date;
}

// دالة توليد رقم التعبئة التلقائي
const generateFuelCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `FUEL-${timestamp.slice(-4)}${random}`;
};

type ViewMode = 'list' | 'add';

export default function FuelConsumption() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [fuelCode] = useState(generateFuelCode());
  const [searchTerm, setSearchTerm] = useState('');
  const [newRecord, setNewRecord] = useState({
    vehicleId: 0,
    driverId: 0,
    fuelType: 'gasoline_91',
    quantity: '',
    cost: '',
    odometer: '',
    station: '',
  });

  // البيانات من API
  const { data: fuelData, isLoading, refetch, isError, error} = trpc.fleetExtended.fuelLogs.list.useQuery({});
  const { data: vehiclesData } = trpc.fleet.vehicles.list.useQuery();
  const { data: driversData } = trpc.fleetExtended.drivers.list.useQuery();

  const createFuelMutation = trpc.fleetExtended.fuelLogs.create.useMutation({
    onSuccess: () => {
      toast.success('تم تسجيل التعبئة بنجاح');
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تسجيل التعبئة');
    },
  });

  const records = (fuelData || []) as FuelLog[];
  const vehicles = vehiclesData || [];
  const drivers = driversData || [];

  const filteredRecords = records.filter(record => {
    const vehicle = vehicles.find((v: any) => v.id === record.vehicleId);
    return vehicle?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           record.station?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getVehiclePlate = (vehicleId: number) => {
    const vehicle = vehicles.find((v: any) => v.id === vehicleId);
    return vehicle ? vehicle.plateNumber : '-';
  };

  const getDriverName = (driverId: number | null) => {
    if (!driverId) return '-';
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver ? `سائق #${driver.id}` : '-';
  };

  const getFuelTypeName = (type: string) => {
    const types: Record<string, string> = {
      'gasoline_91': 'بنزين 91',
      'gasoline_95': 'بنزين 95',
      'diesel': 'ديزل',
      'electric': 'كهرباء',
    };
    return types[type] || type;
  };

  const resetForm = () => {
    setNewRecord({ vehicleId: 0, driverId: 0, fuelType: 'gasoline_91', quantity: '', cost: '', odometer: '', station: '' });
  };

  const handleCreateFuel = () => {
    if (!newRecord.vehicleId || !newRecord.quantity || !newRecord.cost) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createFuelMutation.mutate({
      vehicleId: newRecord.vehicleId,
      driverId: newRecord.driverId || undefined,
      fuelType: newRecord.fuelType,
      quantity: newRecord.quantity,
      cost: newRecord.cost,
      odometer: newRecord.odometer ? parseInt(newRecord.odometer) : undefined,
      station: newRecord.station || undefined,
    });
  };

  const totalCost = records.reduce((sum, r) => sum + parseFloat(r.totalCost || r.cost || '0'), 0);
  const totalQuantity = records.reduce((sum, r) => sum + parseFloat(r.quantity || '0'), 0);
  const avgCostPerLiter = totalQuantity > 0 ? (totalCost / totalQuantity).toFixed(2) : '0';

  // نموذج إضافة تعبئة جديدة
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
            <h1 className="text-2xl font-bold">تسجيل تعبئة وقود</h1>
            <p className="text-muted-foreground">أدخل بيانات التعبئة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              بيانات التعبئة
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم التعبئة (تلقائي)</Label>
                  <Input 
                    value={fuelCode} 
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>المركبة *</Label>
                  <Select value={newRecord.vehicleId.toString()} onValueChange={(v) => setNewRecord({...newRecord, vehicleId: parseInt(v)})}>
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
                  <Label>السائق</Label>
                  <Select value={newRecord.driverId.toString()} onValueChange={(v) => setNewRecord({...newRecord, driverId: parseInt(v)})}>
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
                  <Label>نوع الوقود *</Label>
                  <Select value={newRecord.fuelType} onValueChange={(v) => setNewRecord({...newRecord, fuelType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline_91">بنزين 91</SelectItem>
                      <SelectItem value="gasoline_95">بنزين 95</SelectItem>
                      <SelectItem value="diesel">ديزل</SelectItem>
                      <SelectItem value="electric">كهرباء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكمية (لتر) *</Label>
                  <Input type="number" value={newRecord.quantity} onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>التكلفة (ريال) *</Label>
                  <Input type="number" value={newRecord.cost?.toLocaleString()} onChange={(e) => setNewRecord({...newRecord, cost: e.target.value})} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>قراءة العداد (كم)</Label>
                  <Input type="number" value={newRecord.odometer} onChange={(e) => setNewRecord({...newRecord, odometer: e.target.value})} placeholder="قراءة العداد" />
                </div>
                <div className="space-y-2">
                  <Label>محطة الوقود</Label>
                  <Input value={newRecord.station} onChange={(e) => setNewRecord({...newRecord, station: e.target.value})} placeholder="اسم المحطة" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateFuel} disabled={createFuelMutation.isPending}>
                {createFuelMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    تسجيل التعبئة
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
          <h2 className="text-2xl font-bold tracking-tight">استهلاك الوقود</h2>
          <p className="text-muted-foreground">تتبع وإدارة استهلاك الوقود للأسطول</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          تسجيل تعبئة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Fuel className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التعبئات</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
              <p className="text-2xl font-bold">{totalQuantity.toFixed(1)} لتر</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التكلفة</p>
              <p className="text-2xl font-bold">{totalCost.toFixed(0)} ريال</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Car className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوسط السعر/لتر</p>
              <p className="text-2xl font-bold">{avgCostPerLiter} ريال</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالمركبة أو المحطة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pe-10" />
          </div>
        </CardContent>
      </Card>

      {/* Fuel Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            سجل التعبئات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد سجلات تعبئة</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                تسجيل تعبئة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">المركبة</TableHead>
                  <TableHead className="text-end">السائق</TableHead>
                  <TableHead className="text-end">نوع الوقود</TableHead>
                  <TableHead className="text-end">الكمية (لتر)</TableHead>
                  <TableHead className="text-end">التكلفة (ريال)</TableHead>
                  <TableHead className="text-end">العداد (كم)</TableHead>
                  <TableHead className="text-end">المحطة</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{getVehiclePlate(record.vehicleId)}</TableCell>
                    <TableCell>{getDriverName(record.driverId)}</TableCell>
                    <TableCell><Badge variant="outline">{getFuelTypeName(record.fuelType)}</Badge></TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>{record.totalCost || record.cost || '-'}</TableCell>
                    <TableCell>{record.mileage || record.odometer || '-'}</TableCell>
                    <TableCell>{record.station || '-'}</TableCell>
                    <TableCell>{record.createdAt ? formatDate(record.createdAt) : '-'}</TableCell>
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
