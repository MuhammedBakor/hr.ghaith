import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, PieChart, Loader2, Car, Users, Fuel } from 'lucide-react';

export default function FleetInsights() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { data: vehiclesData, isLoading: vLoading } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/fleet/vehicles').then(r => r.data),
  });
  const { data: driversData, isLoading: dLoading } = useQuery({
    queryKey: ['fleet-extended', 'drivers'],
    queryFn: () => api.get('/fleet-extended/drivers').then(r => r.data),
  });
  
  const vehicles = (vehiclesData || []) as any[];
  const drivers = (driversData || []) as any[];
  const isLoading = vLoading || dLoading;

  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((d: any) => d.status === 'active').length,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">رؤى الأسطول</h2>
        <p className="text-gray-500">تحليلات ورؤى ذكية عن أداء الأسطول</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المركبات</p>
              <p className="text-2xl font-bold">{stats.totalVehicles}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">السائقين</p>
              <p className="text-2xl font-bold">{stats.totalDrivers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نسبة النشاط</p>
              <p className="text-2xl font-bold">{stats.totalVehicles ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Fuel className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">كفاءة الوقود</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع حالات المركبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">نشطة</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalVehicles ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium">{stats.activeVehicles}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">غير نشطة</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${stats.totalVehicles ? ((stats.totalVehicles - stats.activeVehicles) / stats.totalVehicles) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium">{stats.totalVehicles - stats.activeVehicles}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              توزيع السائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">نشطين</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalDrivers ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium">{stats.activeDrivers}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">غير نشطين</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-400 rounded-full" style={{ width: `${stats.totalDrivers ? ((stats.totalDrivers - stats.activeDrivers) / stats.totalDrivers) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium">{stats.totalDrivers - stats.activeDrivers}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
