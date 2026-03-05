import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, FileText, Lock, Eye, Activity, TrendingUp, AlertCircle, Clock, User, Filter } from "lucide-react";
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
import { PrintButton } from "@/components/PrintButton";

export default function GovernanceDashboard() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const queryError = false; // Error state from useQuery

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch governance stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isError, error} =
    useQuery({
      queryKey: ["governanceDashboard", "stats"],
      queryFn: () => api.get("/api/governance-dashboard/stats").then(r => r.data),
    });

  // Fetch violations
  const { data: violations, isLoading: violationsLoading, refetch: refetchViolations } =
    useQuery({
      queryKey: ["governanceDashboard", "violations", severityFilter, typeFilter],
      queryFn: () => api.get("/api/governance-dashboard/violations", { params: {
        severity: severityFilter !== "all" ? severityFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      }}).then(r => r.data),
    });

  // Fetch audit trail
  const { data: auditTrail, isLoading: auditLoading, refetch: refetchAudit } =
    useQuery({
      queryKey: ["governanceDashboard", "auditTrail"],
      queryFn: () => api.get("/api/governance-dashboard/audit-trail", { params: { limit: 50 } }).then(r => r.data),
    });

  // Run governance check mutation
  const runCheckMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/governance-dashboard/run-check", data).then(r => r.data),
    onSuccess: () => {
      refetchStats();
      refetchViolations();
    },
  });

  const handleRunCheck = () => {
    runCheckMutation.mutate({});
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchViolations();
    refetchAudit();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive">حرج</Badge>;
      case "HIGH":
        return <Badge variant="destructive" className="bg-orange-500">عالي</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary">متوسط</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getViolationTypeBadge = (type: string) => {
    switch (type) {
      case "NO_PERMISSION":
        return <Badge variant="outline" className="text-red-600 border-red-600">بدون صلاحية</Badge>;
      case "NO_SCOPE":
        return <Badge variant="outline" className="text-orange-600 border-orange-600">بدون نطاق</Badge>;
      case "NO_AUDIT":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">بدون تدقيق</Badge>;
      case "SCOPE_LEAK":
        return <Badge variant="outline" className="text-purple-600 border-purple-600">تسرب نطاق</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            لوحة مراقبة الحوكمة
          </h1>
          <p className="text-muted-foreground mt-1">
            مراقبة وتحليل الحوكمة والامتثال في النظام
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={handleRunCheck} disabled={runCheckMutation.isPending}>
            {runCheckMutation.isPending ? (
              <RefreshCw className="h-4 w-4 ms-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 ms-2" />
            )}
            تشغيل فحص الحوكمة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإجراءات</CardTitle>
              <PrintButton title="إجمالي الإجراءات" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcedures || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.protectedProcedures || 0} محمية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تغطية الصلاحيات</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.permissionCoverage?.toFixed(1) || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${stats?.permissionCoverage || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تغطية النطاق</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.scopeCoverage?.toFixed(1) || 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${stats?.scopeCoverage || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المخالفات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.violationsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.criticalViolations || 0} حرجة، {stats?.highViolations || 0} عالية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            نظرة عامة على التغطية
          </CardTitle>
          <CardDescription>
            نسب تغطية الحوكمة عبر مختلف الجوانب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">تغطية الصلاحيات</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.permissionCoverage?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all" 
                  style={{ width: `${stats?.permissionCoverage || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">تغطية النطاق المؤسسي</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.scopeCoverage?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all" 
                  style={{ width: `${stats?.scopeCoverage || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">تغطية سجل التدقيق</span>
                <span className="text-sm text-muted-foreground">
                  {stats?.auditCoverage?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all" 
                  style={{ width: `${stats?.auditCoverage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Violations and Audit Trail */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            المخالفات
            {(stats?.violationsCount || 0) > 0 && (
              <Badge variant="destructive" className="me-2">
                {stats?.violationsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            سجل التدقيق
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>قائمة المخالفات</CardTitle>
                <div className="flex gap-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 ms-2" />
                      <SelectValue placeholder="الخطورة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="CRITICAL">حرج</SelectItem>
                      <SelectItem value="HIGH">عالي</SelectItem>
                      <SelectItem value="MEDIUM">متوسط</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 ms-2" />
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="NO_PERMISSION">بدون صلاحية</SelectItem>
                      <SelectItem value="NO_SCOPE">بدون نطاق</SelectItem>
                      <SelectItem value="NO_AUDIT">بدون تدقيق</SelectItem>
                      <SelectItem value="SCOPE_LEAK">تسرب نطاق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : violations && violations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الخطورة</TableHead>
                      <TableHead>التفاصيل</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {violation.procedureName}
                        </TableCell>
                        <TableCell>{getViolationTypeBadge(violation.violationType)}</TableCell>
                        <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {violation.details}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(violation.detectedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">لا توجد مخالفات</h3>
                  <p className="text-muted-foreground">النظام متوافق مع معايير الحوكمة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>سجل التدقيق</CardTitle>
              <CardDescription>
                آخر 50 عملية مسجلة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditTrail && auditTrail.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العملية</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditTrail.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {entry.userId || 'نظام'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(entry.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {JSON.stringify(entry.metadata).slice(0, 100)}...
                          </code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">لا توجد سجلات</h3>
                  <p className="text-muted-foreground">لم يتم تسجيل أي عمليات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Check Info */}
      {stats?.generatedAt && (
        <div className="text-center text-sm text-muted-foreground">
          آخر تحديث: {formatDateTime(stats.generatedAt)}
        </div>
      )}
    </div>
  );
}
