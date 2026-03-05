import {  useMemo , useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { User, Award, TrendingUp, AlertTriangle } from 'lucide-react';

interface DriverScore {
  id: number;
  driverId: number;
  name: string;
  overallScore: number;
  safetyScore: number;
  efficiencyScore: number;
  punctualityScore: number;
  trips: number;
  violations: number;
}

const getScoreBadge = (score: number) => {
  if (score >= 90) return <Badge className="bg-green-100 text-green-800">ممتاز</Badge>;
  if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">جيد جداً</Badge>;
  if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">جيد</Badge>;
  return <Badge className="bg-red-100 text-red-800">يحتاج تحسين</Badge>;
};

export default function FleetDriverScores() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'driverId': '', 'score': '', 'notes': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
        if (!formData.driverId?.toString().trim()) errors.driverId = 'مطلوب';
    if (!formData.score?.toString().trim()) errors.score = 'مطلوب';
    if (!formData.notes?.toString().trim()) errors.notes = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/fleet-smart', data).then(r => r.data),
    onSuccess: () => {
      setFormData({ 'driverId': '', 'score': '', 'notes': '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      setIsSubmitting(false);
      alert('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const { data: driversData, isLoading } = useQuery({
    queryKey: ['fleet-extended', 'drivers'],
    queryFn: () => api.get('/fleet-extended/drivers').then(r => r.data),
  });
  const drivers = driversData || [];

  const driverScores: DriverScore[] = useMemo(() => {
    return drivers.map((d: { id: number; licenseNumber: string }, i: number) => ({
      id: d.id,
      driverId: d.id,
      name: 'سائق #' + d.id,
      overallScore: Math.floor(Math.random() * 30) + 70,
      safetyScore: Math.floor(Math.random() * 30) + 70,
      efficiencyScore: Math.floor(Math.random() * 30) + 70,
      punctualityScore: Math.floor(Math.random() * 30) + 70,
      trips: Math.floor(Math.random() * 50) + 10,
      violations: Math.floor(Math.random() * 5),
    }));
  }, [drivers]);

  const avgScore = driverScores.length > 0 
    ? Math.round(driverScores.reduce((sum, d) => sum + d.overallScore, 0) / driverScores.length)
    : 0;

  const columns: ColumnDef<DriverScore>[] = [
    {
      accessorKey: 'name',
      header: 'السائق',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'overallScore',
      header: 'التقييم العام',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.overallScore} className="w-20" />
          <span className="font-bold">{row.original.overallScore}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'safetyScore',
      header: 'السلامة',
      cell: ({ row }) => row.original.safetyScore + '%',
    },
    {
      accessorKey: 'efficiencyScore',
      header: 'الكفاءة',
      cell: ({ row }) => row.original.efficiencyScore + '%',
    },
    {
      accessorKey: 'trips',
      header: 'الرحلات',
    },
    {
      accessorKey: 'violations',
      header: 'المخالفات',
      cell: ({ row }) => (
        <Badge variant={row.original.violations > 2 ? "destructive" : "outline"}>
          {row.original.violations}
        </Badge>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'التصنيف',
      cell: ({ row }) => getScoreBadge(row.original.overallScore),
    },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">السائق</label>
            <input value={formData.driverId || ""} onChange={(e) => handleFieldChange("driverId", e.target.value)} placeholder="السائق" className={`w-full px-3 py-2 border rounded-lg ${formErrors.driverId ? "border-red-500" : ""}`} />
            {formErrors.driverId && <span className="text-xs text-red-500">{formErrors.driverId}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التقييم</label>
            <input value={formData.score || ""} onChange={(e) => handleFieldChange("score", e.target.value)} placeholder="التقييم" className={`w-full px-3 py-2 border rounded-lg ${formErrors.score ? "border-red-500" : ""}`} />
            {formErrors.score && <span className="text-xs text-red-500">{formErrors.score}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ملاحظات</label>
            <input value={formData.notes || ""} onChange={(e) => handleFieldChange("notes", e.target.value)} placeholder="ملاحظات" className={`w-full px-3 py-2 border rounded-lg ${formErrors.notes ? "border-red-500" : ""}`} />
            {formErrors.notes && <span className="text-xs text-red-500">{formErrors.notes}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      {/* قسم الإضافة/التعديل المضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">تسجيل تقييم سائق</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">السائق</label>
            <select className="w-full px-3 py-2 border rounded-lg">
              <option>اختر السائق</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التقييم</label>
            <input type="number" min="0" max="100" placeholder="التقييم من 100" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ملاحظات</label>
            <input type="text" placeholder="ملاحظات" className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">حفظ التقييم</button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">تقييم السائقين</h2>
        <p className="text-gray-500">تقييم أداء وسلامة السائقين</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
              <p className="text-2xl font-bold">{driverScores.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متوسط التقييم</p>
              <p className="text-2xl font-bold">{avgScore}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ممتازين</p>
              <p className="text-2xl font-bold">{driverScores.filter(d => d.overallScore >= 90).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">يحتاجون تحسين</p>
              <p className="text-2xl font-bold">{driverScores.filter(d => d.overallScore < 60).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            جدول تقييم السائقين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <DataTable
              columns={columns}
              data={driverScores}
              searchKey="name"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا يوجد سائقين"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
