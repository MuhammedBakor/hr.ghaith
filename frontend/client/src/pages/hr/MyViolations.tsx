import { formatDate } from '@/lib/formatDate';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { AlertTriangle, Eye, CheckCircle, Inbox, Loader2, User, Calendar, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { PrintButton } from '@/components/PrintButton';

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  sent: 'مُرسلة',
  acknowledged: 'تم الاستلام',
};

export default function MyViolations() {
  const { currentEmployeeId } = useAppContext();
  const [viewViolation, setViewViolation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['my-violations', currentEmployeeId],
    queryFn: () => api.get('/hr/violations', { params: { employeeId: currentEmployeeId } }).then(r => r.data),
    enabled: !!currentEmployeeId,
  });

  const filtered = (violations as any[]).filter((v: any) => {
    if (!searchTerm) return true;
    return (v.violationType || '').includes(searchTerm) ||
      (v.sentByName || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: (violations as any[]).length,
    sent: (violations as any[]).filter((v: any) => v.status === 'sent').length,
    acknowledged: (violations as any[]).filter((v: any) => v.status === 'acknowledged').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مخالفاتي</h1>
          <p className="text-muted-foreground">المخالفات الصادرة بحقك</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المخالفات</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">بانتظار الاستلام</p>
              <h3 className="text-2xl font-bold">{stats.sent}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">تم الاستلام</p>
              <h3 className="text-2xl font-bold">{stats.acknowledged}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة المخالفات</CardTitle>
              <PrintButton title="مخالفاتي" />
              <CardDescription>المخالفات الصادرة بحقك مع تفاصيل من أرسلها</CardDescription>
            </div>
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">لا توجد مخالفات</p>
              <p className="text-sm">سجلك نظيف من المخالفات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع المخالفة</TableHead>
                  <TableHead>تاريخ المخالفة</TableHead>
                  <TableHead>أُرسلت من</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.violationType || '-'}</TableCell>
                    <TableCell>{v.violationDate ? formatDate(v.violationDate) : '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.sentByName || '-'}</p>
                        {v.sentByRole && (
                          <p className="text-xs text-muted-foreground">{v.sentByRole}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{v.createdAt ? formatDate(v.createdAt) : '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[v.status] || 'bg-gray-100 text-gray-700'}>
                        {statusLabels[v.status] || v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setViewViolation(v)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">حقوقك كموظف</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• يحق لك الاطلاع على تفاصيل أي مخالفة مسجلة ضدك</li>
                <li>• يمكنك التواصل مع مديرك المباشر أو قسم الموارد البشرية لأي استفسار</li>
                <li>• يحق لك تقديم توضيح أو اعتراض على المخالفة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewViolation} onOpenChange={(o) => { if (!o) setViewViolation(null); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تفاصيل المخالفة
            </DialogTitle>
          </DialogHeader>
          {viewViolation && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> نوع المخالفة
                  </p>
                  <p className="font-semibold mt-1">{viewViolation.violationType || '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> تاريخ المخالفة
                  </p>
                  <p className="font-semibold mt-1">
                    {viewViolation.violationDate ? formatDate(viewViolation.violationDate) : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> أُرسلت بواسطة
                  </p>
                  <p className="font-semibold mt-1">{viewViolation.sentByName || '-'}</p>
                  {viewViolation.sentByRole && (
                    <p className="text-xs text-muted-foreground">{viewViolation.sentByRole}</p>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> تاريخ الإرسال
                  </p>
                  <p className="font-semibold mt-1">
                    {viewViolation.createdAt ? formatDate(viewViolation.createdAt) : '-'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">الحالة</p>
                <div className="mt-1">
                  <Badge className={statusColors[viewViolation.status] || 'bg-gray-100 text-gray-700'}>
                    {statusLabels[viewViolation.status] || viewViolation.status}
                  </Badge>
                </div>
              </div>
              {viewViolation.description && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-700 mb-1">تفاصيل المخالفة</p>
                  <p className="text-sm text-amber-900">{viewViolation.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewViolation(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
