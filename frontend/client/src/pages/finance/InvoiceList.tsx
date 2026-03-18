import React, { useState, useEffect } from "react";
import { useAppContext } from '@/contexts/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreHorizontal,
  Download,
  Filter,
  ArrowRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { financeService, Invoice } from '@/services/financeService';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Eye } from "lucide-react";

// دالة توليد رقم الفاتورة التلقائي
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `INV-${timestamp.slice(-4)}${random}`;
};

type ViewMode = 'list' | 'add';

export default function InvoiceList() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "general_manager" || userRole === "finance_manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [clientName, setClientName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState('draft');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [, setLocation] = useLocation();

  const handleEditOpen = (invoice: Invoice) => {
    setEditItem(invoice);
    setInvoiceNumber(invoice.invoiceNumber);
    setClientName(invoice.clientName || '');
    setTotalAmount(invoice.amount.toString());
    setStatus(invoice.status);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  const queryClient = useQueryClient();

  // جلب الفواتير
  const { data: invoices = [], isLoading, refetch, isError, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => financeService.getInvoices(),
  });

  // إنشاء فاتورة جديدة
  const createInvoiceMutation = useMutation({
    mutationFn: (data: Invoice) => financeService.createInvoice(data),
    onSuccess: () => {
      toast.success('تم إنشاء الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setViewMode('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء الفاتورة: ' + error.message);
    },
  });

  // حذف فاتورة
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteInvoice(id),
    onSuccess: () => {
      toast.success('تم حذف الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error('فشل في حذف الفاتورة: ' + error.message);
    },
  });

  // تحديث فاتورة
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Invoice }) => financeService.updateInvoice(id, data),
    onSuccess: () => {
      toast.success('تم تحديث الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDialogOpen(false);
      setEditItem(null);
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث الفاتورة: ' + error.message);
    },
  });

  const resetForm = () => {
    setInvoiceNumber(generateInvoiceNumber());
    setClientName('');
    setTotalAmount('');
    setStatus('draft');
  };

  const handleSubmit = () => {
    if (!totalAmount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }

    if (editItem) {
      updateInvoiceMutation.mutate({
        id: editItem.id,
        data: {
          ...editItem,
          clientName: clientName || undefined,
          amount: parseFloat(totalAmount),
          status: status,
        }
      });
    } else {
      createInvoiceMutation.mutate({
        invoiceNumber: invoiceNumber,
        clientName: clientName || undefined,
        amount: parseFloat(totalAmount),
        status: status,
        issueDate: new Date().toISOString(),
      });
    }
  };

  // فلترة الفواتير
  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.clientName && inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // حساب الإحصائيات
  const stats = {
    total: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount?.toString() || '0'), 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount?.toString() || '0'), 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + parseFloat(inv.amount?.toString() || '0'), 0),
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-purple-100 text-purple-800',
      pending_approval: 'bg-amber-100 text-amber-800',
      approved: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };

    const labels: Record<string, string> = {
      paid: 'مدفوعة',
      pending: 'معلقة',
      overdue: 'متأخرة',
      draft: 'مسودة',
      sent: 'مرسلة',
      pending_approval: 'بانتظار الموافقة',
      approved: 'معتمدة',
      cancelled: 'ملغاة',
    };

    return <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>{labels[status] || status}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(num || 0);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA');
  };

  // نموذج إنشاء فاتورة جديدة
  if (viewMode === 'add') {
    if (isError) return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
        <p className="text-gray-500 mt-2">{(error as any)?.message}</p>
      </div>
    );

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء فاتورة جديدة</h1>
            <p className="text-muted-foreground">أدخل بيانات الفاتورة</p>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الفاتورة (تلقائي)</Label>
                  <Input
                    value={invoiceNumber}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم العميل</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: شركة التقنية المتقدمة"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المبلغ الإجمالي *</Label>
                  <Input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="مثال: 15000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="sent">مرسلة</SelectItem>
                      <SelectItem value="paid">مدفوعة</SelectItem>
                      <SelectItem value="overdue">متأخرة</SelectItem>
                      <SelectItem value="cancelled">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={createInvoiceMutation.isPending}>
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

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الفواتير</h2>
          <p className="text-muted-foreground">إدارة الفواتير والمدفوعات</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          فاتورة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">إجمالي المستحقات</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(stats.total)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">المدفوعات</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(stats.paid)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">فواتير متأخرة</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(stats.overdue)}</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                className="pe-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              تصفية
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد فواتير</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء فاتورة جديدة
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم الفاتورة</TableHead>
                  <TableHead className="text-end">العميل</TableHead>
                  <TableHead className="text-end">تاريخ الإصدار</TableHead>
                  <TableHead className="text-end">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName || '-'}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setLocation(`/finance/invoice/${invoice.id}`)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleEditOpen(invoice)}>
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => invoice.id && handleDelete(invoice.id)}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dialogOpen && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editItem ? "تعديل فاتورة" : "إضافة فاتورة"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="clientName">اسم العميل</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="اسم العميل..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">المبلغ الإجمالي</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="sent">مرسلة</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                    <SelectItem value="overdue">متأخرة</SelectItem>
                    <SelectItem value="cancelled">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button
                onClick={handleSubmit}
                disabled={updateInvoiceMutation.isPending || createInvoiceMutation.isPending}
              >
                {updateInvoiceMutation.isPending || createInvoiceMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
