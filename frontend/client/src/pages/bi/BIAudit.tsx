import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Search,
  RefreshCw,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  BarChart3,
  Activity,
  Clock,
  User,
} from "lucide-react";

export default function BIAudit() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // بيانات مؤقتة - سيتم ربطها بالـ API لاحقاً
  const auditLogs: any[] = [];
  const isLoading = false;
  const refetch = () => {};

  const filteredLogs = auditLogs?.filter((log: any) => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action?.includes(actionFilter);
    return matchesSearch && matchesAction;
  }) || [];

  const getActionIcon = (action: string) => {
    if (action?.includes("view")) return <Eye className="h-4 w-4" />;
    if (action?.includes("create")) return <FileText className="h-4 w-4" />;
    if (action?.includes("update") || action?.includes("edit")) return <Edit className="h-4 w-4" />;
    if (action?.includes("delete")) return <Trash2 className="h-4 w-4" />;
    if (action?.includes("export")) return <Download className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    if (action?.includes("view")) return <Badge variant="secondary">عرض</Badge>;
    if (action?.includes("create")) return <Badge className="bg-green-500">إنشاء</Badge>;
    if (action?.includes("update")) return <Badge className="bg-blue-500">تحديث</Badge>;
    if (action?.includes("delete")) return <Badge variant="destructive">حذف</Badge>;
    if (action?.includes("export")) return <Badge className="bg-purple-500">تصدير</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const stats = {
    total: auditLogs?.length || 0,
    views: auditLogs?.filter((l: any) => l.action?.includes("view")).length || 0,
    exports: auditLogs?.filter((l: any) => l.action?.includes("export")).length || 0,
    changes: auditLogs?.filter((l: any) => l.action?.includes("update") || l.action?.includes("create")).length || 0,
  };

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">سجل تدقيق ذكاء الأعمال</h2>
          <p className="text-muted-foreground">تتبع جميع العمليات على لوحات التحكم والتقارير</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المشاهدات</p>
              <h3 className="text-2xl font-bold">{stats.views}</h3>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">التصديرات</p>
              <h3 className="text-2xl font-bold">{stats.exports}</h3>
            </div>
            <Download className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">التغييرات</p>
              <h3 className="text-2xl font-bold">{stats.changes}</h3>
            </div>
            <Edit className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في السجلات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العمليات</SelectItem>
                <SelectItem value="view">عرض</SelectItem>
                <SelectItem value="create">إنشاء</SelectItem>
                <SelectItem value="update">تحديث</SelectItem>
                <SelectItem value="delete">حذف</SelectItem>
                <SelectItem value="export">تصدير</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل العمليات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سجلات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العملية</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.userId || "النظام"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
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
