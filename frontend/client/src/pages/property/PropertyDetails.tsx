import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, MapPin, DollarSign, Calendar, Home, Plus } from "lucide-react";
import { toast } from "sonner";

export default function PropertyDetails() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const deleteMutation = useMutation({ mutationFn: (data: any) => api.delete(`/property/properties/${data.id}`).then(r => r.data), onSuccess: () => { refetchUnits(); } });

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;

  // State for add unit dialog
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    unitType: 'apartment',
    floor: 1,
    area: '',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: ''
  });

  const { data: property, isLoading, refetch } = useQuery({
    queryKey: ['property', 'properties', propertyId],
    queryFn: () => api.get(`/property/properties/${propertyId}`).then(r => r.data),
    enabled: propertyId > 0
  });

  const { data: units, refetch: refetchUnits } = useQuery({
    queryKey: ['property', 'units', propertyId],
    queryFn: () => api.get(`/property/units?propertyId=${propertyId}`).then(r => r.data),
    enabled: propertyId > 0
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) => api.post('/property/units', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة الوحدة بنجاح');
      setShowAddUnit(false);
      setUnitForm({
        unitNumber: '',
        unitType: 'apartment',
        floor: 1,
        area: '',
        bedrooms: 1,
        bathrooms: 1,
        monthlyRent: '',
      });
      refetchUnits();
    },
    onError: () => toast.error('فشل إضافة الوحدة')
  });

  const handleAddUnit = () => {
    if (!unitForm.unitNumber) {
      toast.error('يرجى إدخال رقم الوحدة');
      return;
    }
    createUnitMutation.mutate({
      propertyId,
      unitNumber: unitForm.unitNumber,
      unitType: unitForm.unitType,
      floor: unitForm.floor,
      area: unitForm.area || undefined,
      bedrooms: unitForm.bedrooms,
      bathrooms: unitForm.bathrooms,
      monthlyRent: unitForm.monthlyRent || undefined
    });
  };

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {


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

  if (!property) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">العقار غير موجود</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
      case 'under_maintenance': return <Badge className="bg-amber-100 text-amber-800">تحت الصيانة</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUnitStatusBadge = (status: string) => {
    switch (status) {
      case 'vacant': return <Badge className="bg-green-100 text-green-800">شاغرة</Badge>;
      case 'occupied': return <Badge className="bg-blue-100 text-blue-800">مؤجرة</Badge>;
      case 'maintenance': return <Badge className="bg-amber-100 text-amber-800">صيانة</Badge>;
      case 'reserved': return <Badge className="bg-purple-100 text-purple-800">محجوزة</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      'building': 'مبنى',
      'land': 'أرض',
      'apartment': 'شقة',
      'villa': 'فيلا',
      'office': 'مكتب',
      'warehouse': 'مستودع',
      'other': 'أخرى',
    };
    return types[type] || type;
  };

  const getUnitTypeName = (type: string) => {
    const types: Record<string, string> = {
      'apartment': 'شقة',
      'studio': 'استوديو',
      'office': 'مكتب',
      'shop': 'محل',
      'parking': 'موقف',
      'storage': 'مخزن',
      'other': 'أخرى',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{property.name}</h2>
          <p className="text-gray-500">{getTypeName(property.propertyType)}</p>
        </div>
        {getStatusBadge(property.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات العقار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">العنوان</p>
                <p className="font-medium">{property.address}</p>
                {property.city && <p className="text-sm text-gray-500">{property.city}</p>}
              </div>
            </div>
            {property.area && (
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">المساحة</p>
                  <p className="font-medium">{property.area} م²</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              المعلومات المالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {property.purchasePrice && (
              <div>
                <p className="text-sm text-gray-500">سعر الشراء</p>
                <p className="font-medium">{parseFloat(property.purchasePrice).toLocaleString()} ر.س</p>
              </div>
            )}
            {property.currentValue && (
              <div>
                <p className="text-sm text-gray-500">القيمة الحالية</p>
                <p className="font-medium">{parseFloat(property.currentValue).toLocaleString()} ر.س</p>
              </div>
            )}
            {property.purchaseDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">تاريخ الشراء</p>
                  <p className="font-medium">{formatDate(property.purchaseDate)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الوحدات</CardTitle>
          <Button size="sm" className="gap-2" onClick={() => setShowAddUnit(true)}>
            <Plus className="h-4 w-4" />
            إضافة وحدة
          </Button>
        </CardHeader>
        <CardContent>
          {units && units.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit: any) => (
                <Card key={unit.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">وحدة {unit.unitNumber}</h4>
                      {getUnitStatusBadge(unit.status)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>النوع: {getUnitTypeName(unit.unitType || 'apartment')}</p>
                      {unit.floor && <p>الطابق: {unit.floor}</p>}
                      {unit.area && <p>المساحة: {unit.area} م²</p>}
                      {unit.bedrooms && <p>غرف النوم: {unit.bedrooms}</p>}
                      {unit.monthlyRent && <p>الإيجار الشهري: {parseFloat(unit.monthlyRent).toLocaleString()} ر.س</p>}
                    </div>
                  </CardContent>
                
                <div className="flex gap-2 mt-2"> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: unit.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد وحدات مسجلة لهذا العقار</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowAddUnit(true)}>
                <Plus className="h-4 w-4" />
                إضافة وحدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إضافة وحدة */}
      {showAddUnit && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Plus className="h-5 w-5" />
              إضافة وحدة جديدة
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الوحدة *</Label>
              <Input
                value={unitForm.unitNumber}
                onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                placeholder="مثال: A101"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الوحدة</Label>
                <Select value={unitForm.unitType} onValueChange={(v) => setUnitForm({ ...unitForm, unitType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">شقة</SelectItem>
                    <SelectItem value="studio">استوديو</SelectItem>
                    <SelectItem value="office">مكتب</SelectItem>
                    <SelectItem value="shop">محل</SelectItem>
                    <SelectItem value="parking">موقف</SelectItem>
                    <SelectItem value="storage">مخزن</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الطابق</Label>
                <Input
                  type="number"
                  value={unitForm.floor}
                  onChange={(e) => setUnitForm({ ...unitForm, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المساحة (م²)</Label>
                <Input
                  value={unitForm.area}
                  onChange={(e) => setUnitForm({ ...unitForm, area: e.target.value })}
                  placeholder="مثال: 120"
                />
              </div>
              <div className="space-y-2">
                <Label>الإيجار الشهري (ر.س)</Label>
                <Input
                  value={unitForm.monthlyRent}
                  onChange={(e) => setUnitForm({ ...unitForm, monthlyRent: e.target.value })}
                  placeholder="مثال: 3000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>غرف النوم</Label>
                <Input
                  type="number"
                  value={unitForm.bedrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bedrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>دورات المياه</Label>
                <Input
                  type="number"
                  value={unitForm.bathrooms}
                  onChange={(e) => setUnitForm({ ...unitForm, bathrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowAddUnit(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddUnit} disabled={createUnitMutation.isPending}>
              {createUnitMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إضافة
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
