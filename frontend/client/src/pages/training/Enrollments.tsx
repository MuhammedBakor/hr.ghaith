import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useEnrollments, useEnrollEmployee, trainingService } from '../../services/trainingService';
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export default function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useEnrollments();
  const list = data || [];

  const enrollMut = useEnrollEmployee();

  const updateEnrollmentMut = useMutation({
    mutationFn: trainingService.updateEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-enrollments"] });
      setOpen(false);
      resetForm();
    },
    onError: (e: any) => { alert(e.message || "حدث خطأ"); }
  });

  const deleteEnrollmentMut = useMutation({
    mutationFn: trainingService.deleteEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-enrollments"] });
    },
    onError: (e: any) => { alert(e.message || "حدث خطأ"); }
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ employeeId: '', programId: '', status: 'enrolled' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const resetForm = () => { setForm({ employeeId: '', programId: '', status: 'enrolled' }); setEditId(null); };

  const handleEdit = (item: any) => {
    setForm({
      employeeId: item.employee?.id || item.employeeId || "",
      programId: item.program?.id || item.programId || "",
      status: item.status || "enrolled"
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      updateEnrollmentMut.mutate({ id: editId, ...form });
    } else {
      enrollMut.mutate(form, {
        onSuccess: () => { setOpen(false); resetForm(); },
        onError: (e: any) => { alert(e.message || "حدث خطأ"); }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteEnrollmentMut.mutate(id);
    setDeleteConfirm(null);
  };

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
            <h1 className="text-lg md:text-2xl font-bold">التسجيلات</h1>
            <p className="text-gray-500">{list.length} عنصر</p>
          </div>
          <button onClick={() => { resetForm(); setOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + إضافة جديد
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الموظف</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">البرنامج</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.id || idx + 1}</td>
                    <td className="px-4 py-3 text-sm">{item.employee?.name || item.employeeId || "—"}</td>
                    <td className="px-4 py-3 text-sm">{item.program?.name || item.programId || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {item.status || "—"}
                      </span>
                    </td>
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
                  <label className="block text-sm font-medium mb-1">معرف الموظف</label>
                  <input type="number" value={form.employeeId || ""} onChange={e => setForm({ ...form, employeeId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">معرف البرنامج</label>
                  <input type="number" value={form.programId || ""} onChange={e => setForm({ ...form, programId: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select
                    value={form.status || "enrolled"}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="enrolled">مسجل</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="withdrawn">منسحب</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg">إلغاء</button>
                <button onClick={handleSave} disabled={enrollMut.isPending || updateEnrollmentMut.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {(enrollMut.isPending || updateEnrollmentMut.isPending) ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}