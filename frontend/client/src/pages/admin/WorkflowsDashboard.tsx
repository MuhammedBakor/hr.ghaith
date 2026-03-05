/**
 * صفحة Dashboard للمسارات النشطة
 * مربوطة بـ API الفعلي
 */

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShoppingCart, Users, Car, Clock, CheckCircle, AlertTriangle, XCircle, Activity, RefreshCw, Eye, Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

export default function WorkflowsDashboard() {
  const saveMut = useMutation({
    mutationFn: (data: any) => api.put(`/admin/automation/${data.id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم الحفظ بنجاح'); },
    onError: (e: any) => { toast.error(e.message || 'حدث خطأ'); },
  });
  const handleSave = (data?: any) => { if (data?.id) saveMut.mutate(data); else toast.success('تم الحفظ'); };

  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const queryError = false; // Error state from useQuery

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState("overview");
  
  // جلب البيانات من API
  const { data: purchaseOrders, isLoading: loadingPO, refetch: refetchPO } = useQuery({
    queryKey: ['admin', 'purchase-orders'],
    queryFn: () => api.get('/admin/purchase-orders').then(r => r.data),
  });

  const { data: leaveRequests, isLoading: loadingLeaves } = useQuery({
    queryKey: ['admin', 'leaves'],
    queryFn: () => api.get('/admin/leaves').then(r => r.data),
  });

  const { data: exceptionsData, isLoading: loadingExceptions } = useQuery({
    queryKey: ['admin', 'exceptions'],
    queryFn: () => api.get('/admin/exceptions/suspense-items').then(r => r.data),
  });

  const isLoading = loadingPO || loadingLeaves || loadingExceptions;
  const exceptions = exceptionsData?.items || [];

  // حساب الإحصائيات من البيانات الفعلية
  const calculateStats = () => {
    const pos = purchaseOrders || [];
    const leaves = leaveRequests || [];
    
    // P2P Stats
    const p2pTotal = pos.length;
    const p2pActive = pos.filter((p: any) => ['draft', 'submitted', 'approved'].includes(p.status)).length;
    const p2pPending = pos.filter((p: any) => p.status === 'submitted').length;
    const p2pCompleted = pos.filter((p: any) => p.status === 'completed').length;
    const p2pOverdue = 0; // يمكن حسابه بناءً على تاريخ الاستحقاق
    
    // H2R Stats
    const h2rTotal = leaves.length;
    const h2rActive = leaves.filter((l: any) => l.status === 'pending').length;
    const h2rPending = leaves.filter((l: any) => l.status === 'pending').length;
    const h2rCompleted = leaves.filter((l: any) => l.status === 'approved').length;
    const h2rOverdue = 0;
    
    // Process Instances Stats (من طلبات الشراء والإجازات)
    const processTotal = pos.length + leaves.length;
    const processActive = p2pActive + h2rActive;
    const processPending = p2pPending + h2rPending;
    const processCompleted = p2pCompleted + h2rCompleted;
    const processOverdue = 0;
    
    return {
      workflows: [
        {
          id: 'p2p',
          name: 'Procure-to-Pay',
          nameAr: 'المشتريات إلى الدفع',
          icon: <ShoppingCart className="h-5 w-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          total: p2pTotal,
          active: p2pActive,
          pending: p2pPending,
          completed: p2pCompleted,
          overdue: p2pOverdue,
          avgDuration: '-',
          trend: 'stable' as const,
          trendValue: 0,
        },
        {
          id: 'h2r',
          name: 'Hire-to-Retire',
          nameAr: 'الموارد البشرية',
          icon: <Users className="h-5 w-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          total: h2rTotal,
          active: h2rActive,
          pending: h2rPending,
          completed: h2rCompleted,
          overdue: h2rOverdue,
          avgDuration: '-',
          trend: 'stable' as const,
          trendValue: 0,
        },
        {
          id: 'processes',
          name: 'Process Instances',
          nameAr: 'المسارات النشطة',
          icon: <Activity className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          total: processTotal,
          active: processActive,
          pending: processPending,
          completed: processCompleted,
          overdue: processOverdue,
          avgDuration: '-',
          trend: 'stable' as const,
          trendValue: 0,
        },
        {
          id: 'exceptions',
          name: 'Exceptions',
          nameAr: 'الاستثناءات',
          icon: <AlertTriangle className="h-5 w-5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          total: exceptions.length,
          active: exceptions.filter((e: any) => e.status === 'pending').length,
          pending: exceptions.filter((e: any) => e.status === 'pending').length,
          completed: exceptions.filter((e: any) => e.status === 'resolved').length,
          overdue: 0,
          avgDuration: '-',
          trend: 'stable' as const,
          trendValue: 0,
        },
      ],
      activeWorkflows: [
        ...pos.slice(0, 5).map((po: any, idx: number) => ({
          id: po.id || idx + 1,
          type: 'p2p',
          typeAr: 'مشتريات',
          reference: po.poNumber || `PO-${idx + 1}`,
          title: po.description || 'طلب شراء',
          currentStep: getStepName(po.status),
          progress: getProgress(po.status),
          status: 'on_track' as const,
          dueDate: '-',
          assignee: '-',
          priority: 'medium' as const,
        })),
        ...leaves.slice(0, 3).map((leave: any, idx: number) => ({
          id: leave.id || idx + 100,
          type: 'h2r',
          typeAr: 'إجازات',
          reference: `LV-${leave.id || idx + 1}`,
          title: leave.leaveType || 'طلب إجازة',
          currentStep: leave.status === 'pending' ? 'بانتظار الاعتماد' : leave.status,
          progress: leave.status === 'approved' ? 100 : 50,
          status: leave.status === 'pending' ? 'at_risk' as const : 'on_track' as const,
          dueDate: leave.startDate || '-',
          assignee: '-',
          priority: 'medium' as const,
        })),
      ],
    };
  };

  const getStepName = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'submitted': return 'بانتظار الاعتماد';
      case 'approved': return 'معتمد';
      case 'invoiced': return 'مفوتر';
      case 'paid': return 'مدفوع';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'draft': return 20;
      case 'submitted': return 40;
      case 'approved': return 60;
      case 'invoiced': return 80;
      case 'paid': return 90;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const stats = calculateStats();
  const workflows = stats.workflows;
  const activeWorkflows = stats.activeWorkflows;

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-amber-100 text-amber-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_track': return 'في الموعد';
      case 'at_risk': return 'معرض للتأخير';
      case 'overdue': return 'متأخر';
      default: return 'غير محدد';
    }
  };

  // الحصول على لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // تحديث البيانات
  const handleRefresh = () => {
    refetchPO();
  };

  // حساب الإجماليات
  const totals = workflows.reduce((acc, w) => ({
    total: acc.total + w.total,
    active: acc.active + w.active,
    pending: acc.pending + w.pending,
    completed: acc.completed + w.completed,
    overdue: acc.overdue + w.overdue,
  }), { total: 0, active: 0, pending: 0, completed: 0, overdue: 0 });

  if (isLoading) {
    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
      <DashboardLayout>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <div className="flex items-center justify-center h-96" dir="rtl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="me-2">جاري تحميل البيانات...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold">لوحة المسارات</h1>
            <p className="text-muted-foreground">Workflows Dashboard - بيانات فعلية من النظام</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 ms-2" />
              تحديث
            </Button>
            <Link href="/finance/p2p">
              <Button>
                <ShoppingCart className="h-4 w-4 ms-2" />
                مسار المشتريات
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المسارات</p>
                  <p className="text-lg md:text-2xl font-bold">{totals.total?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نشطة</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-600">{totals.active}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">بانتظار الاعتماد</p>
                  <p className="text-lg md:text-2xl font-bold text-amber-600">{totals.pending}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">{totals.completed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متأخرة/فاشلة</p>
                  <p className="text-lg md:text-2xl font-bold text-red-600">{totals.overdue}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="active">المسارات النشطة</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Workflow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${workflow.bgColor}`}>
                          <span className={workflow.color}>{workflow.icon}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workflow.nameAr}</CardTitle>
              <PrintButton title="{workflow.nameAr}" />
                          <CardDescription>{workflow.name}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{workflow.total?.toLocaleString()} مسار</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-lg md:text-2xl font-bold text-blue-600">{workflow.active}</p>
                        <p className="text-xs text-muted-foreground">نشط</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-2xl font-bold text-amber-600">{workflow.pending}</p>
                        <p className="text-xs text-muted-foreground">معلق</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-2xl font-bold text-green-600">{workflow.completed}</p>
                        <p className="text-xs text-muted-foreground">مكتمل</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-2xl font-bold text-red-600">{workflow.overdue}</p>
                        <p className="text-xs text-muted-foreground">متأخر</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة الإنجاز</span>
                        <span>{workflow.total > 0 ? Math.round((workflow.completed / (workflow || 1).total) * 100) : 0}%</span>
                      </div>
                      <Progress value={workflow.total > 0 ? (workflow.completed / (workflow || 1).total) * 100 : 0} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>المسارات النشطة</CardTitle>
                <CardDescription>جميع المسارات قيد التنفيذ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المرجع</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الخطوة الحالية</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWorkflows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          لا توجد مسارات نشطة حالياً
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeWorkflows.map((workflow) => (
                        <TableRow key={workflow.id}>
                          <TableCell className="font-medium">{workflow.reference}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{workflow.typeAr}</Badge>
                          </TableCell>
                          <TableCell>{workflow.title}</TableCell>
                          <TableCell>{workflow.currentStep}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={workflow.progress} className="w-20" />
                              <span className="text-sm">{workflow.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(workflow.status)}>
                              {getStatusText(workflow.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(workflow.priority)}>
                              {String(workflow.priority) === 'urgent' ? 'عاجل' :
                               String(workflow.priority) === 'high' ? 'عالي' :
                               String(workflow.priority) === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المسارات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${workflow.bgColor}`}>
                          <span className={workflow.color}>{workflow.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{workflow.nameAr}</span>
                            <span className="text-sm text-muted-foreground">{workflow.total?.toLocaleString()}</span>
                          </div>
                          <Progress value={totals.total > 0 ? (workflow.total / (totals || 1).total) * 100 : 0} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ملخص الحالات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span>نشطة</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{totals.active}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span>معلقة</span>
                      </div>
                      <span className="text-xl font-bold text-amber-600">{totals.pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>مكتملة</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">{totals.completed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span>متأخرة/فاشلة</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{totals.overdue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
