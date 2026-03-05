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
  MessageSquare, 
  Mail, 
  Phone, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MessageLogs() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading, refetch } = trpc.notifications.list.useQuery();

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Phone className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 me-1" />تم الإرسال</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 me-1" />فشل</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 me-1" />قيد الانتظار</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">سجل الرسائل</h2>
          <p className="text-muted-foreground">عرض جميع الرسائل المرسلة من النظام</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            سجل الرسائل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 px-2 md:px-0 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالمستلم أو المحتوى..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="القناة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع القنوات</SelectItem>
                <SelectItem value="email">البريد الإلكتروني</SelectItem>
                <SelectItem value="sms">رسائل SMS</SelectItem>
                <SelectItem value="whatsapp">واتساب</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="sent">تم الإرسال</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">القناة</TableHead>
                  <TableHead className="text-end">المستلم</TableHead>
                  <TableHead className="text-end">الموضوع</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.channel)}
                          <span className="capitalize">{log.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.recipient}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.subject || "-"}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell dir="ltr" className="text-end">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد رسائل
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 md:px-0">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">القناة</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getChannelIcon(selectedLog.channel)}
                    <span className="capitalize">{selectedLog.channel}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المستلم</label>
                  <p className="mt-1">{selectedLog.recipient}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">التاريخ</label>
                  <p className="mt-1" dir="ltr">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
              </div>
              {selectedLog.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الموضوع</label>
                  <p className="mt-1">{selectedLog.subject}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">المحتوى</label>
                <div className="mt-1 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedLog.body || selectedLog.content || "-"}
                </div>
              </div>
              {selectedLog.error && (
                <div>
                  <label className="text-sm font-medium text-red-600">رسالة الخطأ</label>
                  <p className="mt-1 text-red-600">{selectedLog.error}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
