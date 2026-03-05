import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Plus, Search, ArrowUpDown, Eye, CheckCircle, Clock, AlertCircle, Loader2, Inbox } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  userId: number | null;
  details: any;
  createdAt: Date | string;
}

export default function Audits() {
  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);

  // استخدام API الحقيقي لسجل التدقيق
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', { limit: 100 }],
    queryFn: () => api.get('/audit/logs', { params: { limit: 100 } }).then(r => r.data),
  });
  const audits = auditLogs || [];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAudits = [...audits]
    .filter((a: any) =>
      a.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => {
      const aVal = String((a as any)[sortField] || '');
      const bVal = String((b as any)[sortField] || '');
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const getActionBadge = (action: string) => {
    if (action?.includes('create')) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ms-1" />إنشاء</Badge>;
    }
    if (action?.includes('update')) {
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 ms-1" />تحديث</Badge>;
    }
    if (action?.includes('delete')) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 ms-1" />حذف</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{action}</Badge>;
  };

  const getEntityTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      'employee': 'موظف',
      'vehicle': 'مركبة',
      'driver': 'سائق',
      'maintenance': 'صيانة',
      'fuel': 'وقود',
      'trip': 'رحلة',
      'document': 'مستند',
      'policy': 'سياسة',
      'user': 'مستخدم'
    };
    return <Badge variant="outline">{types[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const createCount = audits.filter((a: any) => a.action?.includes('create')).length;
  const updateCount = audits.filter((a: any) => a.action?.includes('update')).length;
  const deleteCount = audits.filter((a: any) => a.action?.includes('delete')).length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجل التدقيق</h2>
          <p className="text-gray-500">متابعة جميع العمليات والتغييرات في النظام</p>
        </div>
        <Button className="gap-2" onClick={() => {
          // تصدير السجل ك CSV
          const csvContent = [
            ['العملية', 'النوع', 'المعرف', 'التاريخ'].join(','),
            ...sortedAudits.map((a: any) => [
              a.action,
              a.entityType,
              a.entityId,
              formatDateTime(a.createdAt)
            ].join(','))
          ].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          toast.success('تم تصدير السجل بنجاح');
        }}>
          <Plus className="h-4 w-4" />
          تصدير السجل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي السجلات</p>
              <h3 className="text-2xl font-bold">{audits.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عمليات الإنشاء</p>
              <h3 className="text-2xl font-bold">{createCount}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عمليات التحديث</p>
              <h3 className="text-2xl font-bold">{updateCount}</h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">عمليات الحذف</p>
              <h3 className="text-2xl font-bold">{deleteCount}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
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
                <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    #
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('action')}>
                  <div className="flex items-center gap-1">
                    العملية
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('entityType')}>
                  <div className="flex items-center gap-1">
                    نوع الكيان
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('entityId')}>
                  <div className="flex items-center gap-1">
                    معرف الكيان
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    التاريخ
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAudits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Inbox className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium">لا توجد سجلات</p>
                      <p className="text-sm">سيتم تسجيل العمليات تلقائياً</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAudits.map((audit: any) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.id}</TableCell>
                    <TableCell>{getActionBadge(audit.action)}</TableCell>
                    <TableCell>{getEntityTypeBadge(audit.entityType)}</TableCell>
                    <TableCell>{audit.entityId || '-'}</TableCell>
                    <TableCell>
                      {audit.createdAt ? formatDateTime(audit.createdAt) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAudit(audit)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog عرض تفاصيل التدقيق */}
      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل العملية</DialogTitle>
          </DialogHeader>
          {selectedAudit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">العملية</p>
                  <p className="font-medium">{selectedAudit.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">النوع</p>
                  <p className="font-medium">{selectedAudit.entityType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المعرف</p>
                  <p className="font-medium">{selectedAudit.entityId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">التاريخ</p>
                  <p className="font-medium">{formatDateTime(selectedAudit.createdAt)}</p>
                </div>
              </div>
              {selectedAudit.details && Object.keys(selectedAudit.details).length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">التفاصيل</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-auto max-h-48 text-start" dir="ltr">
                    {JSON.stringify(selectedAudit.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
