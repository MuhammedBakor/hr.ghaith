import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, AlertTriangle, Gavel, Eye, FileText, MessageSquare, Clock, CheckCircle, Scale, Printer, Download, Send } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { PrintButton } from "@/components/PrintButton";

const statusColors: Record<string, string> = {
  reported: 'bg-gray-100 text-gray-800',
  investigating: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-red-100 text-red-800',
  dismissed: 'bg-green-100 text-green-800',
  appealed: 'bg-purple-100 text-purple-800',
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  executed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  reported: 'تم الإبلاغ',
  investigating: 'قيد التحقيق',
  confirmed: 'مؤكدة',
  dismissed: 'مرفوضة',
  appealed: 'مستأنفة',
  draft: 'مسودة',
  pending_approval: 'بانتظار الموافقة',
  approved: 'معتمد',
  executed: 'منفذ',
  cancelled: 'ملغي',
};

const severityLabels: Record<string, string> = {
  minor: 'بسيطة',
  moderate: 'متوسطة',
  major: 'كبيرة',
  critical: 'حرجة',
};

const severityColors: Record<string, string> = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function MyViolations() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('violations');
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<number | null>(null);
  const [appealReason, setAppealReason] = useState('');

  // استخدام معرف المستخدم الحالي من سياق المصادقة
  const employeeId = user?.id || 1;

  // Fetch data for current employee
  const { data: violationTypes } = trpc.controlKernel.violationTypes?.list?.useQuery();
  const { data: penaltyTypes } = trpc.controlKernel.penaltyTypes?.list?.useQuery();
  const { data: violations, isLoading: loadingViolations } = trpc.controlKernel.violations?.list?.useQuery({ employeeId });
  const { data: penalties, isLoading: loadingPenalties, refetch: refetchPenalties } = trpc.controlKernel.penalties?.list?.useQuery({ employeeId });

  // Appeal mutation
  const appealPenalty = trpc.controlKernel.penalties?.appeal?.useMutation({
    onSuccess: () => {
      toast.success('تم تقديم الاستئناف بنجاح');
      setIsAppealOpen(false);
      setAppealReason('');
      setSelectedPenaltyId(null);
      refetchPenalties();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleAppeal = () => {
    if (!selectedPenaltyId || !appealReason.trim()) {
      toast.error('يرجى كتابة سبب الاستئناف');
      return;
    }
    appealPenalty.mutate({ id: selectedPenaltyId, reason: appealReason });
  };

  const openAppeal= (penaltyId: number) => {
    setSelectedPenaltyId(penaltyId);
    setIsAppealOpen(true);
  };

  // Stats
  const stats = {
    totalViolations: violations?.length || 0,
    confirmedViolations: violations?.filter(v => v.status === 'confirmed').length || 0,
    totalPenalties: penalties?.length || 0,
    executedPenalties: penalties?.filter(p => p.status === 'executed').length || 0,
    appealedPenalties: penalties?.filter(p => p.status === 'appealed').length || 0,
  };

  if (authLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hr">
            <Button variant="ghost" size="icon" aria-label="تحميل">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مخالفاتي وجزاءاتي</h1>
            <p className="text-muted-foreground">عرض سجل المخالفات والجزاءات الخاصة بك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 ms-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const data = activeTab === 'violations' ? violations : penalties;
            if (!data || data.length === 0) {
              toast.error('لا توجد بيانات للتصدير');
              return;
            }
            let headers: string[];
            let csvData: string[][];
            if (activeTab === 'violations') {
              headers = ['رقم المخالفة', 'نوع المخالفة', 'التاريخ', 'التكرار', 'الحالة'];
              csvData = (violations || []).map((v: any) => [
                v.violationNumber,
                violationTypes?.find((t: any) => t.id === v.violationTypeId)?.nameAr || '-',
                formatDate(v.violationDate),
                String(v.occurrenceCount),
                statusLabels[v.status] || v.status
              ]);
            } else {
              headers = ['رقم الجزاء', 'نوع الجزاء', 'التاريخ', 'قيمة الخصم', 'الحالة'];
              csvData = (penalties || []).map((p: any) => [
                p.penaltyNumber,
                penaltyTypes?.find((t: any) => t.id === p.penaltyTypeId)?.nameAr || '-',
                formatDate(p.penaltyDate),
                p.deductionAmount || '-',
                statusLabels[p.status] || p.status
              ]);
            }
            const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            toast.success('تم تصدير البيانات بنجاح');
          }}>
            <Download className="h-4 w-4 ms-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي المخالفات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalViolations}</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">المخالفات المؤكدة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.confirmedViolations}</h3>
            </div>
            <div className="p-3 rounded-xl bg-orange-50">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الجزاءات المنفذة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.executedPenalties}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-50">
              <Gavel className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الاستئنافات</p>
              <h3 className="text-2xl font-bold mt-1">{stats.appealedPenalties}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>سجل المخالفات والجزاءات</CardTitle>
              <PrintButton title="سجل المخالفات والجزاءات" />
          <CardDescription>
            يمكنك الاطلاع على تفاصيل المخالفات والجزاءات وتقديم استئناف عند الحاجة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="violations" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                المخالفات ({stats.totalViolations})
              </TabsTrigger>
              <TabsTrigger value="penalties" className="gap-2">
                <Gavel className="h-4 w-4" />
                الجزاءات ({stats.totalPenalties})
              </TabsTrigger>
            </TabsList>

            {/* Violations Tab */}
            <TabsContent value="violations">
              {loadingViolations ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : violations && violations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المخالفة</TableHead>
                      <TableHead>نوع المخالفة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>التكرار</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[100px]">التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation) => {
                      const violationType = violationTypes?.find(t => t.id === violation.violationTypeId);
                      return (
                        <TableRow key={violation.id}>
                          <TableCell className="font-medium">{violation.violationNumber}</TableCell>
                          <TableCell>{violationType?.nameAr || '-'}</TableCell>
                          <TableCell>
                            {formatDate(violation.violationDate)}
                          </TableCell>
                          <TableCell>
                            <Badge className={severityColors[violationType?.severity || 'minor'] || 'bg-gray-100'}>
                              {severityLabels[violationType?.severity || 'minor'] || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{violation.occurrenceCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[violation.status] || 'bg-gray-100'}>
                              {statusLabels[violation.status] || violation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">لا توجد مخالفات</h3>
                  <p className="text-muted-foreground">سجلك خالٍ من المخالفات</p>
                </div>
              )}
            </TabsContent>

            {/* Penalties Tab */}
            <TabsContent value="penalties">
              {loadingPenalties ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : penalties && penalties.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الجزاء</TableHead>
                      <TableHead>نوع الجزاء</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[150px]">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {penalties.map((penalty) => {
                      const penaltyType = penaltyTypes?.find(t => t.id === penalty.penaltyTypeId);
                      const canAppeal = penalty.status === 'approved' || penalty.status === 'executed';
                      return (
                        <TableRow key={penalty.id}>
                          <TableCell className="font-medium">{penalty.penaltyNumber}</TableCell>
                          <TableCell>{penaltyType?.nameAr || '-'}</TableCell>
                          <TableCell>
                            {formatDate(penalty.penaltyDate)}
                          </TableCell>
                          <TableCell>
                            {penalty.deductionAmount ? `${penalty.deductionAmount} ر.س` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[penalty.status] || 'bg-gray-100'}>
                              {statusLabels[penalty.status] || penalty.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                              {canAppeal && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAppeal(penalty.id)}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  <MessageSquare className="h-4 w-4 ms-1" />
                                  استئناف
                                </Button>
                              )}
                              {penalty.status === 'appealed' && (
                                <Badge variant="outline" className="text-purple-600">
                                  <Clock className="h-3 w-3 ms-1" />
                                  قيد المراجعة
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">لا توجد جزاءات</h3>
                  <p className="text-muted-foreground">سجلك خالٍ من الجزاءات</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Appeal*/}
      {isAppealOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تقديم استئناف</h3>
            <p className="text-sm text-gray-500">
              يرجى كتابة سبب الاستئناف بالتفصيل. سيتم مراجعة طلبك من قبل الإدارة.
            </p>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>سبب الاستئناف</Label>
              <Textarea
                placeholder="اكتب سبب الاستئناف هنا..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={5}
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4 inline ms-2" />
              ملاحظة: سيتم إرسال الاستئناف للمراجعة وستتلقى إشعاراً بالقرار.
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsAppealOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAppeal} disabled={appealPenalty.isPending}>
              <Send className="h-4 w-4 ms-2" />
              {appealPenalty.isPending ? 'جاري الإرسال...' : 'إرسال الاستئناف'}
            </Button>
          </div>
        
      </div>)}


      {/* Info Card */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">حقوقك كموظف</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• يحق لك الاطلاع على تفاصيل أي مخالفة مسجلة ضدك</li>
                <li>• يحق لك تقديم استئناف على أي جزاء خلال 15 يوماً من تاريخ الإبلاغ</li>
                <li>• سيتم إشعارك بنتيجة الاستئناف خلال 7 أيام عمل</li>
                <li>• يمكنك التواصل مع قسم الموارد البشرية لأي استفسار</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
