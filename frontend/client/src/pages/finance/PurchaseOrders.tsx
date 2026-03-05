import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  Package,
  Trash2,
  Send,
  Check,
  Truck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { Dialog } from "@/components/ui/dialog";


// دالة توليد رقم طلب الشراء التلقائي
const generatePONumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `PO-${timestamp}-${random}`;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  draft: { label: "مسودة", color: "bg-gray-100 text-gray-700", icon: FileText },
  submitted: { label: "مقدم", color: "bg-blue-100 text-blue-700", icon: Send },
  approved: { label: "معتمد", color: "bg-green-100 text-green-700", icon: CheckCircle },
  partially_received: { label: "مستلم جزئياً", color: "bg-amber-100 text-amber-700", icon: Package },
  received: { label: "مستلم", color: "bg-emerald-100 text-emerald-700", icon: Truck },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: Trash2 },
};

type ViewMode = 'list' | 'add';

export default function PurchaseOrders() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Form state
  const [poNumber, setPONumber] = useState(generatePONumber());
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }>>([{ description: "", quantity: 1, unitPrice: 0, unit: "وحدة" }]);
  
  const { data: purchaseOrders, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['finance', 'purchase-orders', statusFilter],
    queryFn: () => api.get('/finance/purchase-orders', {
      params: statusFilter !== "all" ? { status: statusFilter } : undefined,
    }).then(r => r.data),
  });
  const { data: vendors } = useQuery({
    queryKey: ['finance', 'vendors'],
    queryFn: () => api.get('/finance/vendors').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/purchase-orders', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء طلب الشراء بنجاح");
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error?.response?.data?.message || error.message}`);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/purchase-orders/${data.id}/submit`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تقديم طلب الشراء للاعتماد");
      refetch();
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/purchase-orders/${data.id}/approve`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم اعتماد طلب الشراء");
      refetch();
    },
  });
  
  const resetForm = () => {
    setPONumber(generatePONumber());
    setVendorId(null);
    setNotes("");
    setItems([{ description: "", quantity: 1, unitPrice: 0, unit: "وحدة" }]);
  };
  
  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, unit: "وحدة" }]);
  };
  
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };
  
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const tax = lineTotal * 0.15;
      return sum + lineTotal + tax;
    }, 0);
  };
  
  const handleCreate = () => {
    if (!vendorId) {
      toast.error("يرجى اختيار المورد");
      return;
    }
    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error("يرجى إكمال بيانات جميع البنود");
      return;
    }
    
    createMutation.mutate({
      vendorId,
      notes,
      items: items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit,
      })),
    });
  };
  
  const filteredOrders = purchaseOrders?.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];
  
  // Stats
  const stats = {
    total: purchaseOrders?.length || 0,
    draft: purchaseOrders?.filter(po => po.status === "draft").length || 0,
    pending: purchaseOrders?.filter(po => po.status === "submitted").length || 0,
    approved: purchaseOrders?.filter(po => po.status === "approved" || po.status === "partially_received" || po.status === "received").length || 0,
  };

  // نموذج إنشاء طلب شراء جديد
  if (viewMode === 'add') {
    
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء طلب شراء جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات طلب الشراء</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              بيانات طلب الشراء
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* معلومات الطلب */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الطلب (تلقائي)</Label>
                  <Input
                    value={poNumber}
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>المورد *</Label>
                  <Select value={vendorId?.toString() || ""} onValueChange={(v) => setVendorId(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.vendorName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">البنود</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 ms-1" />
                    إضافة بند
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-end">الوصف</TableHead>
                        <TableHead className="w-24 text-end">الكمية</TableHead>
                        <TableHead className="w-24 text-end">الوحدة</TableHead>
                        <TableHead className="w-32 text-end">السعر</TableHead>
                        <TableHead className="w-32 text-end">الإجمالي</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items?.map((item, index) => (
                        <TableRow key={item.id ?? `TableRow-${index}`}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              placeholder="وصف البند"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(index, "unit", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {((item.quantity * item.unitPrice) * 1.15).toLocaleString('ar-SA')} ر.س
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <div className="bg-muted/50 px-4 py-2 rounded-lg">
                    <span className="text-muted-foreground">الإجمالي (شامل الضريبة): </span>
                    <span className="font-bold text-lg">{calculateTotal().toLocaleString('ar-SA')} ر.س</span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
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

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">طلبات الشراء</h2>
          <p className="text-muted-foreground">إدارة طلبات الشراء ودورة الاعتماد</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          طلب شراء جديد
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.total?.toLocaleString()}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">مسودات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.draft}</h3>
            </div>
            <div className="p-3 rounded-xl bg-gray-50">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">بانتظار الاعتماد</p>
              <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">معتمدة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.approved}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الطلب أو اسم المورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="submitted">مقدم</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="partially_received">مستلم جزئياً</SelectItem>
                <SelectItem value="received">مستلم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات الشراء</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم الطلب</TableHead>
                  <TableHead className="text-end">المورد</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الإجمالي</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">لا توجد طلبات شراء</p>
                      <Button variant="link" onClick={() => setViewMode('add')}>
                        إنشاء طلب شراء جديد
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((po) => {
                    const status = statusConfig[po.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.poNumber}</TableCell>
                        <TableCell>{po.vendorName || "-"}</TableCell>
                        <TableCell>
                          {formatDate(po.orderDate)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {parseFloat(po.totalAmount).toLocaleString('ar-SA')} ر.س
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {po.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => submitMutation.mutate({ id: po.id })}
                                disabled={submitMutation.isPending}
                              >
                                <Send className="h-4 w-4 ms-1" />
                                تقديم
                              </Button>
                            )}
                            {po.status === "submitted" && (
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate({ id: po.id })}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4 ms-1" />
                                اعتماد
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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
