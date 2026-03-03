import React, { useState } from "react";
import { trpc } from "../../lib/trpc";

export default function SalaryAdvances() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const hasAccess = userRole === 'admin' || userRole === 'finance_manager';
  
  const { data, refetch, isLoading, isError, error } = trpc.salaryAdvances.list.useQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const createMut = trpc.salaryAdvances.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setFormData({}); }
  });
  const updateMut = trpc.salaryAdvances.update.useMutation({
    onSuccess: () => { refetch(); setEditingId(null); setFormData({}); }
  });
  const deleteMut = trpc.salaryAdvances.delete.useMutation({
    onSuccess: () => { refetch(); }
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ: {(error as any)?.message}</div>;

  const filtered = data?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <h1 className="text-lg md:text-2xl font-bold mb-6">السلف على الراتب</h1>
      
      {/* شريط البحث والإضافة */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text" placeholder="بحث..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border rounded-lg"
        />
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({}); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'إلغاء' : '+ إضافة جديد'}
        </button>
      </div>

      {/* نموذج الإضافة/التعديل — مضمن في الصفحة */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل' : 'إضافة جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input placeholder="الاسم" value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 border rounded-lg" />
            <input placeholder="الوصف" value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="px-3 py-2 border rounded-lg" />
            <input placeholder="النوع" value={formData.type || ''}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="px-3 py-2 border rounded-lg" />
            <input placeholder="القيمة" value={formData.amount || ''}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => editingId ? updateMut.mutate({id: editingId, ...formData}) : createMut.mutate(formData)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              {editingId ? 'تحديث' : 'حفظ'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">إلغاء</button>
          </div>
        </div>
      )}

      {/* حالة فارغة */}
      {(!filtered || filtered.length === 0) && <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>}

      {/* الجدول */}
      <div className="grid grid-cols-1 gap-4">
        {filtered?.map((item: any) => (
          <div key={item.id} className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <p className="font-bold">{item.name || item.title || `#${item.id}`}</p>
                <p className="text-sm text-gray-500">{item.description || item.type || item.status || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(item.id); setFormData(item); setShowForm(true); }}
                  className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button>
                <button onClick={() => window.confirm('هل أنت متأكد من الحذف؟') && deleteMut.mutate({id: item.id})}
                  className="text-red-600 hover:text-red-800 text-sm">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
