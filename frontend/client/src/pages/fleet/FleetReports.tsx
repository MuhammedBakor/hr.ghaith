import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, Fuel, Wrench, Route, Download, Printer, Calendar } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

export default function FleetReports() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'fleet_manager';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const queryError = false; // Error state from useQuery

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [reportType, setReportType] = useState('vehicles');
  const [dateRange, setDateRange] = useState('month');

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['fleet', 'maintenance'],
    queryFn: () => api.get('/api/fleet/maintenance').then(r => r.data),
  });
  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ['fleet-extended', 'fuel-logs'],
    queryFn: () => api.get('/api/fleet-extended/fuel-logs').then(r => r.data),
  });
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['fleet-extended', 'trips'],
    queryFn: () => api.get('/api/fleet-extended/trips').then(r => r.data),
  });

  const vehicles = vehiclesData || [];
  const maintenance = maintenanceData || [];
  const fuelLogs = fuelData || [];
  const trips = tripsData || [];

  const isLoading = vehiclesLoading || maintenanceLoading || fuelLoading || tripsLoading;

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v: any) => v.status === 'available' || v.status === 'in_use').length;
  const totalMaintenanceCost = maintenance.reduce((sum: number, m: any) => sum + parseFloat(m.cost || '0'), 0);
  const totalFuelCost = fuelLogs.reduce((sum: number, f: any) => sum + parseFloat(f.cost || '0'), 0);
  const totalTrips = trips.length;
  const completedTrips = trips.filter((t: any) => t.status === 'completed').length;

  const getVehiclePlate = (vehicleId: number) => {
    const vehicle = vehicles.find((v: any) => v.id === vehicleId);
    return vehicle ? (vehicle as any).plateNumber : '-';
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    let csvContent = '';
    if (reportType === 'vehicles') {
      csvContent = 'رقم اللوحة,الماركة,الموديل,الحالة\n';
      vehicles.forEach((v: any) => {
        csvContent += `${v.plateNumber},${v.make || '-'},${v.model || '-'},${v.status}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fleet_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تقارير الأسطول</h2>
          <p className="text-gray-500">تقارير شاملة عن أداء الأسطول</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50"><Car className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المركبات</p>
              <p className="text-2xl font-bold">{totalVehicles}</p>
              <p className="text-xs text-green-600">{activeVehicles} نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50"><Wrench className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">تكلفة الصيانة</p>
              <p className="text-2xl font-bold">{totalMaintenanceCost.toFixed(0)}</p>
              <p className="text-xs text-gray-500">ريال</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><Fuel className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">تكلفة الوقود</p>
              <p className="text-2xl font-bold">{totalFuelCost.toFixed(0)}</p>
              <p className="text-xs text-gray-500">ريال</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50"><Route className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">الرحلات</p>
              <p className="text-2xl font-bold">{totalTrips}</p>
              <p className="text-xs text-green-600">{completedTrips} مكتملة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 ms-2" />
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="vehicles">المركبات</TabsTrigger>
          <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
          <TabsTrigger value="fuel">الوقود</TabsTrigger>
          <TabsTrigger value="trips">الرحلات</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />تقرير المركبات</CardTitle>
              <PrintButton title="التقرير" />
              <CardDescription>حالة جميع مركبات الأسطول</CardDescription>
            </CardHeader>
            <CardContent>
                        {(!vehicles || vehicles.length === 0) && <div className="text-center py-12 text-muted-foreground">لا توجد بيانات</div>}
<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">رقم اللوحة</TableHead>
                    <TableHead className="text-end">الماركة</TableHead>
                    <TableHead className="text-end">الموديل</TableHead>
                    <TableHead className="text-end">السنة</TableHead>
                    <TableHead className="text-end">نوع الوقود</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.plateNumber}</TableCell>
                      <TableCell>{v.make || '-'}</TableCell>
                      <TableCell>{v.model || '-'}</TableCell>
                      <TableCell>{v.year || '-'}</TableCell>
                      <TableCell>{v.fuelType || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === 'available' ? 'default' : 'secondary'}>
                          {v.status === 'available' ? 'متاحة' : v.status === 'in_use' ? 'قيد الاستخدام' : v.status === 'maintenance' ? 'صيانة' : v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />تقرير الصيانة</CardTitle>
              <CardDescription>سجل صيانة المركبات</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">المركبة</TableHead>
                    <TableHead className="text-end">نوع الصيانة</TableHead>
                    <TableHead className="text-end">الوصف</TableHead>
                    <TableHead className="text-end">التكلفة</TableHead>
                    <TableHead className="text-end">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{getVehiclePlate(m.vehicleId)}</TableCell>
                      <TableCell><Badge variant="outline">{m.maintenanceType === 'scheduled' ? 'مجدولة' : m.maintenanceType === 'repair' ? 'إصلاح' : m.maintenanceType}</Badge></TableCell>
                      <TableCell>{m.description || '-'}</TableCell>
                      <TableCell>{m.cost ? `${m.cost?.toLocaleString()} ريال` : '-'}</TableCell>
                      <TableCell>{m.serviceDate ? formatDate(m.serviceDate) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Fuel className="h-5 w-5" />تقرير الوقود</CardTitle>
              <CardDescription>سجل استهلاك الوقود</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">المركبة</TableHead>
                    <TableHead className="text-end">نوع الوقود</TableHead>
                    <TableHead className="text-end">الكمية (لتر)</TableHead>
                    <TableHead className="text-end">التكلفة</TableHead>
                    <TableHead className="text-end">المحطة</TableHead>
                    <TableHead className="text-end">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelLogs.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{getVehiclePlate(f.vehicleId)}</TableCell>
                      <TableCell>{f.fuelType}</TableCell>
                      <TableCell>{f.quantity}</TableCell>
                      <TableCell>{f.cost?.toLocaleString()} ريال</TableCell>
                      <TableCell>{f.station || '-'}</TableCell>
                      <TableCell>{f.createdAt ? formatDate(f.createdAt) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" />تقرير الرحلات</CardTitle>
              <CardDescription>سجل رحلات الأسطول</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">المركبة</TableHead>
                    <TableHead className="text-end">نقطة الانطلاق</TableHead>
                    <TableHead className="text-end">الوجهة</TableHead>
                    <TableHead className="text-end">الغرض</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{getVehiclePlate(t.vehicleId)}</TableCell>
                      <TableCell>{t.startLocation || '-'}</TableCell>
                      <TableCell>{t.endLocation || '-'}</TableCell>
                      <TableCell>{t.purpose || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'completed' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'destructive'}>
                          {t.status === 'completed' ? 'مكتملة' : t.status === 'in_progress' ? 'قيد التنفيذ' : 'ملغاة'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
