import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Search, Download, Eye, Trash2, FolderOpen, FileCheck, Loader2, File } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

interface Document {
  id: number;
  title: string;
  description: string | null;
  documentType: 'form' | 'other' | 'policy' | 'procedure' | 'report' | 'contract';
  category: string | null;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: string;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function DocumentList() {
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    documentType: 'other' as const,
    category: '',
  });

  const { data: documentsData, isLoading, refetch, isError, error} = trpc.documents.list.useQuery();
  
  const createDocumentMutation = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء المستند بنجاح');
      setIsOpen(false);
      setNewDocument({ title: '', description: '', documentType: 'other', category: '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في إنشاء المستند');
    },
  });

  const documents = (documentsData || []) as unknown as Document[];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    policy: documents.filter(d => d.documentType === 'policy').length,
    procedure: documents.filter(d => d.documentType === 'procedure').length,
    form: documents.filter(d => d.documentType === 'form').length,
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'policy': return <Badge className="bg-blue-100 text-blue-800">سياسة</Badge>;
      case 'procedure': return <Badge className="bg-green-100 text-green-800">إجراء</Badge>;
      case 'form': return <Badge className="bg-purple-100 text-purple-800">نموذج</Badge>;
      case 'report': return <Badge className="bg-amber-100 text-amber-800">تقرير</Badge>;
      case 'contract': return <Badge className="bg-red-100 text-red-800">عقد</Badge>;
      default: return <Badge variant="outline">أخرى</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">مسودة</Badge>;
      case 'published': return <Badge className="bg-green-100 text-green-800">منشور</Badge>;
      case 'archived': return <Badge variant="outline">مؤرشف</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreateDocument = () => {
    if (!newDocument.title) {
      toast.error('يرجى إدخال عنوان المستند');
      return;
    }
    createDocumentMutation.mutate({
      title: newDocument.title,
      description: newDocument.description || undefined,
      documentType: newDocument.documentType,
      category: newDocument.category || undefined,
    });
  };

  if (isLoading) {
    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المستندات</h2>
          <p className="text-gray-500">تنظيم وإدارة مستندات المنظمة</p>
        </div>
        {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء مستند جديد</h3>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>العنوان *</Label>
                <Input 
                  value={newDocument.title} 
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})} 
                  placeholder="عنوان المستند" 
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input 
                  value={newDocument.description} 
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})} 
                  placeholder="وصف المستند" 
                />
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select 
                  value={newDocument.documentType} 
                  onValueChange={(v: any) => setNewDocument({...newDocument, documentType: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">سياسة</SelectItem>
                    <SelectItem value="procedure">إجراء</SelectItem>
                    <SelectItem value="form">نموذج</SelectItem>
                    <SelectItem value="report">تقرير</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input 
                  value={newDocument.category} 
                  onChange={(e) => setNewDocument({...newDocument, category: e.target.value})} 
                  placeholder="تصنيف المستند" 
                />
              </div>
              <Button onClick={handleCreateDocument} className="w-full" disabled={createDocumentMutation.isPending}>
                {createDocumentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
                إنشاء المستند
              </Button>
            </div>
          
        </div>)}

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
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FileCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">سياسات</p>
              <p className="text-2xl font-bold">{stats.policy}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <FolderOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجراءات</p>
              <p className="text-2xl font-bold">{stats.procedure}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <File className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نماذج</p>
              <p className="text-2xl font-bold">{stats.form}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="policy">سياسات</SelectItem>
                <SelectItem value="procedure">إجراءات</SelectItem>
                <SelectItem value="form">نماذج</SelectItem>
                <SelectItem value="report">تقارير</SelectItem>
                <SelectItem value="contract">عقود</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
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
            قائمة المستندات
          </CardTitle>
              <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">العنوان</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">التصنيف</TableHead>
                <TableHead className="text-end">الحجم</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد مستندات
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{doc.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(doc.documentType)}</TableCell>
                    <TableCell>{doc.category || '-'}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                        {doc.filePath && (
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) toast.info("حذف المستند") }}>
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
