import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
/**
 * صفحة مسار Procure-to-Pay
 * 
 * تعرض المسار الكامل من طلب الشراء إلى الدفع:
 * 1. طلب شراء (Purchase Request)
 * 2. اعتماد (Approval)
 * 3. فاتورة مورد (Vendor Invoice)
 * 4. سند صرف (Payment Voucher)
 * 5. قيد يومية (Journal Entry)
 */

import { useState, useMemo } from "react";
import { PrintButton } from "@/components/PrintButton";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, CheckCircle2, FileText, CreditCard, BookOpen, Plus, Upload, Clock, CheckCircle, XCircle, Loader2, ChevronRight, Send, Eye, RefreshCw, Trash2 } from "lucide-react";

// أنواع البيانات
interface P2PStep {
  id: number;
  title: string;
  titleAr: string;
  icon: React.ReactNode;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  description: string;
}

interface PurchaseRequestItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function P2PWorkflow() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState("overview");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  
  // جلب طلبات الشراء من API
  const { data: purchaseOrders, isLoading, refetch, isError, error} = trpc.finance.purchaseOrders?.list?.useQuery({});
  
  // جلب الموردين من API
  const { data: vendors } = trpc.finance.vendors?.list?.useQuery({});
  
  // Mutations
  const createPOMutation = trpc.finance.purchaseOrders?.create?.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء طلب الشراء بنجاح");
      setShowNewRequestDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء الطلب: ${error.message}`);
    },
  });
  
  const submitPOMutation = trpc.finance.purchaseOrders?.submit?.useMutation({
    onSuccess: () => {
      toast.success("تم تقديم الطلب للاعتماد");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل تقديم الطلب: ${error.message}`);
    },
  });
  
  const approvePOMutation = trpc.finance.purchaseOrders?.approve?.useMutation({
    onSuccess: () => {
      toast.success("تم اعتماد الطلب بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل اعتماد الطلب: ${error.message}`);
    },
  });
  
  // نموذج طلب شراء جديد
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    vendorId: "",
    priority: "medium",
    reason: "",
    items: [{ id: 1, description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }] as PurchaseRequestItem[],
  });

  // إعادة تعيين النموذج
  const resetForm = () => {
    setNewRequest({
      title: "",
      description: "",
      vendorId: "",
      priority: "medium",
      reason: "",
      items: [{ id: 1, description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }],
    });
  };

  // خطوات المسار
  const getSteps = (currentStep: number): P2PStep[] => [
    {
      id: 1,
      title: "طلب شراء",
      titleAr: "طلب شراء",
      icon: <ShoppingCart className="h-5 w-5" />,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending',
      description: "إنشاء طلب شراء جديد مع تحديد المواد والكميات والمورد",
    },
    {
      id: 2,
      title: "اعتماد",
      titleAr: "اعتماد",
      icon: <CheckCircle2 className="h-5 w-5" />,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
      description: "مراجعة واعتماد الطلب من المسؤول المختص",
    },
    {
      id: 3,
      title: "فاتورة مورد",
      titleAr: "فاتورة مورد",
      icon: <FileText className="h-5 w-5" />,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'in_progress' : 'pending',
      description: "استلام وتسجيل فاتورة المورد مع إرفاق المستندات",
    },
    {
      id: 4,
      title: "سند صرف",
      titleAr: "سند صرف",
      icon: <CreditCard className="h-5 w-5" />,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'in_progress' : 'pending',
      description: "إنشاء سند صرف للدفع للمورد",
    },
    {
      id: 5,
      title: "قيد يومية",
      titleAr: "قيد يومية",
      icon: <BookOpen className="h-5 w-5" />,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'in_progress' : 'pending',
      description: "ترحيل القيد المحاسبي تلقائياً",
    },
  ];

  // تحويل الحالة إلى رقم الخطوة
  const getStepFromStatus = (status: string): number => {
    switch (status) {
      case 'draft': return 1;
      case 'submitted': return 2;
      case 'approved': return 3;
      case 'invoiced': return 4;
      case 'paid': return 5;
      case 'completed': return 6;
      default: return 1;
    }
  };

  // حساب الإحصائيات
  const stats = useMemo(() => {
    if (!purchaseOrders) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    return {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter((po: any) => po.status === 'submitted').length,
      inProgress: purchaseOrders.filter((po: any) => ['approved', 'invoiced'].includes(po.status)).length,
      completed: purchaseOrders.filter((po: any) => ['paid', 'completed'].includes(po.status)).length,
    };
  }, [purchaseOrders]);

  // حساب إجمالي الطلب
  const calculateTotal = () => {
    return newRequest.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // إضافة صنف جديد
  const addItem = () => {
    setNewRequest({
      ...newRequest,
      items: [
        ...newRequest.items,
        { id: newRequest.items.length + 1, description: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
      ],
    });
  };

  // تحديث صنف
  const updateItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newRequest.items];
    (updatedItems[index] as any)[field] = value;
    
    // حساب الإجمالي تلقائياً
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setNewRequest({ ...newRequest, items: updatedItems });
  };

  // حذف صنف
  const removeItem = (index: number) => {
    if (newRequest.items.length > 1) {
      const updatedItems = newRequest.items.filter((_, i) => i !== index);
      setNewRequest({ ...newRequest, items: updatedItems });
    }
  };

  // إرسال طلب شراء جديد
  const submitPurchaseRequest = () => {
    if (!newRequest.title || !newRequest.reason) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    if (!newRequest.vendorId) {
      toast.error("يرجى اختيار المورد");
      return;
    }
    
    if (newRequest.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error("يرجى ملء بيانات جميع الأصناف بشكل صحيح");
      return;
    }
    
    createPOMutation.mutate({
      vendorId: parseInt(newRequest.vendorId),
      notes: `${newRequest.title}\n${newRequest.description}\nسبب الطلب: ${newRequest.reason}`,
      items: newRequest?.items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved':
      case 'invoiced': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-amber-100 text-amber-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'paid': return 'تم الدفع';
      case 'invoiced': return 'تم الفوترة';
      case 'approved': return 'معتمد';
      case 'submitted': return 'بانتظار الاعتماد';
      case 'rejected': return 'مرفوض';
      case 'draft': return 'مسودة';
      default: return 'معلق';
    }
  };

  // دالة توليد رقم طلب الشراء التلقائي
  const generatePOCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
    return `PO-${timestamp.slice(-4)}${random}`;
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold">مسار المشتريات إلى الدفع</h1>
            <p className="text-muted-foreground">Procure-to-Pay Workflow</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ms-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            {showNewRequestDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
              
              <div>
                <div className="mb-4 border-b pb-3">
                  <h3 className="text-lg font-bold">إنشاء طلب شراء جديد</h3>
                </div>
                
                <div className="space-y-6 py-4">
                  {/* معلومات أساسية */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>عنوان الطلب *</Label>
                      <Input
                        value={newRequest.title}
                        onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                        placeholder="مثال: شراء أجهزة حاسب آلي"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المورد *</Label>
                      <Select
                        value={newRequest.vendorId}
                        onValueChange={(value) => setNewRequest({ ...newRequest, vendorId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المورد" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((vendor: any) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                              {vendor.vendorName || vendor.name}
                            </SelectItem>
                          ))}
                          {(!vendors || vendors.length === 0) && (
                            <>
                              <SelectItem value="1">شركة التقنية المتقدمة</SelectItem>
                              <SelectItem value="2">مؤسسة الوراق</SelectItem>
                              <SelectItem value="3">شركة التبريد الحديثة</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      placeholder="وصف تفصيلي للطلب..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الأولوية</Label>
                      <Select
                        value={newRequest.priority}
                        onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">منخفضة</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="urgent">عاجلة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>سبب الطلب *</Label>
                      <Input
                        value={newRequest.reason}
                        onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                        placeholder="سبب الحاجة لهذا الشراء"
                      />
                    </div>
                  </div>

                  {/* الأصناف */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">الأصناف المطلوبة</Label>
                      <Button variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 ms-1" />
                        إضافة صنف
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                        <div className="col-span-5">الوصف</div>
                        <div className="col-span-2">الكمية</div>
                        <div className="col-span-2">سعر الوحدة</div>
                        <div className="col-span-2">الإجمالي</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      {newRequest?.items?.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="وصف الصنف"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              min={1}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min={0}
                            />
                          </div>
                          <div className="col-span-2 text-sm">
                            {item.totalPrice.toLocaleString()} ر.س
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={newRequest.items.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-lg font-semibold">
                        الإجمالي: {calculateTotal().toLocaleString()} ر.س
                      </div>
                    </div>
                  </div>

                  {/* المرفقات */}
                  <div className="space-y-2">
                    <Label>المرفقات (Evidence)</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        اسحب الملفات هنا أو انقر للتحميل
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => toast.info('اسحب الملفات هنا أو اضغط للاختيار')}>
                        اختر ملف
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                  <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={submitPurchaseRequest} disabled={createPOMutation.isPending}>
                    {createPOMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ms-2" />
                        إرسال الطلب
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>)}
          </div>
        </div>

        {/* خطوات المسار */}
        <Card className="bg-gradient-to-l from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>خطوات المسار</CardTitle>
              <PrintButton title="خطوات المسار" />
            <CardDescription>المسار الكامل من طلب الشراء إلى الدفع والترحيل المحاسبي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getSteps(1).map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'in_progress' ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {step.icon}
                    </div>
                    <span className="text-xs mt-2 text-center max-w-[80px]">{step.titleAr}</span>
                    <span className="text-[10px] text-muted-foreground">{step.title}</span>
                  </div>
                  {index < getSteps(1).length - 1 && (
                    <div className="w-12 h-0.5 bg-muted mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="active">المسارات النشطة</TabsTrigger>
            <TabsTrigger value="pending">بانتظار الاعتماد</TabsTrigger>
            <TabsTrigger value="completed">المكتملة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* إحصائيات */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">طلبات جديدة</p>
                      <h3 className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">بانتظار الاعتماد</p>
                      <h3 className="text-lg md:text-2xl font-bold">{stats.pending}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                      <h3 className="text-lg md:text-2xl font-bold">{stats.inProgress}</h3>
                    </div>
                    <Loader2 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">مكتملة هذا الشهر</p>
                      <h3 className="text-lg md:text-2xl font-bold">{stats.completed}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* آخر النشاطات */}
            <Card>
              <CardHeader>
                <CardTitle>آخر النشاطات</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : purchaseOrders && purchaseOrders.length > 0 ? (
                  <div className="space-y-4">
                    {purchaseOrders.slice(0, 5).map((po: any) => (
                      <div
                        key={po.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedPOId(po.id);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{po.notes?.split('\n')[0] || `طلب شراء #${po.id}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              PO-{po.id.toString().padStart(4, '0')} • {po.vendorName || 'مورد غير محدد'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(po.status)}>
                            {getStatusText(po.status)}
                          </Badge>
                          <div className="text-start">
                            <p className="font-medium">{(po.totalAmount || 0).toLocaleString()} ر.س</p>
                            <p className="text-xs text-muted-foreground">
                              الخطوة {getStepFromStatus(po.status)} من 5
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات شراء حتى الآن</p>
                    <Button className="mt-4" onClick={() => setShowNewRequestDialog(true)}>
                      <Plus className="h-4 w-4 ms-2" />
                      إنشاء طلب جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>المسارات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
<Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الخطوة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders?.filter((po: any) => !['completed', 'paid', 'rejected'].includes(po.status)).map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">PO-{po.id.toString().padStart(4, '0')}</TableCell>
                          <TableCell>{po.notes?.split('\n')[0] || `طلب شراء #${po.id}`}</TableCell>
                          <TableCell>{po.vendorName || 'غير محدد'}</TableCell>
                          <TableCell>{(po.totalAmount || 0).toLocaleString()} ر.س</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(po.status)}>
                              {getStatusText(po.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStepFromStatus(po.status)} من 5</TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {po.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={() => submitPOMutation.mutate({ id: po.id })}
                                  disabled={submitPOMutation.isPending}
                                >
                                  تقديم
                                </Button>
                              )}
                              {po.status === 'submitted' && (
                                <Button
                                  size="sm"
                                  onClick={() => approvePOMutation.mutate({ id: po.id })}
                                  disabled={approvePOMutation.isPending}
                                >
                                  اعتماد
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>بانتظار الاعتماد</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders?.filter((po: any) => po.status === 'submitted').map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">PO-{po.id.toString().padStart(4, '0')}</TableCell>
                          <TableCell>{po.notes?.split('\n')[0] || `طلب شراء #${po.id}`}</TableCell>
                          <TableCell>{po.vendorName || 'غير محدد'}</TableCell>
                          <TableCell>{(po.totalAmount || 0).toLocaleString()} ر.س</TableCell>
                          <TableCell>{formatDate(po.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                onClick={() => approvePOMutation.mutate({ id: po.id })}
                                disabled={approvePOMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 ms-1" />
                                اعتماد
                              </Button>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4 ms-1" />
                                رفض
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {purchaseOrders?.filter((po: any) => po.status === 'submitted').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا توجد طلبات بانتظار الاعتماد
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات المكتملة</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>تاريخ الإكمال</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders?.filter((po: any) => ['completed', 'paid'].includes(po.status)).map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-medium">PO-{po.id.toString().padStart(4, '0')}</TableCell>
                          <TableCell>{po.notes?.split('\n')[0] || `طلب شراء #${po.id}`}</TableCell>
                          <TableCell>{po.vendorName || 'غير محدد'}</TableCell>
                          <TableCell>{(po.totalAmount || 0).toLocaleString()} ر.س</TableCell>
                          <TableCell>{formatDate(po.updatedAt || po.createdAt)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => toast.info("عرض تفاصيل الطلب")}>
                              <Eye className="h-4 w-4 ms-1" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {purchaseOrders?.filter((po: any) => ['completed', 'paid'].includes(po.status)).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا توجد طلبات مكتملة
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
