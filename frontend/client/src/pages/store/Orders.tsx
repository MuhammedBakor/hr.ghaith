import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { toast } from "sonner";

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  items: number;
  total: string;
  paymentMethod: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
}

export default function Orders() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({ mutationFn: (data: any) => api.post('/store/orders', data).then(r => r.data), onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const [editingItem, setEditingItem] = useState<any>(null);

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/store/orders/${data.id}`).then(r => r.data), onSuccess: () => { refetch(); } });

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // جلب الطلبات من API
  const { data: ordersApiData, isLoading, refetch } = useQuery({ queryKey: ['store', 'orders'], queryFn: () => api.get('/store/orders').then(r => r.data) });

  // تحويل البيانات من API
  const ordersData: Order[] = useMemo(() => {
    if (!ordersApiData || ordersApiData.length === 0) {
      return [];
    }
    return ordersApiData.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || `ORD-${o.id}`,
      customer: o.customerName || 'عميل غير محدد',
      items: o.itemsCount || 0,
      total: o.total ? `${o.total.toLocaleString()} ر.س` : '0 ر.س',
      paymentMethod: o.paymentMethod || 'غير محدد',
      orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
      deliveryDate: o.deliveryDate ? new Date(o.deliveryDate).toISOString().split('T')[0] : '',
      status: o.status || 'pending',
    }));
  }, [ordersApiData]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const total = ordersData.length;
    const pending = ordersData.filter(o => o.status === 'pending').length;
    const processing = ordersData.filter(o => o.status === 'processing' || o.status === 'shipped').length;
    const delivered = ordersData.filter(o => o.status === 'delivered').length;
    return { total, pending, processing, delivered };
  }, [ordersData]);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      { accessorKey: "orderNumber", header: "رقم الطلب" },
      { accessorKey: "customer", header: "العميل" },
      { accessorKey: "items", header: "المنتجات" },
      { accessorKey: "total", header: "الإجمالي" },
      { accessorKey: "paymentMethod", header: "طريقة الدفع" },
      { accessorKey: "orderDate", header: "تاريخ الطلب" },
      { accessorKey: "deliveryDate", header: "تاريخ التسليم" },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses: Record<string, { label: string; color: string; icon: any }> = {
            pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
            processing: { label: "قيد التجهيز", color: "bg-blue-100 text-blue-800", icon: ShoppingBag },
            shipped: { label: "تم الشحن", color: "bg-purple-100 text-purple-800", icon: Truck },
            delivered: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: CheckCircle },
            cancelled: { label: "ملغي", color: "bg-red-100 text-red-800", icon: Clock },
            refunded: { label: "مسترجع", color: "bg-gray-100 text-gray-800", icon: Clock },
          };
          const status = statuses[row.original.status] || statuses.pending;
          const Icon = status.icon;
          
  if (isError) return (
    <div className="p-8 text-center">
        {/* إضافة جديد */}
        <div className="mb-4 flex justify-between items-center">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showCreateForm ? 'إلغاء' : '+ إضافة جديد'}
          </button>
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="الاسم" value={createData.name || ''} onChange={e => setCreateData({...createData, name: e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input placeholder="الوصف" value={createData.description || ''} onChange={e => setCreateData({...createData, description: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => createMutation.mutate(createData)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ</button>
          
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(o)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: o.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
        )}
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
            <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
              <Icon className="h-3 w-3" />
              {status.label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(row.original); setShowOrderDetails(true); }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { window.print(); toast.success(`جاري طباعة الطلب ${row.original.orderNumber}`); }}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: ordersData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExport = () => {
    if (ordersData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['رقم الطلب', 'العميل', 'المنتجات', 'الإجمالي', 'طريقة الدفع', 'تاريخ الطلب', 'تاريخ التسليم', 'الحالة'];
    const csvData = ordersData.map(o => [o.orderNumber, o.customer, o.items, o.total, o.paymentMethod, o.orderDate, o.deliveryDate, o.status]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل الطلبات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الطلبات</h2>
          <p className="text-muted-foreground">متابعة وإدارة طلبات المتجر</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 ms-2" />
            تصدير
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الشحن</p>
                <h3 className="text-2xl font-bold">{stats.processing}</h3>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم التسليم</p>
                <h3 className="text-2xl font-bold">{stats.delivered}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>سجل الطلبات</CardTitle>
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
          {ordersData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="h-12 px-4 text-end align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"
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
                        <td key={cell.id} className="p-4 align-middle">
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

      {/* نافذة عرض تفاصيل الطلب */}
      {showOrderDetails && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <ShoppingBag className="h-5 w-5" />
              تفاصيل الطلب
            </h3>
          </div>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">رقم الطلب</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">العميل</p>
                  <p className="font-medium">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">عدد المنتجات</p>
                  <p className="font-medium">{selectedOrder.items}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الإجمالي</p>
                  <p className="font-medium">{selectedOrder.total?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">طريقة الدفع</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاريخ الطلب</p>
                  <p className="font-medium">{selectedOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاريخ التسليم</p>
                  <p className="font-medium">{selectedOrder.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <Badge className={selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {selectedOrder.status === 'pending' ? 'قيد الانتظار' : selectedOrder.status === 'processing' ? 'قيد المعالجة' : selectedOrder.status === 'shipped' ? 'تم الشحن' : selectedOrder.status === 'delivered' ? 'تم التسليم' : selectedOrder.status === 'cancelled' ? 'ملغي' : 'مسترجع'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              إغلاق
            </Button>
            <Button onClick={() => { window.print(); toast.success('جاري الطباعة...'); }}>
              <Printer className="h-4 w-4 ms-2" />
              طباعة
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
