import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Truck, MapPin, Loader2, Inbox } from 'lucide-react';

export default function FleetETA() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/fleet/vehicles').then(r => r.data),
  });
  const vehicles = (vehiclesData || []) as any[];
  const activeVehicles = vehicles.filter(v => v.status === 'active');

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">أوقات الوصول المتوقعة</h2>
        <p className="text-gray-500">تتبع أوقات الوصول المتوقعة للمركبات</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مركبات في الطريق</p>
              <p className="text-2xl font-bold">{activeVehicles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متوسط ETA</p>
              <p className="text-2xl font-bold">-- دقيقة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <MapPin className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">وجهات نشطة</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تفاصيل أوقات الوصول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-50 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">لا توجد رحلات نشطة</p>
            <p className="text-sm text-gray-400">ستظهر أوقات الوصول عند بدء رحلات جديدة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
