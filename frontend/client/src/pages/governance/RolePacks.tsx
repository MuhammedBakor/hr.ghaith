import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2, ArrowRight, Users, Key, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

type ViewMode = 'list' | 'view' | 'create' | 'edit';

interface RolePack {
  id: number;
  code: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  category: string;
  scope?: string | null;
  priority?: number | null;
  permissions?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORIES = [
  { value: 'system', label: 'النظام', labelAr: 'النظام' },
  { value: 'hr', label: 'الموارد البشرية', labelAr: 'الموارد البشرية' },
  { value: 'finance', label: 'المالية', labelAr: 'المالية' },
  { value: 'fleet', label: 'الأسطول', labelAr: 'الأسطول' },
  { value: 'legal', label: 'القانونية', labelAr: 'القانونية' },
  { value: 'property', label: 'الأملاك', labelAr: 'الأملاك' },
  { value: 'general', label: 'عام', labelAr: 'عام' },
];

const SCOPES = [
  { value: 'global', label: 'عام (جميع الفروع)', labelAr: 'عام (جميع الفروع)' },
  { value: 'company', label: 'على مستوى الشركة', labelAr: 'على مستوى الشركة' },
  { value: 'branch', label: 'على مستوى الفرع', labelAr: 'على مستوى الفرع' },
  { value: 'department', label: 'على مستوى القسم', labelAr: 'على مستوى القسم' },
];

export default function RolePacks() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPack, setSelectedPack] = useState<RolePack | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    description: '',
    category: 'general',
    scope: 'branch',
    isDefault: false,
    priority: 50,
  });
  
  const utils = trpc.useUtils();
  const { data: rolePacks, isLoading, isError, error} = trpc.kernel.rolePacks?.list?.useQuery();
  
  // جلب صلاحيات الحزمة المحددة
  const { data: packPermissions, isLoading: isLoadingPermissions } = trpc.kernel.rolePacks?.getPermissions?.useQuery(
    { rolePackId: selectedPack?.id || 0 },
    { enabled: !!selectedPack?.id && showPermissionsDialog }
  );
  
  // Create mutation
  const createMutation = trpc.kernel.rolePacks?.create?.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء الصفة بنجاح');
      utils.kernel.rolePacks?.list?.invalidate();
      setViewMode('list');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء الصفة: ' + error.message);
    },
  });
  
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      nameAr: '',
      description: '',
      category: 'general',
      scope: 'branch',
      isDefault: false,
      priority: 50,
    });
  };
  
  const filteredPacks = (rolePacks || []).filter((pack: RolePack) => {
    const matchesSearch = 
      pack.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.nameAr?.includes(searchTerm) ||
      pack.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || pack.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const openViewDialog = (pack: RolePack) => {
    setSelectedPack(pack);
    setViewMode('view');
  };
  
  const openPermissionsDialog = (pack: RolePack) => {
    setSelectedPack(pack);
    setShowPermissionsDialog(true);
  };
  
  const openEditDialog = (pack: RolePack) => {
    setSelectedPack(pack);
    setFormData({
      code: pack.code,
      name: pack.name,
      nameAr: pack.nameAr || '',
      description: pack.description || '',
      category: pack.category,
      scope: pack.scope || 'branch',
      isDefault: pack.isDefault,
      priority: pack.priority || 50,
    });
    setViewMode('edit');
  };
  
  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createMutation.mutate(formData);
  };
  
  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.labelAr || category;
  };
  
  const getScopeLabel = (scope: string) => {
    return SCOPES.find(s => s.value === scope)?.labelAr || scope;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // عرض تفاصيل الصفة
  if (viewMode === 'view' && selectedPack) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedPack(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-lg md:text-2xl font-bold">تفاصيل الصفة</h2>
            <p className="text-gray-500">{selectedPack.nameAr || selectedPack.name}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-500">الكود</Label>
                <p className="font-mono">{selectedPack.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالإنجليزية</Label>
                <p className="font-medium">{selectedPack.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالعربية</Label>
                <p className="font-medium">{selectedPack.nameAr || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">التصنيف</Label>
                <Badge variant="outline">{getCategoryLabel(selectedPack.category)}</Badge>
              </div>
              <div>
                <Label className="text-gray-500">النطاق</Label>
                <Badge variant="secondary">{getScopeLabel(selectedPack.scope || 'system')}</Badge>
              </div>
              <div>
                <Label className="text-gray-500">الأولوية</Label>
                <p className="font-medium">{selectedPack.priority}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">الوصف</Label>
                <p className="font-medium">{selectedPack.description || 'لا يوجد وصف'}</p>
              </div>
              <div>
                <Label className="text-gray-500">الحالة</Label>
                <Badge variant={selectedPack.isActive ? 'default' : 'secondary'}>
                  {selectedPack.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">افتراضي</Label>
                <Badge variant={selectedPack.isDefault ? 'default' : 'outline'}>
                  {selectedPack.isDefault ? 'نعم' : 'لا'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              الصلاحيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openPermissionsDialog(selectedPack)}>
              عرض الصلاحيات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نموذج إنشاء/تعديل صفة
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-lg md:text-2xl font-bold">
              {viewMode === 'create' ? 'إنشاء صفة جديدة' : 'تعديل الصفة'}
            </h2>
            <p className="text-gray-500">
              {viewMode === 'create' ? 'إضافة صفة جديدة للنظام' : 'تعديل بيانات الصفة'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>الكود *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="أدخل..."
                  className="font-mono"
                />
              </div>
              <div>
                <Label>التصنيف *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.labelAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الاسم بالإنجليزية *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل..."
                />
              </div>
              <div>
                <Label>الاسم بالعربية</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مدير الموارد البشرية"
                />
              </div>
              <div>
                <Label>النطاق *</Label>
                <Select value={formData.scope} onValueChange={(v) => setFormData({ ...formData, scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map(scope => (
                      <SelectItem key={scope.value} value={scope.value}>{scope.labelAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الأولوية</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 50 })}
                  min={1}
                  max={100}
                />
              </div>
              <div className="col-span-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الصفة وصلاحياتها..."
                  rows={3}
                />
              </div>
              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded"
                  />
                  <span>صفة افتراضية للمستخدمين الجدد</span>
                </label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-6">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  viewMode === 'create' ? 'إنشاء الصفة' : 'حفظ التعديلات'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            إدارة الصفات
          </h2>
          <p className="text-gray-500">إدارة صفات وأدوار المستخدمين في النظام</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <PrintButton title="الصفات" />
          <Button onClick={() => setViewMode('create')}>
            <Plus className="h-4 w-4 ms-2" />
            صفة جديدة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث عن صفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="جميع التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.labelAr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Packs Table */}
      <Card>
        <CardHeader>
          <CardTitle>الصفات ({filteredPacks.length})</CardTitle>
          <CardDescription>قوالب الصفات الجاهزة للتعيين على المستخدمين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
<Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">الكود</TableHead>
                <TableHead className="text-end">الاسم</TableHead>
                <TableHead className="text-end">التصنيف</TableHead>
                <TableHead className="text-end">النطاق</TableHead>
                <TableHead className="text-end">الأولوية</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    لا توجد صفات مطابقة للبحث
                  </TableCell>
                </TableRow>
              ) : (
                filteredPacks.map((pack: RolePack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-mono">{pack.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pack.nameAr || pack.name}</p>
                        {pack.nameAr && <p className="text-xs text-gray-500">{pack.name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(pack.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getScopeLabel(pack.scope || 'system')}</Badge>
                    </TableCell>
                    <TableCell>{pack.priority}</TableCell>
                    <TableCell>
                      <Badge variant={pack.isActive ? 'default' : 'secondary'}>
                        {pack.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                      {pack.isDefault && (
                        <Badge variant="outline" className="me-1">افتراضي</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openViewDialog(pack)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openPermissionsDialog(pack)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(pack)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
</div>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      {showPermissionsDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">صلاحيات الصفة: {selectedPack?.nameAr || selectedPack?.name}</h3>
            <p className="text-sm text-gray-500">
              قائمة الصلاحيات المرتبطة بهذه الصفة
            </p>
          </div>
          
          {isLoadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : packPermissions && packPermissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الوحدة</TableHead>
                  <TableHead className="text-end">المورد</TableHead>
                  <TableHead className="text-end">الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packPermissions.map((perm: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{perm.module}</TableCell>
                    <TableCell>{perm.resource}</TableCell>
                    <TableCell>{perm.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد صلاحيات مرتبطة بهذه الصفة
            </div>
          )}
          
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
