import { formatDate } from '@/lib/formatDate';
import React, { useState } from "react";
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  Eye,
  Star,
  Users,
  Clock,
  BarChart3,
  Filter,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PrintButton } from "@/components/PrintButton";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  useBiDashboards,
  useCreateBiDashboard,
  useUpdateBiDashboard,
  useDeleteBiDashboard,
  BiDashboard
} from "@/services/biService";

export default function Dashboards() {
  const { user: currentUser, error: authError } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [formData, setFormData] = useState<Partial<BiDashboard>>({ name: '', description: '', type: 'hr' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BiDashboard>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: dashboards = [], isLoading, refetch } = useBiDashboards();
  const createMutation = useCreateBiDashboard();
  const deleteMutation = useDeleteBiDashboard();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'مطلوب';
    if (!formData.description?.trim()) errors.description = 'مطلوب';
    if (!formData.type?.trim()) errors.type = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    createMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', description: '', type: 'hr' });
        setIsSubmitting(false);
        setIsCreateOpen(false);
        toast.success('تم الحفظ بنجاح');
        refetch();
      },
      onError: (err: any) => {
        setIsSubmitting(false);
        toast.error(err.message || 'حدث خطأ');
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("تم حذف لوحة البيانات بنجاح");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "فشل الحذف");
        },
      });
    }
  };

  const handleSort = (field: keyof BiDashboard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDashboards = [...dashboards]
    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.type.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const getStatusBadge = (isFavorite: boolean) => {
    return isFavorite ?
      <Badge className="bg-yellow-100 text-yellow-800">مفضلة</Badge> :
      <Badge className="bg-gray-100 text-gray-800">عادية</Badge>;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (authError) return <div className="p-8 text-center text-red-500">حدث خطأ في المصادقة</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحات المعلومات</h2>
          <p className="text-gray-500">إدارة لوحات المعلومات التحليلية</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          لوحة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي اللوحات</p>
              <h3 className="text-2xl font-bold">{dashboards.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مفضلة</p>
              <h3 className="text-2xl font-bold">{dashboards.filter(d => d.isFavorite).length}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              قائمة اللوحات
            </CardTitle>
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
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('name')}>اللوحة</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('type')}>التصنيف</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('createdAt')}>التاريخ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDashboards.map((dashboard) => (
                <TableRow key={dashboard.id}>
                  <TableCell>
                    <div className="font-medium">{dashboard.name}</div>
                    <div className="text-sm text-gray-500">{dashboard.description}</div>
                  </TableCell>
                  <TableCell>{dashboard.type}</TableCell>
                  <TableCell>{formatDate(dashboard.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(dashboard.isFavorite)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(dashboard.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء لوحة معلومات جديدة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={formErrors.name ? "border-red-500" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className={formErrors.description ? "border-red-500" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">النوع</Label>
              <Select value={formData.type} onValueChange={(val) => handleFieldChange("type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">الموارد البشرية</SelectItem>
                  <SelectItem value="finance">المالية</SelectItem>
                  <SelectItem value="sales">المبيعات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
