import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Shield,
  Loader2,
  ArrowRight
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

interface Policy {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  category: string;
  version: string | null;
  effectiveFrom: Date | string | null;
  effectiveTo: Date | string | null;
  isActive: boolean;
  description?: string | null;
  content?: string | null;
  contentAr?: string | null;
}

type ViewMode = 'list' | 'add' | 'view' | 'edit';

const categoryLabels: Record<string, string> = {
  attendance: 'الحضور',
  leave: 'الإجازات',
  payroll: 'الرواتب',
  conduct: 'السلوك',
  benefits: 'المزايا',
  general: 'عام',
};

export default function Policies() {
  const queryClient = useQueryClient();
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // نموذج إضافة سياسة جديدة
  const [newPolicy, setNewPolicy] = useState({
    code: '',
    name: '',
    nameAr: '',
    category: 'general' as const,
    description: '',
    content: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  // استخدام API الحقيقي
  const { data: policiesData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['policies-list'],
    queryFn: () => api.get('/policies').then(r => r.data),
  });
  const policies = policiesData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/policies', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة السياسة بنجاح');
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إضافة السياسة: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/policies/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث السياسة بنجاح');
      setViewMode('list');
      setSelectedPolicy(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث السياسة: ${error.message}`);
    },
  });

  const resetForm = () => {
    setNewPolicy({
      code: '',
      name: '',
      nameAr: '',
      category: 'general',
      description: '',
      content: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPolicies = [...policies]
    .filter((p: Policy) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameAr?.includes(searchTerm) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.includes(searchTerm)
    )
    .sort((a: Policy, b: Policy) => {
      const aVal = String((a as any)[sortField] || '');
      const bVal = String((b as any)[sortField] || '');
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ms-1" />سارية</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 ms-1" />غير سارية</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      attendance: 'bg-blue-100 text-blue-800',
      leave: 'bg-green-100 text-green-800',
      payroll: 'bg-purple-100 text-purple-800',
      conduct: 'bg-orange-100 text-orange-800',
      benefits: 'bg-teal-100 text-teal-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[category] || colors.general}>{categoryLabels[category] || category}</Badge>;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = policies.filter((p: Policy) => p.isActive).length;
  const inactiveCount = policies.filter((p: Policy) => !p.isActive).length;

  // نموذج إضافة سياسة جديدة
  if (viewMode === 'add') {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold">إضافة سياسة جديدة</h2>
            <p className="text-gray-500">أدخل بيانات السياسة الجديدة</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>كود السياسة *</Label>
                  <Input
                    value={newPolicy.code}
                    onChange={(e) => setNewPolicy({ ...newPolicy, code: e.target.value })}
                    placeholder="مثال: POL-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التصنيف *</Label>
                  <Select value={newPolicy.category} onValueChange={(v: any) => setNewPolicy({ ...newPolicy, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendance">الحضور</SelectItem>
                      <SelectItem value="leave">الإجازات</SelectItem>
                      <SelectItem value="payroll">الرواتب</SelectItem>
                      <SelectItem value="conduct">السلوك</SelectItem>
                      <SelectItem value="benefits">المزايا</SelectItem>
                      <SelectItem value="general">عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية *</Label>
                  <Input
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="الاسم"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالعربية *</Label>
                  <Input
                    value={newPolicy.nameAr}
                    onChange={(e) => setNewPolicy({ ...newPolicy, nameAr: e.target.value })}
                    placeholder="اسم السياسة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ السريان *</Label>
                  <Input
                    type="date"
                    value={newPolicy.effectiveFrom}
                    onChange={(e) => setNewPolicy({ ...newPolicy, effectiveFrom: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="وصف مختصر للسياسة"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>محتوى السياسة *</Label>
                <Textarea
                  value={newPolicy.content}
                  onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
                  placeholder="نص السياسة الكامل"
                  rows={6}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (!newPolicy.code || !newPolicy.name || !newPolicy.nameAr || !newPolicy.content) {
                    toast.error('يرجى ملء جميع الحقول المطلوبة');
                    return;
                  }
                  createMutation.mutate({
                    ...newPolicy,
                    effectiveFrom: new Date(newPolicy.effectiveFrom),
                  });
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إضافة السياسة
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل السياسة
  if (viewMode === 'view' && selectedPolicy) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedPolicy(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold">تفاصيل السياسة</h2>
            <p className="text-gray-500">{selectedPolicy.nameAr}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-gray-500">الكود</Label>
                <p className="font-mono">{selectedPolicy.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">التصنيف</Label>
                <p>{getCategoryBadge(selectedPolicy.category)}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالإنجليزية</Label>
                <p className="font-medium">{selectedPolicy.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">الاسم بالعربية</Label>
                <p className="font-medium">{selectedPolicy.nameAr}</p>
              </div>
              <div>
                <Label className="text-gray-500">تاريخ السريان</Label>
                <p>{selectedPolicy.effectiveFrom ? formatDate(selectedPolicy.effectiveFrom) : '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">الحالة</Label>
                <p>{getStatusBadge(selectedPolicy.isActive)}</p>
              </div>
            </div>
            {selectedPolicy.description && (
              <div className="mb-6">
                <Label className="text-gray-500">الوصف</Label>
                <p className="mt-1">{selectedPolicy.description}</p>
              </div>
            )}
            {selectedPolicy.content && (
              <div>
                <Label className="text-gray-500">محتوى السياسة</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedPolicy.content}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">السياسات والإجراءات</h2>
          <p className="text-gray-500">إدارة سياسات وإجراءات المنظمة</p>
        </div>
        <Button className="gap-2" onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4" />
          سياسة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي السياسات</p>
              <h3 className="text-2xl font-bold">{policies.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">سياسات سارية</p>
              <h3 className="text-2xl font-bold">{activeCount}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">غير سارية</p>
              <h3 className="text-2xl font-bold">{inactiveCount}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">التصنيفات</p>
              <h3 className="text-2xl font-bold">{new Set(policies?.map((p: Policy) => p.category)).size}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث في السياسات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة السياسات</CardTitle>
              <PrintButton title="قائمة السياسات" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end cursor-pointer" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    الكود
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-end cursor-pointer" onClick={() => handleSort('nameAr')}>
                  <div className="flex items-center gap-1">
                    الاسم
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-end">التصنيف</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">تاريخ السريان</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد سياسات
                  </TableCell>
                </TableRow>
              ) : (
                sortedPolicies.map((policy: Policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-mono">{policy.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{policy.nameAr}</p>
                        <p className="text-sm text-gray-500">{policy.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(policy.category)}</TableCell>
                    <TableCell>{getStatusBadge(policy.isActive)}</TableCell>
                    <TableCell>
                      {policy.effectiveFrom ? formatDate(policy.effectiveFrom) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPolicy(policy); setViewMode('view'); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          updateMutation.mutate({ id: policy.id, isActive: !policy.isActive });
                        }}>
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
    </div>
  );
}
