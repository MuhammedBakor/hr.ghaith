import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, useUpdateEmployee } from '@/services/hrService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users as UsersIcon, Search, Plus, Edit, Trash2, Shield, Loader2, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { PrintButton } from "@/components/PrintButton";

type ViewMode = 'list' | 'view' | 'edit';

export default function Users() {
  // v63: قراءة الدور من AppContext بدل hardcoded
  const { selectedRole } = useAppContext();
  const userRole = selectedRole;
  const canEdit = ['admin', 'general_manager', 'hr_manager'].includes(userRole);
  const canDelete = userRole === 'admin';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // استخدام useEmployees لجلب قائمة الموظفين
  const { data: employees, isLoading, isError, error } = useEmployees();

  // Mutation لتحديث الموظف
  const updateMutation = useUpdateEmployee();

  const filteredUsers = (employees || []).filter((emp: any) =>
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (newStatus: string) => {
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      status: newStatus as any,
    }, {
      onSuccess: () => {
        toast.success('تم تحديث بيانات المستخدم بنجاح');
        setViewMode('list');
        setSelectedUser(null);
      },
      onError: (error: any) => {
        toast.error('فشل في التحديث: ' + error.message);
      },
    });
  };

  const openViewDialog = (user: any) => {
    setSelectedUser(user);
    setViewMode('view');
  };

  const openEditDialog = (user: any) => {
    setSelectedUser({ ...user });
    setViewMode('edit');
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    // تغيير حالة المستخدم إلى terminated بدلاً من الحذف الفعلي
    updateMutation.mutate({
      id: userToDelete.id,
      status: 'terminated',
    }, {
      onSuccess: () => {
        toast.success('تم تحديث بيانات المستخدم بنجاح');
      },
      onError: (error: any) => {
        toast.error('فشل في التحديث: ' + error.message);
      },
    });
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // عرض تفاصيل المستخدم
  if (viewMode === 'view' && selectedUser) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedUser(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تفاصيل المستخدم</h2>
            <p className="text-gray-500">{selectedUser.firstName} {selectedUser.lastName}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-500">الاسم الكامل</Label>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <Label className="text-gray-500">البريد الإلكتروني</Label>
                <p className="font-medium">{selectedUser.email || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">رقم الهاتف</Label>
                <p className="font-medium">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">الحالة</Label>
                <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'}>
                  {selectedUser.status === 'active' ? 'نشط' : selectedUser.status === 'terminated' ? 'منتهي' : 'غير نشط'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">القسم</Label>
                <p className="font-medium">{selectedUser.department || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">المسمى الوظيفي</Label>
                <p className="font-medium">{selectedUser.position || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">تاريخ الانضمام</Label>
                <p className="font-medium">{selectedUser.joinDate ? formatDate(selectedUser.joinDate) : '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">تاريخ الإنشاء</Label>
                <p className="font-medium">{selectedUser.createdAt ? formatDate(selectedUser.createdAt) : '-'}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedUser(null); }}>إغلاق</Button>
              <Button onClick={() => setViewMode('edit')}>تعديل</Button>
              <Link href={`/hr/employees/${selectedUser.id}`}>
                <Button variant="secondary" onClick={() => window.location.href = `/hr/employee/${selectedUser.id}`}>عرض الملف الكامل</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض نموذج تعديل المستخدم
  if (viewMode === 'edit' && selectedUser) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedUser(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تعديل المستخدم</h2>
            <p className="text-gray-500">{selectedUser.firstName} {selectedUser.lastName}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={selectedUser.status}
                onValueChange={(value) => setSelectedUser({ ...selectedUser, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="on_leave">في إجازة</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                  <SelectItem value="terminated">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedUser(null); }}>إلغاء</Button>
              <Button onClick={() => handleStatusChange(selectedUser.status)} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-gray-500">إدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
        <Link href="/hr/employees/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            مستخدم جديد
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">النشطين</p>
              <p className="text-2xl font-bold">{(employees || []).filter((u: any) => u.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <UsersIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">غير النشطين</p>
              <p className="text-2xl font-bold">{(employees || []).filter((u: any) => u.status !== 'active').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              قائمة المستخدمين
            </CardTitle>
            <PrintButton title="التقرير" />
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
                <TableHead className="text-end">الاسم</TableHead>
                <TableHead className="text-end">البريد الإلكتروني</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
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
                filteredUsers?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'نشط' : user.status === 'terminated' ? 'منتهي' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt ? formatDate(user.createdAt) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openViewDialog(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(user)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إنهاء الخدمة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إنهاء خدمة المستخدم "{userToDelete?.firstName} {userToDelete?.lastName}"؟ سيتم تغيير حالته إلى "منتهي".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {updateMutation.isPending ? 'جاري التنفيذ...' : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
