import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type InboxItem = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  amount?: string;
  requester?: string;
  createdAt: string;
  entityId: number;
  entityType: string;
  actions: string[];
};

export default function UnifiedInbox() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const handleSubmit = () => { createMut.mutate({}); };

  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const isProcessing = false; // Loading state

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  
  // جلب كل البيانات المعلقة
  const { data: pendingBalances = [] } = useQuery({ queryKey: ['admin', 'pendingBalances', 'pending'], queryFn: () => api.get('/pending-balances', { params: { status: 'pending' } }).then(r => r.data) });
  const { data: reserves = [], isError, error} = useQuery({ queryKey: ['reserves', 'requested'], queryFn: () => api.get('/reserves', { params: { status: 'requested' } }).then(r => r.data) });
  const { data: leavesPending = [] } = useQuery({ queryKey: ['hr', 'leaves'], queryFn: () => api.get('/hr/leaves').then(r => r.data) });

  const createMut = useMutation({ mutationFn: (data: any) => api.post('/admin', data).then(r => r.data), onError: (e: any) => { alert(e.message || "حدث خطأ"); }, onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin'] });
 window.location.reload(); } });
  
  // تحويل كل شيء لـ inbox items
  const inboxItems = useMemo(() => {
    const items: InboxItem[] = [];
    
    // Pending Balances
    (pendingBalances as any[]).forEach((pb: any) => {
      items.push({
        id: `pb-${pb.id}`,
        type: 'pending_balance',
        typeLabel: getTypeLabel(pb.entityType),
        title: `${getTypeLabel(pb.entityType)} #${pb.entityId}`,
        description: pb.amount ? `${pb.amount?.toLocaleString()} ر.س` : 'بدون مبلغ',
        status: pb.status,
        priority: parseFloat(pb.amount || '0') > 10000 ? 'high' : 'medium',
        amount: pb.amount,
        createdAt: pb.createdAt,
        entityId: pb.entityId,
        entityType: pb.entityType,
        actions: ['approve', 'reject'],
      });
    });
    
    // Pending Reserves
    (reserves as any[]).forEach((r: any) => {
      items.push({
        id: `res-${r.id}`,
        type: 'reserve',
        typeLabel: getReserveLabel(r.reserveType),
        title: `${getReserveLabel(r.reserveType)} — ${r.entityType} #${r.entityId}`,
        description: r.reservedAmount ? `${r.reservedAmount} ر.س` : r.reservedDays ? `${r.reservedDays} يوم` : '',
        status: r.status,
        priority: 'medium',
        amount: r.reservedAmount,
        createdAt: r.createdAt,
        entityId: r.entityId,
        entityType: r.entityType,
        actions: ['approve', 'release'],
      });
    });
    
    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return items;
  }, [pendingBalances, reserves, leavesPending]);

  const filteredItems = activeTab === 'pending' 
    ? inboxItems.filter(i => ['pending', 'requested'].includes(i.status))
    : activeTab === 'approved'
    ? inboxItems.filter(i => ['approved', 'reserved'].includes(i.status))
    : inboxItems;

  const priorityColors: Record<string, string> = {
    low: 'border-r-gray-300',
    medium: 'border-r-blue-400',
    high: 'border-r-orange-500',
    urgent: 'border-r-red-600',
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  

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
        <div>
          <h1 className="text-lg md:text-2xl font-bold">صندوق المهام الموحد</h1>
          <p className="text-gray-500 text-sm mt-1">كل المعاملات المعلقة التي تحتاج إجراءك</p>
        
          <button onClick={() => setShowDialog(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ إضافة</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
            {inboxItems.filter(i => ['pending', 'requested'].includes(i.status)).length} معلّق
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {[
          { key: 'pending', label: 'المعلّقة', count: inboxItems.filter(i => ['pending','requested'].includes(i.status)).length },
          { key: 'approved', label: 'المعتمدة', count: inboxItems.filter(i => ['approved','reserved'].includes(i.status)).length },
          { key: 'all', label: 'الكل', count: inboxItems.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Summary by type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {['invoice', 'expense', 'leave', 'purchase_order', 'salary_advance', 'custody'].map(type => {
          const count = inboxItems.filter(i => i.entityType === type && ['pending','requested'].includes(i.status)).length;
          return (
            <div key={type} className="bg-white rounded-lg shadow-sm p-3 text-center border">
              <p className="text-xs text-gray-500">{getTypeLabel(type)}</p>
              <p className="text-xl font-bold mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            لا توجد معاملات في هذا القسم
          </div>
        ) : (
          filteredItems?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map(item => (
            <div key={item.id}
              className={`bg-white rounded-lg shadow-sm p-4 border-r-4 ${priorityColors[item.priority]} hover:shadow-md transition`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.typeLabel}</span>
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.amount && (
                    <span className="text-sm font-bold text-green-700">{parseFloat(item.amount).toLocaleString()} ر.س</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                {item.actions.includes('approve') && (
                  <button className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    اعتماد
                  </button>
                )}
                {item.actions.includes('reject') && (
                  <button className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    رفض
                  </button>
                )}
                {item.actions.includes('release') && (
                  <button className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    إفراج
                  </button>
                )}
                <button className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                  عرض التفاصيل
                </button>
              </div>
            </div>
          ))
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

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    invoice: 'فاتورة', expense: 'مصروف', leave: 'إجازة',
    purchase_order: 'طلب شراء', payroll: 'راتب', voucher: 'سند',
    salary_advance: 'سلفة', custody: 'عهدة', project: 'مشروع',
  };
  return labels[type] || type;
}

function getReserveLabel(type: string): string {
  const labels: Record<string, string> = {
    leave_balance: 'حجز إجازة', expense_claim: 'مطالبة مصروفات',
    salary_advance: 'سلفة', purchase_commit: 'التزام مشتريات',
    project_budget: 'ميزانية مشروع', custody: 'عهدة',
  };
  return labels[type] || type;
}
