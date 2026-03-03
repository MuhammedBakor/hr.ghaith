import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Loader2,
  Inbox
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

interface MaintenanceRequest {
  id: number;
  ticketNumber: string;
  propertyId: number;
  property: string;
  unitId: number | null;
  unit: string;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  requestDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cost: number;
}

export default function PropertyMaintenance() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const utils = trpc.useUtils();
  const { data: maintenanceData, isLoading, isError, error} = trpc.property.maintenance.list.useQuery();
  const { data: properties } = trpc.property.properties?.list?.useQuery();
  const { data: units } = trpc.property.units?.list?.useQuery();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [formData, setFormData] = useState<{
    propertyId: string;
    unitId: string;
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedCost: string;
  }>({
    propertyId: '',
    unitId: '',
    type: 'electrical',
    description: '',
    priority: 'medium',
    estimatedCost: '',
  });

  const createMutation = trpc.property.maintenance.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء طلب الصيانة بنجاح');
      utils.property.maintenance.list.invalidate();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الطلب: ' + error.message);
    },
  });

  const updateMutation = trpc.property.maintenance.update.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث طلب الصيانة بنجاح');
      utils.property.maintenance.list.invalidate();
      setIsOpen(false);
      setEditingRequest(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('فشل في تحديث الطلب: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      propertyId: '',
      unitId: '',
      type: 'electrical',
      description: '',
      priority: 'medium',
      estimatedCost: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.propertyId || !formData.description) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (editingRequest) {
      updateMutation.mutate({
        id: editingRequest.id,
        status: editingRequest.status,
        actualCost: formData.estimatedCost || undefined,
      });
    } else {
      createMutation.mutate({
        propertyId: parseInt(formData.propertyId),
        unitId: formData.unitId ? parseInt(formData.unitId) : undefined,
        title: formData.type, // نوع الصيانة كعنوان
        description: formData.description,
        priority: formData.priority,
        category: formData.type, // نوع الصيانة كفئة
        estimatedCost: formData.estimatedCost || undefined,
      });
    }
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setFormData({
      propertyId: String(request.propertyId),
      unitId: request.unitId ? String(request.unitId) : '',
      type: request.type,
      description: request.description,
      priority: request.priority as 'low' | 'medium' | 'high',
      estimatedCost: String(request.cost || ''),
    });
    setIsOpen(true);
  };

  const handleStatusChange = (id: number, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    updateMutation.mutate({ id, status });
  };
  
  const requests: MaintenanceRequest[] = maintenanceData?.map((m: any) => ({
    id: m.id,
    ticketNumber: `MNT-${String(m.id).padStart(3, '0')}`,
    propertyId: m.propertyId,
    property: m.propertyName || properties?.find((p: any) => p.id === m.propertyId)?.name || '',
    unitId: m.unitId,
    unit: m.unitNumber || '',
    type: m.type || '',
    description: m.description || '',
    priority: m.priority || 'medium',
    requestDate: m.requestDate || m.createdAt || '',
    status: m.status || 'pending',
    cost: parseFloat(m.estimatedCost || m.actualCost || '0') || 0
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof MaintenanceRequest>('requestDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof MaintenanceRequest) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRequests = [...requests]
    .filter(r => r.property.includes(searchTerm) || r.ticketNumber.includes(searchTerm) || r.type.includes(searchTerm))
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ms-1" />مكتمل</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 ms-1" />قيد التنفيذ</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 ms-1" />قيد الانتظار</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">ملغي</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">عالية</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">متوسطة</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-800">منخفضة</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);

  const maintenanceTypes = [
    { value: 'electrical', label: 'كهرباء' },
    { value: 'plumbing', label: 'سباكة' },
    { value: 'hvac', label: 'تكييف' },
    { value: 'structural', label: 'هيكلي' },
    { value: 'painting', label: 'دهان' },
    { value: 'cleaning', label: 'تنظيف' },
    { value: 'other', label: 'أخرى' },
  ];

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
          <h2 className="text-2xl font-bold">صيانة العقارات</h2>
          <p className="text-gray-500">طلبات الصيانة والإصلاحات</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setEditingRequest(null);
          setIsOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          طلب صيانة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلبات</p>
              <h3 className="text-2xl font-bold">{requests.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قيد الانتظار</p>
              <h3 className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">أولوية عالية</p>
              <h3 className="text-2xl font-bold">{requests.filter(r => r.priority === 'high').length}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التكاليف</p>
              <h3 className="text-2xl font-bold">{totalCost.toLocaleString()} ر.س</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              طلبات الصيانة
            </CardTitle>
              <PrintButton title="التقرير" />
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('ticketNumber')}>
                  <div className="flex items-center gap-1">
                    رقم الطلب
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('property')}>
                  <div className="flex items-center gap-1">
                    العقار
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1">
                    النوع
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1">
                    الأولوية
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('requestDate')}>
                  <div className="flex items-center gap-1">
                    التاريخ
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('cost')}>
                  <div className="flex items-center gap-1">
                    التكلفة
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    الحالة
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium">لا توجد طلبات صيانة</p>
                      <p className="text-sm">ابدأ بإضافة طلبات صيانة للعقارات</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.ticketNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.property}</div>
                        <div className="text-sm text-gray-500">{request.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell>{maintenanceTypes.find(t => t.value === request.type)?.label || request.type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{request.description}</TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>{request.requestDate ? formatDate(request.requestDate) : '-'}</TableCell>
                    <TableCell>{request.cost > 0 ? `${request.cost.toLocaleString()} ر.س` : '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={request.status}
                        onValueChange={(value: any) => handleStatusChange(request.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(request)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit*/}
      {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editingRequest ? 'تعديل طلب الصيانة' : 'طلب صيانة جديد'}</h3>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>العقار *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                disabled={!!editingRequest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العقار" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((property: any) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>الوحدة (اختياري)</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                disabled={!!editingRequest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units?.filter((u: any) => String(u.propertyId) === formData.propertyId).map((unit: any) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الصيانة</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={!!editingRequest}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  disabled={!!editingRequest}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>الوصف *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المشكلة أو العمل المطلوب"
                disabled={!!editingRequest}
              />
            </div>
            
            <div className="space-y-2">
              <Label>التكلفة التقديرية</Label>
              <Input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              {editingRequest ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
