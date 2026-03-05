import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export default function PrintTemplates() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const isProcessing = false; // Loading state

  const { data: templates = [], isError, error } = useQuery({ queryKey: ['printTemplates', 'list'], queryFn: () => api.get('/print-templates').then(r => r.data) });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/print-templates', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printTemplates'] });
      toast.success('تم إضافة القالب');
    },
    onError: (e: any) => toast.error(e.message)
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string>('');

  const renderMut = useMutation({
    mutationFn: (data: any) => api.post('/print-templates/render', data).then(r => r.data),
    onSuccess: (data: any) => {
      setPreview(data.html);
      toast.success('تم إنشاء المعاينة');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const list = (templates || []) as any[];
  const selected = list.find((t: any) => t.id === selectedTemplate);

  const handleRender = () => {
    if (!selectedTemplate) return toast.error('اختر قالب');
    renderMut.mutate({ templateId: selectedTemplate, data: formData });
  };

  const handlePrint = () => {
    if (!preview) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(preview);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };


  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);


  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

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
        <h1 className="text-lg md:text-2xl font-bold mb-6">قوالب الطباعة</h1>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium mb-3">اختر القالب</h3>
              <div className="space-y-2">

                {!list?.length && <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>}
                {list?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((t: any) => (
                  <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setFormData({}); setPreview(''); }}
                    className={`w-full text-end px-4 py-3 rounded-lg border transition ${selectedTemplate === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <p className="font-medium">{t.nameAr}</p>
                    <p className="text-xs text-gray-400">{t.module} / {t.entityType}</p>
                  </button>
                ))}

                <button onClick={() => createMut.mutate({})} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ إضافة</button>
              </div>
            </div>

            {/* Variables Form */}
            {selected && (
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h3 className="font-medium mb-3">البيانات</h3>
                {(selected?.variables || []).map((v: string) => (
                  <div key={v} className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">{v}</label>
                    <input value={formData[v] || ''} onChange={e => setFormData({ ...formData, [v]: e.target.value })}
                      className="w-full border rounded px-3 py-1.5 text-sm" placeholder={v} />
                  </div>
                ))}
                <button onClick={handleRender} className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  معاينة
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="col-span-2">
            {preview ? (
              <div className="bg-white rounded-lg shadow">
                <div className="flex justify-between items-center p-3 border-b">
                  <h3 className="font-medium">المعاينة</h3>
                  <button onClick={handlePrint} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    🖨️ طباعة
                  </button>
                </div>
                <iframe srcDoc={preview} className="w-full h-[700px] border-0" title="print-preview" sandbox="allow-same-origin" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                <p className="text-5xl mb-4">🖨️</p>
                <p>اختر قالب واملأ البيانات ثم اضغط "معاينة"</p>
              </div>
            )}
          </div>
        </div>

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
              <Button disabled={false} variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
            </div>
          </div>
        </div>)}
      </div>
    </>
  );
}