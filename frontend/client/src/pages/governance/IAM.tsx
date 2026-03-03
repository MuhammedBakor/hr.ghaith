import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Key, Lock, UserCheck, Search, Loader2 } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface User {
  id: number;
  openId: string;
  username: string | null;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  lastSignedIn: Date;
}

interface Role {
  id: number;
  code?: string | null;
  name: string;
  nameAr: string;
  level: number;
  isSystem: boolean;
  isActive?: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function IAM() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = trpc.admin.rbac.create.useMutation({ onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);

  const deleteMutation = trpc.admin.rbac.delete.useMutation({ onSuccess: () => { refetch(); } });

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const queryError = false; // Error state from useQuery

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // Users list from API - استخدام kernel.users.list
  const { data: usersData, isLoading: usersLoading } = trpc.kernel.users.list.useQuery();
  // Use hrAdvanced.roles.list which has actual data
  const { data: rolesData, isLoading: rolesLoading } = trpc.hrAdvanced.roles.list.useQuery();

  const users = (usersData || []) as User[];
  const roles = (rolesData || []) as Role[];

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => {
      const lastLogin = new Date(u.lastSignedIn);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastLogin > thirtyDaysAgo;
    }).length,
    totalRoles: roles.length,
    adminUsers: users.filter(u => u.role === 'admin').length,
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-800">مدير</Badge>;
      case 'user': return <Badge className="bg-blue-100 text-blue-800">مستخدم</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const isLoading = usersLoading || rolesLoading;

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الهوية والوصول (IAM)</h2>
          <p className="text-gray-500">إدارة المستخدمين والأدوار والصلاحيات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مستخدمين نشطين</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الأدوار</p>
              <p className="text-2xl font-bold">{stats.totalRoles}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <Key className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مدراء النظام</p>
              <p className="text-2xl font-bold">{stats.adminUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة المستخدمين</CardTitle>
              <PrintButton title="قائمة المستخدمين" />
                <div className="relative w-64">
                  <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pe-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">المستخدم</TableHead>
                    <TableHead className="text-end">البريد الإلكتروني</TableHead>
                    <TableHead className="text-end">الدور</TableHead>
                    <TableHead className="text-end">آخر دخول</TableHead>
                    <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        لا يوجد مستخدمين
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.name || user.username || 'مستخدم'}</p>
                              <p className="text-xs text-gray-500">@{user.username || user.openId.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{formatDate(user.lastSignedIn)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الأدوار</CardTitle>
              <CardDescription>الأدوار المعرفة في النظام</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        لا توجد أدوار معرفة
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-sm">{role.code || role.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{role.nameAr}</p>
                            <p className="text-sm text-gray-500">{role.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.level}</Badge>
                        </TableCell>
                        <TableCell>
                          {role.isSystem ? (
                            <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />نظام</Badge>
                          ) : (
                            <Badge variant="secondary">مخصص</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={(role.isActive !== false) ? 'default' : 'secondary'}>
                            {(role.isActive !== false) ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(user)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: user.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
  );
}
