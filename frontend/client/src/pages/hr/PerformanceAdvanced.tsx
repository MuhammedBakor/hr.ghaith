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
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Star, Plus, Eye, Edit, CheckCircle2, Clock, Award, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

export default function PerformanceAdvanced() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

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

  // البيانات من API
  const { data: reviewsData, isLoading } = trpc.hrExtended.performance.list.useQuery();
  const { data: employeesData } = trpc.hr.employees.list.useQuery();
  const { data: goalsData, refetch: refetchGoals } = trpc.hrExtended.goals.list.useQuery();
  const { data: kpisData } = trpc.hrExtended.kpis.list.useQuery();
  
  const createGoalMutation = trpc.hrExtended.goals.create.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة الهدف بنجاح');
      setShowGoalDialog(false);
      setNewGoal({ employeeId: 0, title: '', description: '', weight: 30, dueDate: '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetchGoals();
    },
    onError: (error) => {
      toast.error(`فشل في إضافة الهدف: ${error.message}`);
    },
  });
  
  const handleCreateGoal = () => {
    if (!newGoal.employeeId || !newGoal.title) {
      toast.error('يرجى إدخال الموظف وعنوان الهدف');
      return;
    }
    createGoalMutation.mutate({
      employeeId: newGoal.employeeId,
      title: newGoal.title,
      description: newGoal.description,
      weight: newGoal.weight,
      dueDate: newGoal.dueDate ? new Date(newGoal.dueDate) : undefined,
    });
  };
  
  const apiReviews = reviewsData || [];
  const employees = employeesData || [];
  
  const getEmployeeName = (id: number) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${(emp as any).firstName} ${(emp as any).lastName}` : `موظف #${id}`;
  };

  const performanceStats = {
    totalReviews: apiReviews.length,
    completedReviews: apiReviews.filter((r: any) => r.status === 'completed').length,
    pendingReviews: apiReviews.filter((r: any) => r.status === 'pending').length,
    averageScore: apiReviews.length > 0 ? apiReviews.reduce((sum: number, r: any) => sum + (r.overallRating || 0), 0) / apiReviews.length : 0
  };

  // تحويل البيانات من API إلى الشكل المطلوب
  const reviews = apiReviews.map((r: any) => ({
    id: r.id,
    employee: getEmployeeName(r.employeeId),
    department: '-',
    reviewer: r.reviewerId ? getEmployeeName(r.reviewerId) : '-',
    period: r.period,
    overallScore: r.overallRating,
    status: r.status || 'pending',
    completedAt: r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : null
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
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">قيد الانتظار</Badge>;
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
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
    <div className="flex gap-1" dir="rtl">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={i} 
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
        <TabsList>
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
                    <TableHead>القسم</TableHead>
                    <TableHead>المقيّم</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.employee}</TableCell>
                      <TableCell>{review.department}</TableCell>
                      <TableCell>{review.reviewer}</TableCell>
                      <TableCell>{review.period}</TableCell>
                      <TableCell>
                        {review.overallScore ? renderStars(review.overallScore) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toast.info("عرض التقييم")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {review.status === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => toast.info("تعديل التقييم")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
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
                  {reviews.filter(r => r.overallScore).slice(0, 3).map((review, index) => (
                    <div key={review.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-amber-100 text-amber-600' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{review.employee}</p>
                          <p className="text-sm text-gray-500">{review.department}</p>
                        </div>
                      </div>
                      {renderStars(review.overallScore!)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Review Dialog */}
      {showNewReview && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تقييم أداء جديد</h3>
            <p className="text-sm text-gray-500">إنشاء تقييم أداء لموظف</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموظف</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">أحمد محمد</SelectItem>
                    <SelectItem value="2">سارة أحمد</SelectItem>
                    <SelectItem value="3">محمد علي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>فترة التقييم</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026-Q1">Q1 2026</SelectItem>
                    <SelectItem value="2025-Q4">Q4 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">تقييم المؤشرات</h4>
              {kpis.map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{kpi.name}</p>
                    <p className="text-sm text-gray-500">{kpi.description}</p>
                  </div>
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - ممتاز</SelectItem>
                      <SelectItem value="4">4 - جيد جداً</SelectItem>
                      <SelectItem value="3">3 - جيد</SelectItem>
                      <SelectItem value="2">2 - مقبول</SelectItem>
                      <SelectItem value="1">1 - ضعيف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>ملاحظات عامة</Label>
              <Textarea placeholder="أدخل ملاحظاتك حول أداء الموظف..." rows={3} />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewReview(false)}>إلغاء</Button>
            <Button onClick={() => { toast.success('تم حفظ التقييم'); setShowNewReview(false); }}>
              حفظ التقييم
            </Button>
          </div>
        </div>
      </div>)}

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
              <Select value={newGoal.employeeId ? String(newGoal.employeeId) : ''} onValueChange={(v) => setNewGoal({...newGoal, employeeId: Number(v)})}>
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
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea 
                placeholder="وصف تفصيلي للهدف..." 
                rows={2}
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوزن (%)</Label>
                <Input 
                  type="number" 
                  placeholder="30" 
                  value={newGoal.weight}
                  onChange={(e) => setNewGoal({...newGoal, weight: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Input 
                  type="date" 
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
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
