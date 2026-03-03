import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

export default function PendingBalances() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [reviewDialog, setReviewDialog] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const utils = trpc.useUtils();
  
  const { data: balances, isLoading, isError, error} = trpc.pendingBalances.list.useQuery({ status: 'pending' });
  

  const approveMutation = trpc.pendingBalances.approve.useMutation({ onSuccess: () => { toast.success('تمت الموافقة'); setReviewDialog(null); utils.pendingBalances.list.invalidate(); }, onError: (e: any) => { alert(e.message || "حدث خطأ"); } });
  
  const rejectMutation = trpc.pendingBalances.reject.useMutation({ onSuccess: () => { toast.success('تم الرفض'); setReviewDialog(null); utils.pendingBalances.list.invalidate(); }, onError: (e: any) => { alert(e.message || "حدث خطأ"); } });

  const typeLabels: Record<string, string> = {
    expense: 'مصروف', leave: 'إجازة', invoice: 'فاتورة',
    payroll: 'راتب', purchase_order: 'طلب شراء',
  };

  const typeIcons: Record<string, any> = {
    expense: DollarSign, leave: Calendar, invoice: DollarSign,
    payroll: DollarSign, purchase_order: DollarSign,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="p-6 space-y-6" dir="rtl">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" /> الأرصدة المعلقة
          </h2>
          <p className="text-gray-500">مراجعة واعتماد الأرصدة المعلقة</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {balances?.length || 0} معلق
        </Badge>
      </div>

      {isLoading && <p className="text-center text-gray-500">جاري التحميل...</p>}

      <div className="grid gap-4">
        {balances?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((b: any) => {
          const Icon = typeIcons[b.entityType] || AlertTriangle;
          return (
            <Card key={b.id} className="border-r-4 border-r-yellow-400">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Icon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {typeLabels[b.entityType] || b.entityType} #{b.entityId}
                      </p>
                      {b.amount && (
                        <p className="text-lg font-bold text-blue-600">
                          {parseFloat(b.amount).toLocaleString('ar-SA')} ر.س
                        </p>
                      )}
                      {b.days && (
                        <p className="text-lg font-bold text-green-600">
                          {b.days} يوم
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        تاريخ التقديم: {formatDate(b.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1"
                      onClick={() => { setReviewDialog({ id: b.id, action: 'approve' }); setNotes(''); }}>
                      <CheckCircle className="h-4 w-4" /> اعتماد
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1"
                      onClick={() => { setReviewDialog({ id: b.id, action: 'reject' }); setNotes(''); }}>
                      <XCircle className="h-4 w-4" /> رفض
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {balances?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-700">لا توجد أرصدة معلقة</p>
              <p className="text-gray-500">جميع الطلبات تمت مراجعتها</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* قسم المراجعة المضمن */}
      {!!reviewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              {reviewDialog?.action === 'approve' ? '✅ اعتماد الرصيد' : '❌ رفض الرصيد'}
            </h3>
          </div>
          <div>
            <Textarea
              placeholder={reviewDialog?.action === 'approve' ? 'ملاحظات (اختياري)' : 'سبب الرفض (مطلوب)'}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setReviewDialog(null)}>إلغاء</Button>
            <Button
              className={reviewDialog?.action === 'approve' ? 'bg-green-600' : 'bg-red-600'}
              onClick={() => {
                if (!reviewDialog) return;
                if (reviewDialog.action === 'reject' && !notes) { toast.error('يرجى كتابة سبب الرفض'); return; }
                if (reviewDialog.action === 'approve') {
                  approveMutation.mutate({ id: reviewDialog.id, notes: notes || undefined });
                } else {
                  rejectMutation.mutate({ id: reviewDialog.id, notes });
                }
              }}
            >
              {reviewDialog?.action === 'approve' ? 'تأكيد الاعتماد' : 'تأكيد الرفض'}
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
