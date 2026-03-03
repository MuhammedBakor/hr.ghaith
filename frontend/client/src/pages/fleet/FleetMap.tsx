import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { 
  MapPin,
  RefreshCw,
  ExternalLink,
  Car,
  Navigation,
  Loader2
} from 'lucide-react';

interface VehicleLocation {
  id: number;
  vehicleId: number;
  plateNumber: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: string;
  lastUpdate: Date;
}

function gmapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function osmEmbedLink(lat: number, lng: number) {
  const bbox = `${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'moving':
      return <Badge className="bg-green-100 text-green-800">متحرك</Badge>;
    case 'idle':
      return <Badge className="bg-yellow-100 text-yellow-800">متوقف</Badge>;
    case 'offline':
      return <Badge className="bg-gray-100 text-gray-800">غير متصل</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function FleetMap() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = trpc.fleet.geofences.create.useMutation({ onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);
  const updateMutation = trpc.fleet.geofences.update.useMutation({ onSuccess: () => { refetch(); setEditingItem(null); } });

  const deleteMutation = trpc.fleet.geofences.delete.useMutation({ onSuccess: () => { refetch(); } });

  const handleSave = () => {
    updateMutation.mutate(editingItem);
  };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'fleet_manager';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);

  // البيانات من API
  const { data: vehiclesData, isLoading, refetch } = trpc.fleet.vehicles.list.useQuery();
  const vehicles = vehiclesData || [];

  // تحويل بيانات المركبات إلى مواقع (في الإنتاج ستأتي من GPS API)
  const vehicleLocations: VehicleLocation[] = useMemo(() => {
    return vehicles.map((v: any, index: number) => ({
      id: v.id,
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      // في الإنتاج: استخدم بيانات GPS الفعلية
      lat: 24.7136 + (index * 0.01),
      lng: 46.6753 + (index * 0.01),
      speed: v.status === 'in_use' ? Math.floor(Math.random() * 80) : 0,
      heading: Math.floor(Math.random() * 360),
      status: v.status === 'in_use' ? 'moving' : v.status === 'available' ? 'idle' : 'offline',
      lastUpdate: v.updatedAt || new Date(),
    }));
  }, [vehicles]);

  // Set default selected vehicle
  useEffect(() => {
    if (!selectedVehicle && vehicleLocations.length > 0) {
      setSelectedVehicle(vehicleLocations[0]);
    }
  }, [vehicleLocations, selectedVehicle]);

  const lat = selectedVehicle?.lat;
  const lng = selectedVehicle?.lng;

  if (isLoading) {
    
  if (isError) return (
    <div className="p-8 text-center">
        {/* إضافة جديد */}
        <div className="mb-4 flex justify-between items-center">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showCreateForm ? 'إلغاء' : '+ إضافة جديد'}
          </button>
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="الاسم" value={createData.name || ''} onChange={e => setCreateData({...createData, name: e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input placeholder="الوصف" value={createData.description || ''} onChange={e => setCreateData({...createData, description: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => createMutation.mutate(createData)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ</button>
          </div>
        )}
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
          <h2 className="text-2xl font-bold tracking-tight">خريطة الأسطول</h2>
          <p className="text-gray-500">تتبع مواقع المركبات في الوقت الفعلي</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              المركبات ({vehicleLocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {vehicleLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد مركبات</p>
                </div>
              ) : (
                vehicleLocations.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedVehicle?.id === vehicle.id ? 'bg-primary/5 border-r-4 border-r-primary' : ''
                    }`}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vehicle.plateNumber}</p>
                        <p className="text-sm text-gray-500">
                          {vehicle.speed} كم/س
                        </p>
                      </div>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      آخر تحديث: {new Date(vehicle.lastUpdate).toLocaleTimeString('ar-SA')}
                    </p>
                  
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(vehicle)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: vehicle.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                الموقع
              </span>
              {lat && lng && (
                <a
                  href={gmapsLink(lat, lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  فتح في خرائط Google
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVehicle && lat && lng ? (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={osmEmbedLink(lat, lng)}
                    title="خريطة الموقع"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">رقم اللوحة</p>
                    <p className="font-medium">{selectedVehicle.plateNumber}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">السرعة</p>
                    <p className="font-medium">{selectedVehicle.speed} كم/س</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">الاتجاه</p>
                    <p className="font-medium flex items-center gap-1">
                      <Navigation className="h-4 w-4" style={{ transform: `rotate(${selectedVehicle.heading}deg)` }} />
                      {selectedVehicle.heading}°
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">الإحداثيات</p>
                    <p className="font-medium text-xs">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>اختر مركبة لعرض موقعها</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
