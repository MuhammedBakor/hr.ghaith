import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal, Pencil, Trash2, FolderKanban, Loader2, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';

interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  department?: string | null;
  budget?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt?: Date | null;
}

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'معلق',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Projects() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as ProjectStatus,
    department: '',
    budget: '',
  });

  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['operations-projects'],
    queryFn: () => api.get('/operations/projects').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/operations/projects', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء المشروع بنجاح');
      setIsAddOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['operations-projects'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في إنشاء المشروع: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/operations/projects', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث المشروع بنجاح');
      setIsEditOpen(false);
      setSelectedProject(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['operations-projects'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في تحديث المشروع: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete('/operations/projects', { data }).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف المشروع بنجاح');
      setIsDeleteOpen(false);
      setSelectedProject(null);
      queryClient.invalidateQueries({ queryKey: ['operations-projects'] });
    },
    onError: (error: any) => {
      toast.error(`خطأ في حذف المشروع: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'draft',
      department: '',
      budget: '',
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المشروع');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      department: formData.department || undefined,
      budget: formData.budget || undefined,
    });
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      department: project.department || '',
      budget: project.budget || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProject) return;
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المشروع');
      return;
    }
    updateMutation.mutate({
      id: selectedProject.id,
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      department: formData.department || undefined,
      budget: formData.budget || undefined,
    });
  };

  const handleDelete = (project: Project) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: project });
    }
  };

  const confirmDelete = () => {
    if (!selectedProject) return;
    deleteMutation.mutate({ id: selectedProject.id });
  };

  const filteredProjects = (projects || []).filter((project: Project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.department && project.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Stats
  const stats = {
    total: (projects || []).length,
    active: (projects || []).filter((p: Project) => p.status === 'active').length,
    completed: (projects || []).filter((p: Project) => p.status === 'completed').length,
    onHold: (projects || []).filter((p: Project) => p.status === 'on_hold').length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المشاريع</h2>
          <p className="text-gray-500">إدارة المشاريع والمهام</p>
        </div>
        {isAddOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إضافة مشروع جديد</h3>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المشروع *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المشروع"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف المشروع"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="on_hold">معلق</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">القسم</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="القسم المسؤول"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">الميزانية</Label>
                <Input
                  id="budget"
                  value={formData.budget?.toLocaleString()}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="مثال: 100,000 ر.س."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء المشروع'
                )}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المشاريع</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <FolderKanban className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مشاريع نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مشاريع مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-50">
              <FolderKanban className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">مشاريع معلقة</p>
              <p className="text-2xl font-bold">{stats.onHold}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المشاريع</CardTitle>
              <PrintButton title="قائمة المشاريع" />
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pe-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد مشاريع</p>
              <p className="text-sm text-gray-400 mt-1">ابدأ بإنشاء مشروع جديد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">اسم المشروع</TableHead>
                  <TableHead className="text-end">القسم</TableHead>
                  <TableHead className="text-end">الميزانية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project: Project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {project.department || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {project.budget || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="المزيد">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Pencil className="h-4 w-4 ms-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 ms-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit*/}
      {isEditOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل المشروع</h3>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">اسم المشروع *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المشروع"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المشروع"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="on_hold">معلق</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-department">القسم</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="القسم المسؤول"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-budget">الميزانية</Label>
              <Input
                id="edit-budget"
                value={formData.budget?.toLocaleString()}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="مثال: 100,000 ر.س."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري التحديث...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>
        
      </div>)}


      {/* Delete Confirmation*/}
      {isDeleteOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تأكيد الحذف</h3>
          </div>
          <div className="py-4">
            <p className="text-gray-600">
              هل أنت متأكد من حذف المشروع "{selectedProject?.name}"؟
            </p>
            <p className="text-sm text-red-500 mt-2">
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الحذف...
                </>
              ) : (
                'حذف المشروع'
              )}
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
