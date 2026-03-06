import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Users, Settings, Loader2, Edit, Trash2, Key, Lock } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface Role {
  id: number;
  name: string;
  nameAr: string;
  description: string | null;
  level: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  module: string;
  description: string | null;
}

export default function RoleSettings() {
  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    level: 1,
  });

  const { data: rolesData, isLoading, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  const roles = (rolesData || []) as Role[];

  const createRoleMutation = useMutation({
    mutationFn: (data: any) => api.post('/roles', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء الدور بنجاح');
      refetch();
      setIsOpen(false);
      setNewRole({ code: '', nameAr: '', nameEn: '', description: '', level: 1 });
    },
    onError: (error: any) => {
      toast.error('حدث خطأ أثناء إنشاء الدور: ' + error.message);
    },
  });

  const handleCreateRole = () => {
    if (!newRole.code || !newRole.nameAr || !newRole.nameEn) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createRoleMutation.mutate({
      name: newRole.code,
      nameAr: newRole.nameAr,
      description: newRole.description || undefined,
      level: newRole.level,
    });
  };

  const getLevelBadge = (level: number) => {
    if (level >= 90) return <Badge className="bg-red-100 text-red-800">مدير النظام</Badge>;
    if (level >= 70) return <Badge className="bg-orange-100 text-orange-800">مدير</Badge>;
    if (level >= 50) return <Badge className="bg-blue-100 text-blue-800">مشرف</Badge>;
    if (level >= 30) return <Badge className="bg-green-100 text-green-800">موظف</Badge>;
    return <Badge variant="outline">أساسي</Badge>;
  };

  const stats = {
    total: roles.length,
    system: roles.filter(r => r.isSystem).length,
    custom: roles.filter(r => !r.isSystem).length,
    active: roles.length, // All roles are active by default
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الأدوار والصلاحيات</h2>
          <p className="text-gray-500">تعريف الأدوار وتعيين الصلاحيات للمستخدمين</p>
        </div>
        {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">


            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء دور جديد</h3>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الكود *</Label>
                <Input value={newRole.code} onChange={(e) => setNewRole({...newRole, code: e.target.value})} placeholder="مثال: hr_manager" />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربية *</Label>
                <Input value={newRole.nameAr} onChange={(e) => setNewRole({...newRole, nameAr: e.target.value})} placeholder="مدير الموارد البشرية" />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية *</Label>
                <Input value={newRole.nameEn} onChange={(e) => setNewRole({...newRole, nameEn: e.target.value})} placeholder="HR Manager" />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input value={newRole.description} onChange={(e) => setNewRole({...newRole, description: e.target.value})} placeholder="وصف الدور" />
              </div>
              <div className="space-y-2">
                <Label>المستوى (1-100)</Label>
                <Input type="number" min={1} max={100} value={newRole.level} onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value) || 1})} />
              </div>
              <Button onClick={handleCreateRole} className="w-full">
                إنشاء الدور
              </Button>
            </div>

        </div>)}

      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الأدوار</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">أدوار النظام</p>
              <p className="text-2xl font-bold">{stats.system}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">أدوار مخصصة</p>
              <p className="text-2xl font-bold">{stats.custom}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">أدوار نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            قائمة الأدوار
          </CardTitle>
              <PrintButton title="التقرير" />
          <CardDescription>جميع الأدوار المعرفة في النظام</CardDescription>
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
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد أدوار معرفة
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-sm">{role.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.nameAr}</p>
                        <p className="text-sm text-gray-500">{role.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(role.level)}</TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />نظام</Badge>
                      ) : (
                        <Badge variant="secondary">مخصص</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        نشط
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedRole(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button size="sm" variant="destructive" onClick={() => toast.info("حذف الدور")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">حول نظام الأدوار</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• أدوار النظام لا يمكن حذفها أو تعديل صلاحياتها الأساسية</li>
                <li>• مستوى الدور يحدد التسلسل الهرمي (100 = أعلى صلاحية)</li>
                <li>• يمكن للمستخدم أن يحمل أكثر من دور في نفس الوقت</li>
                <li>• الصلاحيات تُجمع من جميع الأدوار المعينة للمستخدم</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
