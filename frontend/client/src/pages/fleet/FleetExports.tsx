import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, Car, Users, Wrench } from 'lucide-react';

export default function FleetExports() {
  const { data: currentUser, isError, error, isLoading} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [exportType, setExportType] = useState('vehicles');
  const [format, setFormat] = useState('csv');

  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });
  const { data: driversData } = useQuery({
    queryKey: ['fleet-extended', 'drivers'],
    queryFn: () => api.get('/api/fleet-extended/drivers').then(r => r.data),
  });

  const vehicles = (vehiclesData || []) as any[];
  const drivers = (driversData || []) as any[];

  const handleExport = () => {
    toast.success(`جاري تصدير ${exportType === 'vehicles' ? 'المركبات' : exportType === 'drivers' ? 'السائقين' : 'الصيانة'} بصيغة ${format.toUpperCase()}`);
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {isLoading && <div className="text-center py-8 text-gray-500">جاري التحميل...</div>}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">تصدير البيانات</h2>
        <p className="text-gray-500">تصدير بيانات الأسطول بصيغ مختلفة</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المركبات</p>
              <p className="text-2xl font-bold">{vehicles.length}</p>
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
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">سجلات الصيانة</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            خيارات التصدير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع البيانات</label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicles">المركبات</SelectItem>
                  <SelectItem value="drivers">السائقين</SelectItem>
                  <SelectItem value="maintenance">الصيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">صيغة الملف</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير البيانات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
