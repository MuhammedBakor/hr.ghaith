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
  Target,
  Plus,
  Search,
  ArrowUpDown,
  Edit,
  TrendingUp,
  TrendingDown,
  Minus,
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


interface KPI {
  id: number;
  code: string;
  name: string;
  category: string;
  target: number;
  actual: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  owner: string;
  status: 'on_track' | 'at_risk' | 'off_track';
}

// جلب البيانات من API

export default function KPIs() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'name': '', 'target': '', 'unit': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.toString().trim()) errors.name = 'مطلوب';
    if (!formData.target?.toString().trim()) errors.target = 'مطلوب';
    if (!formData.unit?.toString().trim()) errors.unit = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = trpc.bi.create.useMutation({
    onSuccess: () => {
      setFormData({ 'name': '', 'target': '', 'unit': '' });
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

  // جلب البيانات من API
  const { data: dashboardStats, isLoading, isError, error } = trpc.bi.dashboardStats.useQuery();
  const { data: widgets, isLoading: isLoading2 } = trpc.bi.widgets?.list?.useQuery();


  // تحويل widgets إلى KPIs
  const apiKpis: KPI[] = (widgets || [])
    .filter((w: any) => w.widgetType === 'kpi')
    .map((w: any, i: number) => ({
      id: w.id,
      code: `KPI-${w.id}`,
      name: w.name,
      category: 'عام',
      target: 100,
      actual: 0,
      unit: '%',
      trend: 'stable' as const,
      owner: 'النظام',
      status: 'on_track' as const,
    }));

  // إضافة KPIs افتراضية من الإحصائيات
  const defaultKpis: KPI[] = [
    { id: 1001, code: 'KPI-PRJ-001', name: 'إجمالي المشاريع', category: 'المشاريع', target: 50, actual: dashboardStats?.projects || 0, unit: '', trend: 'up', owner: 'النظام', status: 'on_track' },
    { id: 1002, code: 'KPI-USR-001', name: 'إجمالي المستخدمين', category: 'المستخدمين', target: 100, actual: dashboardStats?.users || 0, unit: '', trend: 'up', owner: 'النظام', status: 'on_track' },
    { id: 1003, code: 'KPI-WF-001', name: 'سير العمل', category: 'العمليات', target: 50, actual: dashboardStats?.workflows || 0, unit: '', trend: 'stable', owner: 'النظام', status: 'on_track' },
  ];

  const kpis = [...defaultKpis, ...apiKpis];
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof KPI>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof KPI) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedKPIs = [...kpis]
    .filter(k => k.name.includes(searchTerm) || k.code.includes(searchTerm) || k.category.includes(searchTerm))
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
      case 'on_track': return <Badge className="bg-green-100 text-green-800">على المسار</Badge>;
      case 'at_risk': return <Badge className="bg-yellow-100 text-yellow-800">في خطر</Badge>;
      case 'off_track': return <Badge className="bg-red-100 text-red-800">خارج المسار</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  const getProgress = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    return Math.min(percentage, 100);
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
            <label className="block text-sm font-medium mb-1">الهدف</label>
            <input value={formData.target || ""} onChange={(e) => handleFieldChange("target", e.target.value)} placeholder="الهدف" className={`w-full px-3 py-2 border rounded-lg ${formErrors.target ? "border-red-500" : ""}`} />
            {formErrors.target && <span className="text-xs text-red-500">{formErrors.target}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوحدة</label>
            <input value={formData.unit || ""} onChange={(e) => handleFieldChange("unit", e.target.value)} placeholder="الوحدة" className={`w-full px-3 py-2 border rounded-lg ${formErrors.unit ? "border-red-500" : ""}`} />
            {formErrors.unit && <span className="text-xs text-red-500">{formErrors.unit}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مؤشرات الأداء الرئيسية</h2>
          <p className="text-gray-500">متابعة وتحليل مؤشرات الأداء</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          مؤشر جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المؤشرات</p>
              <h3 className="text-2xl font-bold">{kpis.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">على المسار</p>
              <h3 className="text-2xl font-bold">{kpis.filter(k => k.status === 'on_track').length}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">في خطر</p>
              <h3 className="text-2xl font-bold">{kpis.filter(k => k.status === 'at_risk').length}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">خارج المسار</p>
              <h3 className="text-2xl font-bold">{kpis.filter(k => k.status === 'off_track').length}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              قائمة المؤشرات
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
                <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    الرمز
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    المؤشر
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    التصنيف
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('target')}>
                  <div className="flex items-center gap-1">
                    المستهدف
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('actual')}>
                  <div className="flex items-center gap-1">
                    الفعلي
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>التقدم</TableHead>
                <TableHead>الاتجاه</TableHead>
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
              {sortedKPIs.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell className="font-medium">{kpi.code}</TableCell>
                  <TableCell>{kpi.name}</TableCell>
                  <TableCell>{kpi.category}</TableCell>
                  <TableCell>{kpi.target}{kpi.unit}</TableCell>
                  <TableCell>{kpi.actual}{kpi.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${kpi.status === 'on_track' ? 'bg-green-500' :
                            kpi.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${getProgress(kpi.actual, kpi.target)}%` }}
                        />
                      </div>
                      <span className="text-sm">{getProgress(kpi.actual, kpi.target).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTrendIcon(kpi.trend)}</TableCell>
                  <TableCell>{getStatusBadge(kpi.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => toast.info("تعديل المؤشر")}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
