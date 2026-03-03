import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileType,
  Plus,
  Search,
  Download,
  Eye,
  ArrowUpDown,
  FileText,
  Star,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: number;
  name: string;
  category: string;
  format: string;
  downloads: number;
  rating: number;
  lastUpdated: string;
  status: "active" | "draft" | "archived";
}

export default function Templates() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = trpc.documents.create.useMutation({ onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);
  const updateMutation = trpc.documents.update.useMutation({ onSuccess: () => { refetch(); setEditingItem(null); } });

  const deleteMutation = trpc.documents.delete.useMutation({ onSuccess: () => { refetch(); } });

  const handleSave = () => {
    updateMutation.mutate(editingItem);
  };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const queryError = false; // Error state from useQuery

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Template>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // جلب القوالب من API
  const { data: documentsData, isLoading, refetch } = trpc.documents.list.useQuery();

  // تحويل البيانات من API إلى الشكل المطلوب
  const templatesData: Template[] = useMemo(() => {
    if (!documentsData || documentsData.length === 0) {
      return [];
    }
    return documentsData.map((doc: any) => ({
      id: doc.id,
      name: doc.title || 'بدون اسم',
      category: doc.category || 'عام',
      format: getFileFormat(doc.mimeType || doc.title),
      downloads: 0,
      rating: 4.5,
      lastUpdated: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : '',
      status: 'active' as const,
    }));
  }, [documentsData]);

  const handleSort = (field: keyof Template) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = templatesData
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
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

  const totalDownloads = templatesData.reduce((sum, t) => sum + t.downloads, 0);
  const avgRating = templatesData.length > 0 
    ? (templatesData.reduce((sum, t) => sum + t.rating, 0) / templatesData.length).toFixed(1)
    : '0';
  const categories = new Set(templatesData.map(t => t.category)).size;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">مسودة</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">مؤرشف</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      DOCX: "bg-blue-100 text-blue-800",
      PDF: "bg-red-100 text-red-800",
      XLSX: "bg-green-100 text-green-800",
      PPTX: "bg-orange-100 text-orange-800",
    };
    return <Badge className={colors[format] || "bg-gray-100 text-gray-800"}>{format}</Badge>;
  };

  const SortButton = ({ field, children }: { field: keyof Template; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-primary" : "text-gray-400"}`} />
    </button>
  );

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
          
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(doc)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: doc.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
        )}
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل القوالب...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">قوالب المستندات</h2>
          <p className="text-muted-foreground">إدارة قوالب المستندات الجاهزة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="ms-2 h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => {
            // فتح نافذة رفع ملف
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.doc,.docx,.pdf,.xlsx,.xls,.pptx,.ppt';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                toast.success(`تم اختيار القالب: ${file.name}`);
                // هنا يمكن رفع الملف إلى السيرفر
              }
            };
            input.click();
          }}>
            <Plus className="ms-2 h-4 w-4" />
            قالب جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي القوالب</p>
                <h3 className="text-2xl font-bold">{templatesData.length}</h3>
              </div>
              <FileType className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التحميلات</p>
                <h3 className="text-2xl font-bold">{totalDownloads.toLocaleString()}</h3>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط التقييم</p>
                <h3 className="text-2xl font-bold">{avgRating}</h3>
              </div>
              <Star className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التصنيفات</p>
                <h3 className="text-2xl font-bold">{categories}</h3>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة القوالب</CardTitle>
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileType className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد قوالب</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-end p-3 font-medium">
                      <SortButton field="name">القالب</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="category">التصنيف</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="format">الصيغة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="downloads">التحميلات</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="rating">التقييم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="lastUpdated">آخر تحديث</SortButton>
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
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{getFormatBadge(item.format)}</td>
                      <td className="p-3">{item.downloads}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {item.rating}
                        </div>
                      </td>
                      <td className="p-3">{item.lastUpdated ? formatDate(item.lastUpdated) : '-'}</td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            // فتح القالب للعرض
                            toast.success(`جاري عرض ${item.name}`);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            // تحميل القالب
                            toast.success(`جاري تحميل ${item.name}`);
                          }}>
                            <Download className="h-4 w-4" />
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
    </div>
  );
}

// دالة مساعدة لاستخراج صيغة الملف
function getFileFormat(mimeTypeOrName: string): string {
  if (!mimeTypeOrName) return 'FILE';
  const name = mimeTypeOrName.toLowerCase();
  if (name.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'DOCX';
  if (name.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (name.includes('excel') || name.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'XLSX';
  if (name.includes('powerpoint') || name.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) return 'PPTX';
  return 'FILE';
}
