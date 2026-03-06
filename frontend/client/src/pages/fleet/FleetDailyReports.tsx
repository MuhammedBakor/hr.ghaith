import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { toast } from 'sonner';
import { FileText, Download, Route, Clock, Fuel, Loader2, Inbox, Car } from 'lucide-react';

interface DailyReport {
  vehicleId: number;
  plateNumber: string;
  date: string;
  distanceKm: number;
  drivingHours: number;
  idleHours: number;
  fuelUsed: number;
  tripCount: number;
}

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function FleetDailyReports() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/fleet/vehicles').then(r => r.data) });
  const { data: tripsData, isLoading: tripsLoading } = useQuery({ queryKey: ['trips'], queryFn: () => api.get('/fleet/trips').then(r => r.data) });
  
  const vehicles = vehiclesData || [];
  const trips = tripsData || [];
  const isLoading = vehiclesLoading || tripsLoading;

  // حساب التقارير اليومية من بيانات الرحلات الحقيقية
  const dailyReports: DailyReport[] = useMemo(() => {
    const selectedDateObj = new Date(selectedDate);
    
    return vehicles.map((v: { id: number; plateNumber: string }) => {
      // فلترة الرحلات لهذه المركبة في التاريخ المحدد
      const vehicleTrips = trips.filter((t: any) => {
        if (t.vehicleId !== v.id) return false;
        const tripDate = new Date(t.startTime || t.createdAt);
        return tripDate.toISOString().split('T')[0] === selectedDate;
      });

      // حساب المسافة من الأودوميتر
      let totalDistance = 0;
      let totalDrivingMinutes = 0;
      
      vehicleTrips.forEach((trip: any) => {
        if (trip.startOdometer && trip.endOdometer) {
          totalDistance += trip.endOdometer - trip.startOdometer;
        }
        if (trip.startTime && trip.endTime) {
          const start = new Date(trip.startTime);
          const end = new Date(trip.endTime);
          totalDrivingMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
        }
      });

      const drivingHours = Math.round(totalDrivingMinutes / 60 * 10) / 10;
      // تقدير الوقود بناءً على المسافة (معدل 10 لتر/100 كم)
      const fuelUsed = Math.round(totalDistance * 0.1);

      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        date: selectedDate,
        distanceKm: totalDistance,
        drivingHours: drivingHours,
        idleHours: 0, // يمكن حسابه من بيانات التتبع
        fuelUsed: fuelUsed,
        tripCount: vehicleTrips.length,
      };
    });
  }, [vehicles, trips, selectedDate]);

  const totalStats = {
    totalDistance: dailyReports.reduce((sum, r) => sum + r.distanceKm, 0),
    totalDriving: dailyReports.reduce((sum, r) => sum + r.drivingHours, 0),
    totalFuel: dailyReports.reduce((sum, r) => sum + r.fuelUsed, 0),
    totalTrips: dailyReports.reduce((sum, r) => sum + r.tripCount, 0),
  };

  const columns: ColumnDef<DailyReport>[] = [
    { accessorKey: 'plateNumber', header: 'المركبة', cell: ({ row }) => <span className="font-mono font-bold">{row.original.plateNumber}</span> },
    { accessorKey: 'distanceKm', header: 'المسافة (كم)', cell: ({ row }) => row.original.distanceKm.toLocaleString() + ' كم' },
    { accessorKey: 'drivingHours', header: 'ساعات القيادة', cell: ({ row }) => row.original.drivingHours + ' ساعة' },
    { accessorKey: 'idleHours', header: 'ساعات التوقف', cell: ({ row }) => row.original.idleHours + ' ساعة' },
    { accessorKey: 'fuelUsed', header: 'الوقود (لتر)', cell: ({ row }) => row.original.fuelUsed + ' لتر' },
    { accessorKey: 'tripCount', header: 'عدد الرحلات' },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

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
          <h2 className="text-2xl font-bold tracking-tight">التقارير اليومية</h2>
          <p className="text-gray-500">ملخص يومي لحركة الأسطول بناءً على بيانات الرحلات</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>التاريخ:</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" className="gap-2" onClick={() => { toast.success('جاري تصدير التقرير...'); window.print(); }}><Download className="h-4 w-4" />تصدير</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المسافة</p>
              <p className="text-2xl font-bold">{totalStats.totalDistance.toLocaleString()} كم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ساعات القيادة</p>
              <p className="text-2xl font-bold">{totalStats.totalDriving} ساعة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <Fuel className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الوقود المستهلك</p>
              <p className="text-2xl font-bold">{totalStats.totalFuel} لتر</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-50">
              <Car className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرحلات</p>
              <p className="text-2xl font-bold">{totalStats.totalTrips}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تفاصيل المركبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
              <Inbox className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium">لا توجد بيانات</p>
              <p className="text-sm">لا توجد مركبات مسجلة في النظام</p>
            </div>
          ) : (
            <DataTable columns={columns} data={dailyReports} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
