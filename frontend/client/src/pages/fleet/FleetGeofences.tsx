import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Circle,
  Square,
  Hexagon,
  Settings,
  Map,
  Loader2,
  ArrowRight,
  Trash2,
  Edit,
  Bell
} from 'lucide-react';

interface Geofence {
  id: number;
  code: string;
  name: string;
  type: string;
  centerLat: string | null;
  centerLng: string | null;
  radius: number | null;
  status: string;
  alertOnEntry: boolean | null;
  alertOnExit: boolean | null;
  createdAt: Date;
}

// دالة توليد رقم السياج التلقائي
const generateGeofenceCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `GEO-${timestamp.slice(-4)}${random}`;
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'circle':
      return <Badge className="bg-blue-100 text-blue-800"><Circle className="h-3 w-3 ms-1" />دائرة</Badge>;
    case 'polygon':
      return <Badge className="bg-purple-100 text-purple-800"><Hexagon className="h-3 w-3 ms-1" />مضلع</Badge>;
    case 'rectangle':
      return <Badge className="bg-green-100 text-green-800"><Square className="h-3 w-3 ms-1" />مستطيل</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = 'list' | 'add';

export default function FleetGeofences() {
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [geofenceCode] = useState(generateGeofenceCode());
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    type: 'circle',
    centerLat: '',
    centerLng: '',
    radius: '500',
    alertOnEntry: true,
    alertOnExit: true,
  });

  const queryClient = useQueryClient();

  // جلب السياجات من API
  const { data: geofencesData, isLoading, isError, error} = useQuery({
    queryKey: ['fleet', 'geofences'],
    queryFn: () => api.get('/fleet/geofences').then(r => r.data),
  });
  const geofences: Geofence[] = (geofencesData || []) as Geofence[];

  // جلب الإحصائيات
  const { data: stats } = useQuery({
    queryKey: ['fleet', 'geofences', 'stats'],
    queryFn: () => api.get('/fleet/geofences/stats').then(r => r.data),
  });

  // إنشاء سياج جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet/geofences', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء السياج الجغرافي بنجاح');
      queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] });
      setViewMode('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء السياج: ' + error.message);
    },
  });

  // حذف سياج
  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/fleet/geofences/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف السياج بنجاح');
      queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] });
    },
    onError: (error: any) => {
      toast.error('فشل في حذف السياج: ' + error.message);
    },
  });

  // تحديث حالة السياج
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/fleet/geofences/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث السياج بنجاح');
      queryClient.invalidateQueries({ queryKey: ['fleet', 'geofences'] });
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث السياج: ' + error.message);
    },
  });

  const resetForm = () => {
    setNewGeofence({
      name: '',
      type: 'circle',
      centerLat: '',
      centerLng: '',
      radius: '500',
      alertOnEntry: true,
      alertOnExit: true,
    });
  };

  const handleCreateGeofence = () => {
    if (!newGeofence.name || !newGeofence.centerLat || !newGeofence.centerLng) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    createMutation.mutate({
      code: geofenceCode,
      name: newGeofence.name,
      type: newGeofence.type as any,
      centerLat: newGeofence.centerLat,
      centerLng: newGeofence.centerLng,
      radius: parseInt(newGeofence.radius),
      alertOnEntry: newGeofence.alertOnEntry,
      alertOnExit: newGeofence.alertOnExit,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({ id, status: newStatus as any });
  };

  const columns: ColumnDef<Geofence>[] = [
    {
      accessorKey: 'code',
      header: 'الكود',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'الاسم',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'النوع',
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: 'radius',
      header: 'النطاق',
      cell: ({ row }) => `${row.original.radius || 0} متر`,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'alerts',
      header: 'التنبيهات',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.alertOnEntry && <Badge variant="outline" className="text-xs">دخول</Badge>}
          {row.original.alertOnExit && <Badge variant="outline" className="text-xs">خروج</Badge>}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleStatus(row.original.id, row.original.status)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600"
            onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) handleDelete(row.original.id) }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // نموذج إضافة سياج جديد
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
            <h1 className="text-2xl font-bold">إنشاء سياج جغرافي جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات السياج الجغرافي</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              بيانات السياج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم السياج (تلقائي)</Label>
                  <Input
                    value={geofenceCode}
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم السياج *</Label>
                  <Input
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                    placeholder="مثال: المقر الرئيسي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع السياج</Label>
                  <Select value={newGeofence.type} onValueChange={(v) => setNewGeofence({...newGeofence, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">دائرة</SelectItem>
                      <SelectItem value="polygon">مضلع</SelectItem>
                      <SelectItem value="rectangle">مستطيل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نصف القطر (متر)</Label>
                  <Input
                    type="number"
                    value={newGeofence.radius}
                    onChange={(e) => setNewGeofence({...newGeofence, radius: e.target.value})}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>خط العرض *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newGeofence.centerLat}
                    onChange={(e) => setNewGeofence({...newGeofence, centerLat: e.target.value})}
                    placeholder="أدخل..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>خط الطول *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newGeofence.centerLng}
                    onChange={(e) => setNewGeofence({...newGeofence, centerLng: e.target.value})}
                    placeholder="أدخل..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label>تنبيه عند الدخول</Label>
                  </div>
                  <Switch
                    checked={newGeofence.alertOnEntry}
                    onCheckedChange={(v) => setNewGeofence({...newGeofence, alertOnEntry: v})}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label>تنبيه عند الخروج</Label>
                  </div>
                  <Switch
                    checked={newGeofence.alertOnExit}
                    onCheckedChange={(v) => setNewGeofence({...newGeofence, alertOnExit: v})}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateGeofence} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 ms-2" />
                )}
                إنشاء السياج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">السياجات الجغرافية</h2>
          <p className="text-muted-foreground">إدارة مناطق التتبع والتنبيهات</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          سياج جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Map className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السياجات</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نشطة</p>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Circle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">دوائر</p>
                <p className="text-2xl font-bold">{stats?.circles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Hexagon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مضلعات</p>
                <p className="text-2xl font-bold">{stats?.polygons || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geofences Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            قائمة السياجات الجغرافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geofences.length === 0 ? (
            <div className="text-center py-12">
              <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">لا توجد سياجات جغرافية</p>
              <p className="text-sm text-muted-foreground mb-4">قم بإنشاء سياج جغرافي جديد لتتبع مواقع المركبات</p>
              <Button onClick={() => setViewMode('add')}>
                <Plus className="h-4 w-4 ms-2" />
                إنشاء سياج جديد
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={geofences}
              searchKey="name"
              searchPlaceholder="بحث بالاسم..."
            />
          )}
        </CardContent>
      </Card>

      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السياج؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
