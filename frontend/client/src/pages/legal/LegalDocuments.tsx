import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, Eye, Trash2, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const documentTypeLabels: Record<string, string> = {
  contract: "عقد",
  agreement: "اتفاقية",
  policy: "سياسة",
  regulation: "لائحة",
  license: "رخصة",
  certificate: "شهادة",
  power_of_attorney: "توكيل",
  other: "أخرى",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  active: "ساري",
  expired: "منتهي",
  pending: "قيد المراجعة",
  draft: "مسودة",
};

export default function LegalDocuments() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [newDocument, setNewDocument] = useState({
    title: "",
    documentType: "contract" as string,
    description: "",
    parties: "",
    effectiveDate: "",
    expiryDate: "",
    status: "draft" as string,
    filePath: "",
  });

  const { data: documents, isLoading, refetch } = trpc.legal.documents?.list?.useQuery();

  const createDocumentMutation = trpc.legal.documents?.create?.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستند بنجاح");
      setIsCreateOpen(false);
      setNewDocument({
        title: "",
        documentType: "contract",
        description: "",
        parties: "",
        effectiveDate: "",
        expiryDate: "",
        status: "draft",
        filePath: "",
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteDocumentMutation = trpc.legal.documents?.delete?.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستند بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateDocument = () => {
    if (!newDocument.title.trim()) {
      toast.error("يرجى إدخال عنوان المستند");
      return;
    }
    createDocumentMutation.mutate({
      title: newDocument.title,
      filePath: newDocument.filePath || "/documents/placeholder.pdf",
    });
  };

  const handleDeleteDocument = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المستند؟")) {
      deleteDocumentMutation.mutate({ id });
    }
  };

  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const stats = {
    total: documents?.length || 0,
    active: documents?.filter((d: any) => d.status === "active").length || 0,
    expired: documents?.filter((d: any) => d.status === "expired").length || 0,
    pending: documents?.filter((d: any) => d.status === "pending").length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">المستندات القانونية</h1>
          <p className="text-muted-foreground">إدارة العقود والاتفاقيات والمستندات القانونية</p>
        </div>
        {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء مستند قانوني جديد</h3>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="عنوان المستند"
                />
              </div>
              <div>
                <Label>نوع المستند</Label>
                <Select
                  value={newDocument.documentType}
                  onValueChange={(value) => setNewDocument({ ...newDocument, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="agreement">اتفاقية</SelectItem>
                    <SelectItem value="policy">سياسة</SelectItem>
                    <SelectItem value="regulation">لائحة</SelectItem>
                    <SelectItem value="license">رخصة</SelectItem>
                    <SelectItem value="certificate">شهادة</SelectItem>
                    <SelectItem value="power_of_attorney">توكيل</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="وصف المستند"
                  rows={3}
                />
              </div>
              <div>
                <Label>الأطراف</Label>
                <Input
                  value={newDocument.parties}
                  onChange={(e) => setNewDocument({ ...newDocument, parties: e.target.value })}
                  placeholder="أطراف العقد أو الاتفاقية"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ السريان</Label>
                  <Input
                    type="date"
                    value={newDocument.effectiveDate}
                    onChange={(e) => setNewDocument({ ...newDocument, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select
                  value={newDocument.status}
                  onValueChange={(value) => setNewDocument({ ...newDocument, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="active">ساري</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateDocument} 
                className="w-full"
                disabled={createDocumentMutation.isPending}
              >
                {createDocumentMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستند"}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">سارية</p>
              <p className="text-lg md:text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">منتهية</p>
              <p className="text-lg md:text-2xl font-bold">{stats.expired}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-lg md:text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المستندات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="contract">عقد</SelectItem>
                <SelectItem value="agreement">اتفاقية</SelectItem>
                <SelectItem value="policy">سياسة</SelectItem>
                <SelectItem value="regulation">لائحة</SelectItem>
                <SelectItem value="license">رخصة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">ساري</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستندات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مستندات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">العنوان</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">تاريخ السريان</TableHead>
                  <TableHead className="text-end">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {doc.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {documentTypeLabels[doc.documentType] || doc.documentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || statusColors.draft}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.effectiveDate ? format(new Date(doc.effectiveDate), "dd MMM yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      {doc.expiryDate ? format(new Date(doc.expiryDate), "dd MMM yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
