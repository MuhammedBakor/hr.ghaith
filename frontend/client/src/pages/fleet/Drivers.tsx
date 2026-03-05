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
import {
  User,
  Plus,
  Car,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Dialog } from "@/components/ui/dialog";


interface Driver {
  id: number;
  employeeId: number | null;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: Date | null;
  status: string;
  medicalCertExpiry: Date | null;
  trainingCompleted: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
    case 'suspended':
      return <Badge className="bg-red-100 text-red-800">موقوف</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getLicenseTypeName = (type: string) => {
  const types: Record<string, string> = {
    light: 'خفيفة',
    heavy: 'ثقيلة',
    motorcycle: 'دراجة نارية',
    special: 'خاصة'
  };
  return types[type] || type;
};

// دالة توليد رقم السائق التلقائي
const generateDriverCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `DRV-${timestamp.slice(-4)}${random}`;
};

export default function Drivers() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add'>('list');
  const [driverCode] = useState(generateDriverCode());
  const [newDriver, setNewDriver] = useState({
    licenseNumber: '',
    licenseType: 'light',
    status: 'active',
  });

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  const { data: driversData, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['fleet-extended', 'drivers', { branchId: selectedBranchId || undefined }],
    queryFn: () => api.get('/fleet-extended/drivers', { params: { branchId: selectedBranchId || undefined } }).then(r => r.data),
  });
  const createDriverMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet-extended/drivers', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة السائق بنجاح');
      setView('list');
      setNewDriver({ licenseNumber: '', licenseType: 'light', status: 'active' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'حدث خطأ');
    },
  });

  const drivers = driversData || [];

  const stats = {
    total: drivers.length,
    active: drivers.filter((d: Driver) => d.status === 'active').length,
    inactive: drivers.filter((d: Driver) => d.status === 'inactive').length,
    trained: drivers.filter((d: Driver) => d.trainingCompleted).length,
  };

  const columns: ColumnDef<Driver>[] = [
    {
      accessorKey: 'id',
      header: '#',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">سائق #{row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'licenseNumber',
      header: 'رقم الرخصة',
    },
    {
      accessorKey: 'licenseType',
      header: 'نوع الرخصة',
      cell: ({ row }) => getLicenseTypeName(row.original.licenseType),
    },
    {
      accessorKey: 'licenseExpiry',
      header: 'انتهاء الرخصة',
      cell: ({ row }) => {
        if (!row.original.licenseExpiry) return '-';
        const expiry = new Date(row.original.licenseExpiry);
        const isExpiringSoon = expiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
          <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
            {expiry.toLocaleDateString('ar-SA')}
          </span>
        );
      },
    },
    {
      accessorKey: 'trainingCompleted',
      header: 'التدريب',
      cell: ({ row }) => row.original.trainingCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  const handleCreateDriver = () => {
    if (!newDriver.licenseNumber) {
      toast.error('رقم الرخصة مطلوب');
      return;
    }
    createDriverMutation.mutate({
      licenseNumber: newDriver.licenseNumber,
      licenseType: newDriver.licenseType as 'light' | 'heavy' | 'motorcycle' | 'special',
      status: newDriver.status as 'active' | 'inactive' | 'suspended',
    });
  };

  const resetForm = () => {
    setNewDriver({ licenseNumber: '', licenseType: 'light', status: 'active' });
  };

  // عرض نموذج إضافة سائق جديد
  if (view === 'add') {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إضافة سائق جديد</h2>
            <p className="text-gray-500">أدخل بيانات السائق الجديد</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              بيانات السائق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الرخصة *</Label>
                <Input
                  value={newDriver.licenseNumber}
                  onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                  placeholder="أدخل..."
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الرخصة</Label>
                <Select value={newDriver.licenseType} onValueChange={(v) => setNewDriver({ ...newDriver, licenseType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">خفيفة</SelectItem>
                    <SelectItem value="heavy">ثقيلة</SelectItem>
                    <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                    <SelectItem value="special">خاصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={newDriver.status} onValueChange={(v) => setNewDriver({ ...newDriver, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">موقوف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateDriver} disabled={createDriverMutation.isPending}>
                {createDriverMutation.isPending ? 'جاري الإضافة...' : 'إضافة السائق'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة السائقين
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة السائقين</h2>
          <p className="text-gray-500">قائمة سائقي الأسطول ومعلوماتهم</p>
        </div>
        <Button className="gap-2" onClick={() => setView('add')}>
          <Plus className="h-4 w-4" />
          إضافة سائق
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Car className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نشطون</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-50">
              <Car className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">غير نشطين</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مدربون</p>
              <p className="text-2xl font-bold">{stats.trained}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            قائمة السائقين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={drivers}
              searchKey="licenseNumber"
              searchPlaceholder="بحث برقم الرخصة..."
              emptyMessage="لا يوجد سائقون"
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
