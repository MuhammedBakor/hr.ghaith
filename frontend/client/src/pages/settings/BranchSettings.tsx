import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, Users, Loader2, Edit, Trash2 } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface Branch {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  managerId: number | null;
  isActive: boolean;
  createdAt: Date;
}

export default function BranchSettings() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [newBranch, setNewBranch] = useState({
    code: '',
    name: '',
    nameAr: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });

  const { data: branchesData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['hr-branches'],
    queryFn: () => api.get('/hr-branches').then(r => r.data),
  });

  const branches = (branchesData || []) as Branch[];

  const createBranchMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr-branches', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء الفرع بنجاح');
      setIsDialogOpen(false);
      setNewBranch({ code: '', name: '', nameAr: '', address: '', city: '', phone: '', email: '' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في إنشاء الفرع');
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: (data: any) => api.put(`/hr-branches/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث الفرع بنجاح');
      setIsDialogOpen(false);
      setEditingBranchId(null);
      setNewBranch({ code: '', name: '', nameAr: '', address: '', city: '', phone: '', email: '' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في تحديث الفرع');
    },
  });

  const handleCreateBranch = () => {
    if (!newBranch.code || !newBranch.name || !newBranch.nameAr) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const data = {
      code: newBranch.code,
      name: newBranch.name,
      nameAr: newBranch.nameAr,
      address: newBranch.address || undefined,
      city: newBranch.city || undefined,
      phone: newBranch.phone || undefined,
      email: newBranch.email || undefined,
    };
    if (editingBranchId) {
      updateBranchMutation.mutate({ id: editingBranchId, ...data });
    } else {
      createBranchMutation.mutate(data);
    }
  };

  const stats = {
    total: branches.length,
    active: branches.filter(b => b.isActive).length,
    inactive: branches.filter(b => !b.isActive).length,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الفروع</h2>
          <p className="text-gray-500">إعداد وإدارة فروع المنظمة</p>
        </div>
        {isDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">

          <div>
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء فرع جديد</h3>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الكود *</Label>
                <Input value={newBranch.code} onChange={(e) => setNewBranch({...newBranch, code: e.target.value})} placeholder="مثال: RYD001" />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية *</Label>
                <Input value={newBranch.name} onChange={(e) => setNewBranch({...newBranch, name: e.target.value})} placeholder="أدخل..." />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربية *</Label>
                <Input value={newBranch.nameAr} onChange={(e) => setNewBranch({...newBranch, nameAr: e.target.value})} placeholder="فرع الرياض" />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input value={newBranch.city} onChange={(e) => setNewBranch({...newBranch, city: e.target.value})} placeholder="الرياض" />
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={newBranch.address} onChange={(e) => setNewBranch({...newBranch, address: e.target.value})} placeholder="العنوان التفصيلي" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input value={newBranch.phone} onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})} placeholder="أدخل..." />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={newBranch.email} onChange={(e) => setNewBranch({...newBranch, email: e.target.value})} placeholder="الشركة" />
                </div>
              </div>
              <Button onClick={handleCreateBranch} className="w-full" disabled={createBranchMutation.isPending}>
                {createBranchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
                إنشاء الفرع
              </Button>
            </div>
          </div>
        </div>)}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الفروع</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">فروع نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <Building2 className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">فروع معطلة</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            قائمة الفروع
          </CardTitle>
              <PrintButton title="التقرير" />
          <CardDescription>جميع فروع المنظمة</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">الكود</TableHead>
                <TableHead className="text-end">الاسم</TableHead>
                <TableHead className="text-end">المدينة</TableHead>
                <TableHead className="text-end">الهاتف</TableHead>
                <TableHead className="text-end">البريد</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد فروع معرفة
                  </TableCell>
                </TableRow>
              ) : (
                branches?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-sm">{branch.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{branch.nameAr}</p>
                        <p className="text-sm text-gray-500">{branch.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {branch.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {branch.city}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {branch.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {branch.phone}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {branch.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {branch.email}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                        {branch.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setNewBranch({
                            code: branch.code, name: branch.name, nameAr: branch.nameAr,
                            address: branch.address || '', city: branch.city || '',
                            phone: branch.phone || '', email: branch.email || '',
                          });
                          setEditingBranchId(branch.id);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          if (confirm(`هل أنت متأكد من تعطيل فرع "${branch.nameAr}"؟`)) {
                            updateBranchMutation.mutate({ id: branch.id, isActive: false });
                          }
                        }}>
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
    </div>
  );
}
