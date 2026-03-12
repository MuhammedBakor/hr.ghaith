import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ShoppingCart,
  ShoppingBag,
  Star,
  Filter,
  Package,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Truck,
  DollarSign, Eye, Edit, Trash2, Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useStoreProducts, useCreateStoreProduct, useDeleteStoreProduct, useStoreOrders } from "@/services/storeService";


export default function Store() {
  const { user: currentUser, error: authError } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    minStockLevel: '',
  });

  const { data: products = [], isLoading, refetch } = useStoreProducts();
  const { data: orders = [] } = useStoreOrders();

  const createMutation = useCreateStoreProduct();

  const deleteMutation = useDeleteStoreProduct();

  const handleCreate = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createMutation.mutate({
      name: newProduct.name,
      sku: newProduct.sku,
      description: newProduct.description || undefined,
      category: newProduct.category || undefined,
      price: parseFloat(newProduct.price),
      stockQuantity: newProduct.stockQuantity ? parseInt(newProduct.stockQuantity) : 0,
    }, {
      onSuccess: () => {
        toast.success('تم إضافة المنتج بنجاح');
        setIsCreateOpen(false);
        setNewProduct({
          name: '',
          sku: '',
          description: '',
          category: '',
          price: '',
          costPrice: '',
          stockQuantity: '',
          minStockLevel: '',
        });
        refetch();
      },
      onError: (error: any) => {
        toast.error('حدث خطأ: ' + (error.message || 'فشل الحفظ'));
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('تم حذف المنتج بنجاح');
          refetch();
        },
        onError: (error: any) => {
          toast.error('حدث خطأ: ' + (error.message || 'فشل الحذف'));
        }
      });
    }
  };

  const confirmDeleteAction = () => {
    if (itemToDelete) {
      const id = typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete;
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('تم حذف المنتج بنجاح');
          refetch();
        },
        onError: (error: any) => {
          toast.error('حدث خطأ: ' + (error.message || 'فشل الحذف'));
        }
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "sku", header: "رمز المنتج" },
      { accessorKey: "name", header: "اسم المنتج" },
      { accessorKey: "category", header: "التصنيف", cell: ({ row }) => row.original.category || '-' },
      {
        accessorKey: "price",
        header: "السعر",
        cell: ({ row }) => `${parseFloat(row.original.price || '0').toLocaleString()} ر.س`
      },
      {
        accessorKey: "stockQuantity",
        header: "المخزون",
        cell: ({ row }) => (
          <span className={row.original.stockQuantity === 0 ? "text-red-600 font-bold" : row.original.stockQuantity < 10 ? "text-amber-600" : ""}>
            {row.original.stockQuantity || 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses: Record<string, { label: string; color: string }> = {
            active: { label: "نشط", color: "bg-green-100 text-green-800" },
            inactive: { label: "غير نشط", color: "bg-gray-100 text-gray-800" },
            out_of_stock: { label: "نفذ المخزون", color: "bg-red-100 text-red-800" },
            discontinued: { label: "متوقف", color: "bg-orange-100 text-orange-800" },
          };
          const status = statuses[row.original.status] || statuses.active;
          return <Badge className={status.color}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" onClick={() => toast.info("تعديل")}><Edit className="h-4 w-4" /></Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalProducts = products.length;
  const todayOrders = orders.filter((o: any) => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  }).length;
  const totalSales = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || '0'), 0);
  const outOfStock = products.filter((p: any) => p.stockQuantity === 0).length;

  const stats = [
    { label: "إجمالي المنتجات", value: totalProducts.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "الطلبات اليوم", value: todayOrders.toString(), icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50" },
    { label: "المبيعات الإجمالية", value: `${(totalSales / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "نفذ المخزون", value: outOfStock.toString(), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isLoading) {
    if (authError) return <div className="p-8 text-center text-red-500">حدث خطأ في المصادقة</div>;


    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">المتجر الإلكتروني</h2>
          <p className="text-muted-foreground">إدارة المنتجات والمخزون والطلبات</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 ms-2" />
          منتج جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={`Stat-${index}`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المنتجات</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pe-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ms-2" />
                تصفية
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد منتجات حالياً</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                إضافة أول منتج
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="h-12 px-4 text-end align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && " ↑"}
                            {header.column.getIsSorted() === "desc" && " ↓"}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Package className="h-5 w-5" />
              إضافة منتج جديد
            </h3>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المنتج *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="مثال: جهاز كمبيوتر محمول"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">رمز المنتج (SKU) *</Label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="PRD-001"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="وصف المنتج..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">التصنيف</Label>
              <Input
                id="category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="مثال: إلكترونيات"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">سعر البيع (ر.س) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price?.toLocaleString()}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costPrice">سعر التكلفة (ر.س)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                  placeholder="800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">الكمية المتوفرة</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={newProduct.stockQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStockLevel">الحد الأدنى للمخزون</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={newProduct.minStockLevel}
                  onChange={(e) => setNewProduct({ ...newProduct, minStockLevel: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </div>
        </div>
      </div>)}

      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAction} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}