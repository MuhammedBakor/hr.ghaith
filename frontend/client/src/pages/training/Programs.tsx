import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram, TrainingType, DurationUnit, ProgramStatus } from '../../services/trainingService';
import { Button } from "@/components/ui/button";


export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === 'admin' || userRole === 'general_manager' || userRole === 'hr_manager';
  const canDelete = userRole === 'admin' || userRole === 'general_manager';

  const { data, isLoading, isError } = usePrograms();
  const list = data || [];

  const createMut = useCreateProgram();
  const updateMut = useUpdateProgram();
  const deleteMut = useDeleteProgram();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    trainingType: 'optional',
    provider: '',
    duration: '',
    durationUnit: 'hours',
    cost: '',
    maxParticipants: '',
    status: 'draft'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      trainingType: 'optional',
      provider: '',
      duration: '',
      durationUnit: 'hours',
      cost: '',
      maxParticipants: '',
      status: 'draft'
    });
    setEditId(null);
  };

  const handleEdit = (item: any) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      trainingType: item.trainingType || "optional",
      provider: item.provider || "",
      duration: item.duration || "",
      durationUnit: item.durationUnit || "hours",
      cost: item.cost || "",
      maxParticipants: item.maxParticipants || "",
      status: item.status || "draft"
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : null,
      cost: form.cost ? Number(form.cost) : null,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null
    };

    if (editId) {
      updateMut.mutate(
        { id: editId, ...payload },
        {
          onSuccess: () => { setOpen(false); resetForm(); },
          onError: (e: any) => alert(e.message || "حدث خطأ")
        }
      );
    } else {
      createMut.mutate(
        payload,
        {
          onSuccess: () => { setOpen(false); resetForm(); },
          onError: (e: any) => alert(e.message || "حدث خطأ")
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate(id, {
      onError: (e: any) => alert(e.message || "حدث خطأ")
    });
    setDeleteConfirm(null);
  };

  if (isLoading) return <div className="p-4 md:p-8 text-center">جاري التحميل...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="بحث في البرامج..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-bold">البرامج التدريبية</h1>
            <p className="text-gray-500">{list.length} برنامج متاح</p>
          </div>
          <button onClick={() => { resetForm(); setOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + إضافة برنامج جديد
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الاسم</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">النوع</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المدة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المزود</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">التكلفة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.trainingType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.duration} {item.durationUnit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.provider || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.cost || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2 space-x-reverse">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">تعديل</button>
                      {deleteConfirm === item.id ? (
                        <span>
                          <button onClick={() => { if (window.confirm('هل أنت متأكد من الحذف؟')) handleDelete(item.id) }} className="text-red-600 font-bold mx-1">تأكيد</button>
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
          {list.length === 0 && <div className="p-4 md:p-8 text-center text-gray-400">لا توجد برامج تدريبية مسجلة</div>}
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">{editId ? 'تعديل برنامج' : 'إضافة برنامج جديد'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">اسم البرنامج</label>
                  <input type="text" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع التدريب</label>
                  <select value={form.trainingType} onChange={e => setForm({ ...form, trainingType: e.target.value as TrainingType })} className="w-full border rounded-lg px-3 py-2">
                    <option value="mandatory">إلزامي</option>
                    <option value="optional">اختياري</option>
                    <option value="certification">شهادة معتمدة</option>
                    <option value="skill_development">تطوير مهارات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المزود</label>
                  <input type="text" value={form.provider || ""} onChange={e => setForm({ ...form, provider: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المدة</label>
                  <input type="number" value={form.duration || ""} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وحدة الوقت</label>
                  <select value={form.durationUnit} onChange={e => setForm({ ...form, durationUnit: e.target.value as DurationUnit })} className="w-full border rounded-lg px-3 py-2">
                    <option value="hours">ساعات</option>
                    <option value="days">أيام</option>
                    <option value="weeks">أسابيع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">التكلفة</label>
                  <input type="number" value={form.cost || ""} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">أقصى عدد مشاركين</label>
                  <input type="number" value={form.maxParticipants || ""} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProgramStatus })} className="w-full border rounded-lg px-3 py-2">
                    <option value="draft">مسودة</option>
                    <option value="active">نشط</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغى</option>
                  </select>
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
      </div>
    </>
  );
}