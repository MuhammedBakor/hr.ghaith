import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Car, FileText, Building2, Activity, Loader2, ArrowUpRight } from 'lucide-react';

export default function BIPage() {
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  // Fetch data from available APIs
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({ queryKey: ['fleet', 'vehicles'], queryFn: () => api.get('/fleet/vehicles').then(r => r.data) });
  const { data: driversData, isLoading: driversLoading } = useQuery({ queryKey: ['fleet', 'drivers'], queryFn: () => api.get('/fleet/drivers').then(r => r.data) });
  const { data: documentsData, isLoading: documentsLoading } = useQuery({ queryKey: ['documents', 'list'], queryFn: () => api.get('/documents').then(r => r.data) });
  const { data: rolesData, isLoading: rolesLoading } = useQuery({ queryKey: ['controlKernel', 'roles'], queryFn: () => api.get('/control-kernel/roles').then(r => r.data) });
  const { data: branchesData, isLoading: branchesLoading } = useQuery({ queryKey: ['controlKernel', 'branches'], queryFn: () => api.get('/control-kernel/branches').then(r => r.data) });

  const vehicles = vehiclesData || [];
  const drivers = driversData || [];
  const documents = documentsData || [];
  const roles = rolesData || [];
  const branches = branchesData || [];

  const isLoading = vehiclesLoading || driversLoading || documentsLoading || rolesLoading || branchesLoading;

  // Calculate stats
  const stats = {
    vehicles: {
      total: vehicles.length,
      active: vehicles.filter((v: any) => v.status === 'active').length,
      maintenance: vehicles.filter((v: any) => v.status === 'maintenance').length,
    },
    drivers: {
      total: drivers.length,
      active: drivers.filter((d: any) => d.status === 'active').length,
    },
    documents: {
      total: documents.length,
      published: documents.filter((d: any) => d.status === 'published').length,
    },
    organization: {
      roles: roles.length,
      branches: branches.length,
    }
  };

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
        <h2 className="text-2xl font-bold tracking-tight">لوحة ذكاء الأعمال</h2>
        <p className="text-gray-500">نظرة شاملة على مؤشرات الأداء الرئيسية</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">إجمالي المركبات</p>
                <p className="text-3xl font-bold">{stats.vehicles.total?.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 ms-1" />
                  {stats.vehicles.active} نشطة
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">السائقين</p>
                <p className="text-3xl font-bold">{stats.drivers.total?.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 ms-1" />
                  {stats.drivers.active} نشط
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">المستندات</p>
                <p className="text-3xl font-bold">{stats.documents.total?.toLocaleString()}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <FileText className="h-3 w-3 ms-1" />
                  {stats.documents.published} منشور
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">الفروع</p>
                <p className="text-3xl font-bold">{stats.organization.branches}</p>
                <p className="text-xs text-amber-600 flex items-center mt-1">
                  <Building2 className="h-3 w-3 ms-1" />
                  {stats.organization.roles} أدوار
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <Building2 className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              حالة الأسطول
            </CardTitle>
            <CardDescription>توزيع حالات المركبات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">نشطة</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${stats.vehicles.total ? (stats.vehicles.active / stats.vehicles.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.vehicles.active}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">صيانة</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${stats.vehicles.total ? (stats.vehicles.maintenance / stats.vehicles.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.vehicles.maintenance}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">أخرى</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 rounded-full" 
                      style={{ width: `${stats.vehicles.total ? ((stats.vehicles.total - stats.vehicles.active - stats.vehicles.maintenance) / stats.vehicles.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.vehicles.total - stats.vehicles.active - stats.vehicles.maintenance}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              ملخص النظام
            </CardTitle>
            <CardDescription>إحصائيات عامة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.vehicles.total?.toLocaleString()}</p>
                <p className="text-sm text-blue-600">مركبة</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{stats.drivers.total?.toLocaleString()}</p>
                <p className="text-sm text-green-600">سائق</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{stats.documents.total?.toLocaleString()}</p>
                <p className="text-sm text-purple-600">مستند</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-700">{stats.organization.branches}</p>
                <p className="text-sm text-amber-600">فرع</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">حول لوحة ذكاء الأعمال</h3>
              <p className="text-sm text-gray-600">
                تعرض هذه اللوحة ملخصاً للبيانات الرئيسية في النظام. يتم تحديث الإحصائيات تلقائياً عند إضافة أو تعديل البيانات.
                للحصول على تقارير تفصيلية، يمكنك زيارة قسم التقارير في كل وحدة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
