import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Shield, Search, Eye, Loader2, ArrowRight, Key, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

type ViewMode = 'list' | 'view';

export default function Roles() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'name': '', 'description': '', 'permissions': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.toString().trim()) errors.name = 'مطلوب';
    if (!formData.description?.toString().trim()) errors.description = 'مطلوب';
    if (!formData.permissions?.toString().trim()) errors.permissions = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/roles', data).then(res => res.data),
    onSuccess: () => {
      setFormData({ 'name': '', 'description': '', 'permissions': '' });
      setIsSubmitting(false);
      toast.success('تم الحفظ بنجاح');
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      toast.error(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => api.get('/roles').then(res => res.data),
  });

  // جلب صلاحيات الدور المحدد
  const { data: rolePermissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: () => api.get(`/roles/${selectedRole?.id}/permissions`).then(res => res.data),
    enabled: !!selectedRole?.id && showPermissionsDialog,
  });

  // Seed defaults mutation
  const seedDefaultsMutation = useMutation({
    mutationFn: () => api.post('/roles/seed-defaults').then(res => res.data),
    onSuccess: () => {
      toast.success('تم تهيئة الأدوار الافتراضية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
    },
    onError: (error: any) => {
      toast.error('فشل في تهيئة الأدوار: ' + error.message);
    },
  });

  const filteredRoles = (roles || []).filter((role: any) =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.nameAr?.includes(searchTerm)
  );

  const openViewDialog = (role: any) => {
    setSelectedRole(role);
    setViewMode('view');
  };

  const openPermissionsDialog = (role: any) => {
    setSelectedRole(role);
    setShowPermissionsDialog(true);
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;


    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        {/* نموذج متكامل مضمن */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم</label>
              <input value={formData.name || ""} onChange={(e) => handleFieldChange("name", e.target.value)} placeholder="الاسم" className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? "border-red-500" : ""}`} />
              {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <input value={formData.description || ""} onChange={(e) => handleFieldChange("description", e.target.value)} placeholder="الوصف" className={`w-full px-3 py-2 border rounded-lg ${formErrors.description ? "border-red-500" : ""}`} />
              {formErrors.description && <span className="text-xs text-red-500">{formErrors.description}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الصلاحيات</label>
              <input value={formData.permissions || ""} onChange={(e) => handleFieldChange("permissions", e.target.value)} placeholder="الصلاحيات" className={`w-full px-3 py-2 border rounded-lg ${formErrors.permissions ? "border-red-500" : ""}`} />
              {formErrors.permissions && <span className="text-xs text-red-500">{formErrors.permissions}</span>}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>

        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // عرض تفاصيل الدور
  if (viewMode === 'view' && selectedRole) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedRole(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تفاصيل الدور</h2>
            <p className="text-gray-500">{selectedRole.nameAr || selectedRole.name}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-500">الكود</Label>
                <p className="font-mono">{selectedRole.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالإنجليزية</Label>
                <p className="font-medium">{selectedRole.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالعربية</Label>
                <p className="font-medium">{selectedRole.nameAr || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">المستوى</Label>
                <p className="font-medium">{selectedRole.level}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">الوصف</Label>
                <p className="font-medium">{selectedRole.description || 'لا يوجد وصف'}</p>
              </div>
              <div>
                <Label className="text-gray-500">الحالة</Label>
                <Badge variant={selectedRole.isActive ? 'default' : 'secondary'}>
                  {selectedRole.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">نوع الدور</Label>
                <Badge variant={selectedRole.isSystem ? 'outline' : 'default'}>
                  {selectedRole.isSystem ? 'نظامي' : 'مخصص'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              الصلاحيات
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <Button onClick={() => openPermissionsDialog(selectedRole)}>
              عرض الصلاحيات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            إدارة الأدوار
          </h2>
          <p className="text-gray-500">إدارة أدوار وصلاحيات النظام</p>
        </div>
        <Button
          onClick={() => seedDefaultsMutation.mutate()}
          disabled={seedDefaultsMutation.isPending}
          variant="outline"
        >
          {seedDefaultsMutation.isPending ? (
            <Loader2 className="h-4 w-4 ms-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 ms-2" />
          )}
          تهيئة الأدوار الافتراضية
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث عن دور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>الأدوار ({filteredRoles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">الكود</TableHead>
                <TableHead className="text-end">الاسم</TableHead>
                <TableHead className="text-end">المستوى</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    لا توجد أدوار
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role: any) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono">{role.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.nameAr || role.name}</p>
                        {role.nameAr && <p className="text-sm text-gray-500">{role.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{role.level}</TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? 'outline' : 'default'}>
                        {role.isSystem ? 'نظامي' : 'مخصص'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? 'default' : 'secondary'}>
                        {role.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(role)} title="عرض التفاصيل">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(role)} title="عرض الصلاحيات">
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      {showPermissionsDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Key className="h-5 w-5" />
              صلاحيات الدور: {selectedRole?.nameAr || selectedRole?.name}
            </h3>
            <p className="text-sm text-gray-500">
              قائمة الصلاحيات المعينة لهذا الدور
            </p>
          </div>

          <div className="py-4">
            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : rolePermissions && rolePermissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">الوحدة</TableHead>
                    <TableHead className="text-end">المورد</TableHead>
                    <TableHead className="text-end">الإجراء</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolePermissions.map((perm: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{perm.module}</TableCell>
                      <TableCell>{perm.resource}</TableCell>
                      <TableCell>{perm.action}</TableCell>
                      <TableCell>
                        <Badge variant={perm.isAllowed ? 'default' : 'destructive'}>
                          {perm.isAllowed ? 'مسموح' : 'ممنوع'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">لا توجد صلاحيات معينة لهذا الدور</p>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
