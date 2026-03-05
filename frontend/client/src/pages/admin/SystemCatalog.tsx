import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Shield, Settings } from 'lucide-react';
import { Link } from 'wouter';

export default function SystemCatalog() {
  const { data: currentUser, isError, error, isLoading} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { data: rolesData } = useQuery({ queryKey: ['controlKernel', 'roles'], queryFn: () => api.get('/control-kernel/roles').then(r => r.data) });
  const { data: branchesData } = useQuery({ queryKey: ['controlKernel', 'branches'], queryFn: () => api.get('/control-kernel/branches').then(r => r.data) });
  
  const roles = (rolesData || []) as any[];
  const branches = (branchesData || []) as any[];

  const modules = [
    { name: 'الأسطول', path: '/fleet', status: 'active', count: 'متاح' },
    { name: 'الموارد البشرية', path: '/hr', status: 'active', count: 'متاح' },
    { name: 'المستندات', path: '/documents', status: 'active', count: 'متاح' },
    { name: 'الحوكمة', path: '/governance', status: 'active', count: 'متاح' },
    { name: 'ذكاء الأعمال', path: '/bi', status: 'active', count: 'متاح' },
    { name: 'الإعدادات', path: '/settings', status: 'active', count: 'متاح' },
  ];

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  
  return (
    <div className="space-y-6" dir="rtl">
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">كتالوج النظام</h2>
        <p className="text-gray-500">نظرة عامة على مكونات النظام</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الوحدات</p>
              <p className="text-2xl font-bold">{modules.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الأدوار</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Server className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الفروع</p>
              <p className="text-2xl font-bold">{branches.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Settings className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الحالة</p>
              <p className="text-2xl font-bold">نشط</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            وحدات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <Link key={module.id ?? `Link-${index}`} href={module.path}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{module.name}</span>
                    <Badge className="bg-green-100 text-green-800">{module.count}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
