import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Edit,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PrintButton } from "@/components/PrintButton";
import { Dialog } from "@/components/ui/dialog";


// دالة توليد رقم المورد التلقائي
const generateVendorCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `VND-${timestamp.slice(-4)}${random}`;
};

// تنسيق المبالغ
function formatAmount(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

type ViewMode = 'list' | 'add' | 'details' | 'edit';

export default function Vendors() {
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
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Form state
  const [vendorCode, setVendorCode] = useState(generateVendorCode());
  const [vendorName, setVendorName] = useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // جلب قائمة الموردين
  const { data: vendors, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['finance', 'vendors', searchTerm],
    queryFn: () => api.get('/finance/vendors', { params: { search: searchTerm || undefined } }).then(r => r.data),
  });

  // إنشاء مورد جديد
  const createVendorMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/vendors', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إضافة المورد بنجاح");
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إضافة المورد: ${error?.response?.data?.message || error.message}`);
    },
  });

  // تحديث مورد
  const updateVendorMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/vendors/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تحديث بيانات المورد بنجاح");
      setViewMode('list');
      setSelectedVendor(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث المورد: ${error?.response?.data?.message || error.message}`);
    },
  });

  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor);
    setVendorName(vendor.vendorName || '');
    setViewMode('edit' as ViewMode);
  };

  const resetForm = () => {
    setVendorCode(generateVendorCode());
    setVendorName("");
  };

  // حساب الإحصائيات
  const stats = {
    totalVendors: vendors?.length || 0,
    totalDue: vendors?.reduce((sum: number, v: any) => sum + Number(v.totalDue || 0), 0) || 0,
    totalPaid: vendors?.reduce((sum: number, v: any) => sum + Number(v.totalPaid || 0), 0) || 0,
    totalBalance: vendors?.reduce((sum: number, v: any) => sum + Number(v.balance || 0), 0) || 0,
  };

  // تصفية الموردين
  const filteredVendors = vendors?.filter((vendor: any) => {
    if (!searchTerm) return true;
    return vendor.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleCreateVendor = () => {
    if (!vendorName.trim()) {
      toast.error("يرجى إدخال اسم المورد");
      return;
    }
    createVendorMutation.mutate({ vendorName });
  };

  // نموذج إضافة مورد جديد
  if (viewMode === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إضافة مورد جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات المورد الجديد</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              بيانات المورد
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم المورد (تلقائي)</Label>
                  <Input
                    value={vendorCode}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم المورد *</Label>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="أدخل اسم المورد"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateVendor} disabled={createVendorMutation.isPending}>
                {createVendorMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إضافة المورد
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نموذج تعديل المورد
  if (viewMode === 'edit' && selectedVendor) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedVendor(null); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل بيانات المورد</h1>
            <p className="text-muted-foreground">{selectedVendor.vendorName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              بيانات المورد
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم المورد</Label>
                  <Input
                    value={`#${selectedVendor.id}`}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم المورد *</Label>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="أدخل اسم المورد"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedVendor(null); resetForm(); }}>
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (!vendorName.trim()) {
                    toast.error("يرجى إدخال اسم المورد");
                    return;
                  }
                  updateVendorMutation.mutate({ id: selectedVendor.id, vendorName });
                }}
                disabled={updateVendorMutation.isPending}
              >
                {updateVendorMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 ms-2" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل المورد
  if (viewMode === 'details' && selectedVendor) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedVendor(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل المورد</h1>
            <p className="text-muted-foreground">{selectedVendor.vendorName}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  المعلومات الأساسية
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">اسم المورد</p>
                    <p className="font-medium">{selectedVendor.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم المورد</p>
                    <p className="font-mono">#{selectedVendor.id}</p>
                  </div>
                </div>
              </div>

              {/* الذمم المالية */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  الذمم المالية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المستحق</p>
                    <p className="font-mono text-lg text-amber-600">{formatAmount(selectedVendor.totalDue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                    <p className="font-mono text-lg text-green-600">{formatAmount(selectedVendor.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد</p>
                    <p className={`font-mono text-lg font-semibold ${Number(selectedVendor.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatAmount(selectedVendor.balance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedVendor(null); }}>
                  إغلاق
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ملف الموردين</h2>
          <p className="text-muted-foreground">إدارة الموردين وذممهم المالية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={() => setViewMode('add')}>
            <Plus className="h-4 w-4 ms-2" />
            إضافة مورد
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموردين</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVendors}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المستحق</p>
                <p className="text-2xl font-bold text-amber-600">{formatAmount(stats.totalDue)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalPaid)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                <p className={`text-2xl font-bold ${stats.totalBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatAmount(stats.totalBalance)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stats.totalBalance >= 0 ? "bg-red-50" : "bg-green-50"}`}>
                <DollarSign className={`h-6 w-6 ${stats.totalBalance >= 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن مورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول الموردين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            قائمة الموردين
          </CardTitle>
          <CardDescription>
            جميع الموردين المسجلين في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-muted-foreground">لا يوجد موردين</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إضافة مورد جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">#</TableHead>
                  <TableHead className="text-end">اسم المورد</TableHead>
                  <TableHead className="text-end">إجمالي المستحق</TableHead>
                  <TableHead className="text-end">إجمالي المدفوع</TableHead>
                  <TableHead className="text-end">الرصيد</TableHead>
                  <TableHead className="text-end">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors?.map((vendor: any, index: number) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{vendor.vendorName}</p>
                          <p className="text-xs text-muted-foreground">#{vendor.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-amber-600">
                      {formatAmount(vendor.totalDue)}
                    </TableCell>
                    <TableCell className="font-mono text-green-600">
                      {formatAmount(vendor.totalPaid)}
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono font-semibold ${Number(vendor.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatAmount(vendor.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendor.createdAt ? format(new Date(vendor.createdAt), "dd/MM/yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setViewMode('details');
                          }}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
