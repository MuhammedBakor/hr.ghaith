import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertTriangle, Phone, MapPin, Clock, Loader2, Inbox, Plus, Car, User } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FleetIncidentAssist() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    incidentType: 'collision' as const,
    severity: 'minor' as const,
    description: '',
    location: '',
    vehicleId: undefined as number | undefined,
    driverId: undefined as number | undefined,
    injuries: false,
    injuryDetails: '',
    notes: '',
  });

  const { data: incidentsData, isLoading, refetch } = trpc.fleet.incidents.list.useQuery();
  const { data: statsData } = trpc.fleet.incidents.stats.useQuery();
  const { data: vehiclesData } = trpc.fleet.vehicles.list.useQuery();
  const { data: driversData } = trpc.fleetExtended.drivers.list.useQuery();

  const incidents = (incidentsData || []) as any[];
  const vehicles = (vehiclesData || []) as any[];
  const drivers = (driversData || []) as any[];
  const stats = statsData || { total: 0, active: 0, processing: 0, resolved: 0 };

  const createIncidentMutation = trpc.fleet.incidents.create.useMutation({
    onSuccess: () => {
      toast.success('تم تسجيل الحادث بنجاح');
      setShowAddDialog(false);
      setNewIncident({
        incidentType: 'collision',
        severity: 'minor',
        description: '',
        location: '',
        vehicleId: undefined,
        driverId: undefined,
        injuries: false,
        injuryDetails: '',
        notes: '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء تسجيل الحادث');
      console.error(error);
    },
  });

  const updateIncidentMutation = trpc.fleet.incidents.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث حالة الحادث');
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء تحديث الحادث');
      console.error(error);
    },
  });

  const handleCreateIncident = () => {
    createIncidentMutation.mutate({
      ...newIncident,
      incidentDate: new Date(),
    });
  };

  const handleUpdateStatus = (id: number, status: 'investigating' | 'resolved' | 'closed') => {
    updateIncidentMutation.mutate({
      id,
      status,
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : undefined,
    });
  };

  const getIncidentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      collision: 'تصادم',
      breakdown: 'عطل',
      theft: 'سرقة',
      vandalism: 'تخريب',
      fire: 'حريق',
      natural_disaster: 'كارثة طبيعية',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  const getSeverityBadge = (severity: string) => {
    const severities: Record<string, { label: string; className: string }> = {
      minor: { label: 'طفيف', className: 'bg-green-100 text-green-800' },
      moderate: { label: 'متوسط', className: 'bg-yellow-100 text-yellow-800' },
      major: { label: 'كبير', className: 'bg-orange-100 text-orange-800' },
      critical: { label: 'حرج', className: 'bg-red-100 text-red-800' },
    };
    const s = severities[severity] || { label: severity, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; className: string }> = {
      reported: { label: 'تم الإبلاغ', className: 'bg-blue-100 text-blue-800' },
      investigating: { label: 'قيد التحقيق', className: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'تم الحل', className: 'bg-green-100 text-green-800' },
      closed: { label: 'مغلق', className: 'bg-gray-100 text-gray-800' },
    };
    const s = statuses[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
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
          <h2 className="text-2xl font-bold tracking-tight">المساعدة في الحوادث</h2>
          <p className="text-gray-500">إدارة ومتابعة حوادث الأسطول</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          تسجيل حادث
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">حوادث نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">قيد المعالجة</p>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تم حلها</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            سجل الحوادث
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد حوادث مسجلة</p>
              <p className="text-sm text-gray-400">ستظهر الحوادث هنا عند تسجيلها</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident: any) => (
                <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getIncidentTypeLabel(incident.incidentType)}</span>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      {incident.description && (
                        <p className="text-sm text-gray-600">{incident.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {incident.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {incident.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(incident.incidentDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {incident.status === 'reported' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(incident.id, 'investigating')}
                        >
                          بدء التحقيق
                        </Button>
                      )}
                      {incident.status === 'investigating' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(incident.id, 'resolved')}
                        >
                          تم الحل
                        </Button>
                      )}
                      {incident.status === 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(incident.id, 'closed')}
                        >
                          إغلاق
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تسجيل حادث جديد */}
      {showAddDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تسجيل حادث جديد</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الحادث</Label>
                <Select
                  value={newIncident.incidentType}
                  onValueChange={(value: any) => setNewIncident({ ...newIncident, incidentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collision">تصادم</SelectItem>
                    <SelectItem value="breakdown">عطل</SelectItem>
                    <SelectItem value="theft">سرقة</SelectItem>
                    <SelectItem value="vandalism">تخريب</SelectItem>
                    <SelectItem value="fire">حريق</SelectItem>
                    <SelectItem value="natural_disaster">كارثة طبيعية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الشدة</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(value: any) => setNewIncident({ ...newIncident, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">طفيف</SelectItem>
                    <SelectItem value="moderate">متوسط</SelectItem>
                    <SelectItem value="major">كبير</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المركبة</Label>
                <Select
                  value={newIncident.vehicleId?.toString() || ''}
                  onValueChange={(value) => setNewIncident({ ...newIncident, vehicleId: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.plateNumber} - {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السائق</Label>
                <Select
                  value={newIncident.driverId?.toString() || ''}
                  onValueChange={(value) => setNewIncident({ ...newIncident, driverId: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السائق" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input
                value={newIncident.location}
                onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                placeholder="أدخل موقع الحادث"
              />
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="وصف تفصيلي للحادث"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="injuries"
                checked={newIncident.injuries}
                onChange={(e) => setNewIncident({ ...newIncident, injuries: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="injuries">يوجد إصابات</Label>
            </div>

            {newIncident.injuries && (
              <div className="space-y-2">
                <Label>تفاصيل الإصابات</Label>
                <Textarea
                  value={newIncident.injuryDetails}
                  onChange={(e) => setNewIncident({ ...newIncident, injuryDetails: e.target.value })}
                  placeholder="وصف الإصابات"
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>ملاحظات إضافية</Label>
              <Textarea
                value={newIncident.notes}
                onChange={(e) => setNewIncident({ ...newIncident, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateIncident} disabled={createIncidentMutation.isPending}>
              {createIncidentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : null}
              تسجيل الحادث
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
