import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Search, Clock, CheckCircle, AlertCircle, ArrowUpDown, Loader2, RefreshCw, Eye, Edit, Trash2, Filter, X, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface RequestType {
  id: number;
  code: string;
  name: string;
  category: string;
  approvalLevels: number;
  avgProcessingTime: string;
  status: "active" | "inactive" | "draft";
  requestsCount: number;
  description?: string;
}

interface RequestTypeFormData {
  name: string;
  category: string;
  approvalLevels: number;
  status: "active" | "inactive" | "draft";
  description: string;
}

const initialFormData: RequestTypeFormData = {
  name: '',
  category: 'hr',
  approvalLevels: 2,
  status: 'active',
  description: '',
};

export default function RequestTypes() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({ mutationFn: (data: any) => api.post('/requests/types', data).then(r => r.data), onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);
  const updateMutation = useMutation({ mutationFn: (data: any) => api.put(`/requests/types/${data.id}`, data).then(r => r.data), onSuccess: () => { refetch(); setEditingType(null); setIsEditOpen(false); toast.success('تم حفظ التغييرات'); } });

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/requests/types/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  const handleSave = () => {
    updateMutation.mutate(editingType);
  };

  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof RequestType>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // نموذج الإنشاء
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<RequestTypeFormData>(initialFormData);

  // نموذج التعديل
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<RequestType | null>(null);

  // نافذة الحذف
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<RequestType | null>(null);

  // نافذة العرض
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingType, setViewingType] = useState<RequestType | null>(null);

  // جلب الطلبات من API لحساب الإحصائيات
  const { data: typesRaw, isLoading, refetch } = useQuery({
    queryKey: ['request-types'],
    queryFn: () => api.get('/requests/types').then(r => r.data),
  });

  // تحويل البيانات من API إلى أنواع الطلبات
  const requestTypesData: RequestType[] = useMemo(() => {
    if (!typesRaw || !Array.isArray(typesRaw) || typesRaw.length === 0) {
      return [];
    }

    return typesRaw.map((t: any, idx: number) => ({
      id: t.id || idx + 1,
      code: t.code || `REQ-${String(idx + 1).padStart(3, '0')}`,
      name: t.nameAr || t.name || 'غير معروف',
      category: t.category || 'عام',
      approvalLevels: t.approvalLevels || (t.requiresApproval ? 2 : 0),
      avgProcessingTime: '1-2 يوم',
      status: t.status || (t.isActive ? 'active' : 'inactive'),
      requestsCount: 0,
      description: t.description || '',
    }));
  }, [typesRaw]);

  // استخراج قائمة التصنيفات الفريدة
  const uniqueCategories = useMemo(() => {
    const categories = new Set(requestTypesData.map(r => r.category));
    return Array.from(categories);
  }, [requestTypesData]);

  const handleSort = (field: keyof RequestType) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // تطبيق الفلاتر
  const filteredData = useMemo(() => {
    let data = requestTypesData;

    // فلترة حسب البحث
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      data = data.filter(t => t.status === statusFilter);
    }

    // فلترة حسب التصنيف
    if (categoryFilter !== 'all') {
      data = data.filter(t => t.category === categoryFilter);
    }

    // الترتيب
    return data.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [requestTypesData, searchTerm, statusFilter, categoryFilter, sortField, sortDirection]);

  const activeTypes = requestTypesData.filter(t => t.status === "active").length;
  const totalRequests = requestTypesData.reduce((sum, t) => sum + t.requestsCount, 0);

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('يرجى إدخال اسم نوع الطلب');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      nameAr: formData.name,
      category: formData.category,
      approvalLevels: formData.approvalLevels,
      requiresApproval: formData.approvalLevels > 0,
      isActive: formData.status === 'active',
      status: formData.status,
      description: formData.description,
    });
    toast.success('تم إنشاء نوع الطلب بنجاح');
    setIsCreateOpen(false);
    setFormData(initialFormData);
  };

  const handleEdit = (type: RequestType) => {
    setEditingType(type);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate(editingType);
  };

  const handleView = (type: RequestType) => {
    setViewingType(type);
    setIsViewOpen(true);
  };

  const handleDelete = (type: RequestType) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: type.id });
    }
  };

  const confirmDeleteAction = () => {
    if (!deletingType) return;
    toast.success('تم حذف نوع الطلب بنجاح');
    setIsDeleteOpen(false);
    setDeletingType(null);
    refetch();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['الرمز', 'الاسم', 'التصنيف', 'مستويات الموافقة', 'وقت المعالجة', 'عدد الطلبات', 'الحالة'];
    const csvData = filteredData.map(t => [t.code, t.name, t.category, t.approvalLevels, t.avgProcessingTime, t.requestsCount, t.status]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `request_types_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">غير نشط</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const SortButton = ({ field, children }: { field: keyof RequestType; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-primary" : "text-gray-400"}`} />
    </button>
  );

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{(error as any)?.message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل أنواع الطلبات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">أنواع الطلبات</h2>
          <p className="text-muted-foreground">إدارة وتكوين أنواع الطلبات المختلفة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="ms-2 h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="ms-2 h-4 w-4" />
            إنشاء نوع طلب جديد
          </Button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء نوع طلب جديد</h3>
            <p className="text-sm text-gray-500">
              أدخل بيانات نوع الطلب الجديد. الحقول المميزة بـ * مطلوبة.
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم نوع الطلب *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: طلب إجازة"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">التصنيف</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr">الموارد البشرية</SelectItem>
                    <SelectItem value="finance">المالية</SelectItem>
                    <SelectItem value="it">تقنية المعلومات</SelectItem>
                    <SelectItem value="admin">الإدارة</SelectItem>
                    <SelectItem value="general">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approvalLevels">مستويات الموافقة</Label>
                <Select
                  value={formData.approvalLevels.toString()}
                  onValueChange={(value) => setFormData({ ...formData, approvalLevels: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">مستوى واحد</SelectItem>
                    <SelectItem value="2">مستويان</SelectItem>
                    <SelectItem value="3">ثلاث مستويات</SelectItem>
                    <SelectItem value="4">أربع مستويات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف نوع الطلب..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">الحالة</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate}>
              إنشاء نوع الطلب
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأنواع</p>
                <h3 className="text-2xl font-bold">{requestTypesData.length}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أنواع نشطة</p>
                <h3 className="text-2xl font-bold">{activeTypes}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <h3 className="text-2xl font-bold">{totalRequests}</h3>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط المعالجة</p>
                <h3 className="text-2xl font-bold">2 يوم</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة أنواع الطلبات</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 ms-2" />
                تصفية
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 ms-2" />
                تصدير
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">فلاتر متقدمة</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 ms-2" />
                  مسح الفلاتر
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>الحالة</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>التصنيف</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع التصنيفات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد أنواع طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-end p-3 font-medium">
                      <SortButton field="code">الرمز</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="name">الاسم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="category">التصنيف</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="approvalLevels">مستويات الموافقة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="avgProcessingTime">وقت المعالجة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="requestsCount">عدد الطلبات</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="status">الحالة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{item.code}</td>
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.approvalLevels}</td>
                      <td className="p-3">{item.avgProcessingTime}</td>
                      <td className="p-3">{item.requestsCount}</td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditOpen && editingType && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل نوع الطلب</h3>
            <p className="text-sm text-gray-500">
              قم بتعديل بيانات نوع الطلب.
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">اسم نوع الطلب</Label>
              <Input
                id="edit-name"
                value={editingType.name}
                onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">التصنيف</Label>
                <Input
                  id="edit-category"
                  value={editingType.category}
                  onChange={(e) => setEditingType({ ...editingType, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-approvalLevels">مستويات الموافقة</Label>
                <Select
                  value={editingType.approvalLevels.toString()}
                  onValueChange={(value) => setEditingType({ ...editingType, approvalLevels: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">مستوى واحد</SelectItem>
                    <SelectItem value="2">مستويان</SelectItem>
                    <SelectItem value="3">ثلاث مستويات</SelectItem>
                    <SelectItem value="4">أربع مستويات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">الحالة</Label>
              <Select
                value={editingType.status}
                onValueChange={(value: any) => setEditingType({ ...editingType, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={editingType.description || ''}
                onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                placeholder="وصف نوع الطلب..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate}>
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog Content (Inline for simplicity since it's an agentic fix) */}
      {isViewOpen && viewingType && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3 flex justify-between items-center">
            <h3 className="text-lg font-bold">تفاصيل نوع الطلب</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">الرمز</Label>
                <p className="font-mono font-medium">{viewingType.code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">الحالة</Label>
                <p>{getStatusBadge(viewingType.status)}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">اسم نوع الطلب</Label>
              <p className="font-medium text-lg">{viewingType.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">التصنيف</Label>
                <p>{viewingType.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">مستويات الموافقة</Label>
                <p>{viewingType.approvalLevels}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">وقت المعالجة</Label>
                <p>{viewingType.avgProcessingTime}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">عدد الطلبات</Label>
                <p className="font-bold text-primary">{viewingType.requestsCount}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">الوصف</Label>
              <p className="mt-1 whitespace-pre-wrap">{viewingType.description || 'لا يوجد وصف'}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingType); }}>
              تعديل
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف نوع الطلب؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف نوع الطلب "{deletingType?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAction} className="bg-red-600 hover:bg-red-700">
              حذف نوع الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
