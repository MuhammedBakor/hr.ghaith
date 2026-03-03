import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '../../lib/trpc';
import { toast } from 'react-hot-toast';

export default function PendingReserves() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const [filter, setFilter] = useState<string>('');
  const { data: reserves = [], isLoading, refetch, isError, error} = trpc.reserves.list.useQuery(
    filter ? { status: filter } : undefined
  );


  const createMut = trpc.reserves.create.useMutation({ onSuccess: () => refetch(),
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
  const approveMutation = trpc.reserves.approve.useMutation({
    onSuccess: () => { toast.success('تم اعتماد الحجز'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const consumeMutation = trpc.reserves.consume.useMutation({
    onSuccess: () => { toast.success('تم استهلاك الحجز'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const releaseMutation = trpc.reserves.release.useMutation({
    onSuccess: () => { toast.success('تم إفراج الحجز'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const reservesList = (reserves || []) as any[];

  const statusColor: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    reserved: 'bg-blue-100 text-blue-800',
    consumed: 'bg-green-100 text-green-800',
    released: 'bg-gray-100 text-gray-800',
    partially_consumed: 'bg-orange-100 text-orange-800',
  };

  const statusLabel: Record<string, string> = {
    requested: 'مطلوب',
    reserved: 'محجوز',
    consumed: 'مستهلك',
    released: 'مُفرج',
    partially_consumed: 'جزئي',
  };

  const typeLabel: Record<string, string> = {
    leave_balance: 'رصيد إجازة',
    expense_claim: 'مطالبة مصروفات',
    salary_advance: 'سلفة',
    purchase_commit: 'التزام مشتريات',
    project_budget: 'ميزانية مشروع',
    custody: 'عهدة',
  };

  if (isLoading) return <div className="p-4 md:p-8 text-center">جاري التحميل...</div>;

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="p-6" dir="rtl">
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg md:text-2xl font-bold">الأرصدة المحجوزة</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {['', 'requested', 'reserved', 'consumed', 'released'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-sm ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {s === '' ? 'الكل' : statusLabel[s] || s}
            </button>
          ))}
        
        <button onClick={() => createMut.mutate({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ إضافة</button>
      </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {['requested', 'reserved', 'consumed', 'released', 'partially_consumed'].map(s => {
          const count = reservesList.filter((r: any) => r.status === s).length;
          return (
            <div key={s} className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-gray-500">{statusLabel[s]}</p>
              <p className="text-lg md:text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">النوع</th>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الكيان</th>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المبلغ/الأيام</th>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
              <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservesList?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{r.id}</td>
                <td className="px-4 py-3 text-sm">{typeLabel[r.reserveType] || r.reserveType}</td>
                <td className="px-4 py-3 text-sm">{r.entityType} #{r.entityId}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {r.reservedAmount ? `${r.reservedAmount} ر.س` : ''}
                  {r.reservedDays ? `${r.reservedDays} يوم` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColor[r.status] || ''}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'requested' && (
                    <div className="flex flex-col sm:flex-row gap-1">
                      <button onClick={() => approveMutation.mutate({ id: r.id })}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">اعتماد</button>
                      <button onClick={() => releaseMutation.mutate({ id: r.id, reason: 'رفض' })}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">إفراج</button>
                    </div>
                  )}
                  {r.status === 'reserved' && (
                    <button onClick={() => consumeMutation.mutate({ id: r.id })}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">استهلاك</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
        {reservesList.length === 0 && (
          <div className="p-4 md:p-8 text-center text-gray-400">لا توجد أرصدة محجوزة</div>
        )}
      </div>
    
        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
