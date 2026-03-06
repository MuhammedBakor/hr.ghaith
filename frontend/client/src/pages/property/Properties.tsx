import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { toast } from 'sonner';
import { Building2, Plus, Search, MapPin, DollarSign, Users, ArrowUpDown, Edit, Trash2, Home, Warehouse, Building, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PrintButton } from "@/components/PrintButton";

export default function Properties() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    propertyType: 'building' as 'building' | 'land' | 'apartment' | 'villa' | 'office' | 'warehouse' | 'other',
    address: '',
    city: '',
    area: '',
    purchasePrice: '',
    currentValue: '',
  });

  const queryClient = useQueryClient();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/property/properties').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/property/properties', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة العقار بنجاح');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setIsCreateOpen(false);
      setNewProperty({
        name: '',
        propertyType: 'building',
        address: '',
        city: '',
        area: '',
        purchasePrice: '',
        currentValue: '',
      });
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: any) => api.delete(`/property/properties/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف العقار بنجاح');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error?.response?.data?.message || error.message));
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreate = () => {
    if (!newProperty.name || !newProperty.address) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createMutation.mutate({
      name: newProperty.name,
      propertyType: newProperty.propertyType,
      address: newProperty.address,
      city: newProperty.city || undefined,
      area: newProperty.area || undefined,
      purchasePrice: newProperty.purchasePrice || undefined,
      currentValue: newProperty.currentValue || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const sortedProperties = [...properties]
    .filter((p: any) => 
      (p.name?.includes(searchTerm) || p.address?.includes(searchTerm))
    )
    .sort((a: any, b: any) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'villa':
      case 'apartment': return <Home className="h-4 w-4" />;
      case 'office':
      case 'building': return <Building className="h-4 w-4" />;
      case 'warehouse': return <Warehouse className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      building: 'مبنى',
      land: 'أرض',
      apartment: 'شقة',
      villa: 'فيلا',
      office: 'مكتب',
      warehouse: 'مستودع',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
      case 'sold': return <Badge className="bg-blue-100 text-blue-800">مباع</Badge>;
      case 'under_maintenance': return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const totalValue = properties.reduce((sum: number, p: any) => sum + parseFloat(p.currentValue || '0'), 0);
  const activeCount = properties.filter((p: any) => p.status === 'active').length;

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
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
          <h2 className="text-2xl font-bold">إدارة العقارات</h2>
          <p className="text-gray-500">قائمة العقارات والأملاك</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          إضافة عقار
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي العقارات</p>
              <h3 className="text-2xl font-bold">{properties.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">القيمة الإجمالية</p>
              <h3 className="text-2xl font-bold">{totalValue.toLocaleString()} ر.س</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">العقارات النشطة</p>
              <h3 className="text-2xl font-bold">{activeCount}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">متاح للبيع</p>
              <h3 className="text-2xl font-bold">{properties.filter((p: any) => p.status === 'inactive').length}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <MapPin className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              قائمة العقارات
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
          {sortedProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد عقارات حالياً</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                إضافة أول عقار
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      العقار
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('propertyType')}>
                    <div className="flex items-center gap-1">
                      النوع
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('address')}>
                    <div className="flex items-center gap-1">
                      العنوان
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('area')}>
                    <div className="flex items-center gap-1">
                      المساحة
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('currentValue')}>
                    <div className="flex items-center gap-1">
                      القيمة الحالية
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
                {sortedProperties.map((property: any) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(property.propertyType)}
                        {getTypeLabel(property.propertyType)}
                      </div>
                    </TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.area ? `${parseFloat(property.area).toLocaleString()} م²` : '-'}</TableCell>
                    <TableCell>{property.currentValue ? `${parseFloat(property.currentValue).toLocaleString()} ر.س` : '-'}</TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("تعديل العقار")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => handleDelete(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Building2 className="h-5 w-5" />
              إضافة عقار جديد
            </h3>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم العقار *</Label>
              <Input
                id="name"
                value={newProperty.name}
                onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                placeholder="مثال: برج الأعمال"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">نوع العقار *</Label>
              <Select
                value={newProperty.propertyType}
                onValueChange={(value: any) => setNewProperty({ ...newProperty, propertyType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="building">مبنى</SelectItem>
                  <SelectItem value="apartment">شقة</SelectItem>
                  <SelectItem value="villa">فيلا</SelectItem>
                  <SelectItem value="office">مكتب</SelectItem>
                  <SelectItem value="warehouse">مستودع</SelectItem>
                  <SelectItem value="land">أرض</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">العنوان *</Label>
              <Input
                id="address"
                value={newProperty.address}
                onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                placeholder="مثال: الرياض - حي العليا"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={newProperty.city}
                  onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                  placeholder="الرياض"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">المساحة (م²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={newProperty.area}
                  onChange={(e) => setNewProperty({ ...newProperty, area: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">سعر الشراء (ر.س)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={newProperty.purchasePrice}
                  onChange={(e) => setNewProperty({ ...newProperty, purchasePrice: e.target.value })}
                  placeholder="500000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentValue">القيمة الحالية (ر.س)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={newProperty.currentValue}
                  onChange={(e) => setNewProperty({ ...newProperty, currentValue: e.target.value })}
                  placeholder="600000"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </div>
        </div>
      </div>)}
    
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
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