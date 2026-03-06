import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, ArrowUpDown, Edit, Eye, AlertTriangle, CheckCircle, Clock, Loader2, Inbox } from 'lucide-react';
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
import { toast } from 'sonner';

interface Contract {
  id: number;
  title: string;
  partyA: string;
  partyB: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  value: string | null;
  status: string;
}

export default function Contracts() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    partyA: '',
    partyB: '',
    startDate: '',
    endDate: '',
    value: '',
    status: 'draft' as const,
  });

  const queryClient = useQueryClient();

  // استخدام API الحقيقي
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['property-contracts'],
    queryFn: () => api.get('/property/contracts').then(r => r.data),
  });
  const contracts = (contractsData || []) as Contract[];

  // إنشاء عقد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/property/contracts', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء العقد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['property-contracts'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء العقد: ' + (error?.response?.data?.message || error.message));
    },
  });

  // تحديث عقد
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/property/contracts/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث العقد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['property-contracts'] });
      setIsDialogOpen(false);
      setEditingContract(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث العقد: ' + (error?.response?.data?.message || error.message));
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      partyA: '',
      partyB: '',
      startDate: '',
      endDate: '',
      value: '',
      status: 'draft',
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.partyA || !formData.partyB) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (editingContract) {
      updateMutation.mutate({
        id: editingContract.id,
        title: formData.title,
        status: formData.status,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        partyA: formData.partyA,
        partyB: formData.partyB,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        value: formData.value || undefined,
        status: formData.status,
      });
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      title: contract.title,
      partyA: contract.partyA,
      partyB: contract.partyB,
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
      value: contract.value || '',
      status: contract.status as any,
    });
    setIsDialogOpen(true);
  };

  const handleView = (contract: Contract) => {
    setViewingContract(contract);
  };

  // حساب الإحصائيات
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length,
    expired: contracts.filter(c => c.status === 'expired').length,
  };

  // الترتيب
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // الفلترة والترتيب
  const filteredContracts = contracts
    .filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partyA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partyB?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField as keyof Contract] || '';
      const bVal = b[sortField as keyof Contract] || '';
      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      }
      return String(bVal).localeCompare(String(aVal));
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">ساري</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      case 'expired': return <Badge className="bg-red-100 text-red-800">منتهي</Badge>;
      case 'terminated': return <Badge className="bg-orange-100 text-orange-800">ملغي</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return formatDate(date);
  };

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
          <h2 className="text-2xl font-bold">العقود</h2>
          <p className="text-gray-500">إدارة عقود الإيجار والاتفاقيات</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setEditingContract(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          عقد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي العقود</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عقود سارية</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قاربت الانتهاء</p>
              <h3 className="text-2xl font-bold text-yellow-600">{stats.expiring}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">منتهية</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.expired}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث بالعنوان أو الأطراف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">لا توجد عقود</p>
              <p className="text-sm mb-4">قم بإنشاء عقد جديد للبدء</p>
              <Button onClick={() => {
                resetForm();
                setEditingContract(null);
                setIsDialogOpen(true);
              }} className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء عقد جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" className="gap-1 p-0 h-auto font-medium" onClick={() => handleSort('title')}>
                      العنوان
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>الطرف الأول</TableHead>
                  <TableHead>الطرف الثاني</TableHead>
                  <TableHead>
                    <Button variant="ghost" className="gap-1 p-0 h-auto font-medium" onClick={() => handleSort('startDate')}>
                      تاريخ البداية
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="gap-1 p-0 h-auto font-medium" onClick={() => handleSort('endDate')}>
                      تاريخ النهاية
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.title}</TableCell>
                    <TableCell>{contract.partyA}</TableCell>
                    <TableCell>{contract.partyB}</TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell>{formatDate(contract.endDate)}</TableCell>
                    <TableCell>{contract.value || '-'}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(contract)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)}>
                          <Edit className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingContract ? 'تعديل العقد' : 'إنشاء عقد جديد'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>عنوان العقد *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان العقد"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الطرف الأول *</Label>
                <Input
                  value={formData.partyA}
                  onChange={(e) => setFormData({ ...formData, partyA: e.target.value })}
                  placeholder="اسم الطرف الأول"
                  disabled={!!editingContract}
                />
              </div>
              <div className="space-y-2">
                <Label>الطرف الثاني *</Label>
                <Input
                  value={formData.partyB}
                  onChange={(e) => setFormData({ ...formData, partyB: e.target.value })}
                  placeholder="اسم الطرف الثاني"
                  disabled={!!editingContract}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={!!editingContract}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>قيمة العقد</Label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="مثال: 50,000 ريال"
                  disabled={!!editingContract}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">ساري</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="terminated">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 ms-2 animate-spin" />
              )}
              {editingContract ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={() => setViewingContract(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل العقد</DialogTitle>
          </DialogHeader>
          
          {viewingContract && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">العنوان</Label>
                  <p className="font-medium">{viewingContract.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500">الحالة</Label>
                  <p>{getStatusBadge(viewingContract.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">الطرف الأول</Label>
                  <p className="font-medium">{viewingContract.partyA}</p>
                </div>
                <div>
                  <Label className="text-gray-500">الطرف الثاني</Label>
                  <p className="font-medium">{viewingContract.partyB}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">تاريخ البداية</Label>
                  <p className="font-medium">{formatDate(viewingContract.startDate)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">تاريخ النهاية</Label>
                  <p className="font-medium">{formatDate(viewingContract.endDate)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">قيمة العقد</Label>
                <p className="font-medium">{viewingContract.value || '-'}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingContract(null)}>
              إغلاق
            </Button>
            <Button onClick={() => {
              if (viewingContract) {
                handleEdit(viewingContract);
                setViewingContract(null);
              }
            }}>
              تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
