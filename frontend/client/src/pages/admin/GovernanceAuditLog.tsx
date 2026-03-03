import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PrintButton } from "@/components/PrintButton";

interface AuditLogEntry {
  id: number;
  action: string;
  userId: number | null;
  userName?: string;
  details: Record<string, any> | unknown;
  createdAt: string | Date;
}

export default function GovernanceAuditLog() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // جلب سجلات التدقيق
  const { data: auditLogs, isLoading, refetch } = trpc.governanceDashboard.getAuditLogs.useQuery({
    limit: 100,
    module: filterModule !== "all" ? filterModule : undefined,
    action: filterAction !== "all" ? filterAction : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // تصفية السجلات حسب البحث
  const filteredLogs = (auditLogs || []).filter((log: AuditLogEntry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
      log.action.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  // تحديد لون الـ Badge حسب نوع العملية
  const getActionBadge = (action: string) => {
    if (action.includes("delete") || action.includes("terminate")) {
      return <Badge variant="destructive">حذف</Badge>;
    }
    if (action.includes("approve")) {
      return <Badge className="bg-green-500">موافقة</Badge>;
    }
    if (action.includes("reject")) {
      return <Badge variant="secondary">رفض</Badge>;
    }
    if (action.includes("create")) {
      return <Badge className="bg-blue-500">إنشاء</Badge>;
    }
    if (action.includes("update") || action.includes("edit")) {
      return <Badge className="bg-amber-500">تعديل</Badge>;
    }
    if (action.includes("permission") || action.includes("role")) {
      return <Badge className="bg-purple-500">صلاحيات</Badge>;
    }
    return <Badge variant="outline">{action.split(".").pop()}</Badge>;
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = (action: string) => {
    if (action.includes("completed") || action.includes("success")) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (action.includes("failed") || action.includes("error")) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (action.includes("initiated") || action.includes("pending")) {
      return <Clock className="h-4 w-4 text-amber-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  };

  // تصدير السجلات
  const handleExport = () => {
    const csvContent = [
      ["التاريخ", "المستخدم", "العملية", "السبب", "الدليل", "التفاصيل"].join(","),
      ...filteredLogs.map((log: AuditLogEntry) => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.userName || log.userId,
        log.action,
        (log.details as any)?.reason || "-",
        (log.details as any)?.evidence || "-",
        JSON.stringify(log.details).replace(/,/g, ";"),
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `governance-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل الحوكمة</h1>
            <p className="text-gray-500">تتبع جميع العمليات المحكومة في النظام</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 ms-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي السجلات</p>
              <p className="text-2xl font-bold">{filteredLogs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عمليات ناجحة</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l: AuditLogEntry) => l.action.includes("completed")).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عمليات فاشلة</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l: AuditLogEntry) => l.action.includes("failed")).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">عمليات معلقة</p>
              <p className="text-2xl font-bold">
                {filteredLogs.filter((l: AuditLogEntry) => l.action.includes("initiated")).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر البحث */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الوحدات</SelectItem>
                <SelectItem value="hr">الموارد البشرية</SelectItem>
                <SelectItem value="finance">المالية</SelectItem>
                <SelectItem value="fleet">الأسطول</SelectItem>
                <SelectItem value="legal">القانونية</SelectItem>
                <SelectItem value="settings">الإعدادات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العمليات</SelectItem>
                <SelectItem value="delete">حذف</SelectItem>
                <SelectItem value="approve">موافقة</SelectItem>
                <SelectItem value="reject">رفض</SelectItem>
                <SelectItem value="create">إنشاء</SelectItem>
                <SelectItem value="update">تعديل</SelectItem>
                <SelectItem value="permission">صلاحيات</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
              placeholder="من تاريخ"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
              placeholder="إلى تاريخ"
            />
          </div>
        </CardContent>
      </Card>

      {/* جدول السجلات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            سجلات الحوكمة ({filteredLogs.length})
          </CardTitle>
              <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد سجلات حوكمة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">المستخدم</TableHead>
                  <TableHead className="text-end">العملية</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">السبب</TableHead>
                  <TableHead className="text-end">الدليل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: AuditLogEntry) => (
                  <TableRow key={log.id}>
                    <TableCell>{getStatusIcon(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ar })}
                        <Clock className="h-3 w-3 text-gray-400 me-2" />
                        {format(new Date(log.createdAt), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{log.userName || `مستخدم #${log.userId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.action.split(".").slice(-2).join(".")}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                        {(log.details as any)?.reason || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(log.details as any)?.evidence ? (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 ms-1" />
                          مرفق
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
