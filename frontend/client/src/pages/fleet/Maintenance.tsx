import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";
import {

  Wrench,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  maintenanceType: string;
  description: string | null;
  cost: string | null;
  mileageAtService: number | null;
  serviceDate: Date;
  nextServiceDate: Date | null;
  status: string;
  createdAt: Date;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800">صيانة دورية</Badge>;
    case 'repair':
      return <Badge className="bg-orange-100 text-orange-800">إصلاح</Badge>;
    case 'inspection':
      return <Badge className="bg-green-100 text-green-800">فحص</Badge>;
    case 'accident':
      return <Badge className="bg-red-100 text-red-800">حادث</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-yellow-100 text-yellow-800">مجدول</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-800">جاري</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-800">ملغي</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// دالة توليد رقم الصيانة التلقائي
const generateMaintenanceCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `MNT-${timestamp.slice(-4)}${random}`;
};

type ViewMode = 'list' | 'add';

export default function Maintenance() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [maintenanceCode] = useState(generateMaintenanceCode());
  const [newRecord, setNewRecord] = useState({
    vehicleId: 0,
    maintenanceType: 'scheduled',
    description: '',
    cost: '',
    performedBy: '',
  });

  const { data: maintenanceData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['fleet', 'maintenance'],
    queryFn: () => api.get('/fleet/maintenance').then(r => r.data),
  });
  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/fleet/vehicles').then(r => r.data),
  });
  const { data: overdueData } = useQuery({
    queryKey: ['fleet-smart', 'overdue-maintenances'],
    queryFn: () => api.get('/fleet-smart/overdue-maintenances').then(r => r.data),
  });
  const completeMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet-smart/complete-and-schedule-next', data).then(r => r.data),
    onSuccess: () => { toast.success('تم إكمال الصيانة وجدولة القادمة'); refetch(); },
    onError: (e: any) => toast.error(e.message || 'خطأ'),
  });
  const createMaintenanceMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet/maintenance', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة سجل الصيانة بنجاح');
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const records = maintenanceData || [];
  const vehicles = vehiclesData || [];

  const stats = {
    scheduled: records.filter((r: MaintenanceRecord) => r.status === 'scheduled').length,
    inProgress: records.filter((r: MaintenanceRecord) => r.status === 'in_progress').length,
    completed: records.filter((r: MaintenanceRecord) => r.status === 'completed').length,
    totalCost: records.reduce((sum: number, r: MaintenanceRecord) => sum + (parseFloat(r.cost || '0') || 0), 0),
  };

  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      accessorKey: 'vehicleId',
      header: 'المركبة',
      cell: ({ row }) => <span className="font-mono font-bold">مركبة #{row.original.vehicleId}</span>,
    },
    {
      accessorKey: 'maintenanceType',
      header: 'النوع',
      cell: ({ row }) => getTypeBadge(row.original.maintenanceType),
    },
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: 'serviceDate',
      header: 'تاريخ الصيانة',
      cell: ({ row }) => row.original.serviceDate ? formatDate(row.original.serviceDate) : '-',
    },
    {
      accessorKey: 'cost',
      header: 'التكلفة',
      cell: ({ row }) => formatCurrency(parseFloat(row.original.cost || '0') || 0),
    },
    {
      accessorKey: 'mileageAtService',
      header: 'العداد',
      cell: ({ row }) => row.original.mileageAtService ? row.original.mileageAtService.toLocaleString() + ' كم' : '-',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  const resetForm = () => {
    setNewRecord({ vehicleId: 0, maintenanceType: 'scheduled', description: '', cost: '', performedBy: '' });
  };

  const handleCreateMaintenance = () => {
    if (!newRecord.vehicleId) {
      toast.error('يرجى اختيار المركبة');
      return;
    }
    createMaintenanceMutation.mutate({
      vehicleId: newRecord.vehicleId,
      maintenanceType: newRecord.maintenanceType as 'scheduled' | 'repair' | 'inspection' | 'accident',
      description: newRecord.description || undefined,
      cost: newRecord.cost || undefined,
      serviceDate: new Date(),
    });
  };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // نموذج إضافة سجل صيانة جديد
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
            <h1 className="text-2xl font-bold">إضافة سجل صيانة</h1>
            <p className="text-muted-foreground">أدخل بيانات الصيانة</p>
          </div>
        </div>

        {/* تنبيه الصيانة المتأخرة */}
        {(overdueData as any[])?.length > 0 && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                صيانة متأخرة ({(overdueData as any[]).length} مركبة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(overdueData as any[]).slice(0, 5).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span>مركبة {m.vehicleId} — {m.description}</span>
                    <Button size="sm" variant="destructive" onClick={() => completeMutation.mutate({
                      maintenanceId: m.id, vehicleId: m.vehicleId
                    })}>إكمال</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              بيانات الصيانة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الصيانة (تلقائي)</Label>
                  <Input
                    value={maintenanceCode}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>المركبة *</Label>
                  <Select value={newRecord.vehicleId.toString()} onValueChange={(v) => setNewRecord({ ...newRecord, vehicleId: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((v: { id: number; plateNumber: string }) => (
                        <SelectItem key={v.id} value={v.id.toString()}>{v.plateNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الصيانة</Label>
                  <Select value={newRecord.maintenanceType} onValueChange={(v) => setNewRecord({ ...newRecord, maintenanceType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oil_change">تغيير زيت</SelectItem>
                      <SelectItem value="tire_rotation">تدوير إطارات</SelectItem>
                      <SelectItem value="brake_service">فرامل</SelectItem>
                      <SelectItem value="general_inspection">فحص عام</SelectItem>
                      <SelectItem value="engine_repair">إصلاح محرك</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التكلفة (ر.س)</Label>
                  <Input
                    type="number"
                    value={newRecord.cost?.toLocaleString()}
                    onChange={(e) => setNewRecord({ ...newRecord, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  placeholder="وصف الصيانة..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>الفني/الورشة</Label>
                <Input
                  value={newRecord.performedBy}
                  onChange={(e) => setNewRecord({ ...newRecord, performedBy: e.target.value })}
                  placeholder="اسم الفني أو الورشة"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateMaintenance} disabled={createMaintenanceMutation.isPending}>
                {createMaintenanceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إضافة سجل الصيانة
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
          <h2 className="text-2xl font-bold tracking-tight">جدولة الصيانة</h2>
          <p className="text-muted-foreground">إدارة صيانة مركبات الأسطول</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          جدولة صيانة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مجدولة</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">جارية</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <Wrench className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalCost)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            سجل الصيانة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد سجلات صيانة</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إضافة سجل صيانة جديد
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              searchKey="description"
              searchPlaceholder="بحث في الوصف..."
              emptyMessage="لا توجد سجلات صيانة"
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
