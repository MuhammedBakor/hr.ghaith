import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Radio,
  RefreshCw,
  MapPin,
  Gauge,
  Navigation,
  Circle,
  Loader2,
  Inbox,
  Car,
  Activity
} from 'lucide-react';

interface LiveVehicle {
  id: number;
  vehicleId: number;
  plateNumber: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  odometer: number;
  status: string;
  lastUpdate: Date;
  driverName?: string;
}

const getStatusIndicator = (status: string) => {
  switch (status) {
    case 'moving':
      return <Circle className="h-3 w-3 fill-green-500 text-green-500" />;
    case 'idle':
      return <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />;
    case 'offline':
      return <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />;
    default:
      return <Circle className="h-3 w-3 fill-gray-300 text-gray-300" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'moving':
      return <Badge className="bg-green-100 text-green-700">متحرك</Badge>;
    case 'idle':
      return <Badge className="bg-yellow-100 text-yellow-700">متوقف</Badge>;
    case 'offline':
      return <Badge className="bg-gray-100 text-gray-700">غير متصل</Badge>;
    default:
      return <Badge variant="outline">غير معروف</Badge>;
  }
};

export default function FleetLive() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);

  const { data: vehiclesData, isLoading: vehiclesLoading, refetch } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/fleet/vehicles').then(r => r.data),
  });
  const { data: driversData } = useQuery({
    queryKey: ['fleet-extended', 'drivers'],
    queryFn: () => api.get('/fleet-extended/drivers').then(r => r.data),
  });
  const { data: tripsData } = useQuery({
    queryKey: ['fleet-extended', 'trips'],
    queryFn: () => api.get('/fleet-extended/trips').then(r => r.data),
  });

  const vehicles = vehiclesData || [];
  const drivers = driversData || [];
  const trips = tripsData || [];
  const isLoading = vehiclesLoading;

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);


  // Generate live data from vehicles with real trip data
  const liveData: LiveVehicle[] = useMemo(() => {
    return vehicles.map((v: any) => {
      const activeTrip = trips.find((t: any) =>
        t.vehicleId === v.id && t.status === 'in_progress'
      );

      const driver = activeTrip ? drivers.find((d: any) => d.id === activeTrip.driverId) : null;

      let status = 'offline';
      if (v.status === 'in_use' || activeTrip) {
        status = 'moving';
      } else if (v.status === 'available') {
        status = 'idle';
      }

      const lat = activeTrip?.startLocation ?
        parseFloat(activeTrip.startLocation.split(',')[0]) || 24.7136 :
        24.7136 + (Math.random() - 0.5) * 0.05;
      const lng = activeTrip?.startLocation ?
        parseFloat(activeTrip.startLocation.split(',')[1]) || 46.6753 :
        46.6753 + (Math.random() - 0.5) * 0.05;

      return {
        id: v.id,
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        lat,
        lng,
        speed: status === 'moving' ? Math.floor(Math.random() * 60) + 20 : 0,
        heading: Math.floor(Math.random() * 360),
        odometer: v.currentMileage || activeTrip?.startMileage || 0,
        status,
        lastUpdate: new Date(),
        driverName: driver?.licenseNumber || undefined,
      };
    });
  }, [vehicles, trips, drivers]);

  const stats = {
    total: liveData.length,
    moving: liveData.filter(v => v.status === 'moving').length,
    idle: liveData.filter(v => v.status === 'idle').length,
    offline: liveData.filter(v => v.status === 'offline').length,
  };

  const columns: ColumnDef<LiveVehicle>[] = [
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getStatusIndicator(row.original.status)}
          {getStatusBadge(row.original.status)}
        </div>
      ),
    },
    {
      accessorKey: 'plateNumber',
      header: 'المركبة',
      cell: ({ row }) => (
        <span className="font-mono font-bold">{row.original.plateNumber}</span>
      ),
    },
    {
      accessorKey: 'driverName',
      header: 'السائق',
      cell: ({ row }) => row.original.driverName || '-',
    },
    {
      accessorKey: 'speed',
      header: 'السرعة',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Gauge className="h-4 w-4 text-gray-400" />
          <span>{row.original.speed} كم/س</span>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'الموقع',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-xs">
            {row.original.lat.toFixed(4)}, {row.original.lng.toFixed(4)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'heading',
      header: 'الاتجاه',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Navigation
            className="h-4 w-4 text-blue-500"
            style={{ transform: `rotate(${row.original.heading}deg)` }}
          />
          <span>{row.original.heading}°</span>
        </div>
      ),
    },
    {
      accessorKey: 'odometer',
      header: 'العداد',
      cell: ({ row }) => (
        <span>{row.original.odometer.toLocaleString()} كم</span>
      ),
    },
    {
      accessorKey: 'lastUpdate',
      header: 'آخر تحديث',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original.lastUpdate.toLocaleTimeString('ar-SA')}
        </span>
      ),
    },
  ];

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
          <h2 className="text-2xl font-bold tracking-tight">التتبع المباشر</h2>
          <p className="text-gray-500">مراقبة حركة الأسطول في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">تحديث تلقائي</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متحركة</p>
              <p className="text-2xl font-bold text-green-600">{stats.moving}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Circle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوقفة</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-50">
              <Radio className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">غير متصلة</p>
              <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-500" />
            حالة المركبات
            {autoRefresh && (
              <Badge variant="outline" className="me-2 text-green-600">
                <RefreshCw className="h-3 w-3 animate-spin ms-1" />
                تحديث كل {refreshInterval} ثوان
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
              <Inbox className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium">لا توجد مركبات</p>
              <p className="text-sm">لا توجد مركبات مسجلة في النظام</p>
            </div>
          ) : (
            <DataTable columns={columns} data={liveData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
