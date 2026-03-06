import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FileText, Search, Filter, Download, Trash2, Eye, Clock, User, Loader2, Plus, RefreshCw, Archive, FileCheck, History } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

export default function DmsAdvanced() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVersionsDialogOpen, setIsVersionsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    documentType: 'other' as const,
    category: '',
    filePath: '',
  });

  const { data: documents, isLoading, refetch } = useQuery({ queryKey: ['dms-documents'], queryFn: () => api.get('/platform/dms').then(r => r.data) });
  const { data: documentVersions } = useQuery({
    queryKey: ['dms-versions', selectedDocument?.id],
    queryFn: () => api.get(`/platform/dms/${selectedDocument?.id}/versions`).then(r => r.data),
    enabled: !!selectedDocument && isVersionsDialogOpen
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/platform/dms', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء المستند بنجاح');
      setIsAddDialogOpen(false);
      setNewDocument({ title: '', description: '', documentType: 'other', category: '', filePath: '' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء المستند: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/platform/dms/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث المستند بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث المستند: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/platform/dms/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف المستند بنجاح');
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في حذف المستند: ${error.message}`);
    },
  });

  const categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'contracts', label: 'العقود' },
    { value: 'reports', label: 'التقارير' },
    { value: 'policies', label: 'السياسات' },
    { value: 'forms', label: 'النماذج' },
    { value: 'invoices', label: 'الفواتير' },
  ];

  const documentTypes = [
    { value: 'policy', label: 'سياسة' },
    { value: 'procedure', label: 'إجراء' },
    { value: 'form', label: 'نموذج' },
    { value: 'report', label: 'تقرير' },
    { value: 'contract', label: 'عقد' },
    { value: 'other', label: 'أخرى' },
  ];

  const statuses = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'published', label: 'منشور' },
    { value: 'archived', label: 'مؤرشف' },
  ];

  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-800">مسودة</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800">منشور</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">مؤرشف</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleView = (doc: any) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (doc: any) => {
    if (doc.filePath) {
      window.open(doc.filePath, '_blank');
      toast.success('جاري تحميل المستند...');
    } else {
      toast.error('لا يوجد ملف مرفق بهذا المستند');
    }
  };

  const handleArchive = (docId: number) => {
    updateMutation.mutate({ id: docId, status: 'archived' });
  };

  const handlePublish = (docId: number) => {
    updateMutation.mutate({ id: docId, status: 'published' });
  };

  const handleDelete = (doc: any) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: doc });
    }
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate({ id: selectedDocument.id });
    }
  };

  const handleViewVersions = (doc: any) => {
    setSelectedDocument(doc);
    setIsVersionsDialogOpen(true);
  };

  const handleCreateDocument = () => {
    if (!newDocument.title) {
      toast.error('يرجى إدخال عنوان المستند');
      return;
    }
    createMutation.mutate(newDocument);
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDocs = documents?.length || 0;
  const publishedDocs = documents?.filter((d: any) => d.status === 'published').length || 0;
  const archivedDocs = documents?.filter((d: any) => d.status === 'archived').length || 0;
  const draftDocs = documents?.filter((d: any) => d.status === 'draft').length || 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المستندات المتقدمة</h2>
          <p className="text-gray-500">إدارة وتنظيم جميع مستندات المنظمة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة مستند
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المستندات</p>
              <p className="text-2xl font-bold">{totalDocs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <FileCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المنشورة</p>
              <p className="text-2xl font-bold">{publishedDocs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المسودات</p>
              <p className="text-2xl font-bold">{draftDocs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <Archive className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المؤرشفة</p>
              <p className="text-2xl font-bold">{archivedDocs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            المستندات ({filteredDocuments.length})
          </CardTitle>
              <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">لا توجد مستندات</p>
              <p className="text-sm">قم بإضافة مستندات جديدة أو تعديل معايير البحث</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">العنوان</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {documentTypes.find(t => t.value === doc.documentType)?.label || doc.documentType || 'عام'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status || 'draft')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {doc.createdAt ? formatDate(doc.createdAt) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(doc)}
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          title="تحميل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewVersions(doc)}
                          title="الإصدارات"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {doc.status !== 'archived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(doc.id)}
                            title="أرشفة"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        {doc.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePublish(doc.id)}
                            title="نشر"
                            className="text-green-600"
                          >
                            <FileCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(doc)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      {isAddDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة مستند جديد</h3>
            <p className="text-sm text-gray-500">
              أدخل بيانات المستند الجديد
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">العنوان *</label>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="عنوان المستند"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">الوصف</label>
              <Textarea
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="وصف المستند"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">نوع المستند</label>
              <Select
                value={newDocument.documentType}
                onValueChange={(value: any) => setNewDocument({ ...newDocument, documentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">الفئة</label>
              <Select
                value={newDocument.category}
                onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.value !== 'all').map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">رابط الملف</label>
              <Input
                value={newDocument.filePath}
                onChange={(e) => setNewDocument({ ...newDocument, filePath: e.target.value })}
                placeholder="رابط الملف (اختياري)"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateDocument} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء'
              )}
            </Button>
          </div>
        </div>
      </div>)}

      {/* View Document Dialog */}
      {isViewDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل المستند</h3>
          </div>
          {selectedDocument && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">العنوان</label>
                  <p className="mt-1 font-medium">{selectedDocument.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">النوع</label>
                  <p className="mt-1">
                    {documentTypes.find(t => t.value === selectedDocument.documentType)?.label || selectedDocument.documentType}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">الوصف</label>
                <p className="mt-1">{selectedDocument.description || 'لا يوجد وصف'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <div className="mt-1">{getStatusBadge(selectedDocument.status || 'draft')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                  <p className="mt-1">
                    {selectedDocument.createdAt ? formatDate(selectedDocument.createdAt) : '-'}
                  </p>
                </div>
              </div>
              {selectedDocument.filePath && (
                <div>
                  <label className="text-sm font-medium text-gray-500">رابط الملف</label>
                  <p className="mt-1 text-blue-600 hover:underline cursor-pointer" onClick={() => handleDownload(selectedDocument)}>
                    {selectedDocument.filePath}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}

      {/* Versions Dialog */}
      {isVersionsDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إصدارات المستند</h3>
            <p className="text-sm text-gray-500">
              {selectedDocument?.title}
            </p>
          </div>
          <div className="py-4">
            {documentVersions && documentVersions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">الإصدار</TableHead>
                    <TableHead className="text-end">التاريخ</TableHead>
                    <TableHead className="text-end">ملاحظات</TableHead>
                    <TableHead className="text-end">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentVersions.map((version: any) => (
                    <TableRow key={version.id}>
                      <TableCell>v{version.versionNumber}</TableCell>
                      <TableCell>
                        {version.createdAt ? formatDate(version.createdAt) : '-'}
                      </TableCell>
                      <TableCell>{version.changeNotes || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (version.filePath) {
                              window.open(version.filePath, '_blank');
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد إصدارات سابقة</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsVersionsDialogOpen(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستند "{selectedDocument?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
