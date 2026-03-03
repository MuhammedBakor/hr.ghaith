import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '../../lib/trpc';
import { toast } from 'react-hot-toast';

export default function UnifiedInbox() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const [filter, setFilter] = useState<string>('pending');
  const { data: items = [], isLoading, refetch, isError, error} = trpc.inbox.myItems.useQuery({ status: filter || undefined });
  const { data: stats } = trpc.inbox.stats.useQuery();
  const completeMut = trpc.inbox.complete.useMutation({
    onSuccess: () => { toast.success('تم الإنجاز'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const list = (items || []) as any[];
  const s = stats || { pending: 0, urgent: 0, overdue: 0, today: 0 };

  const priorityColor: Record<string, string> = {
    urgent: 'border-r-4 border-red-500 bg-red-50',
    high: 'border-r-4 border-orange-400 bg-orange-50',
    medium: 'border-r-4 border-blue-400',
    low: 'border-r-4 border-gray-300',
  };

  const typeIcon: Record<string, string> = {
    approval: '✅', review: '👁️', action_required: '⚡',
    info: 'ℹ️', escalation: '🔺', evidence_required: '📎',
  };

  const typeLabel: Record<string, string> = {
    approval: 'موافقة', review: 'مراجعة', action_required: 'إجراء مطلوب',
    info: 'للعلم', escalation: 'تصعيد', evidence_required: 'أدلة مطلوبة',
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
      <h1 className="text-lg md:text-2xl font-bold mb-2">صندوق المهام</h1>
      <p className="text-gray-500 mb-6">كل المهام والموافقات والمراجعات في مكان واحد</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xl md:text-3xl font-bold text-blue-600">{s.pending}</p>
          <p className="text-sm text-gray-500">معلّق</p>
        
          <button onClick={() => setShowDialog(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ إضافة</button>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xl md:text-3xl font-bold text-red-600">{s.urgent}</p>
          <p className="text-sm text-gray-500">عاجل</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xl md:text-3xl font-bold text-orange-600">{s.overdue}</p>
          <p className="text-sm text-gray-500">متأخر</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xl md:text-3xl font-bold text-green-600">{s.today}</p>
          <p className="text-sm text-gray-500">اليوم</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {[{ v: 'pending', l: 'معلّق' }, { v: 'in_progress', l: 'جاري' }, { v: 'completed', l: 'مكتمل' }, { v: '', l: 'الكل' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f.v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any) => (
          <div key={item.id} className={`bg-white rounded-lg shadow p-4 ${priorityColor[item.priority] || ''} hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{typeIcon[item.taskType] || '📋'}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {typeLabel[item.taskType] || item.taskType}
                  </span>
                  <span className="text-xs text-gray-400">{item.sourceModule}/{item.sourceEntityType}</span>
                </div>
                <h3 className="font-medium text-gray-900">{item.titleAr || item.title}</h3>
                {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                <div className="flex flex-col sm:flex-row gap-4 mt-2 text-xs text-gray-400">
                  <span>#{item.sourceEntityId}</span>
                  {item.dueDate && <span>استحقاق: {formatDate(item.dueDate)}</span>}
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {item.status === 'pending' && (
                  <button onClick={() => completeMut.mutate({ id: item.id })}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                    إنجاز ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {list.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>لا توجد مهام {filter === 'pending' ? 'معلّقة' : ''}</p>
          </div>
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
