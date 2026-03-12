import React from "react";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export default function ReservationsPage() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => api.get('/reservations').then(r => r.data),
  });
  const list = (data || []) as any[];

  const createMut = useMutation({ mutationFn: (data: any) => api.post('/reservations', data).then(r => r.data), onSuccess: () => { refetch(); setOpen(false); resetForm(); }, onError: (e: any) => { alert(e.message || "حدث خطأ"); } });
  const updateMut = useMutation({ mutationFn: (data: any) => api.put(`/reservations/${data.id}`, data).then(r => r.data), onSuccess: () => { refetch(); setOpen(false); resetForm(); }, onError: (e: any) => { alert(e.message || "حدث خطأ"); } });
  const deleteMut = useMutation({ mutationFn: (data: any) => api.delete(`/reservations/${data.id}`, { data }).then(r => r.data), onSuccess: () => refetch(), onError: (e: any) => { alert(e.message || "حدث خطأ"); } });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ vehicleId: '', driverId: '', startDate: '', endDate: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const resetForm = () => { setForm({ vehicleId: '', driverId: '', startDate: '', endDate: '' }); setEditId(null); };

  const handleEdit = (item: any) => {
    setForm({ vehicleId: item.vehicleId || "", driverId: item.driverId || "", startDate: item.startDate || "", endDate: item.endDate || "" });
    setEditId(item.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      updateMut.mutate({ id: editId, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate({ id, reason: 'حذف', confirmed: true });
    setDeleteConfirm(null);
  };

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  if (isLoading) return <div className="p-4 md:p-8 text-center">جاري التحميل...</div>;

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;



  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-bold">حجوزات المركبات</h1>
            <p className="text-gray-500">{list.length} عنصر</p>
          </div>
          <button onClick={() => { resetForm(); setOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + إضافة جديد
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full min-w-[600px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المركبة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">السائق</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">من</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إلى</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.id || idx + 1}</td>
                    <td className="px-4 py-3 text-sm">{String(item.vehicleId || "—")}</td>
                    <td className="px-4 py-3 text-sm">{String(item.driverId || "—")}</td>
                    <td className="px-4 py-3 text-sm">{String(item.startDate || "—")}</td>
                    <td className="px-4 py-3 text-sm">{String(item.endDate || "—")}</td>
                    <td className="px-4 py-3 text-sm space-x-2 space-x-reverse">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">تعديل</button>
                      {deleteConfirm === item.id ? (
                        <span>
                          <button onClick={() => { if (window.confirm('هل أنت متأكد من الحذف؟')) handleDelete(item.id) }} className="text-red-600 font-bold mx-1">تأكيد الحذف</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 mx-1">إلغاء</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(item.id)} className="text-red-500 hover:text-red-700">حذف</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <div className="p-4 md:p-8 text-center text-gray-400">لا توجد بيانات</div>}
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{editId ? 'تعديل' : 'إضافة جديد'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المركبة</label>
                  <input type="number" value={form.vehicleId || ""} onChange={e => setForm({ ...form, vehicleId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السائق</label>
                  <input type="number" value={form.driverId || ""} onChange={e => setForm({ ...form, driverId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">من</label>
                  <input type="text" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">إلى</label>
                  <input type="text" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg">إلغاء</button>
                <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {(createMut.isPending || updateMut.isPending) ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog for Create/Edit */}
        {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
          <div>
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الاسم / الوصف</label>
                <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
            </div>
          </div>
        </div>)}
      </div>
    </>
  );
}
