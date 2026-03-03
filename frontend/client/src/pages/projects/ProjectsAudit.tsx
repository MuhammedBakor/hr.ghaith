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
import { trpc } from "@/lib/trpc";
import {
  Search,
  RefreshCw,
  FolderKanban,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  User,
  ListTodo,
  Users,
} from "lucide-react";

export default function ProjectsAudit() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: auditLogs, isLoading, refetch } = trpc.auditLogsExtended.list.useQuery({
    limit: 100,
  });

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
    if (action?.includes("complete")) return <CheckCircle className="h-4 w-4" />;
    if (action?.includes("task")) return <ListTodo className="h-4 w-4" />;
    if (action?.includes("member")) return <Users className="h-4 w-4" />;
    return <FolderKanban className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    if (action?.includes("view")) return <Badge variant="secondary">عرض</Badge>;
    if (action?.includes("create")) return <Badge className="bg-green-500">إنشاء</Badge>;
    if (action?.includes("update")) return <Badge className="bg-blue-500">تحديث</Badge>;
    if (action?.includes("delete")) return <Badge variant="destructive">حذف</Badge>;
    if (action?.includes("complete")) return <Badge className="bg-purple-500">إكمال</Badge>;
    if (action?.includes("task")) return <Badge className="bg-amber-500">مهمة</Badge>;
    if (action?.includes("member")) return <Badge className="bg-cyan-500">عضو</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const stats = {
    total: auditLogs?.length || 0,
    projects: auditLogs?.filter((l: any) => l.action?.includes("project")).length || 0,
    tasks: auditLogs?.filter((l: any) => l.action?.includes("task")).length || 0,
    members: auditLogs?.filter((l: any) => l.action?.includes("member")).length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">سجل تدقيق المشاريع</h2>
          <p className="text-muted-foreground">تتبع جميع العمليات على المشاريع والمهام والأعضاء</p>
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
            <FolderKanban className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المشاريع</p>
              <h3 className="text-2xl font-bold">{stats.projects}</h3>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">المهام</p>
              <h3 className="text-2xl font-bold">{stats.tasks}</h3>
            </div>
            <ListTodo className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">الأعضاء</p>
              <h3 className="text-2xl font-bold">{stats.members}</h3>
            </div>
            <Users className="h-8 w-8 text-green-500" />
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
                <SelectItem value="project">المشاريع</SelectItem>
                <SelectItem value="task">المهام</SelectItem>
                <SelectItem value="member">الأعضاء</SelectItem>
                <SelectItem value="complete">الإكمال</SelectItem>
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
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                {filteredLogs.map((log: any) => (
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
