import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';

interface Template { id: number; code: string; nameAr: string; body: string; }

const DEFAULTS: Template[] = [
  { id:1, code:'leave_approved', nameAr:'موافقة إجازة', body:'بسم الله الرحمن الرحيم\n\nالسيد/ة {employeeName} — رقم: {employeeId}\n\nنفيدكم بالموافقة على طلب الإجازة.\n\n{companyName}\n{date}' },
  { id:2, code:'leave_rejected', nameAr:'رفض إجازة', body:'بسم الله الرحمن الرحيم\n\nالسيد/ة {employeeName} — رقم: {employeeId}\n\nنأسف لعدم الموافقة على الإجازة.\n\n{companyName}\n{date}' },
  { id:3, code:'salary_certificate', nameAr:'شهادة راتب', body:'بسم الله الرحمن الرحيم\n\nإلى من يهمه الأمر\n\nنشهد بأن {employeeName} يعمل لدى {companyName}\nبمسمى: {position} — براتب: {salary} ريال\n\n{companyName}\n{date}' },
  { id:4, code:'experience_letter', nameAr:'شهادة خبرة', body:'بسم الله الرحمن الرحيم\n\nنشهد بأن {employeeName} عمل لدى {companyName}\nمن {startDate} إلى {endDate}\n\n{companyName}\n{date}' },
];

const VARS = ['{employeeName}','{employeeId}','{companyName}','{date}','{position}','{salary}','{startDate}','{endDate}','{department}'];

export default function LetterTemplates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULTS);
  const [editId, setEditId] = useState<number|null>(null);
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => { try {
      const { data } = await api.get('/settings/letter-templates');
      if (data) {
        for (const t of DEFAULTS) {
          const found = (data as any[]).find((x:any)=>x.settingKey===`template.${t.code}`);
          if (found?.settingValue) t.body = found.settingValue;
        }
      }
      setTemplates([...DEFAULTS]);
    } catch {} })();
  }, []);

  const startEdit = (t: Template) => { setEditId(t.id); setEditBody(t.body); };
  const save = async (t: Template) => {
    setSaving(true);
    try {
      await api.post('/settings/letter-templates',{key:`template.${t.code}`,value:editBody});
      t.body = editBody; setTemplates([...templates]); setEditId(null);
    } catch {} setSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8"><h1 className="text-2xl font-bold">📝 قوالب الخطابات</h1><p className="text-gray-500 mt-1">تعديل نصوص الخطابات — المتغيرات تُستبدل تلقائياً</p></div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-sm mb-2">المتغيرات:</h3>
        <div className="flex gap-2 flex-wrap">{VARS.map(v=><span key={v} className="bg-white px-2 py-1 rounded text-xs font-mono text-blue-700">{v}</span>)}</div>
      </div>
      <div className="space-y-3">{templates.map(t=>(
        <div key={t.id} className="bg-white rounded-xl border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">{t.nameAr} <span className="text-gray-400 text-xs">({t.code})</span></span>
            <button onClick={()=>editId===t.id?setEditId(null):startEdit(t)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm">{editId===t.id?'إغلاق':'✏️ تعديل'}</button>
          </div>
          {editId===t.id ? (<div>
            <textarea className="w-full border rounded-lg p-3 h-40 text-sm" value={editBody} onChange={e=>setEditBody(e.target.value)} />
            <button onClick={()=>save(t)} disabled={saving} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm">{saving?'⏳':'💾 حفظ'}</button>
          </div>) : (<pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-20 overflow-hidden">{t.body}</pre>)}
        </div>
      ))}</div>
    </div>);
}
