import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
import { AlertTriangle, Plus, Search, Edit, Shield, TrendingUp, TrendingDown, Inbox, Loader2, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

const CATEGORIES = [
  { value: 'operational', label: 'تشغيلي' },
  { value: 'financial', label: 'مالي' },
  { value: 'compliance', label: 'امتثال' },
  { value: 'strategic', label: 'استراتيجي' },
  { value: 'reputational', label: 'سمعة' },
  { value: 'technology', label: 'تقني' },
  { value: 'hr', label: 'موارد بشرية' },
  { value: 'legal', label: 'قانوني' },
];

export default function Risks() {
  const queryClient = useQueryClient();

  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'operational' as const,
    likelihood: 'medium' as const,
    impact: 'medium' as const,
    riskLevel: 'medium' as const,
    mitigationPlan: '',
  });

  // جلب المخاطر
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['governance-risks'],
    queryFn: () => api.get('/governance/risks').then(r => r.data),
  });

  // جلب الإحصائيات
  const { data: stats } = useQuery({
    queryKey: ['governance-risks-stats'],
    queryFn: () => api.get('/governance/risks/stats').then(r => r.data),
  });

  // إنشاء مخاطرة
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/governance/risks', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء المخاطرة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['governance-risks'] });
      queryClient.invalidateQueries({ queryKey: ['governance-risks-stats'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء المخاطرة: ' + error.message);
    },
  });

  // تحديث مخاطرة
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/governance/risks/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث المخاطرة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['governance-risks'] });
      queryClient.invalidateQueries({ queryKey: ['governance-risks-stats'] });
      setIsDialogOpen(false);
      setEditingRisk(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث المخاطرة: ' + error.message);
    },
  });

  // حذف مخاطرة
  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/governance/risks/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف المخاطرة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['governance-risks'] });
      queryClient.invalidateQueries({ queryKey: ['governance-risks-stats'] });
    },
    onError: (error: any) => {
      toast.error('فشل في حذف المخاطرة: ' + error.message);
    },
  });

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'operational',
      likelihood: 'medium',
      impact: 'medium',
      riskLevel: 'medium',
      mitigationPlan: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (editingRisk) {
      updateMutation.mutate({
        id: editingRisk.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (risk: any) => {
    setEditingRisk(risk);
    setFormData({
      code: risk.code,
      name: risk.name,
      description: risk.description || '',
      category: risk.category,
      likelihood: risk.likelihood,
      impact: risk.impact,
      riskLevel: risk.riskLevel,
      mitigationPlan: risk.mitigationPlan || '',
    });
    setIsDialogOpen(true);
  };

  const filteredRisks = risks.filter((r: any) =>
    r.name?.includes(searchTerm) ||
    r.code?.includes(searchTerm) ||
    r.category?.includes(searchTerm)
  );

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return <Badge className="bg-red-600 text-white">حرج</Badge>;
      case 'high': return <Badge className="bg-red-100 text-red-800">عالي</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">متوسط</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">منخفض</Badge>;
      default: return <Badge>{level}</Badge>;
    }
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return <Badge variant="outline" className="border-red-300 text-red-600"><TrendingUp className="h-3 w-3 ms-1" />عالي</Badge>;
      case 'medium': return <Badge variant="outline" className="border-yellow-300 text-yellow-600">متوسط</Badge>;
      case 'low': return <Badge variant="outline" className="border-green-300 text-green-600"><TrendingDown className="h-3 w-3 ms-1" />منخفض</Badge>;
      default: return <Badge variant="outline">{likelihood}</Badge>;
    }
  };

  const getMitigationBadge = (status: string) => {
    switch (status) {
      case 'mitigated': return <Badge className="bg-green-100 text-green-800"><Shield className="h-3 w-3 ms-1" />معالج</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">قيد المعالجة</Badge>;
      case 'pending': return <Badge className="bg-gray-100 text-gray-800">قيد الانتظار</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;


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
          <h2 className="text-2xl font-bold">إدارة المخاطر</h2>
          <p className="text-gray-500">تحديد وتقييم ومعالجة المخاطر</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setEditingRisk(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          تسجيل مخاطرة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المخاطر</p>
              <h3 className="text-2xl font-bold">{stats?.total || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مخاطر حرجة</p>
              <h3 className="text-2xl font-bold">{stats?.critical || 0}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">تم معالجتها</p>
              <h3 className="text-2xl font-bold">{stats?.mitigated || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قيد المعالجة</p>
              <h3 className="text-2xl font-bold">{stats?.inProgress || 0}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              سجل المخاطر
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
                <TableHead>الرمز</TableHead>
                <TableHead>المخاطرة</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الاحتمالية</TableHead>
                <TableHead>الأثر</TableHead>
                <TableHead>مستوى المخاطرة</TableHead>
                <TableHead>حالة المعالجة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium">لا توجد مخاطر مسجلة</p>
                      <p className="text-sm">ابدأ بتسجيل المخاطر لمتابعتها ومعالجتها</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRisks.map((risk: any) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.code}</TableCell>
                    <TableCell>{risk.name}</TableCell>
                    <TableCell>{getCategoryLabel(risk.category)}</TableCell>
                    <TableCell>{getLikelihoodBadge(risk.likelihood)}</TableCell>
                    <TableCell>{getLikelihoodBadge(risk.impact)}</TableCell>
                    <TableCell>{getRiskLevelBadge(risk.riskLevel)}</TableCell>
                    <TableCell>{getMitigationBadge(risk.mitigationStatus)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(risk)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete(risk.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4 text-red-500" />
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

      {/* Dialog */}
      {isDialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editingRisk ? 'تعديل المخاطرة' : 'تسجيل مخاطرة جديدة'}</h3>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رمز المخاطرة *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="RISK-001"
                  disabled={!!editingRisk}
                />
              </div>
              <div className="space-y-2">
                <Label>اسم المخاطرة *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اسم المخاطرة"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المخاطرة..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مستوى المخاطرة</Label>
                <Select
                  value={formData.riskLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, riskLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">حرج</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاحتمالية</Label>
                <Select
                  value={formData.likelihood}
                  onValueChange={(value: any) => setFormData({ ...formData, likelihood: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأثر</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>خطة المعالجة</Label>
              <Textarea
                value={formData.mitigationPlan}
                onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
                placeholder="خطة معالجة المخاطرة..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
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
              {editingRisk ? 'تحديث' : 'إنشاء'}
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
