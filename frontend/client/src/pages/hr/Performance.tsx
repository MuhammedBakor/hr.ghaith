import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Plus,
  Star,
  TrendingDown,
  Target,
  Users,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useEmployees, usePerformanceReviews, useCreatePerformanceReview } from '@/services/hrService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";


// دالة توليد رقم التقييم التلقائي
const generateReviewCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `PRF-${timestamp.slice(-4)}${random}`;
};

interface PerformanceRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  department?: string;
  reviewPeriod?: string;
  reviewPeriodStart?: Date;
  reviewPeriodEnd?: Date;
  overallRating: string | number;
  status: string;
  reviewerId: number;
  reviewDate?: Date;
}

const getRatingBadge = (rating: string | number) => {
  const numRating = typeof rating === 'string' ? 0 : rating;
  if (numRating >= 90) return <Badge className="bg-green-100 text-green-800">ممتاز</Badge>;
  if (numRating >= 75) return <Badge className="bg-blue-100 text-blue-800">جيد جداً</Badge>;
  if (numRating >= 60) return <Badge className="bg-yellow-100 text-yellow-800">جيد</Badge>;
  return <Badge className="bg-red-100 text-red-800">يحتاج تحسين</Badge>;
};

type ViewMode = 'list' | 'add';

export default function Performance() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [reviewCode] = useState(generateReviewCode());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('Q1 2026');
  const [rating, setRating] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  // جلب قائمة الموظفين
  const { data: employeesData, isError, error } = useEmployees();
  const employees = (employeesData as any)?.items || employeesData || [];

  // جلب تقييمات الأداء
  const { data: performanceData, isLoading } = usePerformanceReviews();
  const records: PerformanceRecord[] = performanceData || [];

  // إنشاء تقييم جديد
  const createPerformanceMutation = useCreatePerformanceReview();

  const resetForm = () => {
    setSelectedEmployee('');
    setReviewPeriod('Q1 2026');
    setRating('');
    setStrengths('');
    setImprovements('');
  };

  const handleCreatePerformance = () => {
    if (!selectedEmployee || !rating) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    createPerformanceMutation.mutate({
      employeeId: parseInt(selectedEmployee),
      reviewerId: 1, // المستخدم الحالي
      reviewPeriod: reviewPeriod,
      reviewDate: new Date(),
      overallRating: parseInt(rating),
      strengths: strengths,
      improvements: improvements,
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء التقييم بنجاح');
        setViewMode('list');
        resetForm();
      },
      onError: (error: any) => {
        toast.error('فشل في إنشاء التقييم: ' + error.message);
      }
    });
  };

  // حساب الإحصائيات
  const getNumericRating = (rating: string | number): number => {
    return typeof rating === 'number' ? rating : 0;
  };

  const stats = {
    avgScore: records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + getNumericRating(r.overallRating), 0) / records.length)
      : 0,
    excellent: records.filter(r => getNumericRating(r.overallRating) >= 90).length,
    needsImprovement: records.filter(r => getNumericRating(r.overallRating) < 60).length,
    totalReviews: records.length,
  };

  const columns: ColumnDef<PerformanceRecord>[] = [
    {
      accessorKey: 'employeeName',
      header: 'الموظف',
      cell: ({ row }) => {
        const employee = employees.find((e: any) => e.id === row.original.employeeId);
        return employee?.fullName || `موظف #${row.original.employeeId}`;
      }
    },
    {
      accessorKey: 'department',
      header: 'القسم',
      cell: ({ row }) => {
        const employee = employees.find((e: any) => e.id === row.original.employeeId);
        return employee?.department || '-';
      }
    },
    {
      accessorKey: 'reviewPeriod',
      header: 'الفترة',
    },
    {
      accessorKey: 'overallRating',
      header: 'الدرجة',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={typeof row.original.overallRating === 'number' ? row.original.overallRating : 0} className="w-20 h-2" />
          <span className="font-medium">{typeof row.original.overallRating === 'number' ? row.original.overallRating : 0}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'التقييم',
      cell: ({ row }) => getRatingBadge(row.original.overallRating || 0),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'reviewed') return <Badge className="bg-green-100 text-green-800">مُراجع</Badge>;
        if (status === 'submitted') return <Badge className="bg-blue-100 text-blue-800">مُقدم</Badge>;
        return <Badge variant="outline">مسودة</Badge>;
      }
    },
  ];

  // نموذج إضافة تقييم
  if (viewMode === 'add') {


    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء تقييم أداء جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات تقييم الأداء</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              بيانات التقييم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم التقييم (تلقائي)</Label>
                  <Input
                    value={reviewCode}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>الموظف *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>فترة التقييم</Label>
                  <Select value={reviewPeriod} onValueChange={setReviewPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1 2026">الربع الأول 2026</SelectItem>
                      <SelectItem value="Q2 2026">الربع الثاني 2026</SelectItem>
                      <SelectItem value="Q3 2026">الربع الثالث 2026</SelectItem>
                      <SelectItem value="Q4 2026">الربع الرابع 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الدرجة (0-100) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="85"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>نقاط القوة</Label>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="نقاط القوة لدى الموظف..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>مجالات التحسين</Label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="المجالات التي تحتاج تحسين..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreatePerformance} disabled={createPerformanceMutation.isPending}>
                {createPerformanceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء التقييم
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تقييم الأداء</h2>
          <p className="text-muted-foreground">متابعة وتقييم أداء الموظفين</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          تقييم جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوسط الأداء</p>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">أداء ممتاز</p>
              <p className="text-2xl font-bold">{stats.excellent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">يحتاج تحسين</p>
              <p className="text-2xl font-bold">{stats.needsImprovement}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التقييمات</p>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            سجل التقييمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد تقييمات</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء تقييم جديد
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={records}
              searchKey="employeeName"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد تقييمات"
            />
          )}
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
