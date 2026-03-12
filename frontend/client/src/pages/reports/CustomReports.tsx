import { formatDate, formatDateTime } from '@/lib/formatDate';
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
import { FileText, Search, Play, Edit, Trash2, ArrowUpDown, Clock, BarChart3, Download, Loader2, RefreshCw, Eye, Filter, X } from "lucide-react";
import { toast } from "sonner";

interface CustomReport {
  id: number;
  name: string;
  description: string;
  module: string;
  createdBy: string;
  lastRun: string;
  schedule: string;
  status: "active" | "draft" | "disabled";
}

interface ReportFormData {
  name: string;
  description: string;
  module: string;
  schedule: string;
  status: "active" | "draft" | "disabled";
}

const initialFormData: ReportFormData = {
  name: '',
  description: '',
  module: 'hr',
  schedule: 'manual',
  status: 'draft',
};

export default function CustomReportsPage() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof CustomReport>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // نموذج الإنشاء
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  
  // نموذج التعديل
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  
  // نافذة الحذف
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState<CustomReport | null>(null);

  // جلب التقارير من API
  const { data: reportsApiData, isLoading, refetch } = useQuery({
    queryKey: ['reports-custom'],
    queryFn: () => api.get('/reports/custom').then(r => r.data),
  });
  
  // إنشاء تقرير جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/reports/custom', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء التقرير بنجاح');
      setIsCreateOpen(false);
      setFormData(initialFormData);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء التقرير: ${error.message}`);
    },
  });
  
  // تعديل تقرير
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/reports/custom', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تعديل التقرير بنجاح');
      setIsEditOpen(false);
      setEditingReport(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تعديل التقرير: ${error.message}`);
    },
  });
  
  // حذف تقرير
  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete('/reports/custom', { data }).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف التقرير بنجاح');
      setIsDeleteOpen(false);
      setDeletingReport(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في حذف التقرير: ${error.message}`);
    },
  });
  
  // تشغيل تقرير
  const runMutation = useMutation({
    mutationFn: (data: any) => api.post('/reports/custom/run', data).then(r => r.data),
    onSuccess: (result: any) => {
      toast.success(result.message);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تشغيل التقرير: ${error.message}`);
    },
  });
  
  // عرض تقرير
  const [viewingReport, setViewingReport] = useState<CustomReport | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const handleRunReport = (report: CustomReport) => {
    runMutation.mutate({ id: report.id });
  };
  
  const handleViewReport = (report: CustomReport) => {
    setViewingReport(report);
    setIsViewOpen(true);
  };

  // تحويل البيانات من API
  const reportsData: CustomReport[] = useMemo(() => {
    if (!reportsApiData || reportsApiData.length === 0) {
      return [];
    }
    return reportsApiData.map((r: any) => ({
      id: r.id,
      name: r.name || 'تقرير بدون اسم',
      description: r.description || '',
      module: r.module || 'عام',
      createdBy: r.createdBy || 'النظام',
      lastRun: r.lastRun ? formatDateTime(r.lastRun) : '-',
      schedule: r.schedule || '-',
      status: r.status || 'active',
    }));
  }, [reportsApiData]);

  const handleSort = (field: keyof CustomReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // تطبيق الفلاتر
  const filteredData = useMemo(() => {
    let data = reportsData;
    
    // فلترة حسب البحث
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      data = data.filter(r => r.status === statusFilter);
    }
    
    // فلترة حسب الوحدة
    if (moduleFilter !== 'all') {
      data = data.filter(r => r.module === moduleFilter);
    }
    
    // الترتيب
    return data.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
  }, [reportsData, searchTerm, statusFilter, moduleFilter, sortField, sortDirection]);

  const activeReports = reportsData.filter(r => r.status === "active").length;
  const draftReports = reportsData.filter(r => r.status === "draft").length;

  // استخراج قائمة الوحدات الفريدة
  const uniqueModules = useMemo(() => {
    const modules = new Set(reportsData.map(r => r.module));
    return Array.from(modules);
  }, [reportsData]);

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('يرجى إدخال اسم التقرير');
      return;
    }
    createMutation.mutate({
      title: formData.name,
      description: formData.description || undefined,
      scheduleCron: formData.schedule === 'manual' ? undefined : formData.schedule,
    });
  };

  const handleEdit = (report: CustomReport) => {
    setEditingReport(report);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingReport) return;
    updateMutation.mutate({
      id: editingReport.id,
      title: editingReport.name,
      description: editingReport.description || undefined,
    });
  };

  const handleDelete = (report: CustomReport) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: report });
    }
  };

  const confirmDelete = () => {
    if (!deletingReport) return;
    deleteMutation.mutate({ id: deletingReport.id });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setModuleFilter('all');
    setSearchTerm('');
  };

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['الاسم', 'الوصف', 'الوحدة', 'المنشئ', 'آخر تشغيل', 'الجدولة', 'الحالة'];
    const csvData = filteredData.map(r => [r.name, r.description, r.module, r.createdBy, r.lastRun, r.schedule, r.status]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      case "disabled":
        return <Badge className="bg-red-100 text-red-800">معطل</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const SortButton = ({ field, children }: { field: keyof CustomReport; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-primary" : "text-gray-400"}`} />
    </button>
  );

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل التقارير...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التقارير المخصصة</h2>
          <p className="text-muted-foreground">إنشاء وإدارة التقارير المخصصة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="ms-2 h-4 w-4" />
            تحديث
          </Button>
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إنشاء تقرير جديد</h3>
                <p className="text-sm text-gray-500">
                  أدخل بيانات التقرير الجديد. الحقول المميزة بـ * مطلوبة.
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">اسم التقرير *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم التقرير"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف التقرير..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="module">الوحدة</Label>
                    <Select value={formData.module} onValueChange={(value) => setFormData({ ...formData, module: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">الموارد البشرية</SelectItem>
                        <SelectItem value="finance">المالية</SelectItem>
                        <SelectItem value="fleet">الأسطول</SelectItem>
                        <SelectItem value="legal">الشؤون القانونية</SelectItem>
                        <SelectItem value="requests">الطلبات</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule">الجدولة</Label>
                    <Select value={formData.schedule} onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">يدوي</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      <SelectItem value="disabled">معطل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
                  إنشاء التقرير
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التقارير</p>
                <h3 className="text-2xl font-bold">{reportsData.length}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تقارير نشطة</p>
                <h3 className="text-2xl font-bold">{activeReports}</h3>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <h3 className="text-2xl font-bold">{draftReports}</h3>
              </div>
              <Edit className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">آخر تشغيل</p>
                <h3 className="text-2xl font-bold">اليوم</h3>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة التقارير</CardTitle>
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
          
          {/* فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
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
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="disabled">معطل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>الوحدة</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الوحدات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الوحدات</SelectItem>
                      {uniqueModules.map(module => (
                        <SelectItem key={module} value={module}>{module}</SelectItem>
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
              <p>لا توجد تقارير</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-end p-3 font-medium">
                      <SortButton field="name">الاسم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="description">الوصف</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="module">الوحدة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="createdBy">المنشئ</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="lastRun">آخر تشغيل</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="schedule">الجدولة</SortButton>
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
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.description}</td>
                      <td className="p-3">{item.module}</td>
                      <td className="p-3">{item.createdBy}</td>
                      <td className="p-3">{item.lastRun}</td>
                      <td className="p-3">{item.schedule}</td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleRunReport(item)} disabled={runMutation.isPending}>
                            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewReport(item)}>
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

      {/* نافذة التعديل */}
      {isEditOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل التقرير</h3>
            <p className="text-sm text-gray-500">
              قم بتعديل بيانات التقرير.
            </p>
          </div>
          {editingReport && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">اسم التقرير</Label>
                <Input
                  id="edit-name"
                  value={editingReport.name}
                  onChange={(e) => setEditingReport({ ...editingReport, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={editingReport.description}
                  onChange={(e) => setEditingReport({ ...editingReport, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">الحالة</Label>
                <Select 
                  value={editingReport.status} 
                  onValueChange={(value: any) => setEditingReport({ ...editingReport, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="disabled">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا التقرير؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف التقرير "{deletingReport?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف التقرير
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* نافذة عرض التقرير */}
      {isViewOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل التقرير</h3>
          </div>
          {viewingReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">اسم التقرير</Label>
                  <p className="font-medium">{viewingReport.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(viewingReport.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">الوصف</Label>
                <p>{viewingReport.description || 'لا يوجد وصف'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">الوحدة</Label>
                  <p>{viewingReport.module}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الجدولة</Label>
                  <p>{viewingReport.schedule}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">أنشأه</Label>
                  <p>{viewingReport.createdBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">آخر تشغيل</Label>
                  <p>{viewingReport.lastRun}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              إغلاق
            </Button>
            {viewingReport && (
              <Button onClick={() => handleRunReport(viewingReport)} disabled={runMutation.isPending}>
                {runMutation.isPending ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Play className="ms-2 h-4 w-4" />}
                تشغيل الآن
              </Button>
            )}
          </div>
        </div>
      </div>)}
    </div>
  );
}
