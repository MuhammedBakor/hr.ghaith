import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Eye, Send, Ban, DollarSign, FileCheck, Hourglass, Shield, AlertTriangle, Calculator, Wallet, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";
import { Dialog } from "@/components/ui/dialog";


const requestTypes = [
  { value: "purchase", label: "طلب شراء", icon: "🛒" },
  { value: "disbursement", label: "طلب صرف", icon: "💸" },
  { value: "receipt", label: "طلب قبض", icon: "💰" },
  { value: "settlement", label: "طلب تسوية", icon: "⚖️" },
  { value: "manual_entry", label: "قيد يدوي", icon: "📝" },
  { value: "invoice_approval", label: "اعتماد فاتورة", icon: "📄" },
  { value: "vendor_payment", label: "سداد مورد", icon: "🏪" },
  { value: "customer_collection", label: "تحصيل عميل", icon: "👤" },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_review: { label: "بانتظار المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  pending_approval: { label: "بانتظار الاعتماد", color: "bg-blue-100 text-blue-700", icon: Hourglass },
  approved: { label: "معتمد", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: XCircle },
  processing: { label: "قيد التنفيذ", color: "bg-purple-100 text-purple-700", icon: Loader2 },
  completed: { label: "مكتمل", color: "bg-emerald-100 text-emerald-700", icon: FileCheck },
  cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-500", icon: Ban },
  on_hold: { label: "معلق", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

const slaStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  on_track: { label: "في الوقت", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  warning: { label: "تحذير", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  violated: { label: "متأخر", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const budgetCheckStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  within_budget: { label: "ضمن الميزانية", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  over_budget: { label: "تجاوز الميزانية", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  no_budget: { label: "بدون ميزانية", color: "bg-gray-100 text-gray-700", icon: Wallet },
  budget_not_found: { label: "ميزانية غير موجودة", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  pending: { label: "لم يتم الفحص", color: "bg-blue-100 text-blue-700", icon: Clock },
  not_checked: { label: "لم يتم الفحص", color: "bg-blue-100 text-blue-700", icon: Clock },
  approved_override: { label: "تجاوز معتمد", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

// دالة توليد رقم الطلب التلقائي
const generateRequestNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `FR-${timestamp}-${random}`;
};

export default function FinancialRequests() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [budgetCheckResult, setBudgetCheckResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  const [formData, setFormData] = useState({
    requestType: "",
    description: "",
    expectedAmount: "",
    requestingEntity: "",
    currency: "SAR",
    slaHours: "48",
    budgetId: "",
  });

  const { data: requests, isLoading, refetch, isError, error } = trpc.finance.financialRequests.list.useQuery({
    status: filterStatus !== "all" ? filterStatus : undefined,
    requestType: filterType !== "all" ? filterType : undefined,
  });

  const { data: budgets } = trpc.finance.budgets?.list?.useQuery();

  const createMutation = trpc.finance.financialRequests.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الطلب المالي بنجاح");
      setView('list');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الطلب");
    },
  });

  const updateStatusMutation = trpc.finance.financialRequests.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      refetch();
      setView('list');
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const checkBudgetMutation = trpc.finance.financialRequests.checkBudget.useMutation({
    onSuccess: (data) => {
      setBudgetCheckResult(data);
      if (data.status === 'within_budget') {
        toast.success("الطلب ضمن الميزانية المتاحة");
      } else if (data.status === 'over_budget') {
        toast.warning(`تحذير: الطلب يتجاوز الميزانية المتاحة بمقدار ${formatCurrency(data.budgetDetails?.overrun || 0)}`);
      } else {
        toast.info(data.message);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء فحص الميزانية");
    },
  });

  const resetForm = () => {
    setFormData({
      requestType: "",
      description: "",
      expectedAmount: "",
      requestingEntity: "",
      currency: "SAR",
      slaHours: "48",
      budgetId: "",
    });
  };

  const handleCreate = () => {
    if (!formData.requestType || !formData.description || !formData.expectedAmount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    createMutation.mutate({
      requestType: formData.requestType as any,
      description: formData.description,
      expectedAmount: formData.expectedAmount,
      requestingEntity: formData.requestingEntity || undefined,
      currency: formData.currency,
      slaHours: parseInt(formData.slaHours) || 48,
      budgetId: formData.budgetId ? parseInt(formData.budgetId) : undefined,
    });
  };

  const handleApprove = (request: any) => {
    if (request.budgetId && request.budgetCheckStatus === 'over_budget') {
      toast.error("لا يمكن اعتماد الطلب: تجاوز الميزانية المتاحة. يرجى مراجعة الميزانية أو تعديل المبلغ.");
      return;
    }

    updateStatusMutation.mutate({
      id: request.id,
      newStatus: "approved",
      reason: "اعتماد الطلب"
    });
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "0";
    return new Intl.NumberFormat("ar-SA").format(parseFloat(amount.toString()));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return formatDate(date);
  };

  const getRequestTypeLabel = (type: string) => {
    return requestTypes.find(t => t.value === type)?.label || type;
  };

  const getRequestTypeIcon = (type: string) => {
    return requestTypes.find(t => t.value === type)?.icon || "📋";
  };

  // Statistics
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r: any) => ["draft", "pending_review", "pending_approval"].includes(r.status)).length || 0,
    approved: requests?.filter((r: any) => r.status === "approved").length || 0,
    completed: requests?.filter((r: any) => r.status === "completed").length || 0,
    overBudget: requests?.filter((r: any) => r.budgetCheckStatus === "over_budget").length || 0,
    totalAmount: requests?.reduce((sum: number, r: any) => sum + parseFloat(r.expectedAmount?.toString() || "0"), 0) || 0,
  };

  // عرض نموذج إضافة طلب جديد
  if (view === 'add') {

    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="space-y-6" dir="rtl">
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إنشاء طلب مالي جديد</h2>
            <p className="text-muted-foreground">أنشئ طلب مالي جديد وربطه بميزانية للتحقق التلقائي من التوفر</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              بيانات الطلب المالي
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>نوع الطلب *</Label>
                <Select
                  value={formData.requestType}
                  onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الجهة الطالبة</Label>
                <Input
                  value={formData.requestingEntity}
                  onChange={(e) => setFormData({ ...formData, requestingEntity: e.target.value })}
                  placeholder="مثال: قسم المشتريات"
                />
              </div>

              <div className="space-y-2">
                <Label>المبلغ المتوقع *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.expectedAmount}
                    onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ر.س</SelectItem>
                      <SelectItem value="USD">$</SelectItem>
                      <SelectItem value="EUR">€</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ربط بميزانية (اختياري)</Label>
                <Select
                  value={formData.budgetId}
                  onValueChange={(value) => setFormData({ ...formData, budgetId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر ميزانية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون ميزانية</SelectItem>
                    {budgets?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((budget: any) => (
                      <SelectItem key={budget.id} value={budget.id.toString()}>
                        {budget.name} ({formatCurrency(budget.plannedAmount)} {budget.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مدة SLA (بالساعات)</Label>
                <Select
                  value={formData.slaHours}
                  onValueChange={(value) => setFormData({ ...formData, slaHours: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 ساعة</SelectItem>
                    <SelectItem value="48">48 ساعة</SelectItem>
                    <SelectItem value="72">72 ساعة</SelectItem>
                    <SelectItem value="168">أسبوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>وصف الطلب *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب وصفاً تفصيلياً للطلب..."
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء الطلب
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل الطلب
  if (view === 'details' && selectedRequest) {
    const status = statusConfig[selectedRequest.status] || statusConfig.draft;
    const StatusIcon = status.icon;
    const slaStatus = slaStatusConfig[selectedRequest.slaStatus || "on_track"];
    const budgetStatus = budgetCheckStatusConfig[selectedRequest.budgetCheckStatus || "pending"];
    const BudgetIcon = budgetStatus.icon;

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedRequest(null); setBudgetCheckResult(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">تفاصيل الطلب {selectedRequest.requestNumber}</h2>
            <p className="text-muted-foreground">عرض وإدارة تفاصيل الطلب المالي</p>
          </div>
        </div>

        {/* Budget Warning Alert */}
        {selectedRequest.budgetCheckStatus === 'over_budget' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تحذير: تجاوز الميزانية</AlertTitle>
            <AlertDescription>
              هذا الطلب يتجاوز الميزانية المتاحة. لا يمكن اعتماده حتى يتم تعديل المبلغ أو زيادة الميزانية.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* معلومات الطلب الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                معلومات الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">رقم الطلب</Label>
                  <p className="font-mono font-medium">{selectedRequest.requestNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div>
                    <Badge className={`${status.color} gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">نوع الطلب</Label>
                  <p className="font-medium flex items-center gap-2">
                    <span>{getRequestTypeIcon(selectedRequest.requestType)}</span>
                    {getRequestTypeLabel(selectedRequest.requestType)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الجهة الطالبة</Label>
                  <p className="font-medium">{selectedRequest.requestingEntity || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">المبلغ المتوقع</Label>
                  <p className="text-xl font-bold">
                    {formatCurrency(selectedRequest.expectedAmount)} {selectedRequest.currency}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">تاريخ الإنشاء</Label>
                  <p className="font-medium">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">الوصف</Label>
                <p className="font-medium">{selectedRequest.description}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">حالة SLA</Label>
                <Badge className={slaStatus.color}>
                  {slaStatus.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* حارس الميزانية */}
          {selectedRequest.budgetId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  حارس الميزانية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">حالة فحص الميزانية:</span>
                  <Badge className={`${budgetStatus.color} gap-1`}>
                    <BudgetIcon className="h-3 w-3" />
                    {budgetStatus.label}
                  </Badge>
                </div>

                {budgetCheckResult && budgetCheckResult.budgetDetails && (
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <div className="flex justify-between text-sm">
                      <span>الميزانية المخططة:</span>
                      <span className="font-medium">{formatCurrency(budgetCheckResult.budgetDetails.planned)} ر.س.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>المصروف الفعلي:</span>
                      <span className="font-medium">{formatCurrency(budgetCheckResult.budgetDetails.actual)} ر.س.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>المتبقي:</span>
                      <span className="font-medium text-green-600">{formatCurrency(budgetCheckResult.budgetDetails.remaining)} ر.س.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>المبلغ المطلوب:</span>
                      <span className={`font-medium ${budgetCheckResult.status === 'over_budget' ? 'text-red-600' : ''}`}>
                        {formatCurrency(budgetCheckResult.budgetDetails.requested)} ر.س.
                      </span>
                    </div>
                    {budgetCheckResult.budgetDetails.overrun > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>مقدار التجاوز:</span>
                        <span className="font-medium text-red-600">{formatCurrency(budgetCheckResult.budgetDetails.overrun)} ر.س.</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>نسبة الاستهلاك</span>
                        <span>{Math.round((budgetCheckResult.budgetDetails.actual / budgetCheckResult.budgetDetails.planned) * 100)}%</span>
                      </div>
                      <Progress
                        value={(budgetCheckResult.budgetDetails.actual / budgetCheckResult.budgetDetails.planned) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => checkBudgetMutation.mutate({ requestId: selectedRequest.id })}
                  disabled={checkBudgetMutation.isPending}
                >
                  {checkBudgetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  فحص الميزانية
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setView('list'); setSelectedRequest(null); }}>
                إغلاق
              </Button>
              {selectedRequest.status === "draft" && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedRequest.id,
                      newStatus: "pending_review",
                      reason: "إرسال للمراجعة"
                    });
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  إرسال للمراجعة
                </Button>
              )}
              {["pending_review", "pending_approval"].includes(selectedRequest.status) && (
                <>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: selectedRequest.id,
                        newStatus: "rejected",
                        reason: "رفض الطلب"
                      });
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    رفض
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={updateStatusMutation.isPending || selectedRequest.budgetCheckStatus === 'over_budget'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    اعتماد
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة الطلبات
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الطلبات المالية</h2>
          <p className="text-muted-foreground">إدارة ومتابعة جميع الطلبات المالية مع حارس الميزانية</p>
        </div>
        <Button className="gap-2" onClick={() => setView('add')}>
          <Plus className="h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">معتمد</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المبالغ</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)} ر.س</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block">نوع الطلب</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات مالية</p>
              <Button variant="link" onClick={() => setView('add')}>
                إنشاء طلب جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم الطلب</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">الوصف</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الميزانية</TableHead>
                  <TableHead className="text-end">SLA</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((request: any) => {
                  const status = statusConfig[request.status] || statusConfig.draft;
                  const slaStatus = slaStatusConfig[request.slaStatus || "on_track"];
                  const budgetStatus = budgetCheckStatusConfig[request.budgetCheckStatus || "pending"];
                  const StatusIcon = status.icon;
                  const BudgetIcon = budgetStatus.icon;

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">
                        {request.requestNumber}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span>{getRequestTypeIcon(request.requestType)}</span>
                          <span>{getRequestTypeLabel(request.requestType)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.description}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(request.expectedAmount)} {request.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.budgetId ? (
                          <Badge className={`${budgetStatus.color} gap-1`}>
                            <BudgetIcon className="h-3 w-3" />
                            {budgetStatus.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={slaStatus.color}>
                          {slaStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="عرض التفاصيل"
                            onClick={() => {
                              setSelectedRequest(request);
                              setBudgetCheckResult(null);
                              setView('details');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.budgetId && !["completed", "cancelled", "rejected"].includes(request.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="فحص الميزانية"
                              onClick={() => checkBudgetMutation.mutate({ requestId: request.id })}
                              disabled={checkBudgetMutation.isPending}
                            >
                              {checkBudgetMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Calculator className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {request.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="إرسال للمراجعة"
                              onClick={() => updateStatusMutation.mutate({
                                id: request.id,
                                newStatus: "pending_review",
                                reason: "إرسال للمراجعة"
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {["pending_review", "pending_approval"].includes(request.status) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={request.budgetCheckStatus === 'over_budget' ? "text-gray-400" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                title={request.budgetCheckStatus === 'over_budget' ? "لا يمكن الاعتماد - تجاوز الميزانية" : "اعتماد"}
                                onClick={() => handleApprove(request)}
                                disabled={updateStatusMutation.isPending || request.budgetCheckStatus === 'over_budget'}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="رفض"
                                onClick={() => updateStatusMutation.mutate({
                                  id: request.id,
                                  newStatus: "rejected",
                                  reason: "رفض الطلب"
                                })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
