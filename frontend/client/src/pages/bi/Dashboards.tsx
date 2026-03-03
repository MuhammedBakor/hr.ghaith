import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  BarChart3
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
import { Dialog } from "@/components/ui/dialog";


interface Dashboard {
  id: number;
  name: string;
  description: string;
  category: string;
  owner: string;
  viewers: number;
  lastUpdated: string;
  isFavorite: boolean;
  status: 'published' | 'draft';
}

// جلب البيانات من API

export default function Dashboards() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'name': '', 'description': '', 'type': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.toString().trim()) errors.name = 'مطلوب';
    if (!formData.description?.toString().trim()) errors.description = 'مطلوب';
    if (!formData.type?.toString().trim()) errors.type = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = trpc.bi.create.useMutation({
    onSuccess: () => {
      setFormData({ 'name': '', 'description': '', 'type': '' });
      setIsSubmitting(false);
      toast.success('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      toast.error(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const utils = trpc.useUtils();

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // جلب لوحات المعلومات من API
  const { data: dashboardsData, isLoading, isError, error } = trpc.bi.dashboards.list.useQuery();



  const dashboards: Dashboard[] = dashboardsData?.map((d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description || '',
    category: 'عام',
    owner: 'النظام',
    viewers: 0,
    lastUpdated: d.createdAt || new Date().toISOString(),
    isFavorite: false,
    status: d.isPublic ? 'published' : 'draft' as const,
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Dashboard>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Dashboard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDashboards = [...dashboards]
    .filter(d => d.name.includes(searchTerm) || d.category.includes(searchTerm))
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
      case 'published': return <Badge className="bg-green-100 text-green-800">منشور</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };


  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <div className="space-y-6" dir="rtl">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input value={formData.name || ""} onChange={(e) => handleFieldChange("name", e.target.value)} placeholder="الاسم" className={`w-full px-3 py-2 border rounded-lg ${formErrors.name ? "border-red-500" : ""}`} />
            {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <input value={formData.description || ""} onChange={(e) => handleFieldChange("description", e.target.value)} placeholder="الوصف" className={`w-full px-3 py-2 border rounded-lg ${formErrors.description ? "border-red-500" : ""}`} />
            {formErrors.description && <span className="text-xs text-red-500">{formErrors.description}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">النوع</label>
            <input value={formData.type || ""} onChange={(e) => handleFieldChange("type", e.target.value)} placeholder="النوع" className={`w-full px-3 py-2 border rounded-lg ${formErrors.type ? "border-red-500" : ""}`} />
            {formErrors.type && <span className="text-xs text-red-500">{formErrors.type}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحات المعلومات</h2>
          <p className="text-gray-500">إدارة لوحات المعلومات التحليلية</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          لوحة جديدة
        </Button>
      </div>

      {/* Stats */}
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
              <p className="text-sm text-gray-500">منشورة</p>
              <h3 className="text-2xl font-bold">{dashboards.filter(d => d.status === 'published').length}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المفضلة</p>
              <h3 className="text-2xl font-bold">{dashboards.filter(d => d.isFavorite).length}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المشاهدين</p>
              <h3 className="text-2xl font-bold">{dashboards.reduce((sum, d) => sum + d.viewers, 0)}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              قائمة اللوحات
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
                    اللوحة
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    التصنيف
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('owner')}>
                  <div className="flex items-center gap-1">
                    المالك
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('viewers')}>
                  <div className="flex items-center gap-1">
                    المشاهدين
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('lastUpdated')}>
                  <div className="flex items-center gap-1">
                    آخر تحديث
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
              {sortedDashboards.map((dashboard) => (
                <TableRow key={dashboard.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {dashboard.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <div className="font-medium">{dashboard.name}</div>
                        <div className="text-sm text-gray-500">{dashboard.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{dashboard.category}</TableCell>
                  <TableCell>{dashboard.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {dashboard.viewers}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatDate(dashboard.lastUpdated)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(dashboard.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toast.info("تعديل اللوحة")}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
