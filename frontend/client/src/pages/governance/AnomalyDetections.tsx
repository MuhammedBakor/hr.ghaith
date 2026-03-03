import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, RefreshCw, AlertTriangle, Eye, CheckCircle, XCircle, Clock, Shield, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";


export default function AnomalyDetections() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'name': '', 'threshold': '', 'module': '' });
  const [formErrors, setFormErrors] = useState < Record<string, string>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.toString().trim()) errors.name = 'مطلوب';
    if (!formData.threshold?.toString().trim()) errors.threshold = 'مطلوب';
    if (!formData.module?.toString().trim()) errors.module = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = trpc.governance.create.useMutation({
    onSuccess: () => {
      setFormData({
        'name': '', 'threshold': '', 'module': '',
        onError: (e: any) => toast.error(e?.message || 'حدث خطأ')
      });
      setIsSubmitting(false);
      alert('تم الحفظ بنجاح');
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

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // جلب بيانات كشف الشذوذ من API
  const { data: anomalyData, isLoading, refetch, isError, error } = trpc.governanceDashboard.anomalyDetections.useQuery();


  { !anomalyData?.length && <p className="text-center text-gray-500 py-8">لا توجد بيانات</p> }
  const detections = anomalyData?.map((det: any) => ({
    id: det.id,
    ruleName: det.ruleName || det.ruleNameAr || 'قاعدة غير معروفة',
    description: det.description || '',
    detectedAt: det.detectedAt ? new Date(det.detectedAt) : new Date(),
    severity: det.severity || 'medium',
    status: det.status || 'pending',
    affectedEntity: det.affectedEntity || '-',
    value: det.value || '-',
    threshold: det.threshold || '-',
  }));

  const filteredDetections = detections.filter((det) => {
    const matchesSearch =
      det.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      det.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || det.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || det.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low": return <Badge variant="secondary">منخفض</Badge>;
      case "medium": return <Badge className="bg-amber-500">متوسط</Badge>;
      case "high": return <Badge className="bg-orange-500">عالي</Badge>;
      case "critical": return <Badge variant="destructive">حرج</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-500">قيد المراجعة</Badge>;
      case "reviewed": return <Badge className="bg-blue-500">تمت المراجعة</Badge>;
      case "blocked": return <Badge variant="destructive">محظور</Badge>;
      case "resolved": return <Badge className="bg-green-500">تم الحل</Badge>;
      case "dismissed": return <Badge variant="secondary">تم التجاهل</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleReview = (id: number) => {
    toast.success("تم تحديث حالة الاكتشاف");
  };

  const stats = {
    total: detections.length,
    pending: detections.filter(d => d.status === "pending").length,
    critical: detections.filter(d => d.severity === "critical").length,
    blocked: detections.filter(d => d.status === "blocked").length,
  };


  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;



  return (
    <div className="space-y-6">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input value={formData.name || ""} onChange={(e) => handleFieldChange("name", e.target.value)} placeholder="الاسم" className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? "border-red-500" : ""}`} />
            {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الحد</label>
            <input value={formData.threshold || ""} onChange={(e) => handleFieldChange("threshold", e.target.value)} placeholder="الحد" className={`w-full px-3 py-2 border rounded-lg ${formErrors.threshold ? "border-red-500" : ""}`} />
            {formErrors.threshold && <span className="text-xs text-red-500">{formErrors.threshold}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الموديول</label>
            <input value={formData.module || ""} onChange={(e) => handleFieldChange("module", e.target.value)} placeholder="الموديول" className={`w-full px-3 py-2 border rounded-lg ${formErrors.module ? "border-red-500" : ""}`} />
            {formErrors.module && <span className="text-xs text-red-500">{formErrors.module}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">اكتشافات الشذوذ</h2>
          <p className="text-muted-foreground">عرض ومراجعة الأنماط غير الطبيعية المكتشفة</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الاكتشافات</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <h3 className="text-2xl font-bold text-amber-600">{stats.pending}</h3>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">حرجة</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.critical}</h3>
            </div>
            <Shield className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">محظورة</p>
              <h3 className="text-2xl font-bold text-purple-600">{stats.blocked}</h3>
            </div>
            <XCircle className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الاكتشافات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                <SelectItem value="blocked">محظور</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="dismissed">تم التجاهل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الخطورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detections Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            سجل الاكتشافات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>القاعدة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الكيان المتأثر</TableHead>
                <TableHead>القيمة / الحد</TableHead>
                <TableHead>الخطورة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetections?.map((det) => (
                <TableRow key={det.id}>
                  <TableCell className="font-medium">{det.ruleName}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{det.description}</p>
                  </TableCell>
                  <TableCell>{det.affectedEntity}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{det.value}</p>
                      <p className="text-muted-foreground">الحد: {det.threshold}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(det.severity)}</TableCell>
                  <TableCell>{getStatusBadge(det.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(det.detectedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                      {det.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500"
                            onClick={() => handleReview(det.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleReview(det.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
