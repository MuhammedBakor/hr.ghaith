import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Progress } from "@/components/ui/progress";
import { Search, Eye, Trash2, FileText, Image, Video, FileAudio, File, CheckCircle, Clock, Send, Loader2, RefreshCw, Download, Share2, Package, CheckCircle2, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function EvidencePacks() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    caseNumber: "",
    caseType: "",
    location: "",
  });

  // Fetch evidence packs
  const { data: packs = [], isLoading, refetch } = trpc.evidencePacks.list.useQuery();
  const { data: stats } = trpc.evidencePacks.stats.useQuery();
  const { data: selectedPackFiles = [] } = trpc.evidencePacks.files.list.useQuery(
    { packId: selectedPack?.id || 0 },
    { enabled: !!selectedPack }
  );

  // Mutations
  const createMutation = trpc.evidencePacks.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء حزمة الأدلة بنجاح");
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", caseNumber: "", caseType: "", location: "",
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في إنشاء حزمة الأدلة: " + error.message);
    },
  });

  const deleteMutation = trpc.evidencePacks.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف حزمة الأدلة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في حذف حزمة الأدلة: " + error.message);
    },
  });

  const submitMutation = trpc.evidencePacks.submit.useMutation({
    onSuccess: () => {
      toast.success("تم تقديم حزمة الأدلة للمراجعة");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في تقديم حزمة الأدلة: " + error.message);
    },
  });

  const approveMutation = trpc.evidencePacks.approve.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد حزمة الأدلة");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في اعتماد حزمة الأدلة: " + error.message);
    },
  });

  const verifyFileMutation = trpc.evidencePacks.files.verify.useMutation({
    onSuccess: () => {
      toast.success("تم التحقق من الملف");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في التحقق من الملف: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!formData.title || !formData.caseNumber) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleView = (pack: any) => {
    setSelectedPack(pack);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (pack: any) => {
    toast.success("جاري تحميل حزمة الأدلة...");
  };

  const handleShare = (pack: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/platform/evidence-packs/${pack.id}`);
    toast.success("تم نسخ رابط المشاركة");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "مسودة", variant: "secondary" },
      complete: { label: "مكتمل", variant: "default" },
      submitted: { label: "قيد المراجعة", variant: "outline" },
      approved: { label: "معتمد", variant: "default" },
      rejected: { label: "مرفوض", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "document": return <FileText className="h-4 w-4 text-blue-600" />;
      case "image": return <Image className="h-4 w-4 text-green-600" />;
      case "video": return <Video className="h-4 w-4 text-purple-600" />;
      case "audio": return <FileAudio className="h-4 w-4 text-orange-600" />;
      default: return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredPacks = packs.filter((pack: any) => {
    const matchesSearch = pack.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || pack.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
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
          <h2 className="text-2xl font-bold tracking-tight">حزم الأدلة</h2>
          <p className="text-muted-foreground">إدارة وتجميع الأدلة والمستندات المتعلقة بالقضايا والحوادث</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          {isCreateDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إنشاء حزمة أدلة جديدة</h3>
                <p className="text-sm text-gray-500">أدخل معلومات حزمة الأدلة الجديدة</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>عنوان الحزمة *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="أدخل عنوان الحزمة"
                  />
                </div>
                <div>
                  <Label>رقم القضية *</Label>
                  <Input
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    placeholder="مثال: 2024-001"
                  />
                </div>
                <div>
                  <Label>نوع القضية</Label>
                  <Input
                    value={formData.caseType}
                    onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    placeholder="أدخل نوع القضية"
                  />
                </div>
                <div>
                  <Label>الموقع</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="أدخل موقع الحادث"
                  />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للحزمة"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
                  إنشاء
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الحزم</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مسودات</p>
              <p className="text-2xl font-bold">{stats?.draft || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Send className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats?.submitted || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">معتمدة</p>
              <p className="text-2xl font-bold">{stats?.approved || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الملفات</p>
              <p className="text-2xl font-bold">{stats?.totalFiles || 0}</p>
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
                  placeholder="بحث بالعنوان أو رقم القضية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="complete">مكتمل</SelectItem>
                <SelectItem value="submitted">قيد المراجعة</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Packs List */}
      <div className="space-y-4">
        {filteredPacks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium text-gray-500">لا توجد حزم أدلة</p>
              <p className="text-sm text-gray-400">قم بإنشاء حزمة جديدة للبدء</p>
            </CardContent>
          </Card>
        ) : (
          filteredPacks.map((pack: any) => (
            <Card key={pack.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{pack.title}</h3>
                      {getStatusBadge(pack.status)}
                    </div>
                    <p className="text-gray-500 mb-3">{pack.description || "لا يوجد وصف"}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        رقم القضية: {pack.caseNumber}
                      </span>
                      {pack.caseType && (
                        <span className="flex items-center gap-1">
                          نوع القضية: {pack.caseType}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {pack.createdAt ? formatDate(pack.createdAt) : "-"}
                      </span>
                    </div>

                    {/* Completeness */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">اكتمال الحزمة</span>
                        <span className="font-medium">{pack.completeness || 0}%</span>
                      </div>
                      <Progress value={pack.completeness || 0} className="h-2" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 me-4">
                    <Button size="sm" variant="outline" onClick={() => handleView(pack)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      عرض
                    </Button>
                    {pack.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => submitMutation.mutate({ id: pack.id })} 
                        className="gap-2"
                        disabled={submitMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                        تقديم
                      </Button>
                    )}
                    {pack.status === "submitted" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => approveMutation.mutate({ id: pack.id })} 
                        className="gap-2 text-green-600"
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                        اعتماد
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownload(pack)} className="gap-2">
                      <Download className="h-4 w-4" />
                      تحميل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(pack)} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      مشاركة
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(pack.id)} 
                      className="gap-2 text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Dialog */}
      {isViewDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل حزمة الأدلة</h3>
          </div>
          {selectedPack && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">العنوان</Label>
                  <p className="font-medium">{selectedPack.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">رقم القضية</Label>
                  <p className="font-medium">{selectedPack.caseNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">نوع القضية</Label>
                  <p className="font-medium">{selectedPack.caseType || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الموقع</Label>
                  <p className="font-medium">{selectedPack.location || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <p>{getStatusBadge(selectedPack.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">نسبة الاكتمال</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedPack.completeness || 0} className="flex-1" />
                    <span>{selectedPack.completeness || 0}%</span>
                  </div>
                </div>
              </div>

              {selectedPack.description && (
                <div>
                  <Label className="text-muted-foreground">الوصف</Label>
                  <p>{selectedPack.description}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground mb-2 block">الملفات المرفقة</Label>
                {selectedPackFiles.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border rounded-lg">
                    <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>لا توجد ملفات مرفقة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPackFiles.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.fileType)}
                          <span>{file.fileName}</span>
                          {file.isVerified && (
                            <Badge variant="outline" className="text-green-500">
                              <CheckCircle className="h-3 w-3 ms-1" />
                              تم التحقق
                            </Badge>
                          )}
                        </div>
                        {!file.isVerified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyFileMutation.mutate({ id: file.id })}
                            disabled={verifyFileMutation.isPending}
                          >
                            تحقق
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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