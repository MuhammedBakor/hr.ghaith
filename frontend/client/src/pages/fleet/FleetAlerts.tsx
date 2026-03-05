import { formatDate, formatDateTime } from '@/lib/formatDate';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Gauge,
  Clock,
  WifiOff,
  Bell,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Alert {
  id: number;
  vehicleId: number | null;
  employeeId: number | null;
  type: string;
  severity: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'overspeed':
      return <Badge className="bg-red-100 text-red-800"><Gauge className="h-3 w-3 ms-1" />تجاوز سرعة</Badge>;
    case 'idle':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 ms-1" />توقف طويل</Badge>;
    case 'stale':
      return <Badge className="bg-gray-100 text-gray-800"><WifiOff className="h-3 w-3 ms-1" />انقطاع تتبع</Badge>;
    case 'geofence_exit':
      return <Badge className="bg-orange-100 text-orange-800">خروج من النطاق</Badge>;
    case 'geofence_enter':
      return <Badge className="bg-blue-100 text-blue-800">دخول للنطاق</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge className="bg-red-500 text-white">حرج</Badge>;
    case 'high':
      return <Badge className="bg-orange-500 text-white">عالي</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500 text-white">متوسط</Badge>;
    case 'low':
      return <Badge className="bg-green-500 text-white">منخفض</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
};

export default function FleetAlerts() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const queryClient = useQueryClient();

  const handleSubmit = () => { createMut.mutate({}); };

  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const [typeFilter, setTypeFilter] = useState<string>('all');

  // البيانات من API
  const { data: violationsData, isLoading, isError, error } = useQuery({
    queryKey: ['fleet-extended', 'violations'],
    queryFn: () => api.get('/fleet-extended/violations').then(r => r.data),
  });
  const { data: vehiclesData } = useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => api.get('/fleet/vehicles').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/fleet-extended', data).then(r => r.data),
    onError: (e: any) => { alert(e.message || "حدث خطأ"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-extended'] });
      window.location.reload();
    },
  });

  const vehicles = vehiclesData || [];
  const alerts = violationsData?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((v: any) => ({
    id: v.id,
    vehicleId: v.vehicleId,
    employeeId: v.employeeId,
    type: v.violationType || 'other',
    severity: v.severity || 'medium',
    description: v.description,
    status: v.status,
    createdAt: v.createdAt,
  })) as Alert[];

  // Filter alerts based on type
  const filteredAlerts = typeFilter === 'all'
    ? alerts
    : alerts.filter(a => a.type === typeFilter);

  const stats = {
    total: alerts.length,
    overspeed: alerts.filter(a => a.type === 'overspeed').length,
    idle: alerts.filter(a => a.type === 'idle').length,
    stale: alerts.filter(a => a.type === 'stale').length,
  };

  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: 'createdAt',
      header: 'الوقت',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      accessorKey: 'vehicleId',
      header: 'المركبة',
      cell: ({ row }) => {
        if (!row.original.vehicleId) return '-';
        const vehicle = vehicles.find((v: { id: number }) => v.id === row.original.vehicleId);
        return <span className="font-medium">{(vehicle as any)?.plateNumber || `مركبة #${row.original.vehicleId}`}</span>;
      },
    },
    {
      accessorKey: 'type',
      header: 'النوع',
      cell: ({ row }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: 'severity',
      header: 'الشدة',
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'resolved' ? 'default' : 'secondary'}>
          {row.original.status === 'resolved' ? 'تم الحل' : row.original.status === 'pending' ? 'معلق' : row.original.status}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تنبيهات الأسطول</h2>
          <p className="text-gray-500">مراقبة وإدارة تنبيهات المركبات</p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية حسب النوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التنبيهات</SelectItem>
            <SelectItem value="overspeed">تجاوز السرعة</SelectItem>
            <SelectItem value="idle">توقف طويل</SelectItem>
            <SelectItem value="stale">انقطاع تتبع</SelectItem>
            <SelectItem value="geofence_exit">خروج من النطاق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي التنبيهات</p>
                <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <Gauge className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">تجاوز السرعة</p>
                <p className="text-2xl font-bold">{stats.overspeed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">توقف طويل</p>
                <p className="text-2xl font-bold">{stats.idle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <WifiOff className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">انقطاع تتبع</p>
                <p className="text-2xl font-bold">{stats.stale}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            سجل التنبيهات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد تنبيهات</p>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredAlerts} />
          )}
        </CardContent>
      </Card>

        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
