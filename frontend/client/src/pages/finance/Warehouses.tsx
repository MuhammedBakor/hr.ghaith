import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
  Warehouse,
  Plus,
  Search,
  Package,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { Dialog } from "@/components/ui/dialog";


// دالة توليد رمز المستودع التلقائي
const generateWarehouseCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `WH-${timestamp.slice(-4)}${random}`;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  inactive: { label: "غير نشط", color: "bg-gray-100 text-gray-700" },
  maintenance: { label: "صيانة", color: "bg-amber-100 text-amber-700" },
};

type ViewMode = 'list' | 'add' | 'inventory' | 'movement';

export default function Warehouses() {
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
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Form state
  const [code, setCode] = useState(generateWarehouseCode());
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [capacity, setCapacity] = useState<number | undefined>();
  const [notes, setNotes] = useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // Movement form
  const [movementProductId, setMovementProductId] = useState<number | null>(null);
  const [movementQuantity, setMovementQuantity] = useState(0);
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in");
  const [movementReason, setMovementReason] = useState("");

  const { data: warehouses, isLoading, refetch, isError, error } = trpc.finance.warehouses?.list?.useQuery();
  const { data: products } = trpc.store.products?.list?.useQuery();
  const { data: warehouseInventory, refetch: refetchInventory } = trpc.finance.warehouses?.inventory?.useQuery(
    { warehouseId: selectedWarehouse?.id || 0 },
    { enabled: !!selectedWarehouse }
  );

  const createMutation = trpc.finance.warehouses?.create?.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستودع بنجاح");
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const updateInventoryMutation = trpc.finance.warehouses?.updateInventory?.useMutation({
    onSuccess: (result) => {
      toast.success(`تم تحديث المخزون. الكمية الجديدة: ${result.newQuantity}`);
      setViewMode('list');
      resetMovementForm();
      refetchInventory();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCode(generateWarehouseCode());
    setName("");
    setLocation("");
    setCity("");
    setCapacity(undefined);
    setNotes("");
  };

  const resetMovementForm = () => {
    setMovementProductId(null);
    setMovementQuantity(0);
    setMovementType("in");
    setMovementReason("");
  };

  const handleCreate = () => {
    if (!name) {
      toast.error("يرجى إدخال اسم المستودع");
      return;
    }

    createMutation.mutate({
      code,
      name,
      location,
      city,
      capacity,
      notes,
    });
  };

  const handleMovement = () => {
    if (!selectedWarehouse || !movementProductId || movementQuantity <= 0) {
      toast.error("يرجى إكمال جميع البيانات");
      return;
    }

    updateInventoryMutation.mutate({
      warehouseId: selectedWarehouse.id,
      productId: movementProductId,
      quantity: movementQuantity,
      movementType,
      reason: movementReason,
    });
  };

  const filteredWarehouses = warehouses?.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // نموذج إنشاء مستودع جديد
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
            <h1 className="text-2xl font-bold">إنشاء مستودع جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات المستودع</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              بيانات المستودع
            </CardTitle>
            <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رمز المستودع (تلقائي)</Label>
                  <Input
                    value={code}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم المستودع *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="المستودع الرئيسي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الموقع</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="المنطقة الصناعية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="الرياض"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>السعة (وحدات)</Label>
                <Input
                  type="number"
                  value={capacity || ""}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || undefined)}
                  placeholder="أدخل..."
                />
              </div>

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
                    إنشاء المستودع
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض مخزون المستودع
  if (viewMode === 'inventory' && selectedWarehouse) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedWarehouse(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">مخزون {selectedWarehouse.name}</h1>
            <p className="text-muted-foreground">عرض المخزون المتاح في المستودع</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              قائمة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">المنتج</TableHead>
                  <TableHead className="text-end">الكمية المتاحة</TableHead>
                  <TableHead className="text-end">الكمية المحجوزة</TableHead>
                  <TableHead className="text-end">الحد الأدنى</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseInventory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">لا يوجد مخزون في هذا المستودع</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouseInventory?.map((item: any) => (
                    <TableRow key={item.inventory.id}>
                      <TableCell className="font-medium">{item.product?.name || "-"}</TableCell>
                      <TableCell>{parseFloat(item.inventory.availableQuantity).toLocaleString('ar-SA')}</TableCell>
                      <TableCell>{parseFloat(item.inventory.reservedQuantity).toLocaleString('ar-SA')}</TableCell>
                      <TableCell>{parseFloat(item.inventory.minQuantity).toLocaleString('ar-SA')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نموذج حركة المخزون
  if (viewMode === 'movement' && selectedWarehouse) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedWarehouse(null); resetMovementForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">حركة مخزون - {selectedWarehouse.name}</h1>
            <p className="text-muted-foreground">تسجيل حركة إدخال أو إخراج للمخزون</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              بيانات الحركة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>المنتج *</Label>
                <Select value={movementProductId?.toString() || ""} onValueChange={(v) => setMovementProductId(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع الحركة *</Label>
                <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-green-600" />
                        إدخال
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-red-600" />
                        إخراج
                      </div>
                    </SelectItem>
                    <SelectItem value="adjustment">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-blue-600" />
                        تسوية
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input
                  type="number"
                  min="1"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>السبب</Label>
                <Textarea
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="سبب الحركة..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); setSelectedWarehouse(null); resetMovementForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleMovement} disabled={updateInventoryMutation.isPending}>
                {updateInventoryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري التنفيذ...
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="h-4 w-4 ms-2" />
                    تنفيذ الحركة
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
          <h2 className="text-2xl font-bold tracking-tight">المستودعات</h2>
          <p className="text-muted-foreground">إدارة المستودعات والمخزون</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          مستودع جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي المستودعات</p>
              <h3 className="text-2xl font-bold mt-1">{warehouses?.length || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <Warehouse className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">مستودعات نشطة</p>
              <h3 className="text-2xl font-bold mt-1">
                {warehouses?.filter(w => w.status === "active").length || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-green-50">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي السعة</p>
              <h3 className="text-2xl font-bold mt-1">
                {warehouses?.reduce((sum, w) => sum + (w.capacity || 0), 0).toLocaleString('ar-SA')}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <ArrowUpDown className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستودعات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="text-center py-8">
              <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد مستودعات</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء مستودع جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الرمز</TableHead>
                  <TableHead className="text-end">الاسم</TableHead>
                  <TableHead className="text-end">الموقع</TableHead>
                  <TableHead className="text-end">السعة</TableHead>
                  <TableHead className="text-end">الإشغال</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses?.map((warehouse) => {
                  const status = statusConfig[warehouse.status] || statusConfig.active;
                  const occupancyPercent = warehouse.capacity
                    ? ((warehouse.currentOccupancy || 0) / warehouse.capacity) * 100
                    : 0;
                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-mono">{warehouse.code}</TableCell>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {warehouse.city || warehouse.location || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.capacity?.toLocaleString('ar-SA') || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${occupancyPercent > 80 ? 'bg-red-500' : occupancyPercent > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{occupancyPercent.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWarehouse(warehouse);
                              setViewMode('inventory');
                            }}
                          >
                            <Package className="h-4 w-4 ms-1" />
                            المخزون
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWarehouse(warehouse);
                              setViewMode('movement');
                            }}
                          >
                            <ArrowUpDown className="h-4 w-4 ms-1" />
                            حركة
                          </Button>
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
