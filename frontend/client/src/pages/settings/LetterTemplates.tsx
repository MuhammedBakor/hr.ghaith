import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { sanitizeHTML } from '@/lib/htmlSanitizer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus, Eye, Printer } from 'lucide-react';

const VARS = ['{employeeName}','{employeeId}','{companyName}','{date}','{position}','{salary}','{startDate}','{endDate}','{department}','{branchName}','{managerName}'];

export default function LetterTemplates() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', nameAr: '', entityType: 'general', module: 'hr', headerHtml: '', bodyHtml: '', footerHtml: '' });

  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['letter-templates'], queryFn: () => api.get('/settings/letter-templates').then(r => r.data) });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/settings/letter-templates', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['letter-templates'] }); setCreateOpen(false); },
  });

  const renderMut = useMutation({
    mutationFn: (data: any) => api.post('/settings/letter-templates/render', data).then(r => r.data),
    onSuccess: (data: any) => { setPreviewHtml(data.html); setPreviewOpen(true); },
  });

  const handlePreview = (templateId: string) => {
    renderMut.mutate({
      templateId,
      data: { employeeName: 'أحمد محمد', employeeId: '1001', companyName: 'شركة المثال', date: new Date().toLocaleDateString('ar-SA'), position: 'مطور أنظمة', salary: '15,000', department: 'تقنية المعلومات', branchName: 'الفرع الرئيسي', managerName: 'خالد العلي', startDate: '2024-01-01', endDate: '2026-01-01' },
    });
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(sanitizeHTML(previewHtml));
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> قوالب الخطابات</h1>
          <p className="text-gray-500 mt-1">إدارة وتعديل قوالب الخطابات الرسمية</p>
        </div>
        <Button disabled={createMut.isPending} onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 ms-2" /> قالب جديد</Button>
      </div>

      {/* المتغيرات المتاحة */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm mb-2">المتغيرات المتاحة:</h3>
          <div className="flex gap-2 flex-wrap">{VARS.map(v => <Badge key={v} variant="secondary" className="font-mono text-xs">{v}</Badge>)}</div>
        </CardContent>
      </Card>

      {/* القوالب */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t: any) => (
            <Card key={t.id || t.key}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{t.nameAr || t.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{t.module}</Badge>
                      <Badge variant="outline">{t.entityType}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(t.id || t.key)}>
                      <Eye className="h-4 w-4 ms-1" /> معاينة
                    </Button>
                  </div>
                </div>
                {t.variables && t.variables.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {t?.variables?.map((v: string) => <span key={v} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{`{${v}}`}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* معاينة */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>معاينة الخطاب</span>
              <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 ms-1" /> طباعة</Button>
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(previewHtml) }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* إنشاء قالب جديد */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader><DialogTitle>قالب خطاب جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">الاسم (عربي)</label><Input value={newTemplate.nameAr} onChange={e => setNewTemplate({...newTemplate, nameAr: e.target.value})} /></div>
              <div><label className="text-sm font-medium">الاسم (إنجليزي)</label><Input value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} /></div>
            </div>
            <div><label className="text-sm font-medium">ترويسة الخطاب (HTML)</label><Textarea className="font-mono text-sm h-20" value={newTemplate.headerHtml} onChange={e => setNewTemplate({...newTemplate, headerHtml: e.target.value})} /></div>
            <div><label className="text-sm font-medium">نص الخطاب (HTML)</label><Textarea className="font-mono text-sm h-32" value={newTemplate.bodyHtml} onChange={e => setNewTemplate({...newTemplate, bodyHtml: e.target.value})} /></div>
            <div><label className="text-sm font-medium">تذييل الخطاب (HTML)</label><Textarea className="font-mono text-sm h-20" value={newTemplate.footerHtml} onChange={e => setNewTemplate({...newTemplate, footerHtml: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={() => createMut.mutate(newTemplate)} disabled={createMut.isPending}>{createMut.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ القالب'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
