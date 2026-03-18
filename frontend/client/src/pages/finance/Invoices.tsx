import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "@/services/financeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Filter, FileText, Clock, CheckCircle2, AlertCircle, Eye, Edit, Trash2, Send, CreditCard, History, XCircle, ArrowUpRight, ArrowRight, Loader2 } from "lucide-react";
import { useAppContext } from '@/contexts/AppContext';
import { PrintButton } from "@/components/PrintButton";

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_approval: { label: "بانتظار الموافقة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "معتمدة", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  sent: { label: "مرسلة", color: "bg-purple-100 text-purple-700", icon: Send },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "ملغاة", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

// دالة توليد رقم الفاتورة التلقائي
const generateAutoInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

// دالة توليد رقم الدفعة التلقائي
const generateAutoPaymentNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

export default function Invoices() {
  const [showInlineForm, setShowInlineForm] = useState(false);

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole?.includes("manager");
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add' | 'details' | 'status' | 'payment'>('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: generateAutoInvoiceNumber(),
    clientName: "",
    amount: "",
    dueDate: "",
    notes: "",
    status: "draft" as const,
  });
  const [newPayment, setNewPayment] = useState({
    paymentNumber: generateAutoPaymentNumber(),
    amount: "",
    paymentMethod: "bank_transfer" as const,
    referenceNumber: "",
    notes: "",
  });
  const [statusChange, setStatusChange] = useState({
    status: "",
    reason: "",
  });

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  const queryClient = useQueryClient();

  // Queries
  const { data: invoices = [], isLoading, refetch, isError, error } = useQuery({
    queryKey: ["invoices", selectedBranchId],
    queryFn: () => financeService.getInvoices(selectedBranchId ?? undefined),
  });

  const { data: invoiceDetail } = useQuery({
    queryKey: ["invoice", selectedInvoice?.id],
    queryFn: () => financeService.getInvoiceById(selectedInvoice.id),
    enabled: !!selectedInvoice?.id && view === 'details',
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => financeService.createInvoice(data, selectedBranchId ?? undefined),
    onSuccess: () => {
      toast.success("تم إنشاء الفاتورة بنجاح");
      setView('list');
      resetInvoiceForm();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء الإنشاء");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: any) => financeService.updateInvoiceStatus(id, status, reason),
    onSuccess: () => {
      toast.success("تم تحديث حالة الفاتورة");
      setView('list');
      setStatusChange({ status: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء التحديث");
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteInvoice(id),
    onSuccess: () => {
      toast.success("تم حذف الفاتورة");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, ...data }: any) => financeService.recordPayment(invoiceId, data),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      setView('list');
      resetPaymentForm();
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الدفعة");
    },
  });

  const resetInvoiceForm = () => {
    setNewInvoice({
      invoiceNumber: generateAutoInvoiceNumber(),
      clientName: "",
      amount: "",
      dueDate: "",
      notes: "",
      status: "draft",
    });
  };

  const resetPaymentForm = () => {
    setNewPayment({
      paymentNumber: generateAutoPaymentNumber(),
      amount: "",
      paymentMethod: "bank_transfer",
      referenceNumber: "",
      notes: "",
    });
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || "0"), 0),
    paid: invoices.filter((inv: any) => inv.status === "paid").length,
    paidAmount: invoices.filter((inv: any) => inv.status === "paid").reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || "0"), 0),
    overdue: invoices.filter((inv: any) => inv.status === "overdue").length,
    overdueAmount: invoices.filter((inv: any) => inv.status === "overdue").reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || "0"), 0),
    pending: invoices.filter((inv: any) => ["draft", "sent", "pending_approval"].includes(inv.status)).length,
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.amount) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    createInvoiceMutation.mutate({
      invoiceNumber: newInvoice.invoiceNumber,
      clientName: newInvoice.clientName,
      amount: newInvoice.amount,
      dueDate: newInvoice.dueDate ? new Date(newInvoice.dueDate) : undefined,
      notes: newInvoice.notes,
      status: newInvoice.status,
    });
  };

  const handleStatusChange = () => {
    if (!statusChange.status || !statusChange.reason) {
      toast.error("يرجى اختيار الحالة وكتابة السبب");
      return;
    }
    updateStatusMutation.mutate({
      id: selectedInvoice.id,
      status: statusChange.status as any,
      reason: statusChange.reason,
    });
  };

  const handleDelete = (invoice: any) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteInvoiceMutation.mutate(invoice);
    }
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoiceMutation.mutate(invoiceToDelete.id);
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleRecordPayment = () => {
    if (!newPayment.amount) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    createPaymentMutation.mutate({
      paymentNumber: newPayment.paymentNumber,
      invoiceId: selectedInvoice.id,
      amount: newPayment.amount,
      paymentMethod: newPayment.paymentMethod,
      referenceNumber: newPayment.referenceNumber,
      notes: newPayment.notes,
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    }).format(Number(amount));
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(date as string));
    } catch {
      return String(date);
    }
  };

  // عرض نموذج إنشاء فاتورة جديدة
  if (view === 'add') {

    if (isError) return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
        <p className="text-gray-500 mt-2">{error?.message}</p>
      </div>
    );

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetInvoiceForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إنشاء فاتورة جديدة</h2>
            <p className="text-muted-foreground">أدخل بيانات الفاتورة الجديدة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              بيانات الفاتورة
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الفاتورة (تلقائي)</Label>
                <Input
                  value={newInvoice.invoiceNumber}
                  disabled
                  className="bg-muted font-mono"
                  placeholder="أدخل القيمة" />
              </div>
              <div className="space-y-2">
                <Label>اسم العميل</Label>
                <Input
                  value={newInvoice.clientName}
                  onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                  placeholder="اسم العميل أو الشركة"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ قبل الضريبة (ر.س.) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0.00"
                />
                {newInvoice.amount && Number(newInvoice.amount) > 0 && (
                  <div className="text-xs text-muted-foreground space-y-0.5 bg-muted/50 rounded p-2">
                    <div className="flex justify-between">
                      <span>المبلغ قبل الضريبة:</span>
                      <span>{formatCurrency(Number(newInvoice.amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span>{formatCurrency(Number(newInvoice.amount) * 0.15)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-0.5 mt-0.5">
                      <span>الإجمالي شامل الضريبة:</span>
                      <span>{formatCurrency(Number(newInvoice.amount) * 1.15)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={newInvoice.status}
                  onValueChange={(value: any) => setNewInvoice({ ...newInvoice, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
                    <SelectItem value="sent">مرسلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetInvoiceForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateInvoice} disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء الفاتورة
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل الفاتورة
  if (view === 'details' && selectedInvoice) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedInvoice(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">تفاصيل الفاتورة {selectedInvoice.invoiceNumber}</h2>
            <p className="text-muted-foreground">عرض وإدارة تفاصيل الفاتورة</p>
          </div>
        </div>

        {invoiceDetail ? (
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="details">البيانات الأساسية</TabsTrigger>
                  <TabsTrigger value="items">البنود</TabsTrigger>
                  <TabsTrigger value="history">سجل التغييرات</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">رقم الفاتورة</Label>
                      <p className="font-semibold font-mono">{invoiceDetail.invoiceNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">العميل</Label>
                      <p className="font-semibold">{invoiceDetail.clientName || "-"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">المبلغ</Label>
                      <p className="font-semibold text-xl">{formatCurrency(invoiceDetail.amount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">الحالة</Label>
                      <Badge className={statusConfig[invoiceDetail.status]?.color}>
                        {statusConfig[invoiceDetail.status]?.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">تاريخ الاستحقاق</Label>
                      <p>{formatDate(invoiceDetail.dueDate || null)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">تاريخ الإنشاء</Label>
                      <p>{formatDate(invoiceDetail.createdAt || null)}</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="items" className="mt-6">
                  {(invoiceDetail.items?.length ?? 0) > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-end">#</TableHead>
                          <TableHead className="text-end">الوصف</TableHead>
                          <TableHead className="text-end">الكمية</TableHead>
                          <TableHead className="text-end">السعر</TableHead>
                          <TableHead className="text-end">الإجمالي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDetail?.items?.map((item: any, index: number) => (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell>{formatCurrency(item.totalAfterTax)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد بنود</p>
                  )}
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                  {(invoiceDetail.statusHistory?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                      {invoiceDetail?.statusHistory?.map((history: any) => (
                        <div key={history.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <History className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{statusConfig[history.fromStatus]?.label || history.fromStatus}</Badge>
                              <ArrowUpRight className="h-4 w-4" />
                              <Badge className={statusConfig[history.toStatus]?.color}>
                                {statusConfig[history.toStatus]?.label || history.toStatus}
                              </Badge>
                            </div>
                            {history.reason && (
                              <p className="text-sm text-muted-foreground mt-2">{history.reason}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(history.changedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا يوجد سجل تغييرات</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // عرض نموذج تغيير الحالة
  if (view === 'status' && selectedInvoice) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedInvoice(null); setStatusChange({ status: "", reason: "" }); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">تغيير حالة الفاتورة</h2>
            <p className="text-muted-foreground">الفاتورة: {selectedInvoice.invoiceNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              تغيير الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>الحالة الحالية</Label>
                <Badge className={statusConfig[selectedInvoice.status]?.color}>
                  {statusConfig[selectedInvoice.status]?.label}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>الحالة الجديدة *</Label>
                <Select
                  value={statusChange.status}
                  onValueChange={(value) => setStatusChange({ ...statusChange, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
                    <SelectItem value="approved">معتمدة</SelectItem>
                    <SelectItem value="sent">مرسلة</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                    <SelectItem value="overdue">متأخرة</SelectItem>
                    <SelectItem value="cancelled">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سبب التغيير *</Label>
                <Textarea
                  value={statusChange.reason}
                  onChange={(e) => setStatusChange({ ...statusChange, reason: e.target.value })}
                  placeholder="اكتب سبب تغيير الحالة..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); setSelectedInvoice(null); setStatusChange({ status: "", reason: "" }); }}>
                إلغاء
              </Button>
              <Button onClick={handleStatusChange} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التحديث...
                  </>
                ) : (
                  "تحديث الحالة"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض نموذج تسجيل دفعة
  if (view === 'payment' && selectedInvoice) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedInvoice(null); resetPaymentForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">تسجيل دفعة</h2>
            <p className="text-muted-foreground">الفاتورة: {selectedInvoice.invoiceNumber} - المبلغ: {formatCurrency(selectedInvoice.amount)}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              بيانات الدفعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الدفعة (تلقائي)</Label>
                <Input
                  value={newPayment.paymentNumber}
                  disabled
                  className="bg-muted font-mono"
                  placeholder="أدخل القيمة" />
              </div>
              <div className="space-y-2">
                <Label>المبلغ (ر.س.) *</Label>
                <Input
                  type="number"
                  value={newPayment.amount?.toLocaleString()}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder={selectedInvoice?.amount}
                />
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={newPayment.paymentMethod}
                  onValueChange={(value: any) => setNewPayment({ ...newPayment, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>رقم المرجع</Label>
                <Input
                  value={newPayment.referenceNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                  placeholder="رقم الحوالة أو الشيك"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); setSelectedInvoice(null); resetPaymentForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleRecordPayment} disabled={createPaymentMutation.isPending}>
                {createPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 ms-2" />
                    تسجيل الدفعة
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة الفواتير
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الفواتير</h2>
          <p className="text-muted-foreground">إدارة الفواتير والمدفوعات</p>
        </div>
        <Button onClick={() => setView('add')}>
          <Plus className="ms-2 h-4 w-4" />
          فاتورة جديدة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الفواتير</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
                <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalAmount)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">المدفوعة</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.paid}</h3>
                <p className="text-sm text-green-600">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المتأخرة</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.overdue}</h3>
                <p className="text-sm text-red-600">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">قيد الانتظار</p>
                <h3 className="text-2xl font-bold text-amber-600">{stats.pending}</h3>
                <p className="text-sm text-muted-foreground">فاتورة</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="ms-2 h-4 w-4" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
                <SelectItem value="approved">معتمدة</SelectItem>
                <SelectItem value="sent">مرسلة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">رقم الفاتورة</TableHead>
                <TableHead className="text-end">العميل</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead className="text-end">تاريخ الاستحقاق</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">لا توجد فواتير</p>
                    <Button variant="link" onClick={() => setView('add')}>
                      إنشاء فاتورة جديدة
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice: any) => {
                  const status = statusConfig[invoice.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium font-mono">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName || "-"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="ms-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="عرض التفاصيل"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setView('details');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="تغيير الحالة"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setStatusChange({ status: "", reason: "" });
                              setView('status');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="تسجيل دفعة"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                resetPaymentForm();
                                setView('payment');
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="حذف"
                            onClick={() => {
                              setInvoiceToDelete(invoice);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
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
