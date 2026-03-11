import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ArrowUpDown,
  Edit,
  Eye,
  Building2,
  User,
  UserCheck,
  UserX,
  Loader2,
  Inbox,
  X
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

interface Tenant {
  id: number;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  property: string;
  unit: string;
  unitId: number;
  contractStart: string;
  contractEnd: string;
  monthlyRent: number;
  status: 'active' | 'expired' | 'terminated' | 'draft';
}

export default function Tenants() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const queryClient = useQueryClient();
  const { data: leasesData, isLoading, isError, error} = useQuery({
    queryKey: ['property-leases'],
    queryFn: () => api.get('/property/leases').then(r => r.data),
  });
  const { data: units } = useQuery({
    queryKey: ['property-units'],
    queryFn: () => api.get('/property/units').then(r => r.data),
  });
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/property/properties').then(r => r.data),
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    unitId: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantIdNumber: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    paymentDay: '1',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/property/leases', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة المستأجر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['property-leases'] });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إضافة المستأجر: ' + (error?.response?.data?.message || error.message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/property/leases/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث بيانات المستأجر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['property-leases'] });
      setIsOpen(false);
      setSelectedTenant(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث البيانات: ' + (error?.response?.data?.message || error.message));
    },
  });

  const resetForm = () => {
    setFormData({
      unitId: '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      tenantIdNumber: '',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      paymentDay: '1',
    });
  };

  const handleSubmit = () => {
    if (!formData.unitId || !formData.tenantName || !formData.startDate || !formData.endDate || !formData.monthlyRent) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (selectedTenant) {
      updateMutation.mutate({
        id: selectedTenant.id,
        monthlyRent: formData.monthlyRent,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    } else {
      createMutation.mutate({
        unitId: parseInt(formData.unitId),
        tenantName: formData.tenantName,
        tenantPhone: formData.tenantPhone || undefined,
        tenantEmail: formData.tenantEmail || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        monthlyRent: formData.monthlyRent,
        securityDeposit: formData.securityDeposit || undefined,
        paymentDay: parseInt(formData.paymentDay) || undefined,
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      unitId: String(tenant.unitId),
      tenantName: tenant.name,
      tenantPhone: tenant.phone,
      tenantEmail: tenant.email,
      tenantIdNumber: tenant.idNumber,
      startDate: tenant.contractStart ? new Date(tenant.contractStart).toISOString().split('T')[0] : '',
      endDate: tenant.contractEnd ? new Date(tenant.contractEnd).toISOString().split('T')[0] : '',
      monthlyRent: String(tenant.monthlyRent),
      securityDeposit: '',
      paymentDay: '1',
    });
    setIsOpen(true);
  };

  const handleView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewOpen(true);
  };
  
  const tenants: Tenant[] = (leasesData || []).map((lease: any) => {
    const unit = units?.find((u: any) => u.id === lease.unitId);
    const property = properties?.find((p: any) => p.id === unit?.propertyId);
    return {
      id: lease.id,
      name: lease.tenantName || '',
      phone: lease.tenantPhone || '',
      email: lease.tenantEmail || '',
      idNumber: lease.tenantIdNumber || '',
      property: property?.name || '',
      unit: unit?.unitNumber || '',
      unitId: lease.unitId,
      contractStart: lease.leaseStartDate || lease.startDate || '',
      contractEnd: lease.leaseEndDate || lease.endDate || '',
      monthlyRent: parseFloat(lease.monthlyRent || '0'),
      status: lease.status || 'active'
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Tenant>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Tenant) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTenants = [...tenants]
    .filter(t => t.name.includes(searchTerm) || t.phone.includes(searchTerm) || t.property.includes(searchTerm))
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
      case 'active': return <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 ms-1" />نشط</Badge>;
      case 'expired': return <Badge className="bg-yellow-100 text-yellow-800"><UserX className="h-3 w-3 ms-1" />منتهي</Badge>;
      case 'terminated': return <Badge className="bg-red-100 text-red-800"><UserX className="h-3 w-3 ms-1" />ملغي</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const availableUnits = units?.filter((u: any) => u.status === 'available') || [];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
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
          <h2 className="text-2xl font-bold">المستأجرين</h2>
          <p className="text-gray-500">إدارة عقود الإيجار والمستأجرين</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setSelectedTenant(null);
          setIsOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          إضافة مستأجر
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المستأجرين</p>
              <h3 className="text-2xl font-bold">{tenants.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عقود نشطة</p>
              <h3 className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عقود منتهية</p>
              <h3 className="text-2xl font-bold">{tenants.filter(t => t.status === 'expired').length}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <UserX className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الإيجارات</p>
              <h3 className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.monthlyRent, 0).toLocaleString()} ر.س</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              قائمة المستأجرين
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
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    المستأجر
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>التواصل</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('property')}>
                  <div className="flex items-center gap-1">
                    العقار
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('contractEnd')}>
                  <div className="flex items-center gap-1">
                    انتهاء العقد
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('monthlyRent')}>
                  <div className="flex items-center gap-1">
                    الإيجار الشهري
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
              {sortedTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium">لا يوجد مستأجرين</p>
                      <p className="text-sm">ابدأ بإضافة مستأجرين للعقارات</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          {tenant.idNumber && <div className="text-sm text-gray-500">{tenant.idNumber}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tenant.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </div>
                        )}
                        {tenant.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {tenant.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.property}</div>
                        <div className="text-sm text-gray-500">{tenant.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell>{tenant.contractEnd ? formatDate(tenant.contractEnd) : '-'}</TableCell>
                    <TableCell>{tenant.monthlyRent.toLocaleString()} ر.س</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(tenant)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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
            <h3 className="text-lg font-bold">{selectedTenant ? 'تعديل بيانات المستأجر' : 'إضافة مستأجر جديد'}</h3>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الوحدة العقارية *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                disabled={!!selectedTenant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedTenant ? units : availableUnits)?.map((unit: any) => {
                    const property = properties?.find((p: any) => p.id === unit.propertyId);
                    return (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {property?.name} - {unit.unitNumber}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>اسم المستأجر *</Label>
              <Input
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                placeholder="الاسم الكامل"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input
                  value={formData.tenantPhone}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  placeholder="أدخل..."
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.tenantEmail}
                  onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                  placeholder="مثال"
                />
              </div>
            </div>
            
            {!selectedTenant && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البداية *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ النهاية *</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الإيجار الشهري *</Label>
                    <Input
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مبلغ التأمين</Label>
                    <Input
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}
            
            {selectedTenant && (
              <div className="space-y-2">
                <Label>الإيجار الشهري</Label>
                <Input
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                  placeholder="0"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              {selectedTenant ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        
      </div>)}


      {/* View*/}
      {isViewOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل المستأجر</h3>
          </div>
          
          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedTenant.name}</h3>
                  {selectedTenant.idNumber && <p className="text-sm text-gray-500">رقم الهوية: {selectedTenant.idNumber}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">العقار</p>
                  <p className="font-medium">{selectedTenant.property}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">الوحدة</p>
                  <p className="font-medium">{selectedTenant.unit}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">رقم الجوال</p>
                  <p className="font-medium">{selectedTenant.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="font-medium">{selectedTenant.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">بداية العقد</p>
                  <p className="font-medium">{selectedTenant.contractStart ? formatDate(selectedTenant.contractStart) : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">نهاية العقد</p>
                  <p className="font-medium">{selectedTenant.contractEnd ? formatDate(selectedTenant.contractEnd) : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">الإيجار الشهري</p>
                  <p className="font-medium">{selectedTenant.monthlyRent.toLocaleString()} ر.س</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">الحالة</p>
                  {getStatusBadge(selectedTenant.status)}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (selectedTenant) handleEdit(selectedTenant);
            }}>
              <Edit className="h-4 w-4 ms-2" />
              تعديل
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
