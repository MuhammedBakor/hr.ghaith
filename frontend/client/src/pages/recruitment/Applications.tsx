import React, { useState } from "react";
import { useAppContext } from '@/contexts/AppContext';
import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication
} from '@/services/recruitmentService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin";

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ applicantName: '', position: '', status: 'pending', email: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading, refetch, isError } = useApplications();
  const list = data || [];

  const createMut = useCreateApplication();
  const updateMut = useUpdateApplication();
  const deleteMut = useDeleteApplication();

  const resetForm = () => { setForm({ applicantName: '', position: '', status: 'pending', email: '' }); setEditId(null); };

  const handleEdit = (item: any) => {
    setForm({
      applicantName: item.applicantName || "",
      position: item.position || "",
      status: item.status || "pending",
      email: item.email || ""
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      updateMut.mutate({ id: editId, ...form }, {
        onSuccess: () => {
          toast.success('تم تحديث الطلب بنجاح');
          setOpen(false);
          resetForm();
        },
        onError: (e: any) => toast.error(e.message || "حدث خطأ")
      });
    } else {
      createMut.mutate(form, {
        onSuccess: () => {
          toast.success('تمت إضافة الطلب بنجاح');
          setOpen(false);
          resetForm();
        },
        onError: (e: any) => toast.error(e.message || "حدث خطأ")
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMut.mutate(id, {
      onSuccess: () => {
        toast.success('تم حذف الطلب');
        setDeleteConfirm(null);
      },
      onError: (e: any) => toast.error(e.message || "حدث خطأ")
    });
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
            <h1 className="text-lg md:text-2xl font-bold">طلبات التوظيف</h1>
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
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الاسم</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المنصب</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.id || idx + 1}</td>
                    <td className="px-4 py-3 text-sm">{String(item.applicantName || "—")}</td>
                    <td className="px-4 py-3 text-sm">{String(item.position || "—")}</td>
                    <td className="px-4 py-3 text-sm">{String(item.status || "—")}</td>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>{editId ? 'تعديل طلب توظيف' : 'إضافة طلب توظيف جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={form.applicantName || ""} onChange={e => setForm({ ...form, applicantName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المنصب</Label>
                <Input value={form.position || ""} onChange={e => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={form.status || "pending"}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="reviewing">قيد المراجعة</option>
                  <option value="interviewed">تمت المقابلة</option>
                  <option value="accepted">مقبول</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}