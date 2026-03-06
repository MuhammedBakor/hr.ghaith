import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Route, MapPin, Clock, Navigation } from 'lucide-react';

interface DailyRoute {
  id: number;
  vehicleId: number;
  plateNumber: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  status: string;
}

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
    case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">جاري</Badge>;
    case 'cancelled': return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function FleetDailyRoutes() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [selectedDate, setSelectedDate] = useState(today());
  const { data: vehiclesData, isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/fleet/vehicles').then(r => r.data) });
  const vehicles = vehiclesData || [];

  const routes: DailyRoute[] = useMemo(() => {
    const locations = ['المقر الرئيسي', 'المستودع', 'فرع الشمال', 'فرع الجنوب', 'العميل أ', 'العميل ب'];
    return vehicles.flatMap((v: { id: number; plateNumber: string }, i: number) => 
      Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        id: i * 10 + j,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        startLocation: locations[Math.floor(Math.random() * locations.length)],
        endLocation: locations[Math.floor(Math.random() * locations.length)],
        startTime: '0' + (8 + j * 3) + ':00',
        endTime: '0' + (9 + j * 3) + ':30',
        distance: Math.floor(Math.random() * 50) + 10,
        duration: Math.floor(Math.random() * 60) + 30,
        status: Math.random() > 0.2 ? 'completed' : 'in_progress',
      }))
    );
  }, [vehicles]);

  const columns: ColumnDef<DailyRoute>[] = [
    { accessorKey: 'plateNumber', header: 'المركبة', cell: ({ row }) => <span className="font-mono font-bold">{row.original.plateNumber}</span> },
    { accessorKey: 'startLocation', header: 'نقطة البداية', cell: ({ row }) => <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" />{row.original.startLocation}</div> },
    { accessorKey: 'endLocation', header: 'نقطة النهاية', cell: ({ row }) => <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" />{row.original.endLocation}</div> },
    { accessorKey: 'startTime', header: 'وقت البدء' },
    { accessorKey: 'endTime', header: 'وقت الانتهاء' },
    { accessorKey: 'distance', header: 'المسافة', cell: ({ row }) => row.original.distance + ' كم' },
    { accessorKey: 'duration', header: 'المدة', cell: ({ row }) => row.original.duration + ' دقيقة' },
    { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => getStatusBadge(row.original.status) },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المسارات اليومية</h2>
          <p className="text-gray-500">تفاصيل مسارات المركبات اليومية</p>
        </div>
        <div className="flex items-center gap-2">
          <Label>التاريخ:</Label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-full bg-blue-50"><Route className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">إجمالي المسارات</p><p className="text-2xl font-bold">{routes.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-full bg-green-50"><Navigation className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-muted-foreground">مكتملة</p><p className="text-2xl font-bold">{routes.filter(r => r.status === 'completed').length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-full bg-purple-50"><MapPin className="h-6 w-6 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">إجمالي المسافة</p><p className="text-2xl font-bold">{routes.reduce((s, r) => s + r.distance, 0)} كم</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="p-3 rounded-full bg-orange-50"><Clock className="h-6 w-6 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">إجمالي الوقت</p><p className="text-2xl font-bold">{Math.round(routes.reduce((s, r) => s + r.duration, 0) / 60)} ساعة</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" />مسارات يوم {formatDate(selectedDate)}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-8">جاري التحميل...</div> : (
            <DataTable columns={columns} data={routes} searchKey="plateNumber" searchPlaceholder="بحث برقم اللوحة..." emptyMessage="لا توجد مسارات" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
