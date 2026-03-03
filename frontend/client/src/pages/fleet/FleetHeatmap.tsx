import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Activity, Loader2 } from 'lucide-react';

export default function FleetHeatmap() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { data: vehiclesData, isLoading } = trpc.fleet.vehicles.list.useQuery();
  const vehicles = (vehiclesData || []) as any[];

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
        <h2 className="text-2xl font-bold tracking-tight">خريطة الكثافة</h2>
        <p className="text-gray-500">عرض توزيع المركبات على الخريطة</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مركبات نشطة</p>
              <p className="text-2xl font-bold">{vehicles.filter((v: any) => v.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Map className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مناطق التغطية</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            خريطة الكثافة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">خريطة الكثافة</p>
              <p className="text-sm text-gray-400">تحتاج إلى بيانات GPS لعرض الخريطة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
