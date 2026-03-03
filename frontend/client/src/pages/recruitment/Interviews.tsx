import React, { useState } from "react";
import { useAppContext } from '@/contexts/AppContext';
import {
  useInterviews,
  useScheduleInterview,
  useUpdateInterview,
  useDeleteInterview,
  useApplications
} from '@/services/recruitmentService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function InterviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin";

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ applicationId: '', interviewDate: '', status: 'scheduled', interviewer: '', location: '', notes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading, isError } = useInterviews();
  const { data: applications } = useApplications();
  const list = data || [];

  const scheduleMut = useScheduleInterview();
  const updateMut = useUpdateInterview();
  const deleteMut = useDeleteInterview();

  const resetForm = () => {
    setForm({ applicationId: '', interviewDate: '', status: 'scheduled', interviewer: '', location: '', notes: '' });
    setEditId(null);
  };

  const handleEdit = (item: any) => {
    setForm({
      applicationId: item.application?.id || item.applicationId || "",
      interviewDate: item.interviewDate ? item.interviewDate.substring(0, 16) : "",
      status: item.status || "scheduled",
      interviewer: item.interviewer || "",
      location: item.location || "",
      notes: item.notes || ""
    });
    setEditId(item.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      updateMut.mutate({ id: editId, ...form }, {
        onSuccess: () => {
          toast.success('تم تحديث المقابلة بنجاح');
          setOpen(false);
          resetForm();
        },
        onError: (e: any) => toast.error(e.message || "حدث خطأ")
      });
    } else {
      scheduleMut.mutate(form, {
        onSuccess: () => {
          toast.success('تمت إضافة المقابلة بنجاح');
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
        toast.success('تم حذف المقابلة');
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
            <h1 className="text-lg md:text-2xl font-bold">المقابلات</h1>
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
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المتقدم</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">التاريخ</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">المحاور</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{item.id || idx + 1}</td>
                    <td className="px-4 py-3 text-sm">{item.application?.applicantName || "—"}</td>
                    <td className="px-4 py-3 text-sm">{item.interviewDate ? new Date(item.interviewDate).toLocaleString('ar-EG') : "—"}</td>
                    <td className="px-4 py-3 text-sm">{item.interviewer || "—"}</td>
                    <td className="px-4 py-3 text-sm">{item.status || "—"}</td>
                    <td className="px-4 py-3 text-sm space-x-2 space-x-reverse">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">تعديل</button>
                      {deleteConfirm === item.id ? (
                        <span>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold mx-1">تأكيد الحذف</button>
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
                <DialogTitle>{editId ? 'تعديل مقابلة' : 'إضافة مقابلة جديدة'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>المتقدم</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={form.applicationId || ""}
                    onChange={e => setForm({ ...form, applicationId: Number(e.target.value) })}
                  >
                    <option value="">اختر المتقدم</option>
                    {applications?.map((app: any) => (
                      <option key={app.id} value={app.id}>{app.applicantName} - {app.position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>التاريخ والوقت</Label>
                  <Input type="datetime-local" value={form.interviewDate || ""} onChange={e => setForm({ ...form, interviewDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>المحاور</Label>
                  <Input value={form.interviewer || ""} onChange={e => setForm({ ...form, interviewer: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الموقع</Label>
                  <Input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={form.status || "scheduled"}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="scheduled">مجدولة</option>
                    <option value="completed">تمت</option>
                    <option value="cancelled">ملغاة</option>
                    <option value="reschedulled">أعيدت جدولتها</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={handleSave} disabled={scheduleMut.isPending || updateMut.isPending}>
                  {scheduleMut.isPending || updateMut.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}