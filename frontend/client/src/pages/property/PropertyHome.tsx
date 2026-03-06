import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Building2, MapPin, DollarSign, Search } from "lucide-react";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";

export default function PropertyHome() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProperty, setNewProperty] = useState({
    name: '',
    propertyType: 'building' as const,
    address: '',
    city: '',
    area: '',
    purchasePrice: '',
  });

  const { data: propertiesData, isLoading, refetch } = useQuery({ queryKey: ['property', 'properties'], queryFn: () => api.get('/property/properties').then(r => r.data) });

  const createPropertyMutation = useMutation({
    mutationFn: (data: any) => api.post('/property/properties', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة العقار بنجاح');
      setIsOpen(false);
      setNewProperty({ name: '', propertyType: 'building', address: '', city: '', area: '', purchasePrice: '' });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في إضافة العقار');
    },
  });

  const properties = propertiesData || [];
  
  const filteredProperties = properties.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProperty = () => {
    if (!newProperty.name || !newProperty.address) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createPropertyMutation.mutate({
      name: newProperty.name,
      propertyType: newProperty.propertyType,
      address: newProperty.address,
      city: newProperty.city || undefined,
      area: newProperty.area || undefined,
      purchasePrice: newProperty.purchasePrice || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive': return <Badge variant="secondary">غير نشط</Badge>;
      case 'under_maintenance': return <Badge className="bg-amber-100 text-amber-800">تحت الصيانة</Badge>;
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

  const stats = {
    total: properties.length,
    active: properties.filter((p: any) => p.status === 'active').length,
    totalValue: properties.reduce((sum: number, p: any) => sum + parseFloat(p.currentValue || p.purchasePrice || '0'), 0),
  };

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
          <h2 className="text-2xl font-bold tracking-tight">إدارة العقارات</h2>
          <p className="text-gray-500">إدارة العقارات والوحدات والعقود</p>
        </div>
        {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إضافة عقار جديد</h3>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم العقار *</Label>
                <Input 
                  value={newProperty.name} 
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})} 
                  placeholder="مثال: برج الأعمال" 
                />
              </div>
              <div className="space-y-2">
                <Label>نوع العقار *</Label>
                <Select value={newProperty.propertyType} onValueChange={(v: any) => setNewProperty({...newProperty, propertyType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">مبنى</SelectItem>
                    <SelectItem value="land">أرض</SelectItem>
                    <SelectItem value="apartment">شقة</SelectItem>
                    <SelectItem value="villa">فيلا</SelectItem>
                    <SelectItem value="office">مكتب</SelectItem>
                    <SelectItem value="warehouse">مستودع</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العنوان *</Label>
                <Input 
                  value={newProperty.address} 
                  onChange={(e) => setNewProperty({...newProperty, address: e.target.value})} 
                  placeholder="العنوان الكامل" 
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input 
                  value={newProperty.city} 
                  onChange={(e) => setNewProperty({...newProperty, city: e.target.value})} 
                  placeholder="الرياض" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المساحة (م²)</Label>
                  <Input 
                    value={newProperty.area} 
                    onChange={(e) => setNewProperty({...newProperty, area: e.target.value})} 
                    placeholder="500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>سعر الشراء</Label>
                  <Input 
                    value={newProperty.purchasePrice} 
                    onChange={(e) => setNewProperty({...newProperty, purchasePrice: e.target.value})} 
                    placeholder="1000000" 
                  />
                </div>
              </div>
              <Button onClick={handleCreateProperty} className="w-full" disabled={createPropertyMutation.isPending}>
                {createPropertyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة العقار'}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي العقارات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عقارات نشطة</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي القيمة</p>
              <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()} ر.س</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="البحث عن عقار..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pe-10"
        />
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العقارات</CardTitle>
              <PrintButton title="قائمة العقارات" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">اسم العقار</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">العنوان</TableHead>
                <TableHead className="text-end">القيمة</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد عقارات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property: any) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Link href={`/property/${property.id}`}>
                        <span className="font-medium text-primary hover:underline cursor-pointer">{property.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{getTypeName(property.propertyType)}</TableCell>
                    <TableCell>
                      <div>
                        <p>{property.address}</p>
                        {property.city && <p className="text-sm text-gray-500">{property.city}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.currentValue || property.purchasePrice 
                        ? `${parseFloat(property.currentValue || property.purchasePrice).toLocaleString()} ر.س`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
