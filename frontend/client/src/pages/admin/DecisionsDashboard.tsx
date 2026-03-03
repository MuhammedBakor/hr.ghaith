import { formatDate, formatDateTime } from '@/lib/formatDate';
/**
 * Dashboard للقرارات التلقائية
 * 
 * يعرض جميع قرارات الـ Kernel:
 * - السماح
 * - الرفض
 * - التعليق
 * - التصعيد
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

// Types
type DecisionAction = "allow" | "deny" | "suspend" | "escalate" | "require_approval";

interface Decision {
  id: number;
  action: DecisionAction;
  reason: string;
  explanation: string;
  module: string;
  operation: string;
  entityType: string;
  entityId?: number;
  userId?: number;
  amount?: number;
  currency?: string;
  budgetCategory?: string;
  evidence?: string[];
  requiredActions?: string[];
  escalateTo?: string;
  processingTime?: number;
  timestamp: string;
}

interface DecisionStats {
  total: number;
  allowed: number;
  denied: number;
  suspended: number;
  escalated: number;
  requireApproval: number;
  byModule: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
}

// Action badge colors
const actionColors: Record<DecisionAction, { bg: string; text: string; icon: React.ReactNode }> = {
  allow: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
  deny: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-4 w-4" /> },
  suspend: { bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="h-4 w-4" /> },
  escalate: { bg: "bg-purple-100", text: "text-purple-700", icon: <AlertTriangle className="h-4 w-4" /> },
  require_approval: { bg: "bg-blue-100", text: "text-blue-700", icon: <Shield className="h-4 w-4" /> },
};

// Action labels
const actionLabels: Record<DecisionAction, string> = {
  allow: "مسموح",
  deny: "مرفوض",
  suspend: "معلق",
  escalate: "مصعّد",
  require_approval: "يحتاج موافقة",
};

// Module labels
const moduleLabels: Record<string, string> = {
  finance: "المالية",
  hr: "الموارد البشرية",
  procurement: "المشتريات",
  legal: "القانونية",
  fleet: "الأسطول",
  projects: "المشاريع",
  requests: "الطلبات",
  unknown: "غير محدد",
};

// View modes
type ViewMode = "list" | "details";

export default function DecisionsDashboard() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const queryError = false; // Error state from useQuery

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [actionFilter, setActionFilter] = useState<DecisionAction | "all">("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const pageSize = 20;

  // Fetch decisions from API
  const { data: decisionsData, isLoading: isLoadingDecisions, refetch: refetchDecisions } = trpc.decisions.getDecisions.useQuery({
    action: actionFilter === "all" ? undefined : actionFilter,
    module: moduleFilter === "all" ? undefined : moduleFilter,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  // Fetch stats from API
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = trpc.decisions.getDecisionStats.useQuery({});

  // Map API data to component format
  const decisionsArray = decisionsData?.decisions || [];
  const decisions: Decision[] = decisionsArray.map((d: any) => ({
    id: d.id,
    action: d.action,
    reason: d.reason || '',
    explanation: d.explanation || '',
    module: d.module || 'unknown',
    operation: d.operation || '',
    entityType: d.entityType || '',
    entityId: d.entityId,
    userId: d.userId,
    amount: d.amount,
    currency: d.currency,
    budgetCategory: d.budgetCategory,
    evidence: d.evidence,
    requiredActions: d.requiredActions,
    escalateTo: d.escalateTo,
    processingTime: d.processingTime,
    timestamp: d.timestamp || new Date().toISOString(),
  }));

  const stats: DecisionStats = statsData || {
    total: 0,
    allowed: 0,
    denied: 0,
    suspended: 0,
    escalated: 0,
    requireApproval: 0,
    byModule: {},
    byDay: [],
  };

  const isLoading = isLoadingDecisions || isLoadingStats;

  // Filter decisions locally for search
  const filteredDecisions = decisions.filter(d => {
    if (searchQuery && !d.reason.includes(searchQuery) && !d.explanation.includes(searchQuery)) return false;
    return true;
  });

  const total = stats.total || filteredDecisions.length;
  const totalPages = Math.ceil(total / (pageSize || 1));

  // Handlers
  const handleRefresh = () => {
    refetchDecisions();
    refetchStats();
  };

  const handleExport = () => {
    // تصدير البيانات إلى CSV
    const headers = ['التاريخ', 'المستخدم', 'العملية', 'النوع', 'القرار', 'السبب'];
    const csvData = filteredDecisions.map(d => [
      formatDateTime(d.timestamp),
      d.userId,
      d.operation,
      d.entityType,
      d.action === 'allow' ? 'مسموح' : d.action === 'deny' ? 'مرفوض' : d.action === 'suspend' ? 'معلق' : d.action === 'escalate' ? 'مصعّد' : 'يحتاج موافقة',
      d.reason
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decisions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (decision: Decision) => {
    setSelectedDecision(decision);
    setViewMode("details");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedDecision(null);
  };

  // Render stats cards
  const renderStatsCards = () => {
    const cards = [
      { label: "إجمالي القرارات", value: stats.total, icon: <Activity className="h-5 w-5" />, color: "text-gray-600" },
      { label: "مسموح", value: stats.allowed, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-600" },
      { label: "مرفوض", value: stats.denied, icon: <XCircle className="h-5 w-5" />, color: "text-red-600" },
      { label: "معلق", value: stats.suspended, icon: <Clock className="h-5 w-5" />, color: "text-amber-600" },
      { label: "مصعّد", value: stats.escalated, icon: <AlertTriangle className="h-5 w-5" />, color: "text-purple-600" },
      { label: "يحتاج موافقة", value: stats.requireApproval, icon: <Shield className="h-5 w-5" />, color: "text-blue-600" },
    ];

    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {cards.map((card, index) => (
          <Card key={card.id ?? `Card-${index}`} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={card.color}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render filters
  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500">فلترة:</span>
      </div>
      
      <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as DecisionAction | "all"); setPage(1); }}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="نوع القرار" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع القرارات</SelectItem>
          <SelectItem value="allow">مسموح</SelectItem>
          <SelectItem value="deny">مرفوض</SelectItem>
          <SelectItem value="suspend">معلق</SelectItem>
          <SelectItem value="escalate">مصعّد</SelectItem>
          <SelectItem value="require_approval">يحتاج موافقة</SelectItem>
        </SelectContent>
      </Select>

      <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="الوحدة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الوحدات</SelectItem>
          <SelectItem value="finance">المالية</SelectItem>
          <SelectItem value="hr">الموارد البشرية</SelectItem>
          <SelectItem value="procurement">المشتريات</SelectItem>
          <SelectItem value="legal">القانونية</SelectItem>
          <SelectItem value="fleet">الأسطول</SelectItem>
          <SelectItem value="projects">المشاريع</SelectItem>
          <SelectItem value="requests">الطلبات</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="بحث..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-[200px]"
      />

      <div className="flex-1" />

      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        <span className="me-2">تحديث</span>
      </Button>

      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4" />
        <span className="me-2">تصدير</span>
      </Button>
    </div>
  );

  // Render decisions table
  const renderDecisionsTable = () => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-end">التاريخ</TableHead>
              <TableHead className="text-end">الوحدة</TableHead>
              <TableHead className="text-end">العملية</TableHead>
              <TableHead className="text-end">القرار</TableHead>
              <TableHead className="text-end">السبب</TableHead>
              <TableHead className="text-end">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">جاري التحميل...</p>
                </TableCell>
              </TableRow>
            ) : filteredDecisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  لا توجد قرارات
                </TableCell>
              </TableRow>
            ) : (
              filteredDecisions.map((decision) => {
                const actionStyle = actionColors[decision.action];
                return (
                  <TableRow key={decision.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm">
                      {formatDateTime(decision.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {moduleLabels[decision.module] || decision.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{decision.operation}</TableCell>
                    <TableCell>
                      <Badge className={`${actionStyle.bg} ${actionStyle.text} border-0`}>
                        <span className="ms-1">{actionStyle.icon}</span>
                        {actionLabels[decision.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {decision.reason}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(decision)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        عرض {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} من {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          صفحة {page} من {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render decision details
  const renderDecisionDetails = () => {
    if (!selectedDecision) return null;

    const actionStyle = actionColors[selectedDecision.action];

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4">
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">تفاصيل القرار #{selectedDecision.id}</CardTitle>
              <PrintButton title="تفاصيل القرار #{selectedDecision.id}" />
              <Badge className={`${actionStyle.bg} ${actionStyle.text} border-0`}>
                <span className="ms-1">{actionStyle.icon}</span>
                {actionLabels[selectedDecision.action]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">الوحدة</p>
                <p className="font-medium">{moduleLabels[selectedDecision.module] || selectedDecision.module}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">العملية</p>
                <p className="font-medium">{selectedDecision.operation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">نوع الكيان</p>
                <p className="font-medium">{selectedDecision.entityType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">معرف الكيان</p>
                <p className="font-medium">{selectedDecision.entityId || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">التاريخ</p>
                <p className="font-medium">{formatDateTime(selectedDecision.timestamp)}</p>
              </div>
              {selectedDecision.amount && (
                <div>
                  <p className="text-sm text-gray-500">المبلغ</p>
                  <p className="font-medium">{selectedDecision.amount.toLocaleString()} {selectedDecision.currency || 'ر.س'}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">السبب</p>
              <p className="font-medium">{selectedDecision.reason}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">الشرح</p>
              <p className="text-gray-700">{selectedDecision.explanation}</p>
            </div>

            {selectedDecision.evidence && selectedDecision.evidence.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">الأدلة</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDecision?.evidence?.map((e, i) => (
                    <li key={e.id ?? `li-${i}`} className="text-gray-700">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDecision.requiredActions && selectedDecision.requiredActions.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">الإجراءات المطلوبة</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDecision?.requiredActions?.map((a, i) => (
                    <li key={a.id ?? `li-${i}`} className="text-gray-700">{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDecision.escalateTo && (
              <div>
                <p className="text-sm text-gray-500 mb-1">التصعيد إلى</p>
                <p className="font-medium">{selectedDecision.escalateTo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة القرارات التلقائية</h1>
        <p className="text-gray-500">مراقبة وتتبع قرارات النواة</p>
      </div>

      {viewMode === "list" ? (
        <>
          {renderStatsCards()}
          {renderFilters()}
          {renderDecisionsTable()}
          {renderPagination()}
        </>
      ) : (
        renderDecisionDetails()
      )}
    </div>
  );
}
