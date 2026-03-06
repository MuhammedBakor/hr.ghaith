import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { FileText, Search, Filter, Download, Eye, Edit, Trash2, Calendar, AlertTriangle, Loader2, RefreshCw, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { toast } from "sonner";

interface Contract {
  id: number;
  contractNumber: string;
  title: string;
  type: "employment" | "vendor" | "lease" | "partnership" | "service";
  partyA: string;
  partyB: string;
  value: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "expired" | "terminated" | "renewed";
}

interface ContractFormData {
  title: string;
  partyA: string;
  partyB: string;
  value: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "expired" | "terminated";
}

const initialFormData: ContractFormData = {
  title: '',
  partyA: '',
  partyB: '',
  value: '',
  startDate: '',
  endDate: '',
  status: 'draft',
};

export default function Contracts() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // نموذج الإنشاء
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  
  // نموذج التعديل
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  
  // نافذة الحذف
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  
  // نافذة عرض التفاصيل
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // جلب العقود من API
  const { data: contractsApiData, isLoading, refetch } = useQuery({
    queryKey: ['legal-contracts'],
    queryFn: () => api.get('/legal/contracts').then(r => r.data),
  });

  // إنشاء عقد جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/legal/contracts', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء العقد بنجاح');
      setIsCreateOpen(false);
      setFormData(initialFormData);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء العقد: ${error?.response?.data?.message || error.message}`);
    },
  });

  // تعديل عقد
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/legal/contracts/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تعديل العقد بنجاح');
      setIsEditOpen(false);
      setEditingContract(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تعديل العقد: ${error?.response?.data?.message || error.message}`);
    },
  });

  // تحويل البيانات من API
  const contractsData: Contract[] = useMemo(() => {
    if (!contractsApiData || contractsApiData.length === 0) {
      return [];
    }
    return contractsApiData.map((c: any) => ({
      id: c.id,
      contractNumber: c.contractNumber || `CON-${c.id}`,
      title: c.title || 'بدون عنوان',
      type: c.contractType || 'service',
      partyA: c.partyA || 'غير محدد',
      partyB: c.partyB || 'غير محدد',
      value: c.value ? `${Number(c.value).toLocaleString()} ر.س` : 'غير محدد',
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
      status: c.status || 'draft',
    }));
  }, [contractsApiData]);

  // تطبيق الفلاتر
  const filteredData = useMemo(() => {
    let data = contractsData;
    
    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter);
    }
    
    // فلترة حسب التاريخ
    if (dateFilter.from) {
      data = data.filter(c => c.startDate >= dateFilter.from);
    }
    if (dateFilter.to) {
      data = data.filter(c => c.endDate <= dateFilter.to);
    }
    
    return data;
  }, [contractsData, statusFilter, dateFilter]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const total = contractsData.length;
    const active = contractsData.filter(c => c.status === 'active').length;
    const expiringSoon = contractsData.filter(c => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      const today = new Date();
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;
    const expired = contractsData.filter(c => c.status === 'expired').length;
    return { total, active, expiringSoon, expired };
  }, [contractsData]);

  const handleCreate = () => {
    if (!formData.title || !formData.partyA || !formData.partyB) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createMutation.mutate({
      title: formData.title,
      partyA: formData.partyA,
      partyB: formData.partyB,
      value: formData.value || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      status: formData.status,
    });
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingContract) return;
    updateMutation.mutate({
      id: editingContract.id,
      title: editingContract.title,
      status: editingContract.status as "draft" | "active" | "expired" | "terminated",
      endDate: editingContract.endDate ? new Date(editingContract.endDate) : undefined,
    });
  };

  const handleDelete = (contract: Contract) => {
    setDeletingContract(contract);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingContract) return;
    // حذف العقد (تغيير الحالة إلى terminated)
    updateMutation.mutate({
      id: deletingContract.id,
      status: 'terminated',
    });
    setIsDeleteOpen(false);
    setDeletingContract(null);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter({ from: '', to: '' });
    setGlobalFilter('');
  };

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      { accessorKey: "contractNumber", header: "رقم العقد" },
      { accessorKey: "title", header: "العنوان" },
      {
        accessorKey: "type",
        header: "النوع",
        cell: ({ row }) => {
          const types: Record<string, { label: string; color: string }> = {
            employment: { label: "توظيف", color: "bg-blue-100 text-blue-800" },
            vendor: { label: "توريد", color: "bg-green-100 text-green-800" },
            lease: { label: "إيجار", color: "bg-purple-100 text-purple-800" },
            partnership: { label: "شراكة", color: "bg-amber-100 text-amber-800" },
            service: { label: "خدمات", color: "bg-cyan-100 text-cyan-800" },
          };
          const type = types[row.original.type] || { label: row.original.type, color: "bg-gray-100 text-gray-800" };
          return <Badge className={type.color}>{type.label}</Badge>;
        },
      },
      { accessorKey: "partyA", header: "الطرف الأول" },
      { accessorKey: "partyB", header: "الطرف الثاني" },
      { accessorKey: "value", header: "القيمة" },
      { accessorKey: "startDate", header: "تاريخ البدء" },
      { accessorKey: "endDate", header: "تاريخ الانتهاء" },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses: Record<string, { label: string; color: string }> = {
            draft: { label: "مسودة", color: "bg-gray-100 text-gray-800" },
            active: { label: "نشط", color: "bg-green-100 text-green-800" },
            expired: { label: "منتهي", color: "bg-red-100 text-red-800" },
            terminated: { label: "ملغي", color: "bg-orange-100 text-orange-800" },
            renewed: { label: "مجدد", color: "bg-blue-100 text-blue-800" },
          };
          const status = statuses[row.original.status] || { label: row.original.status, color: "bg-gray-100 text-gray-800" };
          return <Badge className={status.color}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setViewingContract(row.original); setIsViewOpen(true); }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(row.original)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['رقم العقد', 'العنوان', 'النوع', 'الطرف الأول', 'الطرف الثاني', 'القيمة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'];
    const csvData = filteredData.map(c => [c.contractNumber, c.title, c.type, c.partyA, c.partyB, c.value, c.startDate, c.endDate, c.status]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل العقود...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة العقود</h2>
          <p className="text-muted-foreground">متابعة وإدارة جميع العقود والاتفاقيات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إنشاء عقد جديد</h3>
                <p className="text-sm text-gray-500">
                  أدخل بيانات العقد الجديد. الحقول المميزة بـ * مطلوبة.
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">عنوان العقد *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="أدخل عنوان العقد"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="partyA">الطرف الأول *</Label>
                    <Input
                      id="partyA"
                      value={formData.partyA}
                      onChange={(e) => setFormData({ ...formData, partyA: e.target.value })}
                      placeholder="اسم الطرف الأول"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="partyB">الطرف الثاني *</Label>
                    <Input
                      id="partyB"
                      value={formData.partyB}
                      onChange={(e) => setFormData({ ...formData, partyB: e.target.value })}
                      placeholder="اسم الطرف الثاني"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">قيمة العقد</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="مثال: 50000"
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">تاريخ البدء</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="terminated">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
                  إنشاء العقد
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العقود</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">العقود النشطة</p>
                <h3 className="text-2xl font-bold">{stats.active}</h3>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تنتهي قريباً</p>
                <h3 className="text-2xl font-bold">{stats.expiringSoon}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">منتهية</p>
                <h3 className="text-2xl font-bold">{stats.expired}</h3>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>سجل العقود</CardTitle>
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
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 ms-2" />
                تصفية
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 ms-2" />
                تصدير
              </Button>
            </div>
          </div>
          
          {/* فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">فلاتر متقدمة</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 ms-2" />
                  مسح الفلاتر
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>الحالة</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="terminated">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد عقود</p>
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

      {/* نافذة التعديل */}
      {isEditOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل العقد</h3>
            <p className="text-sm text-gray-500">
              قم بتعديل بيانات العقد.
            </p>
          </div>
          {editingContract && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">عنوان العقد</Label>
                <Input
                  id="edit-title"
                  value={editingContract.title}
                  onChange={(e) => setEditingContract({ ...editingContract, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">تاريخ الانتهاء</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editingContract.endDate}
                  onChange={(e) => setEditingContract({ ...editingContract, endDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">الحالة</Label>
                <Select 
                  value={editingContract.status} 
                  onValueChange={(value: any) => setEditingContract({ ...editingContract, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="terminated">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة عرض تفاصيل العقد */}
      {isViewOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <FileText className="h-5 w-5" />
              تفاصيل العقد
            </h3>
          </div>
          {viewingContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">رقم العقد</Label>
                  <p className="font-medium">{viewingContract.contractNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <Badge className={{
                    draft: "bg-gray-100 text-gray-800",
                    active: "bg-green-100 text-green-800",
                    expired: "bg-red-100 text-red-800",
                    terminated: "bg-orange-100 text-orange-800",
                    renewed: "bg-blue-100 text-blue-800"
                  }[viewingContract.status]}>
                    {{
                      draft: "مسودة",
                      active: "نشط",
                      expired: "منتهي",
                      terminated: "ملغى",
                      renewed: "مجدد"
                    }[viewingContract.status]}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">عنوان العقد</Label>
                <p className="font-medium">{viewingContract.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الطرف الأول</Label>
                  <p className="font-medium">{viewingContract.partyA}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الطرف الثاني</Label>
                  <p className="font-medium">{viewingContract.partyB}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">قيمة العقد</Label>
                  <p className="font-medium text-primary">{viewingContract.value}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">تاريخ البداية</Label>
                  <p className="font-medium">{viewingContract.startDate}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">تاريخ الانتهاء</Label>
                  <p className="font-medium">{viewingContract.endDate}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingContract!); }}>
              <Edit className="h-4 w-4 ms-2" />
              تعديل
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا العقد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إلغاء العقد "{deletingContract?.title}". هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف العقد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
