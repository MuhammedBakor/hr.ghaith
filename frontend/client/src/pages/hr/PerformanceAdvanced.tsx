import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Star, Plus, Eye, CheckCircle2, Clock, Award, BarChart3, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEmployees, usePerformanceReviews, useGoals, useCreateGoal, useKPIs, useCreatePerformanceReview, useDeletePerformanceReview, useBranches, useDepartments } from '@/services/hrService';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

export default function PerformanceAdvanced() {
  const { selectedBranchId } = useAppContext();
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('reviews');
  const [showNewReview, setShowNewReview] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-Q1');
  const [newGoal, setNewGoal] = useState({
    employeeId: 0,
    title: '',
    description: '',
    weight: 30,
    dueDate: ''
  });
  const [newReview, setNewReview] = useState({
    employeeId: 0,
    period: '2026-Q1',
    rating: 3,
    feedback: '',
    strengths: '',
    improvements: '',
    status: 'draft'
  });

  const [reviewFilterBranch, setReviewFilterBranch] = useState('');
  const [reviewFilterDept, setReviewFilterDept] = useState('');
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);

  // البيانات من API (REST)
  const { data: reviewsData, isLoading } = usePerformanceReviews();
  const { data: employeesData } = useEmployees({ branchId: selectedBranchId });
  const { data: branchesData } = useBranches();
  const { data: departmentsData } = useDepartments({ branchId: selectedBranchId || (reviewFilterBranch ? parseInt(reviewFilterBranch) : null) });
  const { data: goalsData, refetch: refetchGoals } = useGoals();
  const { data: kpisData } = useKPIs();

  const createGoalMutation = useCreateGoal();
  const createReviewMutation = useCreatePerformanceReview();
  const deleteReviewMutation = useDeletePerformanceReview();

  const handleCreateGoal = () => {
    if (!newGoal.employeeId || !newGoal.title) {
      toast.error('يرجى إدخال الموظف وعنوان الهدف');
      return;
    }
    createGoalMutation.mutate(
      {
        employeeId: newGoal.employeeId,
        title: newGoal.title,
        description: newGoal.description,
        weight: newGoal.weight,
        dueDate: newGoal.dueDate || undefined,
        status: 'in_progress'
      },
      {
        onSuccess: () => {
          toast.success('تم إضافة الهدف بنجاح');
          setShowGoalDialog(false);
          setNewGoal({ employeeId: 0, title: '', description: '', weight: 30, dueDate: '' });
          refetchGoals();
        },
        onError: (err: any) => toast.error(`فشل في إضافة الهدف: ${err.message}`),
      }
    );
  };

  const handleCreateReview = () => {
    if (!newReview.employeeId) {
      toast.error('يرجى اختيار الموظف');
      return;
    }
    createReviewMutation.mutate(
      {
        ...newReview,
        reviewerId: 1, // Placeholder for current user employee ID
      },
      {
        onSuccess: () => {
          toast.success('تم حفظ التقييم بنجاح');
          setShowNewReview(false);
          setNewReview({
            employeeId: 0,
            period: '2026-Q1',
            rating: 3,
            feedback: '',
            strengths: '',
            improvements: '',
            status: 'draft'
          });
        },
        onError: (err: any) => toast.error(`فشل في حفظ التقييم: ${err.message}`),
      }
    );
  };

  const allApiReviews = reviewsData || [];
  const employees = employeesData || [];
  const branches = (branchesData || []).filter((b: any) => b.id);
  const departments = departmentsData || [];
  const filteredReviewEmployees = employees.filter((e: any) => {
    if (reviewFilterBranch && String(e.branch?.id) !== reviewFilterBranch) return false;
    if (reviewFilterDept && String(e.department?.id) !== reviewFilterDept) return false;
    return true;
  });

  // Filter reviews by selected branch (unless on comprehensive dashboard)
  const apiReviews = selectedBranchId
    ? allApiReviews.filter((r: any) => r.employee?.branch?.id === selectedBranchId)
    : allApiReviews;

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${(emp as any).firstName} ${(emp as any).lastName}` : `موظف #${id}`;
  };

  const performanceStats = {
    totalReviews: apiReviews.length,
    completedReviews: apiReviews.filter((r: any) => r.status === 'finalized').length,
    pendingReviews: apiReviews.filter((r: any) => r.status === 'draft' || r.status === 'submitted').length,
    averageScore: apiReviews.length > 0 ? apiReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / apiReviews.length : 0
  };

  // تحويل البيانات من API إلى الشكل المطلوب
  const reviews = apiReviews.map((r: any) => ({
    id: r.id,
    raw: r,
    employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : `موظف #${r.id}`,
    department: r.employee?.department?.nameAr || r.employee?.department?.name || '-',
    branch: r.employee?.branch?.nameAr || r.employee?.branch?.name || '-',
    period: r.period || '-',
    rating: r.rating || 0,
    feedback: r.feedback || '',
    status: r.status || 'draft',
    reviewDate: r.reviewDate || null,
  }));

  // الأهداف من API
  const goals = (goalsData || []).map((g: any) => ({
    id: g.id,
    employee: getEmployeeName(g.employeeId),
    title: g.titleAr || g.title,
    description: g.description,
    weight: g.weight || 0,
    progress: g.progress || 0,
    dueDate: g.dueDate ? new Date(g.dueDate).toISOString().split('T')[0] : '-',
    status: g.status
  }));

  // مؤشرات الأداء من API
  const kpis = (kpisData || []).map((k: any) => ({
    id: k.id,
    name: k.nameAr || k.name,
    weight: k.weight || 0,
    description: k.description
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalized': case 'completed':
        return <Badge className="bg-green-100 text-green-700">مكتمل</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700">مُرسَل</Badge>;
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-700">مسودة</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">جاري</Badge>;
      case 'on_track':
        return <Badge className="bg-green-100 text-green-700">على المسار</Badge>;
      case 'at_risk':
        return <Badge className="bg-red-100 text-red-700">في خطر</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1" dir="rtl">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= score ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        ))}
        <span className={`ms-2 font-medium ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الأداء والتقييم</h2>
          <p className="text-gray-500">تقييم أداء الموظفين وإدارة الأهداف</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-Q1">Q1 2026</SelectItem>
              <SelectItem value="2025-Q4">Q4 2025</SelectItem>
              <SelectItem value="2025-Q3">Q3 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewReview(true)}>
            <Plus className="h-4 w-4 ms-2" />
            تقييم جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي التقييمات</p>
                <h3 className="text-2xl font-bold">{performanceStats.totalReviews}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تقييمات مكتملة</p>
                <h3 className="text-2xl font-bold text-green-600">{performanceStats.completedReviews}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تقييمات معلقة</p>
                <h3 className="text-2xl font-bold text-amber-600">{performanceStats.pendingReviews}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">متوسط التقييم</p>
                <h3 className="text-2xl font-bold">{performanceStats.averageScore}/5</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          <TabsTrigger value="goals">الأهداف</TabsTrigger>
          <TabsTrigger value="kpis">مؤشرات الأداء</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>تقييمات الأداء</CardTitle>
              <PrintButton title="تقييمات الأداء" />
              <CardDescription>قائمة تقييمات الموظفين للفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الفرع</TableHead>
                    <TableHead>القسم</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">لا توجد تقييمات بعد</TableCell>
                    </TableRow>
                  ) : reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.employeeName}</TableCell>
                      <TableCell>{review.branch}</TableCell>
                      <TableCell>{review.department}</TableCell>
                      <TableCell>{review.period}</TableCell>
                      <TableCell>
                        {review.rating ? renderStars(review.rating) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" title="عرض التفاصيل" onClick={() => setViewRecord(review)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="حذف" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteReviewId(review.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowGoalDialog(true)}>
              <Plus className="h-4 w-4 ms-2" />
              هدف جديد
            </Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>أهداف الموظفين</CardTitle>
              <CardDescription>متابعة تحقيق الأهداف المحددة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الهدف</TableHead>
                    <TableHead>الوزن</TableHead>
                    <TableHead>التقدم</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.employee}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-gray-500">{goal.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{goal.weight}%</TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>{goal.dueDate}</TableCell>
                      <TableCell>{getStatusBadge(goal.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>مؤشرات الأداء الرئيسية (KPIs)</CardTitle>
              <CardDescription>معايير تقييم أداء الموظفين</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المؤشر</TableHead>
                    <TableHead>الوزن</TableHead>
                    <TableHead>الوصف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{kpi.weight}%</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{kpi.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>توزيع التقييمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>ممتاز (4.5+)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="w-32 h-2" />
                      <span className="text-sm">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>جيد جداً (3.5-4.5)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={45} className="w-32 h-2" />
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>جيد (2.5-3.5)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={20} className="w-32 h-2" />
                      <span className="text-sm">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>يحتاج تحسين (&lt;2.5)</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-32 h-2" />
                      <span className="text-sm">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>أفضل الموظفين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.filter(r => r.rating).sort((a, b) => b.rating - a.rating).slice(0, 3).map((review, index) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{review.employeeName}</p>
                          <p className="text-sm text-gray-500">{review.department}</p>
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Review Dialog */}
      <Dialog open={showNewReview} onOpenChange={(open) => { if (!open) { setShowNewReview(false); setReviewFilterBranch(''); setReviewFilterDept(''); } }}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              تقييم أداء جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Branch + Department filters */}
            <div className={`grid gap-4 ${selectedBranchId ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {!selectedBranchId && (
                <div className="space-y-2">
                  <Label>الفرع (تصفية)</Label>
                  <Select value={reviewFilterBranch} onValueChange={(v) => { setReviewFilterBranch(v === 'all' ? '' : v); setReviewFilterDept(''); setNewReview(r => ({ ...r, employeeId: 0 })); }}>
                    <SelectTrigger><SelectValue placeholder="جميع الفروع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
                      {branches.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.nameAr || b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>القسم (تصفية)</Label>
                <Select value={reviewFilterDept} onValueChange={(v) => { setReviewFilterDept(v === 'all' ? '' : v); setNewReview(r => ({ ...r, employeeId: 0 })); }}>
                  <SelectTrigger><SelectValue placeholder="جميع الأقسام" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employee + Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموظف <span className="text-red-500">*</span></Label>
                <Select value={newReview.employeeId ? String(newReview.employeeId) : ''} onValueChange={(v) => setNewReview(r => ({ ...r, employeeId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                  <SelectContent>
                    {filteredReviewEmployees.map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>فترة التقييم</Label>
                <Select value={newReview.period} onValueChange={(v) => setNewReview(r => ({ ...r, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026-Q1">Q1 2026</SelectItem>
                    <SelectItem value="2025-Q4">Q4 2025</SelectItem>
                    <SelectItem value="2025-Q3">Q3 2025</SelectItem>
                    <SelectItem value="2025-Q2">Q2 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>التقييم العام</Label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview(r => ({ ...r, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star className={`h-8 w-8 transition-colors ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                  </button>
                ))}
                <span className="text-sm text-gray-500 ms-2">
                  {newReview.rating === 5 ? 'ممتاز' : newReview.rating === 4 ? 'جيد جداً' : newReview.rating === 3 ? 'جيد' : newReview.rating === 2 ? 'مقبول' : 'ضعيف'}
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label>ملاحظات عامة</Label>
              <Textarea
                placeholder="أدخل ملاحظاتك حول أداء الموظف..."
                rows={3}
                value={newReview.feedback}
                onChange={(e) => setNewReview(r => ({ ...r, feedback: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowNewReview(false); setReviewFilterBranch(''); setReviewFilterDept(''); }}>إلغاء</Button>
            <Button onClick={handleCreateReview} disabled={createReviewMutation.isPending}>
              {createReviewMutation.isPending ? 'جاري الحفظ...' : 'حفظ التقييم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Review Details Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={(open) => { if (!open) setViewRecord(null); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              تفاصيل التقييم
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">الموظف</p>
                  <p className="font-medium">{viewRecord.employeeName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">الفرع</p>
                  <p className="font-medium">{viewRecord.branch}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">القسم</p>
                  <p className="font-medium">{viewRecord.department}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">الفترة</p>
                  <p className="font-medium">{viewRecord.period}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">تاريخ التقييم</p>
                  <p className="font-medium">{viewRecord.reviewDate || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">الحالة</p>
                  {getStatusBadge(viewRecord.status)}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1 text-sm">التقييم العام</p>
                {renderStars(viewRecord.rating)}
              </div>
              {viewRecord.feedback && (
                <div>
                  <p className="text-gray-500 mb-1 text-sm">الملاحظات</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{viewRecord.feedback}</p>
                </div>
              )}
              {viewRecord.raw?.strengths && (
                <div>
                  <p className="text-gray-500 mb-1 text-sm">نقاط القوة</p>
                  <p className="text-sm bg-green-50 p-3 rounded-lg">{viewRecord.raw.strengths}</p>
                </div>
              )}
              {viewRecord.raw?.improvements && (
                <div>
                  <p className="text-gray-500 mb-1 text-sm">مجالات التحسين</p>
                  <p className="text-sm bg-amber-50 p-3 rounded-lg">{viewRecord.raw.improvements}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecord(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review AlertDialog */}
      <AlertDialog open={deleteReviewId !== null} onOpenChange={(open) => { if (!open) setDeleteReviewId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteReviewId !== null) {
                  deleteReviewMutation.mutate(deleteReviewId, {
                    onSuccess: () => { toast.success('تم حذف التقييم'); setDeleteReviewId(null); },
                    onError: (err: any) => { toast.error(`فشل الحذف: ${err.message}`); setDeleteReviewId(null); },
                  });
                }
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Goal Dialog */}
      {showGoalDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">هدف جديد</h3>
            <p className="text-sm text-gray-500">إضافة هدف جديد للموظف</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={newGoal.employeeId ? String(newGoal.employeeId) : ''} onValueChange={(v) => setNewGoal({ ...newGoal, employeeId: Number(v) })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عنوان الهدف</Label>
              <Input
                placeholder="مثال: إكمال مشروع التطوير"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                placeholder="وصف تفصيلي للهدف..."
                rows={2}
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوزن (%)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={newGoal.weight}
                  onChange={(e) => setNewGoal({ ...newGoal, weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateGoal} disabled={createGoalMutation.isPending}>
              {createGoalMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
