import React from "react";
import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
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
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Receipt,
  CreditCard,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  Printer,
  Play,
  BookOpen,
  Link2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAppContext } from '@/contexts/AppContext';
import { PrintButton } from "@/components/PrintButton";
import { Dialog } from "@/components/ui/dialog";


// دالة توليد رقم السند التلقائي
const generateVoucherNumber = (type: string) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  const prefix = type === 'payment' ? 'PV' : type === 'receipt' ? 'RV' : 'JV';
  return `${prefix}-${timestamp}-${random}`;
};

const voucherTypes = [
  { value: "payment", label: "سند صرف", icon: ArrowUpCircle, color: "text-red-600" },
  { value: "receipt", label: "سند قبض", icon: ArrowDownCircle, color: "text-green-600" },
  { value: "journal", label: "سند قيد", icon: FileText, color: "text-blue-600" },
];

const paymentMethods = [
  { value: "cash", label: "نقدي", icon: Banknote },
  { value: "bank_transfer", label: "تحويل بنكي", icon: CreditCard },
  { value: "check", label: "شيك", icon: Receipt },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_approval: { label: "بانتظار الاعتماد", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "معتمد", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  executed: { label: "منفذ", color: "bg-blue-100 text-blue-700", icon: Play },
  posted: { label: "مرحّل", color: "bg-indigo-100 text-indigo-700", icon: BookOpen },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
};

type ViewMode = 'list' | 'add' | 'details';

export default function Vouchers() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const [formData, setFormData] = useState({
    voucherNumber: generateVoucherNumber('payment'),
    voucherType: "",
    amount: "",
    description: "",
    paymentMethod: "cash",
    beneficiaryName: "",
    beneficiaryAccount: "",
    requestId: "",
    accountId: "",
    debitAccountId: "",
    creditAccountId: "",
    notes: "",
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  const { data: vouchers, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['finance', 'vouchers', filterStatus, filterType, selectedBranchId],
    queryFn: () => api.get('/finance/vouchers', {
      params: {
        status: filterStatus !== "all" ? filterStatus : undefined,
        voucherType: filterType !== "all" ? filterType : undefined,
        branchId: selectedBranchId || undefined,
      }
    }).then(r => r.data),
  });

  const { data: accounts } = useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get('/finance/accounts').then(r => r.data),
  });
  const { data: approvedRequests } = useQuery({
    queryKey: ['finance', 'financial-requests', 'approved'],
    queryFn: () => api.get('/finance/financial-requests', { params: { status: "approved" } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/vouchers', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء السند بنجاح");
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء إنشاء السند");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/vouchers/${data.id}/approve`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم اعتماد السند بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء اعتماد السند");
    },
  });

  const executeMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/vouchers/${data.id}/execute`, data).then(r => r.data),
    onSuccess: (data: any) => {
      toast.success(`تم تنفيذ السند وإنشاء القيد المحاسبي رقم ${data.entryNumber}`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء تنفيذ السند");
    },
  });

  const resetForm = () => {
    setFormData({
      voucherNumber: generateVoucherNumber('payment'),
      voucherType: "",
      amount: "",
      description: "",
      paymentMethod: "cash",
      beneficiaryName: "",
      beneficiaryAccount: "",
      requestId: "",
      accountId: "",
      debitAccountId: "",
      creditAccountId: "",
      notes: "",
    });
  };

  const handleVoucherTypeChange = (type: string) => {
    setFormData({
      ...formData,
      voucherType: type,
      voucherNumber: generateVoucherNumber(type),
    });
  };

  const handleCreate = () => {
    if (!formData.voucherType || !formData.amount || !formData.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // تحويل نوع السند إلى القيمة الصحيحة
    const voucherTypeMap: Record<string, "payment" | "receipt" | "journal"> = {
      "payment": "payment",
      "receipt": "receipt",
      "journal": "journal",
    };

    createMutation.mutate({
      voucherType: voucherTypeMap[formData.voucherType] || "payment",
      amount: formData.amount,
      description: formData.description,
      paymentMethod: (formData.paymentMethod || "cash") as "cash" | "bank_transfer" | "check" | "credit_card" | "other",
      beneficiaryName: formData.beneficiaryName || undefined,
      beneficiaryAccount: formData.beneficiaryAccount || undefined,
      requestId: formData.requestId ? parseInt(formData.requestId) : undefined,
      accountId: formData.accountId ? parseInt(formData.accountId) : undefined,
      debitAccountId: formData.debitAccountId ? parseInt(formData.debitAccountId) : undefined,
      creditAccountId: formData.creditAccountId ? parseInt(formData.creditAccountId) : undefined,
      notes: formData.notes || undefined,
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

  const getVoucherTypeConfig = (type: string) => {
    return voucherTypes.find(t => t.value === type) || voucherTypes[0];
  };

  // Statistics
  const stats = {
    total: vouchers?.length || 0,
    payments: vouchers?.filter((v: any) => v.voucherType === "payment").length || 0,
    receipts: vouchers?.filter((v: any) => v.voucherType === "receipt").length || 0,
    executed: vouchers?.filter((v: any) => v.status === "executed").length || 0,
    totalPayments: vouchers?.filter((v: any) => v.voucherType === "payment")
      .reduce((sum: number, v: any) => sum + parseFloat(v.amount?.toString() || "0"), 0) || 0,
    totalReceipts: vouchers?.filter((v: any) => v.voucherType === "receipt")
      .reduce((sum: number, v: any) => sum + parseFloat(v.amount?.toString() || "0"), 0) || 0,
  };

  // نموذج إنشاء سند جديد
  if (viewMode === 'add') {
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
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء سند جديد</h1>
            <p className="text-muted-foreground">أنشئ سند صرف أو قبض جديد. عند تنفيذ السند سيتم إنشاء قيد محاسبي تلقائياً.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              بيانات السند
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم السند (تلقائي)</Label>
                  <Input
                    value={formData.voucherNumber}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>نوع السند *</Label>
                  <Select
                    value={formData.voucherType}
                    onValueChange={handleVoucherTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع السند" />
                    </SelectTrigger>
                    <SelectContent>
                      {voucherTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <type.icon className={`h-4 w-4 ${type.color}`} />
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <span className="flex items-center gap-2">
                            <method.icon className="h-4 w-4" />
                            {method.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount?.toLocaleString()}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحساب الرئيسي</Label>
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((account: any) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* حسابات القيد المحاسبي */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  حسابات القيد المحاسبي (اختياري)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحساب المدين</Label>
                    <Select
                      value={formData.debitAccountId}
                      onValueChange={(value) => setFormData({ ...formData, debitAccountId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحساب المدين" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الحساب الدائن</Label>
                    <Select
                      value={formData.creditAccountId}
                      onValueChange={(value) => setFormData({ ...formData, creditAccountId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحساب الدائن" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الطلب المالي المرتبط</Label>
                <Select
                  value={formData.requestId}
                  onValueChange={(value) => setFormData({ ...formData, requestId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطلب المالي (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedRequests?.map((request: any) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        {request.requestNumber} - {request.description?.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المستفيد</Label>
                  <Input
                    placeholder="اسم المستفيد"
                    value={formData.beneficiaryName}
                    onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم حساب المستفيد</Label>
                  <Input
                    placeholder="رقم الحساب البنكي"
                    value={formData.beneficiaryAccount}
                    onChange={(e) => setFormData({ ...formData, beneficiaryAccount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف *</Label>
                <Textarea
                  placeholder="وصف السند..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  placeholder="ملاحظات إضافية..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء السند
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل السند
  if (viewMode === 'details' && selectedVoucher) {
    const status = statusConfig[selectedVoucher.status] || statusConfig.draft;
    const typeConfig = getVoucherTypeConfig(selectedVoucher.voucherType);
    const TypeIcon = typeConfig.icon;

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedVoucher(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل السند {selectedVoucher.voucherNumber}</h1>
            <p className="text-muted-foreground">عرض تفاصيل السند المالي</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">رقم السند</Label>
                  <p className="font-medium font-mono">{selectedVoucher.voucherNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">نوع السند</Label>
                  <p className="font-medium flex items-center gap-2">
                    <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                    {typeConfig.label}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div>
                    <Badge className={`${status.color} gap-1`}>
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">طريقة الدفع</Label>
                  <p className="font-medium">
                    {paymentMethods.find(m => m.value === selectedVoucher.paymentMethod)?.label || selectedVoucher.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">المبلغ</Label>
                  <p className={`text-xl font-bold ${selectedVoucher.voucherType === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedVoucher.voucherType === 'payment' ? '-' : '+'}{formatCurrency(selectedVoucher.amount)} ر.س.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">اسم المستفيد</Label>
                  <p className="font-medium">{selectedVoucher.beneficiaryName || "-"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">الوصف</Label>
                <p className="font-medium">{selectedVoucher.description || "-"}</p>
              </div>

              {selectedVoucher.notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm">{selectedVoucher.notes}</p>
                </div>
              )}

              {selectedVoucher.journalEntryId && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">القيد المحاسبي المرتبط</Label>
                      <p className="font-medium">قيد رقم #{selectedVoucher.journalEntryId}</p>
                    </div>
                    <Link href="/finance/journal-entries">
                      <Button variant="outline" size="sm" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        عرض القيد
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span>تاريخ الإنشاء: </span>
                    <span className="font-medium">{formatDate(selectedVoucher.createdAt)}</span>
                  </div>
                  {selectedVoucher.executedAt && (
                    <div>
                      <span>تاريخ التنفيذ: </span>
                      <span className="font-medium">{formatDate(selectedVoucher.executedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedVoucher(null); }}>
                  إغلاق
                </Button>
                {selectedVoucher.status === "draft" && (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      approveMutation.mutate({ id: selectedVoucher.id });
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    اعتماد
                  </Button>
                )}
                {selectedVoucher.status === "approved" && (
                  <Button
                    className="gap-2"
                    onClick={() => {
                      executeMutation.mutate({ id: selectedVoucher.id });
                    }}
                    disabled={executeMutation.isPending}
                  >
                    <Play className="h-4 w-4" />
                    تنفيذ وإنشاء قيد
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة السندات
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">السندات المالية</h2>
          <p className="text-muted-foreground">إدارة سندات الصرف والقبض مع الربط التلقائي بالقيود المحاسبية</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          سند جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي السندات</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">سندات الصرف</p>
                <h3 className="text-2xl font-bold">{stats.payments}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <ArrowUpCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">سندات القبض</p>
                <h3 className="text-2xl font-bold">{stats.receipts}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <ArrowDownCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">سندات منفذة</p>
                <h3 className="text-2xl font-bold">{stats.executed}</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Play className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">صافي الحركة</p>
                <h3 className={`text-2xl font-bold ${stats.totalReceipts - stats.totalPayments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalReceipts - stats.totalPayments)}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Banknote className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {voucherTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السندات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !vouchers?.length ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد سندات</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء سند جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم السند</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                  <TableHead className="text-end">المستفيد</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">القيد المحاسبي</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers?.map((voucher: any) => {
                  const status = statusConfig[voucher.status] || statusConfig.draft;
                  const typeConfig = getVoucherTypeConfig(voucher.voucherType);
                  const StatusIcon = status.icon;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono text-sm">
                        {voucher.voucherNumber}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                          <span>{typeConfig.label}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${voucher.voucherType === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                          {voucher.voucherType === 'payment' ? '-' : '+'}{formatCurrency(voucher.amount)} ر.س.
                        </span>
                      </TableCell>
                      <TableCell>
                        {voucher.beneficiaryName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {voucher.journalEntryId ? (
                          <Link href={`/finance/journal-entries`}>
                            <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                              <Link2 className="h-3 w-3" />
                              قيد #{voucher.journalEntryId}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(voucher.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="عرض التفاصيل"
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setViewMode('details');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="طباعة" aria-label="طباعة">
                            <Printer className="h-4 w-4" />
                          </Button>
                          {voucher.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="اعتماد"
                              onClick={() => approveMutation.mutate({ id: voucher.id })}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {voucher.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="تنفيذ وإنشاء قيد"
                              onClick={() => executeMutation.mutate({ id: voucher.id })}
                              disabled={executeMutation.isPending}
                            >
                              {executeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
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
