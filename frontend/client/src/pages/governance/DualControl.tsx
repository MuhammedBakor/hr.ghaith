import { formatDate, formatDateTime } from '@/lib/formatDate';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, RefreshCw, Shield, Users, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";


export default function DualControl() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'operation': '', 'requiredApprovers': '', 'module': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.operation?.toString().trim()) errors.operation = 'مطلوب';
    if (!formData.requiredApprovers?.toString().trim()) errors.requiredApprovers = 'مطلوب';
    if (!formData.module?.toString().trim()) errors.module = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/governance', data).then(r => r.data),
    onSuccess: () => {
      setFormData({
        'operation': '', 'requiredApprovers': '', 'module': '',
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

  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // جلب طلبات الرقابة المزدوجة من API
  const { data: dualControlData, isLoading, refetch } = useQuery({
    queryKey: ['governance', 'dualControlRequests'],
    queryFn: () => api.get('/governance/dual-control-requests').then(r => r.data),
  });


  { !dualControlData?.length && <p className="text-center text-gray-500 py-8">لا توجد بيانات</p> }
  const dualControlRequests = dualControlData?.map((req: any) => ({
    id: req.id,
    type: req.type || 'general',
    description: req.description || '',
    requestedBy: req.requestedByName || `مستخدم #${req.requestedBy}`,
    requestedAt: req.requestedAt ? new Date(req.requestedAt) : new Date(),
    firstApprover: req.firstApproverName || null,
    firstApprovalAt: req.firstApprovalAt ? new Date(req.firstApprovalAt) : null,
    secondApprover: req.secondApproverName || null,
    secondApprovalAt: req.secondApprovalAt ? new Date(req.secondApprovalAt) : null,
    status: req.status || 'pending_first',
    amount: req.amount || null,
  }));

  const filteredRequests = dualControlRequests.filter((req) => {
    const matchesSearch =
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_first": return <Badge className="bg-amber-500">بانتظار الموافقة الأولى</Badge>;
      case "pending_second": return <Badge className="bg-blue-500">بانتظار الموافقة الثانية</Badge>;
      case "approved": return <Badge className="bg-green-500">معتمد</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "payroll_approval": return <Badge variant="outline">رواتب</Badge>;
      case "large_transfer": return <Badge variant="outline">تحويل مالي</Badge>;
      case "user_permission": return <Badge variant="outline">صلاحيات</Badge>;
      case "contract_termination": return <Badge variant="outline">إنهاء عقد</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleApprove = (id: number) => {
    toast.success("تم الموافقة على الطلب");
  };

  const handleReject = (id: number) => {
    toast.error("تم رفض الطلب");
  };

  const stats = {
    total: dualControlRequests.length,
    pendingFirst: dualControlRequests.filter(r => r.status === "pending_first").length,
    pendingSecond: dualControlRequests.filter(r => r.status === "pending_second").length,
    approved: dualControlRequests.filter(r => r.status === "approved").length,
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
            <label className="block text-sm font-medium mb-1">العملية</label>
            <input value={formData.operation || ""} onChange={(e) => handleFieldChange("operation", e.target.value)} placeholder="العملية" className={`w-full px-3 py-2 border rounded-lg ${formErrors.operation ? "border-red-500" : ""}`} />
            {formErrors.operation && <span className="text-xs text-red-500">{formErrors.operation}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">عدد الموافقين</label>
            <input value={formData.requiredApprovers || ""} onChange={(e) => handleFieldChange("requiredApprovers", e.target.value)} placeholder="عدد الموافقين" className={`w-full px-3 py-2 border rounded-lg ${formErrors.requiredApprovers ? "border-red-500" : ""}`} />
            {formErrors.requiredApprovers && <span className="text-xs text-red-500">{formErrors.requiredApprovers}</span>}
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
          <h2 className="text-2xl font-bold tracking-tight">التحكم المزدوج</h2>
          <p className="text-muted-foreground">إدارة طلبات الموافقة المزدوجة للعمليات الحساسة</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">ما هو التحكم المزدوج؟</h4>
              <p className="text-sm text-blue-700 mt-1">
                التحكم المزدوج يتطلب موافقة شخصين مختلفين على العمليات الحساسة مثل اعتماد الرواتب،
                التحويلات المالية الكبيرة، ومنح الصلاحيات. هذا يضمن الرقابة ويمنع الاحتيال.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">بانتظار الأولى</p>
              <h3 className="text-2xl font-bold text-amber-600">{stats.pendingFirst}</h3>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">بانتظار الثانية</p>
              <h3 className="text-2xl font-bold text-blue-600">{stats.pendingSecond}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">معتمدة</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.approved}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
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
                  placeholder="بحث في الطلبات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending_first">بانتظار الأولى</SelectItem>
                <SelectItem value="pending_second">بانتظار الثانية</SelectItem>
                <SelectItem value="approved">معتمدة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            طلبات التحكم المزدوج
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوصف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>مقدم الطلب</TableHead>
                <TableHead>الموافق الأول</TableHead>
                <TableHead>الموافق الثاني</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.description}</p>
                      {req.amount && (
                        <p className="text-sm text-muted-foreground">
                          المبلغ: {req.amount.toLocaleString()} ر.س
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(req.type)}</TableCell>
                  <TableCell>
                    <div>
                      <p>{req.requestedBy}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(req.requestedAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.firstApprover ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{req.firstApprover}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.secondApprover ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{req.secondApprover}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                      {(req.status === "pending_first" || req.status === "pending_second") && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500"
                            onClick={() => handleApprove(req.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleReject(req.id)}
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
