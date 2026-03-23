import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ArrowRight, Plus, Trash2, CreditCard, FileText, Building2, CheckCircle, XCircle, Clock, AlertTriangle, Send, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-800", icon: <FileText className="h-4 w-4" /> },
  pending_approval: { label: "بانتظار الموافقة", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  approved: { label: "معتمدة", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-4 w-4" /> },
  sent: { label: "مرسلة", color: "bg-purple-100 text-purple-800", icon: <Send className="h-4 w-4" /> },
  paid: { label: "مدفوعة", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  overdue: { label: "متأخرة", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> },
  cancelled: { label: "ملغاة", color: "bg-gray-100 text-gray-500", icon: <XCircle className="h-4 w-4" /> },
};

// الانتقالات المسموحة لكل حالة
const allowedTransitions: Record<string, string[]> = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["sent", "cancelled"],
  sent: ["paid", "overdue", "cancelled"],
  overdue: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export default function InvoiceDetails() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);

  const [, params] = useRoute("/finance/invoice/:id");
  const [, setLocation] = useLocation();
  const invoiceId = params?.id ? parseInt(params.id) : 0;

  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  
  const [newItem, setNewItem] = useState({
    description: "",
    quantity: 1,
    unitPrice: "",
    taxRate: "15",
    discount: "0",
  });

  const [newPayment, setNewPayment] = useState<{
    amount: string;
    paymentMethod: "bank_transfer" | "check" | "cash" | "credit_card" | "other";
    reference: string;
    notes: string;
  }>({
    amount: "",
    paymentMethod: "bank_transfer",
    reference: "",
    notes: "",
  });

  // جلب بيانات الفاتورة (items و payments مضمّنة في الاستجابة)
  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: () => api.get(`/finance/invoices/${invoiceId}`).then(r => r.data),
    enabled: invoiceId > 0,
  });

  const items: any[] = invoice?.items ?? [];
  const payments: any[] = invoice?.payments ?? [];

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: (data: any) => api.post(`/finance/invoices/${invoiceId}/items`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إضافة البند بنجاح");
      setShowAddItem(false);
      setNewItem({ description: "", quantity: 1, unitPrice: "", taxRate: "15", discount: "0" });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء إضافة البند");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/finance/invoices/items/${data.id}`, { data: { reason: data.reason } }).then(r => r.data),
    onSuccess: () => {
      toast.success("تم حذف البند بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء حذف البند");
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => api.post(`/finance/invoices/${invoiceId}/payments`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      setShowAddPayment(false);
      setNewPayment({ amount: "", paymentMethod: "bank_transfer", reference: "", notes: "" });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء تسجيل الدفعة");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/invoices/${data.id}/status`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تحديث حالة الفاتورة بنجاح");
      setShowStatusChange(false);
      setNewStatus("");
      setStatusReason("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء تحديث الحالة");
    },
  });

  const handleAddItem = () => {
    if (!newItem.description || !newItem.unitPrice) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    addItemMutation.mutate({
      invoiceId,
      itemNumber: items.length + 1,
      description: newItem.description,
      quantity: String(newItem.quantity),
      unitPrice: newItem.unitPrice,
      taxRate: newItem.taxRate,
      discount: newItem.discount,
    });
  };

  const handleDeleteItem = (itemId: number) => {
    setItemToDelete(itemId);
    setDeleteItemDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate({ id: itemToDelete, reason: "حذف بند من الفاتورة" });
    }
    setDeleteItemDialogOpen(false);
    setItemToDelete(null);
  };

  const handleAddPayment = () => {
    if (!newPayment.amount) {
      toast.error("يرجى إدخال مبلغ الدفعة");
      return;
    }
    addPaymentMutation.mutate({
      paymentNumber: `PAY-${Date.now()}`,
      invoiceId,
      amount: newPayment.amount,
      paymentMethod: newPayment.paymentMethod,
      notes: newPayment.notes,
    });
  };

  const handleStatusChange = () => {
    if (!newStatus || !statusReason) {
      toast.error("يرجى اختيار الحالة الجديدة وإدخال السبب");
      return;
    }
    updateStatusMutation.mutate({
      id: invoiceId,
      status: newStatus as any,
      reason: statusReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FileText className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-600">الفاتورة غير موجودة</h2>
        <Button onClick={() => setLocation("/finance")}>
          <ArrowRight className="ms-2 h-4 w-4" />
          العودة للفواتير
        </Button>
      </div>
    );
  }

  const currentStatus = statusConfig[invoice.status] || statusConfig.draft;
  const availableTransitions = allowedTransitions[invoice.status] || [];
  
  // حساب المجاميع — إذا لا توجد بنود نستخدم بيانات الفاتورة مباشرة
  const hasItems = items.length > 0;
  const subtotal = hasItems
    ? items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return sum + qty * price;
      }, 0)
    : parseFloat(invoice.subtotal || invoice.amount || "0");
  const totalTax = hasItems
    ? items.reduce((sum, item) => {
        if (item.taxAmount != null && parseFloat(item.taxAmount) !== 0) return sum + parseFloat(item.taxAmount);
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const rate = parseFloat(item.taxRate) || 0;
        return sum + (qty * price * rate / 100);
      }, 0)
    : parseFloat(invoice.vatAmount || "0");
  const totalDiscount = items.reduce((sum, item) => sum + parseFloat(item.discount || "0"), 0);
  const grandTotal = hasItems
    ? items.reduce((sum, item) => {
        if (item.totalAfterTax != null && parseFloat(item.totalAfterTax) !== 0) return sum + parseFloat(item.totalAfterTax);
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const rate = parseFloat(item.taxRate) || 0;
        const disc = parseFloat(item.discount || "0");
        return sum + (qty * price) + (qty * price * rate / 100) - disc;
      }, 0)
    : subtotal + totalTax;
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const remaining = grandTotal - totalPaid;

  const buildInvoiceHTML = () => {
    const logo = import.meta.env.VITE_APP_LOGO || "/logo.svg";
    const appTitle = import.meta.env.VITE_APP_TITLE || "منصة غيث";
    const paymentMethodLabel = (m: string) => {
      if (m === "cash") return "نقدي";
      if (m === "bank_transfer") return "تحويل بنكي";
      if (m === "credit_card") return "بطاقة ائتمان";
      if (m === "check") return "شيك";
      return m || "-";
    };

    const itemsRows = items.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const tax = (item.taxAmount != null && parseFloat(item.taxAmount) !== 0) ? parseFloat(item.taxAmount) : qty * price * (parseFloat(item.taxRate) || 0) / 100;
      const disc = parseFloat(item.discount || "0");
      const total = (item.totalAfterTax != null && parseFloat(item.totalAfterTax) !== 0) ? parseFloat(item.totalAfterTax) : qty * price + tax - disc;
      return `<tr>
        <td>${item.description}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:center">${price.toLocaleString()} ر.س.</td>
        <td style="text-align:center">${tax.toLocaleString()} ر.س.</td>
        <td style="text-align:center; color:red">-${disc.toLocaleString()} ر.س.</td>
        <td style="text-align:center; font-weight:bold">${total.toLocaleString()} ر.س.</td>
      </tr>`;
    }).join("");

    const paymentsRows = payments.map((p: any) => `<tr>
      <td>${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("ar-SA") : "-"}</td>
      <td style="color:green; font-weight:bold">${parseFloat(p.amount).toLocaleString()} ر.س.</td>
      <td>${paymentMethodLabel(p.paymentMethod)}</td>
      <td>${p.reference || "-"}</td>
      <td>${p.notes || "-"}</td>
    </tr>`).join("");

    return `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة ${invoice.invoiceNumber} - ${appTitle}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; direction:rtl; padding:20px; background:white; }
        .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #10b981; padding-bottom:15px; margin-bottom:20px; }
        .logo-section { display:flex; align-items:center; gap:15px; }
        .logo-section img { width:60px; height:60px; object-fit:contain; }
        .logo-section h1 { font-size:24px; color:#10b981; }
        .print-info { text-align:left; font-size:12px; color:#666; }
        .invoice-info { display:flex; justify-content:space-between; margin-bottom:20px; padding:15px; background:#f9f9f9; border-radius:8px; }
        .info-block { }
        .info-block h3 { margin-bottom:8px; color:#333; }
        .info-block p { margin:4px 0; color:#555; }
        .summary-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:15px; margin-bottom:20px; }
        .summary-row { display:flex; justify-content:space-between; padding:4px 0; }
        .summary-row.total { font-weight:bold; border-top:2px solid #10b981; padding-top:8px; margin-top:8px; font-size:1.1em; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th, td { border:1px solid #ddd; padding:10px; text-align:right; }
        th { background-color:#10b981; color:white; font-weight:bold; }
        tr:nth-child(even) { background-color:#f9f9f9; }
        h2.section-title { margin:20px 0 10px; color:#333; font-size:18px; }
        .footer { margin-top:30px; padding-top:15px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:12px; color:#666; }
        @media print { body { padding:0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="${logo}" alt="Logo" onerror="this.style.display='none'" />
          <h1>${appTitle}</h1>
        </div>
        <div class="print-info">
          <div>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</div>
          <div>الوقت: ${new Date().toLocaleTimeString("ar-SA")}</div>
        </div>
      </div>

      <div class="invoice-info">
        <div class="info-block">
          <h3>معلومات الفاتورة</h3>
          <p>رقم الفاتورة: <strong>${invoice.invoiceNumber}</strong></p>
          <p>تاريخ الإصدار: ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("ar-SA") : "-"}</p>
          <p>تاريخ الاستحقاق: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("ar-SA") : "-"}</p>
        </div>
        <div class="info-block">
          <h3>معلومات العميل</h3>
          <p>${invoice.clientName || "غير محدد"}</p>
          ${invoice.notes ? `<p>${invoice.notes}</p>` : ""}
        </div>
        <div class="info-block">
          <h3>الحالة</h3>
          <p>${currentStatus.label}</p>
        </div>
      </div>

      <div class="summary-box">
        <div class="summary-row"><span>المجموع الفرعي:</span><span>${subtotal.toLocaleString()} ر.س.</span></div>
        <div class="summary-row"><span>الضريبة:</span><span>${totalTax.toLocaleString()} ر.س.</span></div>
        <div class="summary-row"><span>الخصم:</span><span style="color:red">-${totalDiscount.toLocaleString()} ر.س.</span></div>
        <div class="summary-row total"><span>الإجمالي:</span><span>${grandTotal.toLocaleString()} ر.س.</span></div>
        <div class="summary-row"><span>المدفوع:</span><span style="color:green">${totalPaid.toLocaleString()} ر.س.</span></div>
        <div class="summary-row" style="font-weight:bold;color:red"><span>المتبقي:</span><span>${remaining.toLocaleString()} ر.س.</span></div>
      </div>

      <h2 class="section-title">بنود الفاتورة</h2>
      <table>
        <thead><tr><th>الوصف</th><th>الكمية</th><th>سعر الوحدة</th><th>الضريبة</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
        <tbody>${itemsRows || '<tr><td colspan="6" style="text-align:center">لا توجد بنود</td></tr>'}</tbody>
      </table>

      ${payments.length > 0 ? `
      <h2 class="section-title">المدفوعات</h2>
      <table>
        <thead><tr><th>التاريخ</th><th>المبلغ</th><th>طريقة الدفع</th><th>رقم المرجع</th><th>ملاحظات</th></tr></thead>
        <tbody>${paymentsRows}</tbody>
      </table>` : ""}

      <div class="footer">
        <div>تم إنشاء هذا التقرير بواسطة ${appTitle}</div>
        <div>جميع الحقوق محفوظة &copy; ${new Date().getFullYear()}</div>
      </div>
    </body>
    </html>`;
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }
    const html = buildInvoiceHTML();
    const printHTML = html.replace("</body>", `<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body>`);
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة لتصدير PDF");
      return;
    }
    const html = buildInvoiceHTML();
    const pdfHTML = html.replace("</body>", `<script>window.onload=function(){window.print();};</script></body>`);
    printWindow.document.write(pdfHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/finance")}>
            <ArrowRight className="ms-2 h-4 w-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">فاتورة {invoice.invoiceNumber}</h1>
            <p className="text-gray-500">تفاصيل الفاتورة وبنودها</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={currentStatus.color}>
            {currentStatus.icon}
            <span className="me-1">{currentStatus.label}</span>
          </Badge>
          {availableTransitions.length > 0 && (
            <Dialog open={showStatusChange} onOpenChange={setShowStatusChange}>
              <DialogTrigger asChild>
                <Button variant="outline">تغيير الحالة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تغيير حالة الفاتورة</DialogTitle>
                  <DialogDescription>
                    اختر الحالة الجديدة وأدخل سبب التغيير
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>الحالة الجديدة</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTransitions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusConfig[status]?.label || status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>سبب التغيير</Label>
                    <Textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="أدخل سبب تغيير الحالة..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStatusChange(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleStatusChange} disabled={updateStatusMutation.isPending}>
                    {updateStatusMutation.isPending ? "جاري التحديث..." : "تأكيد"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => handlePrintInvoice()}>
            <Printer className="ms-2 h-4 w-4" />
            طباعة
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF()}>
            <Download className="ms-2 h-4 w-4" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">معلومات الفاتورة</CardTitle>
              <PrintButton title="معلومات الفاتورة" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الفاتورة:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">تاريخ الإصدار:</span>
              <span>{invoice.createdAt ? formatDate(invoice.createdAt) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">تاريخ الاستحقاق:</span>
              <span>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{invoice.clientName || "غير محدد"}</span>
            </div>
            {(invoice as any).notes && (
              <p className="text-sm text-gray-500">{(invoice as any).notes}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ملخص المبالغ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">المجموع الفرعي:</span>
              <span>{subtotal.toLocaleString()} ر.س.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الضريبة:</span>
              <span>{totalTax.toLocaleString()} ر.س.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الخصم:</span>
              <span className="text-red-600">-{totalDiscount.toLocaleString()} ر.س.</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>الإجمالي:</span>
              <span className="text-primary">{grandTotal.toLocaleString()} ر.س.</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>المدفوع:</span>
              <span>{totalPaid.toLocaleString()} ر.س.</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>المتبقي:</span>
              <span>{remaining.toLocaleString()} ر.س.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>بنود الفاتورة</CardTitle>
            <CardDescription>قائمة المنتجات والخدمات في الفاتورة</CardDescription>
          </div>
          <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ms-2 h-4 w-4" />
                إضافة بند
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة بند جديد</DialogTitle>
                <DialogDescription>أدخل تفاصيل البند المراد إضافته للفاتورة</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>الوصف *</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="وصف المنتج أو الخدمة"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>سعر الوحدة *</Label>
                    <Input
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نسبة الضريبة %</Label>
                    <Input
                      type="number"
                      value={newItem.taxRate}
                      onChange={(e) => setNewItem({ ...newItem, taxRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>الخصم</Label>
                    <Input
                      type="number"
                      value={newItem.discount}
                      onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddItem(false)}>إلغاء</Button>
                <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                  {addItemMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوصف</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-center">سعر الوحدة</TableHead>
                <TableHead className="text-center">الضريبة</TableHead>
                <TableHead className="text-center">الخصم</TableHead>
                <TableHead className="text-center">الإجمالي</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد بنود في هذه الفاتورة
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-center">{parseFloat(item.unitPrice).toLocaleString()} ر.س.</TableCell>
                    <TableCell className="text-center">{((item.taxAmount != null && parseFloat(item.taxAmount) !== 0) ? parseFloat(item.taxAmount) : (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) * (parseFloat(item.taxRate) || 0) / 100).toLocaleString()} ر.س.</TableCell>
                    <TableCell className="text-center text-red-600">-{parseFloat(item.discount || "0").toLocaleString()} ر.س.</TableCell>
                    <TableCell className="text-center font-bold">{((item.totalAfterTax != null && parseFloat(item.totalAfterTax) !== 0) ? parseFloat(item.totalAfterTax) : (() => { const q = parseFloat(item.quantity) || 0; const p = parseFloat(item.unitPrice) || 0; const r = parseFloat(item.taxRate) || 0; const d = parseFloat(item.discount || "0"); return q * p + q * p * r / 100 - d; })()).toLocaleString()} ر.س.</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>المدفوعات</CardTitle>
            <CardDescription>سجل المدفوعات المستلمة لهذه الفاتورة</CardDescription>
          </div>
          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogTrigger asChild>
              <Button>
                <CreditCard className="ms-2 h-4 w-4" />
                تسجيل دفعة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                <DialogDescription>أدخل تفاصيل الدفعة المستلمة</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    value={newPayment.amount?.toLocaleString()}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>طريقة الدفع</Label>
                  <Select
                    value={newPayment.paymentMethod}
                    onValueChange={(v: string) => setNewPayment({ ...newPayment, paymentMethod: v as "bank_transfer" | "check" | "cash" | "credit_card" | "other" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                      <SelectItem value="check">شيك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>رقم المرجع</Label>
                  <Input
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                    placeholder="رقم الحوالة أو الشيك"
                  />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPayment(false)}>إلغاء</Button>
                <Button onClick={handleAddPayment} disabled={addPaymentMutation.isPending}>
                  {addPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>رقم المرجع</TableHead>
                <TableHead>ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد مدفوعات مسجلة لهذه الفاتورة
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {parseFloat(payment.amount).toLocaleString()} ر.س.
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod === "cash" && "نقدي"}
                      {payment.paymentMethod === "bank_transfer" && "تحويل بنكي"}
                      {payment.paymentMethod === "credit_card" && "بطاقة ائتمان"}
                      {payment.paymentMethod === "check" && "شيك"}
                    </TableCell>
                    <TableCell>{(payment as any).reference || "-"}</TableCell>
                    <TableCell className="text-gray-500">{payment.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AlertDialog لتأكيد حذف البند */}
      <AlertDialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا البند؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
