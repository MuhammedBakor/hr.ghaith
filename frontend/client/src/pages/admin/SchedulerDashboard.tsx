import { useAppContext } from '@/contexts/AppContext';
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Clock, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Calendar,
  Timer,
  Activity,
  Settings2,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";

interface ScheduledJob {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  cronExpression: string;
  isEnabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastStatus?: 'success' | 'failed' | 'running';
  runCount: number;
}

interface JobLog {
  id: number;
  jobType: string;
  status: string;
  message?: string;
  executedAt: Date;
  duration?: number;
}

// المهام المجدولة المعرفة في النظام
const SCHEDULED_JOBS: ScheduledJob[] = [
  {
    id: 'sla.check',
    name: 'SLA Check',
    nameAr: 'فحص SLA',
    description: 'فحص الطلبات المتأخرة وتصعيدها حسب قواعد SLA',
    cronExpression: '0 */15 * * * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'contracts.expiry_check',
    name: 'Contracts Expiry Check',
    nameAr: 'فحص انتهاء العقود',
    description: 'فحص العقود التي ستنتهي خلال 30 يوم وإرسال تنبيهات',
    cronExpression: '0 0 8 * * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'documents.expiry_check',
    name: 'Documents Expiry Check',
    nameAr: 'فحص انتهاء المستندات',
    description: 'فحص المستندات التي ستنتهي صلاحيتها قريباً',
    cronExpression: '0 0 9 * * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'vehicles.maintenance_check',
    name: 'Vehicles Maintenance Check',
    nameAr: 'فحص صيانة المركبات',
    description: 'فحص المركبات التي تحتاج صيانة دورية',
    cronExpression: '0 0 7 * * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'cleanup.old_data',
    name: 'Cleanup Old Data',
    nameAr: 'تنظيف البيانات القديمة',
    description: 'حذف سجلات Jobs والبيانات القديمة (أكثر من 90 يوم)',
    cronExpression: '0 0 3 * * 0',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'payroll.reminder',
    name: 'Payroll Reminder',
    nameAr: 'تذكير الرواتب',
    description: 'إرسال تذكير لقسم الموارد البشرية لمعالجة الرواتب',
    cronExpression: '0 0 8 1-5 * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'leaves.pending_check',
    name: 'Pending Leaves Check',
    nameAr: 'فحص الإجازات المعلقة',
    description: 'فحص طلبات الإجازة المعلقة لأكثر من 3 أيام',
    cronExpression: '0 0 10 * * 1-5',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'report.daily',
    name: 'Daily Report',
    nameAr: 'التقرير اليومي',
    description: 'إنشاء تقرير يومي بإحصائيات النظام',
    cronExpression: '0 0 6 * * *',
    isEnabled: true,
    runCount: 0
  },
  {
    id: 'notification.send',
    name: 'Notification Sender',
    nameAr: 'إرسال الإشعارات',
    description: 'معالجة وإرسال الإشعارات المعلقة في الطابور',
    cronExpression: '0 */5 * * * *',
    isEnabled: true,
    runCount: 0
  }
];

function parseCronExpression(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 6) return cron;
  
  const [, min, hour, dayOfMonth, , dayOfWeek] = parts;
  
  // تحليل بسيط للتعبيرات الشائعة
  if (min.startsWith('*/')) {
    const interval = min.replace('*/', '');
    return `كل ${interval} دقيقة`;
  }
  if (hour === '*' && min !== '*') {
    return `كل ساعة في الدقيقة ${min}`;
  }
  if (hour !== '*' && dayOfMonth === '*' && dayOfWeek === '*') {
    return `يومياً الساعة ${hour}:${min.padStart(2, '0')}`;
  }
  if (dayOfWeek === '0') {
    return `أسبوعياً (الأحد) الساعة ${hour}:${min.padStart(2, '0')}`;
  }
  if (dayOfWeek === '1-5') {
    return `أيام العمل الساعة ${hour}:${min.padStart(2, '0')}`;
  }
  if (dayOfMonth.includes('-')) {
    return `أيام ${dayOfMonth} من كل شهر`;
  }
  
  return cron;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'success':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">نجح</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">فشل</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">قيد التنفيذ</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">لم يُنفذ</Badge>;
  }
}

export default function SchedulerDashboard() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const isPageLoading = false; // Loading state

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [jobs, setJobs] = useState<ScheduledJob[]>(SCHEDULED_JOBS);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // جلب سجلات التنفيذ
  const { data: jobLogs, refetch: refetchLogs, isError, error} = trpc.scheduler.getLogs.useQuery(
    { limit: 20 },
    { 
      enabled: true,
      refetchInterval: 30000 // تحديث كل 30 ثانية
    }
  );

  // جلب حالة المهام
  const { data: jobStatuses, refetch: refetchStatuses } = trpc.scheduler.getJobStatuses.useQuery(
    undefined,
    { 
      enabled: true,
      refetchInterval: 30000
    }
  );

  // تحديث حالة المهام عند جلب البيانات
  useEffect(() => {
    if (jobStatuses) {
      setJobs(prev => prev.map(job => {
        const status = jobStatuses.find((s: { jobType: string }, []) => s.jobType === job.id);
        if (status) {
          return {
            ...job,
            isEnabled: status.isEnabled ?? job.isEnabled,
            lastRun: status.lastRun ? new Date(status.lastRun) : undefined,
            lastStatus: (status.lastStatus as 'success' | 'failed' | 'running' | undefined),
            runCount: status.runCount ?? 0
          };
        }
        return job;
      }));
    }
  }, [jobStatuses]);

  // تحديث السجلات
  useEffect(() => {
    if (jobLogs) {
      setLogs(jobLogs.map((log: { id: number; jobType: string; status: string; message?: string; executedAt: string | Date; duration?: number }, []) => ({
        id: log.id,
        jobType: log.jobType,
        status: log.status,
        message: log.message,
        executedAt: new Date(log.executedAt),
        duration: log.duration
      })));
    }
  }, [jobLogs]);

  // تفعيل/تعطيل مهمة
  const toggleJobMutation = trpc.scheduler.toggleJob.useMutation({
    onSuccess: (_, variables) => {
      setJobs(prev => prev.map(job => 
        job.id === variables.jobType 
          ? { ...job, isEnabled: variables.enabled }
          : job
      ));
      toast.success(variables.enabled ? 'تم تفعيل المهمة' : 'تم تعطيل المهمة');
    },
    onError: () => {
      toast.error('فشل في تحديث حالة المهمة');
    }
  });

  // تشغيل مهمة يدوياً
  const runJobMutation = trpc.scheduler.runJob.useMutation({
    onSuccess: (result) => {
      setRunningJob(null);
      if (result.success) {
        toast.success(`تم تنفيذ المهمة بنجاح: ${result.message}`);
        refetchLogs();
        refetchStatuses();
      } else {
        toast.error(`فشل تنفيذ المهمة: ${result.message}`);
      }
    },
    onError: () => {
      setRunningJob(null);
      toast.error('فشل في تشغيل المهمة');
    }
  });

  const handleToggleJob = (jobId: string, enabled: boolean) => {
    toggleJobMutation.mutate({ jobType: jobId, enabled });
  };

  const handleRunJob = (jobId: string) => {
    setRunningJob(jobId);
    runJobMutation.mutate({ jobType: jobId });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchLogs(), refetchStatuses()]);
    setIsRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  // إحصائيات
  const stats = {
    total: jobs.length,
    enabled: jobs.filter(j => j.isEnabled).length,
    successToday: logs.filter(l => 
      l.status === 'success' && 
      new Date(l.executedAt).toDateString() === new Date().toDateString()
    ).length,
    failedToday: logs.filter(l => 
      l.status === 'failed' && 
      new Date(l.executedAt).toDateString() === new Date().toDateString()
    ).length
  };

  
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
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">جدولة المهام</h1>
            <p className="text-muted-foreground">إدارة ومراقبة المهام المجدولة في النظام</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ms-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                  <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مهام نشطة</p>
                  <p className="text-2xl font-bold">{stats.enabled}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نجح اليوم</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.successToday}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">فشل اليوم</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedToday}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              المهام المجدولة
            </CardTitle>
              <PrintButton title="التقرير" />
            <CardDescription>
              قائمة بجميع المهام المجدولة مع إمكانية التحكم بها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">المهمة</TableHead>
                  <TableHead className="text-end">الجدولة</TableHead>
                  <TableHead className="text-end">آخر تنفيذ</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">مرات التنفيذ</TableHead>
                  <TableHead className="text-end">نشط</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.nameAr}</p>
                        <p className="text-xs text-muted-foreground">{job.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{parseCronExpression(job.cronExpression)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.lastRun ? (
                        <span className="text-sm">
                          {job.lastRun.toLocaleString('ar-SA')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.lastStatus)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{job.runCount}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={job.isEnabled}
                        onCheckedChange={(checked) => handleToggleJob(job.id, checked)}
                        disabled={toggleJobMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunJob(job.id)}
                        disabled={runningJob === job.id || !job.isEnabled}
                      >
                        {runningJob === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span className="me-1">تشغيل</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              سجل التنفيذ
            </CardTitle>
            <CardDescription>
              آخر 20 عملية تنفيذ للمهام المجدولة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">المهمة</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                    <TableHead className="text-end">الرسالة</TableHead>
                    <TableHead className="text-end">وقت التنفيذ</TableHead>
                    <TableHead className="text-end">المدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((log) => {
                    const job = jobs.find(j => j.id === log.jobType);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className="font-medium">{job?.nameAr || log.jobType}</span>
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge className="bg-emerald-100 text-emerald-700">نجح</Badge>
                          ) : log.status === 'failed' ? (
                            <Badge className="bg-red-100 text-red-700">فشل</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">{log.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {log.message || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {log.executedAt.toLocaleString('ar-SA')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.duration ? (
                            <span className="text-sm">{log.duration}ms</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد سجلات تنفيذ بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
