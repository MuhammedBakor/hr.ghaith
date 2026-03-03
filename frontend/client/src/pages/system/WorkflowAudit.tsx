import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  GitBranch, 
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const actionColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  escalated: "bg-purple-100 text-purple-800",
  returned: "bg-orange-100 text-orange-800",
};

const actionLabels: Record<string, string> = {
  approved: "موافقة",
  rejected: "رفض",
  pending: "قيد الانتظار",
  escalated: "تصعيد",
  returned: "إعادة",
};

export default function WorkflowAudit() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");

  const { data: auditLogs, isLoading, refetch } = trpc.auditLogsExtended.list.useQuery({
    limit: 100,
  });

  const filteredLogs = auditLogs?.filter((log: any) => {
    const matchesSearch = 
      log.workflowName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.stepName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.comments?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesWorkflow = workflowFilter === "all" || log.workflowName === workflowFilter;
    return matchesSearch && matchesAction && matchesWorkflow;
  }) || [];

  const workflows = Array.from(new Set(auditLogs?.map((l: any) => l.workflowName).filter(Boolean) || []));

  const stats = {
    total: auditLogs?.length || 0,
    approved: auditLogs?.filter((l: any) => l.action === "approved").length || 0,
    rejected: auditLogs?.filter((l: any) => l.action === "rejected").length || 0,
    pending: auditLogs?.filter((l: any) => l.action === "pending").length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">سجل تدقيق سير العمل</h1>
          <p className="text-muted-foreground">تتبع جميع إجراءات سير العمل والموافقات</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإجراءات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">موافقات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مرفوضات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-lg md:text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في السجلات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الإجراءات</SelectItem>
                <SelectItem value="approved">موافقة</SelectItem>
                <SelectItem value="rejected">رفض</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="escalated">تصعيد</SelectItem>
                <SelectItem value="returned">إعادة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="سير العمل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع سير العمل</SelectItem>
                {(workflows as string[]).map((wf) => (
                  <SelectItem key={wf} value={wf}>
                    {wf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الإجراءات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سجلات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">سير العمل</TableHead>
                  <TableHead className="text-end">الخطوة</TableHead>
                  <TableHead className="text-end">الإجراء</TableHead>
                  <TableHead className="text-end">المستخدم</TableHead>
                  <TableHead className="text-end">الملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {log.createdAt 
                        ? format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: ar })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.workflowName || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {log.stepName || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || actionColors.pending}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.userName || log.userId || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.comments || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
