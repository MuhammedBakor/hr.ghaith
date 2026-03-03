import { formatDate, formatDateTime } from '@/lib/formatDate';
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, FileText, Eye, Plus, Search, Filter, Edit, Trash2, ExternalLink, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Page {
  id: number;
  title: string;
  slug: string;
  type: "page" | "post" | "landing";
  author: string;
  views: number;
  lastModified: string;
  status: "published" | "draft" | "scheduled" | "archived";
}

export default function PublicSite() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    metaDescription: "",
    metaKeywords: "",
    template: "default",
  });
  const [editPage, setEditPage] = useState({
    id: 0,
    title: "",
    metaDescription: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  // جلب الصفحات من API
  const { data: pagesApiData, isLoading, refetch } = trpc.publicSite.pages.list.useQuery();

  // Mutations
  const createPageMutation = trpc.publicSite.pages.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الصفحة بنجاح");
      setShowCreateDialog(false);
      setNewPage({ title: "", slug: "", metaDescription: "", metaKeywords: "", template: "default",
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء الصفحة: ${error.message}`);
    },
  });

  const updatePageMutation = trpc.publicSite.pages.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الصفحة بنجاح");
      setShowEditDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الصفحة: ${error.message}`);
    },
  });

  const deletePageMutation = trpc.publicSite.pages.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصفحة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حذف الصفحة: ${error.message}`);
    },
  });

  // تحويل البيانات من API إلى الشكل المطلوب
  const pagesData: Page[] = useMemo(() => {
    if (!pagesApiData) return [];
    return pagesApiData.map((page: any) => ({
      id: page.id,
      title: page.title || "بدون عنوان",
      slug: page.slug,
      type: page.template === "landing" ? "landing" : page.template === "post" ? "post" : "page",
      author: page.authorName || "غير معروف",
      views: page.views || 0,
      lastModified: page.updatedAt ? formatDate(page.updatedAt) : "-",
      status: page.status || "draft",
    }));
  }, [pagesApiData]);

  const stats = useMemo(() => ({
    total: pagesData.length,
    published: pagesData.filter(p => p.status === "published").length,
    draft: pagesData.filter(p => p.status === "draft").length,
    views: pagesData.reduce((acc, p) => acc + p.views, 0),
  }), [pagesData]);

  const handleViewPage = (page: Page) => {
    setSelectedPage(page);
    setShowViewDialog(true);
  };

  const handleEditPage = (page: Page) => {
    setEditPage({
      id: page.id,
      title: page.title,
      metaDescription: "",
      status: page.status === "scheduled" ? "draft" : page.status,
    });
    setShowEditDialog(true);
  };

  const handleCreatePage = () => {
    if (!newPage.title || !newPage.slug) {
      toast.error("يرجى إدخال العنوان والرابط");
      return;
    }
    createPageMutation.mutate(newPage);
  };

  const handleUpdatePage = () => {
    if (!editPage.title) {
      toast.error("يرجى إدخال العنوان");
      return;
    }
    updatePageMutation.mutate(editPage);
  };

  const handleDeletePage = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deletePageMutation.mutate({ id: itemToDelete });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const columns: ColumnDef<Page>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "العنوان",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "slug",
        header: "الرابط",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.slug}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "النوع",
        cell: ({ row }) => {
          const types: Record<string, { label: string; color: string }> = {
            page: { label: "صفحة", color: "bg-blue-100 text-blue-800" },
            post: { label: "مقال", color: "bg-purple-100 text-purple-800" },
            landing: { label: "هبوط", color: "bg-green-100 text-green-800" },
          };
          const type = types[row.original.type] || types.page;
          return <Badge className={type.color}>{type.label}</Badge>;
        },
      },
      {
        accessorKey: "views",
        header: "المشاهدات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.views.toLocaleString()}</span>
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
            <Button variant="ghost" size="sm" onClick={() => handleViewPage(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEditPage(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(row.original.slug, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeletePage(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: pagesData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل الصفحات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الموقع العام</h2>
          <p className="text-muted-foreground">إدارة صفحات ومحتوى الموقع العام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ms-2" />
            صفحة جديدة
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الصفحات</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صفحات منشورة</p>
                <h3 className="text-2xl font-bold">{stats.published}</h3>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <h3 className="text-2xl font-bold">{stats.draft}</h3>
              </div>
              <Edit className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                <h3 className="text-2xl font-bold">{stats.views.toLocaleString()}</h3>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الصفحات</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-3 text-end font-medium">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                      لا توجد صفحات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إنشاء صفحة جديدة */}
      {showCreateDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Plus className="h-5 w-5" />
              إنشاء صفحة جديدة
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={newPage.title}
                onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                placeholder="عنوان الصفحة"
              />
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug) *</Label>
              <Input
                value={newPage.slug}
                onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                placeholder="/about-us"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف التعريفي</Label>
              <Textarea
                value={newPage.metaDescription}
                onChange={(e) => setNewPage({ ...newPage, metaDescription: e.target.value })}
                placeholder="وصف مختصر للصفحة"
              />
            </div>
            <div className="space-y-2">
              <Label>الكلمات المفتاحية</Label>
              <Input
                value={newPage.metaKeywords}
                onChange={(e) => setNewPage({ ...newPage, metaKeywords: e.target.value })}
                placeholder="كلمة1, كلمة2, كلمة3"
              />
            </div>
            <div className="space-y-2">
              <Label>القالب</Label>
              <Select value={newPage.template} onValueChange={(value) => setNewPage({ ...newPage, template: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">افتراضي</SelectItem>
                  <SelectItem value="landing">صفحة هبوط</SelectItem>
                  <SelectItem value="post">مقال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreatePage} disabled={createPageMutation.isPending}>
              {createPageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء"
              )}
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة عرض تفاصيل الصفحة */}
      {showViewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Eye className="h-5 w-5" />
              تفاصيل الصفحة
            </h3>
          </div>
          {selectedPage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="font-medium">{selectedPage.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الرابط</p>
                  <p className="font-medium" dir="ltr">{selectedPage.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">النوع</p>
                  <p className="font-medium">{selectedPage.type === "page" ? "صفحة" : selectedPage.type === "post" ? "مقال" : "هبوط"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <Badge className={selectedPage.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {selectedPage.status === "published" ? "منشور" : selectedPage.status === "draft" ? "مسودة" : selectedPage.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المشاهدات</p>
                  <p className="font-medium">{selectedPage.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">آخر تعديل</p>
                  <p className="font-medium">{selectedPage.lastModified}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الكاتب</p>
                  <p className="font-medium">{selectedPage.author}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              إغلاق
            </Button>
            {selectedPage && (
              <Button onClick={() => window.open(selectedPage.slug, '_blank')}>
                <ExternalLink className="h-4 w-4 ms-2" />
                فتح الصفحة
              </Button>
            )}
          </div>
        </div>
      </div>)}

      {/* نافذة تعديل الصفحة */}
      {showEditDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Edit className="h-5 w-5" />
              تعديل الصفحة
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={editPage.title}
                onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
                placeholder="عنوان الصفحة"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف التعريفي</Label>
              <Textarea
                value={editPage.metaDescription}
                onChange={(e) => setEditPage({ ...editPage, metaDescription: e.target.value })}
                placeholder="وصف مختصر للصفحة"
              />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={editPage.status} onValueChange={(value: "draft" | "published" | "archived") => setEditPage({ ...editPage, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdatePage} disabled={updatePageMutation.isPending}>
              {updatePageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </div>
        </div>
      </div>)}
    
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