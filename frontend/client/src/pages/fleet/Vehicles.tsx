import React from "react";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Car, Plus, Wrench, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Dialog } from "@/components/ui/dialog";


interface Vehicle {
  id: number;
  plateNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  status: string;
  fuelType: string | null;
  currentMileage: number | null;
  assignedTo: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800">متاح</Badge>;
    case 'in_use':
      return <Badge className="bg-blue-100 text-blue-800">قيد الاستخدام</Badge>;
    case 'maintenance':
      return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
    case 'retired':
      return <Badge className="bg-red-100 text-red-800">متقاعد</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// دالة توليد رقم المركبة التلقائي
const generateVehicleCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `VEH-${timestamp.slice(-4)}${random}`;
};

export default function Vehicles() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add'>('list');
  const [vehicleCode] = useState(generateVehicleCode());
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'available',
  });

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  const { data: vehiclesData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['fleet', 'vehicles', { branchId: selectedBranchId || undefined }],
    queryFn: () => api.get('/api/fleet/vehicles', { params: { branchId: selectedBranchId || undefined } }).then(r => r.data),
  });
  const createVehicleMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet/vehicles', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة المركبة بنجاح');
      setView('list');
      setNewVehicle({
        plateNumber: '', make: '', model: '', year: new Date().getFullYear(), status: 'available',
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'حدث خطأ');
    },
  });

  const vehicles = vehiclesData || [];

  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v: Vehicle) => v.status === 'available' || v.status === 'in_use').length,
    maintenance: vehicles.filter((v: Vehicle) => v.status === 'maintenance').length,
    retired: vehicles.filter((v: Vehicle) => v.status === 'retired').length,
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'plateNumber',
      header: 'رقم اللوحة',
      cell: ({ row }) => (
        <span className="font-mono font-bold">{row.original.plateNumber}</span>
      ),
    },
    {
      accessorKey: 'make',
      header: 'المركبة',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.make} {row.original.model}</p>
          <p className="text-sm text-muted-foreground">{row.original.year} - {row.original.color || ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'fuelType',
      header: 'نوع الوقود',
      cell: ({ row }) => {
        const fuelTypes: Record<string, string> = { petrol: 'بنزين', diesel: 'ديزل', electric: 'كهربائي', hybrid: 'هجين' };
        return fuelTypes[row.original.fuelType || 'petrol'] || row.original.fuelType;
      },
    },
    {
      accessorKey: 'currentMileage',
      header: 'المسافة',
      cell: ({ row }) => `${(row.original.currentMileage || 0).toLocaleString()} كم`,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <MapPin className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Wrench className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreateVehicle = () => {
    if (!newVehicle.plateNumber) {
      toast.error('رقم اللوحة مطلوب');
      return;
    }
    createVehicleMutation.mutate({
      plateNumber: newVehicle.plateNumber,
      make: newVehicle.make || undefined,
      model: newVehicle.model || undefined,
      year: newVehicle.year,
    });
  };

  const resetForm = () => {
    setNewVehicle({ plateNumber: '', make: '', model: '', year: new Date().getFullYear(), status: 'available' });
  };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // عرض نموذج إضافة مركبة جديدة
  if (view === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إضافة مركبة جديدة</h2>
            <p className="text-gray-500">أدخل بيانات المركبة الجديدة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              بيانات المركبة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم اللوحة *</Label>
                <Input
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                  placeholder="أ ب ج 1234"
                />
              </div>
              <div className="space-y-2">
                <Label>الشركة المصنعة</Label>
                <Input
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  placeholder="تويوتا"
                />
              </div>
              <div className="space-y-2">
                <Label>الموديل</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="كامري"
                />
              </div>
              <div className="space-y-2">
                <Label>سنة الصنع</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={newVehicle.status} onValueChange={(v) => setNewVehicle({ ...newVehicle, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="retired">متقاعد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateVehicle} disabled={createVehicleMutation.isPending}>
                {createVehicleMutation.isPending ? 'جاري الإضافة...' : 'إضافة المركبة'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة المركبات
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة المركبات</h2>
          <p className="text-gray-500">قائمة مركبات الأسطول وحالتها</p>
        </div>
        <Button className="gap-2" onClick={() => setView('add')}>
          <Plus className="h-4 w-4" />
          إضافة مركبة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المركبات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">في الصيانة</p>
              <p className="text-2xl font-bold">{stats.maintenance}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متقاعدة</p>
              <p className="text-2xl font-bold">{stats.retired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            قائمة المركبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={vehicles}
              searchKey="plateNumber"
              searchPlaceholder="بحث برقم اللوحة..."
              emptyMessage="لا توجد مركبات"
            />
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
