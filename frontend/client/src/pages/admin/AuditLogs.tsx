import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAuditLogs } from '@/services/systemService';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Search, Loader2, Activity, User, Clock } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

export default function AuditLogs() {
  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs, isLoading } = useAuditLogs();

  const filteredLogs = (logs || []).filter((log: any) =>
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module?.includes(searchTerm)
  );

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    if (action?.includes('create')) return <Badge className="bg-green-100 text-green-800">إنشاء</Badge>;
    if (action?.includes('update')) return <Badge className="bg-blue-100 text-blue-800">تحديث</Badge>;
    if (action?.includes('delete')) return <Badge className="bg-red-100 text-red-800">حذف</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجل المراجعة</h2>
          <p className="text-gray-500">تتبع جميع العمليات والتغييرات في النظام</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي السجلات</p>
              <p className="text-2xl font-bold">{logs?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المستخدمين النشطين</p>
              <p className="text-2xl font-bold">{new Set((logs || []).map((l: any) => l.userId)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">آخر 24 ساعة</p>
              <p className="text-2xl font-bold">
                {(logs || []).filter((l: any) => {
                  const logDate = new Date(l.createdAt);
                  const now = new Date();
                  return (now.getTime() - logDate.getTime()) < 24 * 60 * 60 * 1000;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              سجل العمليات
            </CardTitle>
              <PrintButton title="التقرير" />
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">التاريخ</TableHead>
                <TableHead className="text-end">المستخدم</TableHead>
                <TableHead className="text-end">الوحدة</TableHead>
                <TableHead className="text-end">العملية</TableHead>
                <TableHead className="text-end">التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {log.createdAt ? formatDateTime(log.createdAt) : '-'}
                    </TableCell>
                    <TableCell>{log.userId || '-'}</TableCell>
                    <TableCell>{log.module || '-'}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-500">
                      {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
