import { useState } from 'react';
import { generateNextCode } from '@/lib/generateCode';
import { useAppContext } from '@/contexts/AppContext';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useBranches } from '@/services/hrService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, Loader2, Edit, Trash2 } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  nameAr: string;
  code: string;
  branchId: number | null;
  managerId: number | null;
  isActive: boolean;
}

export default function DepartmentSettings() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole, selectedBranchId } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', nameAr: '', code: '', branchId: '',
  });

  const { data: departmentsData, isLoading, refetch, isError } = useDepartments({ branchId: selectedBranchId });
  const { data: branchesData } = useBranches();

  const departments = (departmentsData || []) as Department[];
  const branches = (branchesData || []) as any[];

  const createMutation = useCreateDepartment();

  const updateMutation = useUpdateDepartment();

  const resetForm = () => setForm({ name: '', nameAr: '', code: '', branchId: '' });

  const handleSubmit = () => {
    if (!form.name || !form.nameAr || !form.code) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const data = {
      name: form.name,
      nameAr: form.nameAr,
      code: form.code,
      branchId: parseInt(form.branchId),
    };
    const onSuccess = () => {
      toast.success(editingId ? 'تم تحديث القسم بنجاح' : 'تم إنشاء القسم بنجاح');
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      refetch();
    };
    const onError = (err: any) => toast.error(err.message || 'فشل في حفظ القسم');
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data }, { onSuccess, onError });
    } else {
      createMutation.mutate(data, { onSuccess, onError });
    }
  };

  const handleEdit = (dept: Department) => {
    setForm({
      name: dept.name,
      nameAr: dept.nameAr,
      code: dept.code,
      branchId: dept.branchId?.toString() || '',
    });
    setEditingId(dept.id);
    setIsDialogOpen(true);
  };

  const getBranchName = (branchId: number | null) => {
    if (!branchId) return '-';
    const branch = branches.find((b: any) => b.id === branchId);
    return branch?.nameAr || branch?.name || '-';
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">إدارة الأقسام</h2>
            <p className="text-gray-500">إنشاء وتعديل أقسام المنظمة</p>
          </div>
          <Button onClick={() => { resetForm(); setForm(f => ({ ...f, code: generateNextCode('DEPT', departments) })); setEditingId(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 ms-2" />
            قسم جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الأقسام ({departments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكود</TableHead>
                      <TableHead>اسم القسم</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-mono">{dept.code}</TableCell>
                        <TableCell className="font-medium">{dept.nameAr || dept.name}</TableCell>
                        <TableCell>{getBranchName(dept.branchId)}</TableCell>
                        <TableCell>
                          <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                            {dept.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(dept)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              if (confirm(`هل أنت متأكد من تعطيل قسم "${dept.nameAr}"؟`)) {
                                updateMutation.mutate({ id: dept.id, isActive: false }, {
                                  onSuccess: () => { toast.success('تم تعطيل القسم'); refetch(); },
                                  onError: (err: any) => toast.error(err.message),
                                });
                              }
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          لا توجد أقسام - أضف قسماً جديداً
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {isDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
          <div>
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">{editingId ? 'تعديل القسم' : 'قسم جديد'}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>كود القسم *</Label>
                <Input value={form.code} readOnly={!editingId} className={!editingId ? "bg-muted font-mono" : "font-mono"} onChange={(e) => editingId && setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربية *</Label>
                <Input placeholder="مثال: تقنية المعلومات" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية *</Label>
                <Input placeholder="مثال: Information Technology" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الفرع</Label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.nameAr || branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إنشاء'}
                </Button>
              </div>
            </div>
          </div>
        </div>)}
      </div>
    </>
  );
}