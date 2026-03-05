import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Play,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Activity,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";

type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
type ViewMode = "list" | "details";

const statusConfig: Record<JobStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "معلق", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  processing: { label: "قيد التنفيذ", color: "bg-blue-100 text-blue-800", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-4 w-4" /> },
  failed: { label: "فاشل", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-4 w-4" /> },
  cancelled: { label: "ملغي", color: "bg-gray-100 text-gray-800", icon: <XCircle className="h-4 w-4" /> },
};

const jobTypeLabels: Record<string, string> = {
  "notification.send": "إرسال إشعار",
  "escalation.trigger": "تصعيد",
  "sla.reminder": "تذكير SLA",
  "sla.breach": "تجاوز SLA",
  "report.generate": "إنشاء تقرير",
  "cleanup.old_jobs": "تنظيف Jobs",
  "sync.external": "مزامنة خارجية",
};

export default function JobsDashboard() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'title': '', 'department': '', 'status': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title?.toString().trim()) errors.title = 'مطلوب';
    if (!formData.department?.toString().trim()) errors.department = 'مطلوب';
    if (!formData.status?.toString().trim()) errors.status = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin', data).then(r => r.data),
    onSuccess: () => {
      setFormData({ 'title': '', 'department': '', 'status': '' });
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

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: jobsData, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['admin', 'jobs', 'list', statusFilter, typeFilter],
    queryFn: () => api.get('/admin/jobs', {
      params: {
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
        limit: 50,
      },
    }).then(r => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin', 'jobs', 'stats'],
    queryFn: () => api.get('/admin/jobs/stats').then(r => r.data),
  });

  const { data: jobDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin', 'jobs', 'get', selectedJobId],
    queryFn: () => api.get(`/admin/jobs/${selectedJobId}`).then(r => r.data),
    enabled: !!selectedJobId && viewMode === "details",
  });

  const retryMutation = useMutation({
    mutationFn: (data: { jobId: string }) => api.post(`/admin/jobs/${data.jobId}/retry`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إعادة جدولة المهمة");
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'list'] });
    },
    onError: (error: any) => {
      toast.error(`فشل في إعادة المحاولة: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (data: { jobId: string }) => api.post(`/admin/jobs/${data.jobId}/cancel`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إلغاء المهمة");
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'list'] });
    },
    onError: (error: any) => {
      toast.error(`فشل في الإلغاء: ${error.message}`);
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: (data: { olderThanDays: number }) => api.post('/admin/jobs/cleanup', data).then(r => r.data),
    onSuccess: (data: any) => {
      toast.success(`تم حذف ${data.deleted} مهمة قديمة`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'stats'] });
    },
    onError: (error: any) => {
      toast.error(`فشل في التنظيف: ${error.message}`);
    },
  });

  const releaseStale = useMutation({
    mutationFn: (data: any) => api.post('/admin/jobs/release-stale', data).then(r => r.data),
    onSuccess: (data: any) => {
      toast.success(`تم تحرير ${data.released} مهمة معلقة`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', 'list'] });
    },
    onError: (error: any) => {
      toast.error(`فشل في التحرير: ${error.message}`);
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return formatDateTime(date);
  };

  const handleViewDetails = (jobId: string) => {
    setSelectedJobId(jobId);
    setViewMode("details");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedJobId(null);
  };

  // Render job details view (in same page)
  const renderDetailsView = () => (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h1 className="text-2xl font-bold">تفاصيل المهمة</h1>
          <p className="text-muted-foreground text-sm">{selectedJobId}</p>
        </div>
      </div>

      {isLoadingDetails ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : jobDetails?.job ? (
        <div className="space-y-6">
          {/* Job Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المهمة</CardTitle>
              <PrintButton title="معلومات المهمة" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">النوع</p>
                  <p className="font-medium text-lg">{jobTypeLabels[jobDetails?.job?.type] || jobDetails?.job?.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge className={`${statusConfig[jobDetails?.job?.status as JobStatus]?.color} mt-1`}>
                    <span className="flex items-center gap-1">
                      {statusConfig[jobDetails?.job?.status as JobStatus]?.icon}
                      {statusConfig[jobDetails?.job?.status as JobStatus]?.label || jobDetails?.job?.status}
                    </span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المحاولات</p>
                  <p className="font-medium text-lg">{jobDetails?.job?.attempts} / {jobDetails?.job?.maxAttempts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الأولوية</p>
                  <p className="font-medium text-lg">{jobDetails?.job?.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{formatDate(jobDetails?.job?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مجدول لـ</p>
                  <p className="font-medium">{formatDate(jobDetails?.job?.scheduledAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {jobDetails?.job?.error && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">رسالة الخطأ</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-red-50 text-red-800 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
                  {jobDetails?.job?.error}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {jobDetails.logs && jobDetails?.logs?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>سجلات المهمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {jobDetails?.logs?.map((log: { action: string; message: string | null; createdAt: Date | string }, index: number) => (
                    <div key={index} className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                      <span className="text-muted-foreground whitespace-nowrap text-sm">
                        {formatDate(log.createdAt)}
                      </span>
                      <Badge variant="outline" className="shrink-0">{log.action}</Badge>
                      <span className="text-sm">{log.message || "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(jobDetails?.job?.status === "failed" || jobDetails?.job?.status === "cancelled") && (
                  <Button
                    onClick={() => retryMutation.mutate({ jobId: selectedJobId! })}
                    disabled={retryMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 ms-2" />
                    إعادة المحاولة
                  </Button>
                )}
                {(jobDetails?.job?.status === "pending" || jobDetails?.job?.status === "processing") && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate({ jobId: selectedJobId! })}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 ms-2" />
                    إلغاء المهمة
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على المهمة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المهام الخلفية</h1>
          <p className="text-muted-foreground">مراقبة وإدارة Jobs المعالجة في الخلفية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => releaseStale.mutate({})}
            disabled={releaseStale.isPending}
          >
            <Play className="h-4 w-4 ms-2" />
            تحرير المعلقة
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanupMutation.mutate({ olderThanDays: 30 })}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 ms-2" />
            تنظيف (30 يوم)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معلق</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData?.stats.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-blue-600">{statsData?.stats.processing || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مكتمل</p>
                <p className="text-2xl font-bold text-green-600">{statsData?.stats.completed || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">فاشل</p>
                <p className="text-2xl font-bold text-red-600">{statsData?.stats.failed || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ملغي</p>
                <p className="text-2xl font-bold text-gray-600">{statsData?.stats.cancelled || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المهام</CardTitle>
          <CardDescription>عرض وإدارة جميع المهام الخلفية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="processing">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="failed">فاشل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(jobTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المحاولات</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>مجدول لـ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsData?.jobs.map((job: { id: string; type: string; status: string; attempts: number; maxAttempts: number; createdAt: Date | string | null; scheduledAt: Date | string | null }) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <span className="font-medium">
                        {jobTypeLabels[job.type] || job.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[job.status as JobStatus]?.color || "bg-gray-100"}>
                        <span className="flex items-center gap-1">
                          {statusConfig[job.status as JobStatus]?.icon}
                          {statusConfig[job.status as JobStatus]?.label || job.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.attempts} / {job.maxAttempts}
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{formatDate(job.scheduledAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(job.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(job.status === "failed" || job.status === "cancelled") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryMutation.mutate({ jobId: job.id })}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {(job.status === "pending" || job.status === "processing") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate({ jobId: job.id })}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!jobsData?.jobs || jobsData?.jobs?.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد مهام
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return viewMode === "list" ? renderListView() : renderDetailsView();
}
