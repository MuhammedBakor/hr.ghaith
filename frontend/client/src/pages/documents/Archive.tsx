import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Search,
  Download,
  Eye,
  ArrowUpDown,
  Calendar,
  HardDrive,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ArchivedItem {
  id: number;
  name: string;
  originalPath: string;
  type: string;
  size: string;
  archivedDate: string;
  archivedBy: string;
  retentionPeriod: string;
  status: "archived" | "pending_deletion" | "permanent";
}

export default function ArchivePage() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({ mutationFn: (data: any) => api.post('/documents/archive', data).then(r => r.data), onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);
  const updateMutation = useMutation({ mutationFn: (data: any) => api.put(`/documents/archive/${data.id}`, data).then(r => r.data), onSuccess: () => { refetch(); setEditingItem(null); } });

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/documents/archive/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  const handleSave = () => {
    updateMutation.mutate(editingItem);
  };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ArchivedItem>("archivedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ArchivedItem | null>(null);

  // جلب المستندات المؤرشفة من API
  const { data: documentsData, isLoading, refetch } = useQuery({
    queryKey: ['documents-archive'],
    queryFn: () => api.get('/documents').then(r => r.data),
  });

  // تحويل البيانات من API إلى الشكل المطلوب
  const archiveData: ArchivedItem[] = useMemo(() => {
    if (!documentsData || documentsData.length === 0) {
      return [];
    }
    return documentsData.map((doc: any) => ({
      id: doc.id,
      name: doc.title || 'بدون اسم',
      originalPath: doc.filePath || '/documents',
      type: doc.documentType || 'ملف',
      size: doc.fileSize ? formatSize(doc.fileSize) : 'غير محدد',
      archivedDate: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : '',
      archivedBy: 'النظام',
      retentionPeriod: '5 سنوات',
      status: 'archived' as const,
    }));
  }, [documentsData]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const total = archiveData.length;
    const pendingDeletion = archiveData.filter(i => i.status === 'pending_deletion').length;
    const permanent = archiveData.filter(i => i.status === 'permanent').length;
    return { total, pendingDeletion, permanent };
  }, [archiveData]);

  const handleSort = (field: keyof ArchivedItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = archiveData
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalPath.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "archived":
        return <Badge className="bg-blue-100 text-blue-800">مؤرشف</Badge>;
      case "pending_deletion":
        return <Badge className="bg-red-100 text-red-800">قيد الحذف</Badge>;
      case "permanent":
        return <Badge className="bg-green-100 text-green-800">دائم</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleView = (item: ArchivedItem) => {
    // فتح المستند للعرض
    if (item.originalPath && item.originalPath.startsWith('http')) {
      window.open(item.originalPath, '_blank');
    } else {
      // عرض تفاصيل المستند في نافذة
      setSelectedDocument(item);
      setShowDocumentDetails(true);
    }
  };

  const handleDownload = (item: ArchivedItem) => {
    // تحميل المستند
    if (item.originalPath) {
      const link = document.createElement('a');
      link.href = item.originalPath;
      link.download = item.name;
      link.click();
      toast.success(`جاري تحميل ${item.name}`);
    } else {
      toast.error('لا يمكن تحميل الملف');
    }
  };

  const SortButton = ({ field, children }: { field: keyof ArchivedItem; children: React.ReactNode }) => (
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



  if (isLoading) {


  return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل الأرشيف...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الأرشيف</h2>
          <p className="text-muted-foreground">إدارة المستندات المؤرشفة وسياسات الاحتفاظ</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المؤرشف</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <Archive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الحجم الكلي</p>
                <h3 className="text-2xl font-bold">-</h3>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الحذف</p>
                <h3 className="text-2xl font-bold">{stats.pendingDeletion}</h3>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">دائم</p>
                <h3 className="text-2xl font-bold">{stats.permanent}</h3>
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
            <CardTitle>المستندات المؤرشفة</CardTitle>
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
              <Archive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد مستندات مؤرشفة</p>
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
                      <SortButton field="originalPath">المسار الأصلي</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="size">الحجم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="archivedDate">تاريخ الأرشفة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="archivedBy">بواسطة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="retentionPeriod">فترة الاحتفاظ</SortButton>
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
                      <td className="p-3 font-mono text-sm text-muted-foreground">{item.originalPath}</td>
                      <td className="p-3">{item.size}</td>
                      <td className="p-3">{item.archivedDate ? formatDate(item.archivedDate) : '-'}</td>
                      <td className="p-3">{item.archivedBy}</td>
                      <td className="p-3">{item.retentionPeriod}</td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
<Button variant="ghost" size="sm" onClick={() => handleView(item)}>
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleDownload(item)}>
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
      {/* نافذة عرض تفاصيل المستند */}
      {showDocumentDetails && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <FileText className="h-5 w-5" />
              تفاصيل المستند
            </h3>
          </div>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">اسم المستند</p>
                  <p className="font-medium">{selectedDocument.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">النوع</p>
                  <p className="font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحجم</p>
                  <p className="font-medium">{selectedDocument.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاريخ الأرشفة</p>
                  <p className="font-medium">{selectedDocument.archivedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">أرشف بواسطة</p>
                  <p className="font-medium">{selectedDocument.archivedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">فترة الاحتفاظ</p>
                  <p className="font-medium">{selectedDocument.retentionPeriod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  {getStatusBadge(selectedDocument.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">المسار الأصلي</p>
                  <p className="font-medium text-xs break-all">{selectedDocument.originalPath}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowDocumentDetails(false)}>
              إغلاق
            </Button>
            {selectedDocument && selectedDocument.originalPath && (
              <Button onClick={() => handleDownload(selectedDocument)}>
                <Download className="h-4 w-4 ms-2" />
                تحميل
              </Button>
            )}
          </div>
        </div>
      </div>)}
    </div>
  );
}

// دالة مساعدة لتنسيق حجم الملف
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
