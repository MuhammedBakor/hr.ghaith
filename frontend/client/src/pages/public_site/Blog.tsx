import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, MessageSquare, Heart, Loader2, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { toast } from "sonner";

interface BlogPost {
  id: number;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  views: number;
  comments: number;
  likes: number;
  status: "published" | "draft" | "scheduled" | "archived";
}

export default function Blog() {
  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'title': '', 'content': '', 'category': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
        if (!formData.title?.toString().trim()) errors.title = 'مطلوب';
    if (!formData.content?.toString().trim()) errors.content = 'مطلوب';
    if (!formData.category?.toString().trim()) errors.category = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/blog/posts', data).then(r => r.data),
    onSuccess: () => {
      setFormData({ 'title': '', 'content': '', 'category': '' });
      setIsSubmitting(false);
      toast.success('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // جلب المقالات من API
  const { data: postsApiData, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => api.get('/blog/posts').then(r => r.data),
  });

  // حذف مقال
  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete('/blog/posts', { data }).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف المقال بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`خطأ في حذف المقال: ${error.message}`);
    },
  });

  const handleDeletePost = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // تحويل البيانات من API
  const postsData: BlogPost[] = useMemo(() => {
    if (!postsApiData || postsApiData.length === 0) {
      return [];
    }
    return postsApiData?.map((p: any) => ({
      id: p.id,
      title: p.title || 'بدون عنوان',
      category: p.category || 'عام',
      author: p.author || 'غير محدد',
      publishDate: p.publishDate ? new Date(p.publishDate).toISOString().split('T')[0] : '',
      views: p.views || 0,
      comments: p.comments || 0,
      likes: p.likes || 0,
      status: p.status || 'draft',
    }));
  }, [postsApiData]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const total = postsData.length;
    const published = postsData.filter(p => p.status === 'published').length;
    const totalViews = postsData.reduce((sum, p) => sum + p.views, 0);
    const totalComments = postsData.reduce((sum, p) => sum + p.comments, 0);
    return { total, published, totalViews, totalComments };
  }, [postsData]);

  const columns = useMemo<ColumnDef<BlogPost>[]>(
    () => [
      { accessorKey: "title", header: "العنوان" },
      { accessorKey: "category", header: "التصنيف" },
      { accessorKey: "author", header: "الكاتب" },
      { accessorKey: "publishDate", header: "تاريخ النشر" },
      {
        accessorKey: "views",
        header: "المشاهدات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            {row.original.views.toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "comments",
        header: "التعليقات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {row.original.comments}
          </div>
        ),
      },
      {
        accessorKey: "likes",
        header: "الإعجابات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-muted-foreground" />
            {row.original.likes}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses: Record<string, { label: string; color: string }> = {
            published: { label: "منشور", color: "bg-green-100 text-green-800" },
            draft: { label: "مسودة", color: "bg-gray-100 text-gray-800" },
            scheduled: { label: "مجدول", color: "bg-blue-100 text-blue-800" },
            archived: { label: "مؤرشف", color: "bg-amber-100 text-amber-800" },
          };
          const status = statuses[row.original.status] || statuses.draft;
          return <Badge className={status.color}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedPost(row.original);
              setShowViewDialog(true);
            }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedPost(row.original);
              setShowEditDialog(true);
            }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeletePost(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: postsData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">العنوان</label>
            <input value={formData.title || ""} onChange={(e) => handleFieldChange("title", e.target.value)} placeholder="العنوان" className={`w-full px-3 py-2 border rounded-lg ${formErrors.title ? "border-red-500" : ""}`} />
            {formErrors.title && <span className="text-xs text-red-500">{formErrors.title}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المحتوى</label>
            <input value={formData.content || ""} onChange={(e) => handleFieldChange("content", e.target.value)} placeholder="المحتوى" className={`w-full px-3 py-2 border rounded-lg ${formErrors.content ? "border-red-500" : ""}`} />
            {formErrors.content && <span className="text-xs text-red-500">{formErrors.content}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الفئة</label>
            <input value={formData.category || ""} onChange={(e) => handleFieldChange("category", e.target.value)} placeholder="الفئة" className={`w-full px-3 py-2 border rounded-lg ${formErrors.category ? "border-red-500" : ""}`} />
            {formErrors.category && <span className="text-xs text-red-500">{formErrors.category}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل المقالات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المدونة</h2>
          <p className="text-muted-foreground">إدارة المقالات والمحتوى</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ms-2" />
            مقال جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المقالات</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">منشورة</p>
                <h3 className="text-2xl font-bold">{stats.published}</h3>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المشاهدات</p>
                <h3 className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</h3>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التعليقات</p>
                <h3 className="text-2xl font-bold">{stats.totalComments}</h3>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المقالات</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pe-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ms-2" />
                تصفية
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {postsData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد مقالات</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="h-12 px-4 text-end align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && " ↑"}
                            {header.column.getIsSorted() === "desc" && " ↓"}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}