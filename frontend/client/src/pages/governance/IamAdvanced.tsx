import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Lock, Loader2, Inbox } from 'lucide-react';

export default function IamAdvanced() {
  const queryClient = useQueryClient();
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const handleSubmit = () => { createMut.mutate({}); };

  const [searchTerm, setSearchTerm] = useState('');
  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/governance', data).then(r => r.data),
    onError: (e: any) => { alert(e.message || "حدث خطأ"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      window.location.reload();
    },
  });
  const roles = (rolesData || []) as any[];

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
        <h2 className="text-2xl font-bold tracking-tight">إدارة الهوية المتقدمة</h2>
        <p className="text-gray-500">إعدادات متقدمة للأمان والصلاحيات</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الأدوار</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الصلاحيات</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">سياسات الأمان</p>
              <p className="text-2xl font-bold">--</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إعدادات الأمان المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-50 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">لا توجد إعدادات مخصصة</p>
            <p className="text-sm text-gray-400">يمكنك إضافة سياسات أمان مخصصة هنا</p>
          </div>
        </CardContent>
      </Card>

        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
