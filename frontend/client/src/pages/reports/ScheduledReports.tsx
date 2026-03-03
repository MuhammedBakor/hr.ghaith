import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Search, Clock, Mail, Pause, Play, ArrowUpDown, CheckCircle, AlertTriangle, Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

interface ScheduledReport {
  id: number;
  reportName: string;
  frequency: string;
  nextRun: string;
  recipients: string[];
  format: string;
  status: "active" | "paused" | "error";
  lastStatus: "success" | "failed" | "pending";
}

export default function ScheduledReportsPage() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ScheduledReport>("nextRun");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    reportName: '',
    frequency: 'daily',
    recipients: '',
    format: 'PDF',
    isActive: true,
  });

  // جلب التقارير من API
  const { data: reportsApiData, isLoading, refetch } = trpc.bi.reports.list.useQuery({});
  
  // جلب سجلات المهام المجدولة
  const { data: schedulerLogs } = trpc.scheduler.getLogs.useQuery({ limit: 50 });

  // تحويل البيانات من API
  const scheduledData: ScheduledReport[] = useMemo(() => {
    if (!reportsApiData || reportsApiData.length === 0) {
      return [];
    }
    return reportsApiData.map((r: any) => ({
      id: r.id,
      reportName: r.name || 'تقرير بدون اسم',
      frequency: r.schedule || 'يدوي',
      nextRun: r.nextRun ? formatDateTime(r.nextRun) : '-',
      recipients: r.recipients || [],
      format: r.format || 'PDF',
      status: r.status || 'active',
      lastStatus: r.lastStatus || 'pending',
    }));
  }, [reportsApiData]);

  // تشغيل مهمة يدوياً
  const runJobMutation = trpc.scheduler.runJob.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`تم تنفيذ التقرير بنجاح: ${result.message}`);
        refetch();
      } else {
        toast.error(`فشل تنفيذ التقرير: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('فشل في تشغيل التقرير');
    }
  });

  // تفعيل/تعطيل مهمة
  const toggleJobMutation = trpc.scheduler.toggleJob.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.enabled ? 'تم تفعيل التقرير' : 'تم إيقاف التقرير');
      refetch();
    },
    onError: () => {
      toast.error('فشل في تحديث حالة التقرير');
    }
  });

  const handleSort = (field: keyof ScheduledReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = scheduledData
    .filter(item =>
      item.reportName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const activeSchedules = scheduledData.filter(s => s.status === "active").length;
  const pausedSchedules = scheduledData.filter(s => s.status === "paused").length;
  const errorSchedules = scheduledData.filter(s => s.status === "error").length;

  const handleRunReport = (reportId: number, reportName: string) => {
    runJobMutation.mutate({ jobType: `report.${reportId}` });
    toast.info(`جاري تشغيل ${reportName}...`);
  };

  const handleToggleReport = (reportId: number, currentStatus: string) => {
    const newEnabled = currentStatus !== 'active';
    toggleJobMutation.mutate({ jobType: `report.${reportId}`, enabled: newEnabled });
  };

  const handleViewReport = (report: ScheduledReport) => {
    setSelectedReport(report);
    setShowViewDialog(true);
  };

  // Mutation لإنشاء تقرير مجدول جديد
  const createReportMutation = trpc.bi.reports.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء التقرير المجدول بنجاح');
      setShowNewDialog(false);
      setNewSchedule({ reportName: '', frequency: 'daily', recipients: '', format: 'PDF', isActive: true,
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء التقرير: ${error.message}`);
    },
  });

  const handleCreateSchedule = () => {
    if (!newSchedule.reportName.trim()) {
      toast.error('يرجى إدخال اسم التقرير');
      return;
    }
    // تحويل التكرار إلى cron expression
    const cronMap: Record<string, string> = {
      'daily': '0 0 8 * * *',
      'weekly': '0 0 8 * * 0',
      'monthly': '0 0 8 1 * *',
    };
    
    createReportMutation.mutate({
      title: newSchedule.reportName,
      scheduleCron: cronMap[newSchedule.frequency] || cronMap['daily'],
      recipients: newSchedule.recipients ? newSchedule.recipients.split(',').map(e => e.trim()) : [],
      format: newSchedule.format.toLowerCase() as 'pdf' | 'excel' | 'csv',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><Play className="h-3 w-3 ms-1" />نشط</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-800"><Pause className="h-3 w-3 ms-1" />متوقف</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 ms-1" />خطأ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLastStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ms-1" />نجح</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 ms-1" />فشل</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 ms-1" />معلق</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      'daily': 'يومي',
      'weekly': 'أسبوعي',
      'monthly': 'شهري',
      'manual': 'يدوي',
    };
    return labels[freq] || freq;
  };

  const SortButton = ({ field, children }: { field: keyof ScheduledReport; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-primary" : "text-gray-400"}`} />
    </button>
  );

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل التقارير المجدولة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التقارير المجدولة</h2>
          <p className="text-muted-foreground">إدارة جدولة إرسال التقارير التلقائية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="ms-2 h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="ms-2 h-4 w-4" />
            جدولة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المجدول</p>
                <h3 className="text-2xl font-bold">{scheduledData.length}</h3>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نشط</p>
                <h3 className="text-2xl font-bold">{activeSchedules}</h3>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوقف</p>
                <h3 className="text-2xl font-bold">{pausedSchedules}</h3>
              </div>
              <Pause className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أخطاء</p>
                <h3 className="text-2xl font-bold">{errorSchedules}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الجدولة</CardTitle>
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد تقارير مجدولة</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="ms-2 h-4 w-4" />
                إنشاء جدولة جديدة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-end p-3 font-medium">
                      <SortButton field="reportName">التقرير</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="frequency">التكرار</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="nextRun">التشغيل القادم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">المستلمون</th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="format">الصيغة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="status">الحالة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="lastStatus">آخر تشغيل</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.reportName}</td>
                      <td className="p-3">{getFrequencyLabel(item.frequency)}</td>
                      <td className="p-3">{item.nextRun}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{item.recipients.length}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{item.format}</Badge>
                      </td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">{getLastStatusBadge(item.lastStatus)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewReport(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRunReport(item.id, item.reportName)}>
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                          {item.status === "active" ? (
                            <Button variant="ghost" size="sm" onClick={() => handleToggleReport(item.id, item.status)}>
                              <Pause className="h-4 w-4 text-amber-600" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleToggleReport(item.id, item.status)}>
                              <Play className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Schedule Dialog */}
      {showNewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء جدولة جديدة</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم التقرير *</Label>
              <Input
                placeholder="مثال: تقرير المبيعات الأسبوعي"
                value={newSchedule.reportName}
                onChange={(e) => setNewSchedule({ ...newSchedule, reportName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>التكرار</Label>
              <Select
                value={newSchedule.frequency}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التكرار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="manual">يدوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المستلمون (البريد الإلكتروني)</Label>
              <Input
                placeholder="email@example.com, email2@example.com"
                value={newSchedule.recipients}
                onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>صيغة التقرير</Label>
              <Select
                value={newSchedule.format}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصيغة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>تفعيل الجدولة</Label>
              <Switch
                checked={newSchedule.isActive}
                onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, isActive: checked })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateSchedule}>
              إنشاء
            </Button>
          </div>
        </div>
      </div>)}

      {/* View Report Dialog */}
      {showViewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل التقرير المجدول</h3>
          </div>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">اسم التقرير</Label>
                  <p className="font-medium">{selectedReport.reportName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">التكرار</Label>
                  <p>{getFrequencyLabel(selectedReport.frequency)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الصيغة</Label>
                  <p>{selectedReport.format}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">التشغيل القادم</Label>
                <p>{selectedReport.nextRun}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">آخر تشغيل</Label>
                <div className="mt-1">{getLastStatusBadge(selectedReport.lastStatus)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">المستلمون ({selectedReport.recipients.length})</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedReport.recipients.length > 0 ? (
                    selectedReport?.recipients?.map((email, idx) => (
                      <Badge key={email.id ?? `Badge-${idx}`} variant="outline">{email}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">لا يوجد مستلمون</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              إغلاق
            </Button>
            {selectedReport && (
              <Button onClick={() => handleRunReport(selectedReport.id, selectedReport.reportName)}>
                <Play className="ms-2 h-4 w-4" />
                تشغيل الآن
              </Button>
            )}
          </div>
        </div>
      </div>)}
    </div>
  );
}
