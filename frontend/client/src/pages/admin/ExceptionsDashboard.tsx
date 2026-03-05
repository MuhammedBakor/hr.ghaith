import { formatDate, formatDateTime } from '@/lib/formatDate';
/**
 * Exceptions Dashboard - لوحة إدارة الاستثناءات والمعلقات
 * 
 * تعرض:
 * - جميع الاستثناءات المفتوحة
 * - طابور المعلقات
 * - إجراءات الحل (إعادة المحاولة، تجاوز، إلغاء)
 */

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle2, RefreshCw, ArrowUpCircle, Eye, Search, AlertCircle, Pause, Play, SkipForward, ArrowRight } from 'lucide-react';
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// أنواع البيانات
type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
type ExceptionStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'escalated' | 'auto_resolved';

interface Exception {
  id: string;
  type: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  module: string;
  entityType: string;
  entityId: number;
  companyId: string;
  branchId: string;
  title: string;
  description: string;
  errorCode?: string;
  resolution?: string;
  resolvedBy?: number;
  resolvedAt?: number;
  escalationLevel: number;
  escalatedTo?: number;
  escalatedAt?: number;
  createdAt: number;
  createdBy?: number;
}

interface SuspenseItem {
  id: string;
  reason: string;
  module: string;
  entityType: string;
  entityId: number;
  companyId: string;
  branchId: string;
  title: string;
  description: string;
  waitingFor: string;
  waitingForUserId?: number;
  createdAt: number;
  dueAt?: number;
  isResolved: boolean;
  resolvedAt?: number;
  resolvedBy?: number;
  resolution?: string;
}

// View modes
type ViewMode = 'list' | 'resolve';

// مكون بطاقة الاستثناء
function ExceptionCard({ 
  exception, 
  onResolve, 
  onEscalate, 
  onAcknowledge 
}: { 
  exception: Exception;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) {
  const severityColors: Record<ExceptionSeverity, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<ExceptionStatus, string> = {
    open: 'bg-red-100 text-red-800',
    acknowledged: 'bg-blue-100 text-blue-800',
    investigating: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    escalated: 'bg-orange-100 text-orange-800',
    auto_resolved: 'bg-emerald-100 text-emerald-800',
  };

  const statusLabels: Record<ExceptionStatus, string> = {
    open: 'مفتوح',
    acknowledged: 'تم الاطلاع',
    investigating: 'قيد التحقيق',
    resolved: 'تم الحل',
    escalated: 'مُصعّد',
    auto_resolved: 'حُل تلقائياً',
  };

  const severityLabels: Record<ExceptionSeverity, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    critical: 'حرج',
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  
  return (
    <Card className="border-r-4" style={{ borderRightColor: exception.severity === 'critical' ? '#ef4444' : exception.severity === 'high' ? '#f97316' : exception.severity === 'medium' ? '#eab308' : '#3b82f6' }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${exception.severity === 'critical' ? 'text-red-500' : exception.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`} />
              <h3 className="font-semibold text-gray-900">{exception.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{exception.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={severityColors[exception.severity]}>
                {severityLabels[exception.severity]}
              </Badge>
              <Badge className={statusColors[exception.status]}>
                {statusLabels[exception.status]}
              </Badge>
              <Badge variant="outline">{exception.module}</Badge>
              <Badge variant="outline">{exception.entityType} #{exception.entityId}</Badge>
              {exception.escalationLevel > 0 && (
                <Badge className="bg-purple-100 text-purple-800">
                  مستوى التصعيد: {exception.escalationLevel}
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <span>تم الإنشاء: {formatDateTime(exception.createdAt)}</span>
              {exception.errorCode && <span className="me-4">كود الخطأ: {exception.errorCode}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {exception.status === 'open' && (
              <Button size="sm" variant="outline" onClick={() => onAcknowledge(exception.id)}>
                <Eye className="h-4 w-4 ms-1" />
                اطلاع
              </Button>
            )}
            {(exception.status === 'open' || exception.status === 'acknowledged' || exception.status === 'investigating') && (
              <>
                <Button size="sm" variant="default" onClick={() => onResolve(exception.id)}>
                  <CheckCircle2 className="h-4 w-4 ms-1" />
                  حل
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onEscalate(exception.id)}>
                  <ArrowUpCircle className="h-4 w-4 ms-1" />
                  تصعيد
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون بطاقة المعلق
function SuspenseCard({ 
  item, 
  onResolve, 
  onRetry, 
  onSkip 
}: { 
  item: SuspenseItem;
  onResolve: (id: string) => void;
  onRetry: (id: string) => void;
  onSkip: (id: string) => void;
}) {
  const isOverdue = item.dueAt && Date.now() > item.dueAt;

  const reasonLabels: Record<string, string> = {
    pending_approval: 'بانتظار الاعتماد',
    pending_document: 'بانتظار مستند',
    pending_budget: 'بانتظار الميزانية',
    pending_verification: 'بانتظار التحقق',
    pending_legal_review: 'بانتظار المراجعة القانونية',
    pending_payment: 'بانتظار الدفع',
    pending_signature: 'بانتظار التوقيع',
    manual_hold: 'إيقاف يدوي',
  };

  return (
    <Card className={`border-r-4 ${isOverdue ? 'border-r-red-500 bg-red-50' : 'border-r-amber-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Pause className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-800">متأخر</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-amber-100 text-amber-800">
                {reasonLabels[item.reason] || item.reason}
              </Badge>
              <Badge variant="outline">{item.module}</Badge>
              <Badge variant="outline">{item.entityType} #{item.entityId}</Badge>
            </div>
            <div className="text-xs text-gray-500">
              <span>بانتظار: {item.waitingFor}</span>
              <span className="me-4">منذ: {formatDateTime(item.createdAt)}</span>
              {item.dueAt && (
                <span className={`me-4 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  الموعد النهائي: {formatDateTime(item.dueAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="default" onClick={() => onResolve(item.id)}>
              <CheckCircle2 className="h-4 w-4 ms-1" />
              حل
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRetry(item.id)}>
              <RefreshCw className="h-4 w-4 ms-1" />
              إعادة
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onSkip(item.id)}>
              <SkipForward className="h-4 w-4 ms-1" />
              تجاوز
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExceptionsDashboard() {
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Simple notification function
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState('exceptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  
  // Resolve form states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [itemType, setItemType] = useState<'exception' | 'suspense'>('exception');

  // Fetch data
  const { data: exceptionsData, refetch: refetchExceptions, isError, error, isLoading} = useQuery({
    queryKey: ["exceptions", "list", statusFilter, severityFilter, moduleFilter],
    queryFn: () => api.get("/exceptions", { params: {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      module: moduleFilter !== 'all' ? moduleFilter : undefined,
    }}).then(r => r.data),
  });

  const { data: suspenseData, refetch: refetchSuspense } = useQuery({
    queryKey: ["exceptions", "suspenseItems", moduleFilter],
    queryFn: () => api.get("/exceptions/suspense-items", { params: {
      isResolved: false,
      module: moduleFilter !== 'all' ? moduleFilter : undefined,
    }}).then(r => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ["exceptions", "stats"],
    queryFn: () => api.get("/exceptions/stats").then(r => r.data),
  });

  // Mutations
  const resolveMutation = useMutation({
    mutationFn: (data: any) => api.post("/exceptions/resolve", data).then(r => r.data),
    onSuccess: () => {
      showNotification('تم حل الاستثناء بنجاح');
      refetchExceptions();
      handleBackToList();
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (data: any) => api.post("/exceptions/escalate", data).then(r => r.data),
    onSuccess: () => {
      showNotification('تم تصعيد الاستثناء');
      refetchExceptions();
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (data: any) => api.post("/exceptions/acknowledge", data).then(r => r.data),
    onSuccess: () => {
      showNotification('تم تسجيل الاطلاع');
      refetchExceptions();
    },
  });

  const resolveSuspenseMutation = useMutation({
    mutationFn: (data: any) => api.post("/exceptions/resolve-suspense", data).then(r => r.data),
    onSuccess: () => {
      showNotification('تم حل المعلق بنجاح');
      refetchSuspense();
      handleBackToList();
    },
  });

  // Handlers
  const handleResolve = (id: string, type: 'exception' | 'suspense') => {
    setSelectedItemId(id);
    setItemType(type);
    setViewMode('resolve');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItemId(null);
    setResolution('');
  };

  const handleConfirmResolve = () => {
    if (!selectedItemId || !resolution.trim()) return;
    
    if (itemType === 'exception') {
      resolveMutation.mutate({ exceptionId: selectedItemId, resolution });
    } else {
      resolveSuspenseMutation.mutate({ suspenseId: selectedItemId, resolution });
    }
  };

  const handleEscalate = (id: string) => {
    escalateMutation.mutate({ exceptionId: id, reason: 'تصعيد يدوي من لوحة التحكم' });
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeMutation.mutate({ exceptionId: id });
  };

  const handleRetry = (id: string) => {
    showNotification('جاري إعادة المحاولة...');
  };

  const handleSkip = (id: string) => {
    showNotification('تم تجاوز العملية', 'error');
  };

  // Filter data
  const filteredExceptions = (exceptionsData?.exceptions || []).filter((e: Exception) => 
    !searchQuery || 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuspense = (suspenseData?.items || []).filter((s: SuspenseItem) =>
    !searchQuery ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = statsData || {
    totalExceptions: 0,
    openExceptions: 0,
    criticalExceptions: 0,
    totalSuspense: 0,
    overdueSuspense: 0,
  };

  // Get selected item details
  const getSelectedItem = () => {
    if (!selectedItemId) return null;
    if (itemType === 'exception') {
      return filteredExceptions.find((e: Exception) => e.id === selectedItemId);
    } else {
      return filteredSuspense.find((s: SuspenseItem) => s.id === selectedItemId);
    }
  };

  // Render resolve form (in same page)
  const renderResolveForm = () => {
    const selectedItem = getSelectedItem();
    
    return (
      <div className="space-y-6" dir="rtl">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              حل {itemType === 'exception' ? 'الاستثناء' : 'المعلق'}
            </h2>
            <p className="text-gray-500">يرجى إدخال وصف الحل المتخذ</p>
          </div>
        </div>

        {/* Item Details */}
        {selectedItem && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل {itemType === 'exception' ? 'الاستثناء' : 'المعلق'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">العنوان</Label>
                  <div className="bg-gray-50 p-3 rounded-lg border mt-1">
                    <p className="text-sm">{selectedItem.title}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">الوحدة</Label>
                  <div className="bg-gray-50 p-3 rounded-lg border mt-1">
                    <p className="text-sm">{selectedItem.module}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">الوصف</Label>
                <div className="bg-gray-50 p-3 rounded-lg border mt-1">
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">وصف الحل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resolution" className="text-sm font-medium">
                وصف الحل المتخذ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="resolution"
                placeholder="اكتب وصف الحل هنا..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleConfirmResolve}
                disabled={!resolution.trim() || resolveMutation.isPending || resolveSuspenseMutation.isPending}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 ms-2" />
                {(resolveMutation.isPending || resolveSuspenseMutation.isPending) ? 'جاري الحفظ...' : 'تأكيد الحل'}
              </Button>
              <Button variant="outline" onClick={handleBackToList}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مركز الاستثناءات</h1>
          <p className="text-gray-500">إدارة الاستثناءات والعمليات المعلقة</p>
        </div>
        <Button onClick={() => { refetchExceptions(); refetchSuspense(); }}>
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">استثناءات مفتوحة</p>
              <p className="text-2xl font-bold">{stats.openExceptions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">حرجة</p>
              <p className="text-2xl font-bold">{stats.criticalExceptions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Pause className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">معلقات</p>
              <p className="text-2xl font-bold">{stats.totalSuspense}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">متأخرة</p>
              <p className="text-2xl font-bold">{stats.overdueSuspense}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي محلول</p>
              <p className="text-2xl font-bold">{stats.totalExceptions - stats.openExceptions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الخطورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">مرتفع</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="acknowledged">تم الاطلاع</SelectItem>
                <SelectItem value="investigating">قيد التحقيق</SelectItem>
                <SelectItem value="escalated">مُصعّد</SelectItem>
                <SelectItem value="resolved">محلول</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="finance">المالية</SelectItem>
                <SelectItem value="hr">الموارد البشرية</SelectItem>
                <SelectItem value="legal">الشؤون القانونية</SelectItem>
                <SelectItem value="fleet">الأسطول</SelectItem>
                <SelectItem value="procurement">المشتريات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exceptions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            الاستثناءات ({filteredExceptions.length})
          </TabsTrigger>
          <TabsTrigger value="suspense" className="flex items-center gap-2">
            <Pause className="h-4 w-4" />
            المعلقات ({filteredSuspense.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exceptions" className="space-y-4 mt-4">
          {filteredExceptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">لا توجد استثناءات</h3>
                <p className="text-gray-500">جميع العمليات تسير بشكل طبيعي</p>
              </CardContent>
            </Card>
          ) : (
            filteredExceptions.map((exception: Exception) => (
              <ExceptionCard
                key={exception.id}
                exception={exception}
                onResolve={(id) => handleResolve(id, 'exception')}
                onEscalate={handleEscalate}
                onAcknowledge={handleAcknowledge}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="suspense" className="space-y-4 mt-4">
          {filteredSuspense.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Play className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">لا توجد عمليات معلقة</h3>
                <p className="text-gray-500">جميع العمليات مكتملة</p>
              </CardContent>
            </Card>
          ) : (
            filteredSuspense.map((item: SuspenseItem) => (
              <SuspenseCard
                key={item.id}
                item={item}
                onResolve={(id) => handleResolve(id, 'suspense')}
                onRetry={handleRetry}
                onSkip={handleSkip}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <DashboardLayout>
      {viewMode === 'list' ? renderListView() : renderResolveForm()}
    </DashboardLayout>
  );
}
