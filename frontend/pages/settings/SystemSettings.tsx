import React, { useState, useEffect } from 'react';

const CURRENCIES = [{c:'SAR',s:'ر.س',l:'ريال سعودي'},{c:'AED',s:'د.إ',l:'درهم إماراتي'},{c:'KWD',s:'د.ك',l:'دينار كويتي'},{c:'QAR',s:'ر.ق',l:'ريال قطري'},{c:'BHD',s:'د.ب',l:'دينار بحريني'},{c:'OMR',s:'ر.ع',l:'ريال عماني'},{c:'EGP',s:'ج.م',l:'جنيه مصري'},{c:'USD',s:'$',l:'دولار أمريكي'},{c:'EUR',s:'€',l:'يورو'}];
const TZS = ['Asia/Riyadh','Asia/Dubai','Asia/Kuwait','Asia/Qatar','Asia/Bahrain','Asia/Muscat','Africa/Cairo','Europe/Istanbul','UTC'];
const DATE_FMTS = ['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'];

type S = Record<string, string>;

export default function SystemSettings() {
  const [s, setS] = useState<S>({
    'system.name': 'منصة غيث', 'system.nameEn': '', 'system.logo': '',
    'system.currency': 'SAR', 'system.timezone': 'Asia/Riyadh',
    'system.language': 'ar', 'system.dateFormat': 'DD/MM/YYYY',
    'system.fiscalYearStart': '01', 'system.maxFileSize': '10',
    'system.allowedFileTypes': 'pdf,jpg,png,xlsx,docx', 'system.maintenanceMode': 'false',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await fetch('/api/trpc/settings.settings.list'); const d = await r.json(); if (d?.result?.data) { const m: S = {}; (d.result.data as any[]).forEach((x: any) => m[x.settingKey] = x.settingValue); setS(p => ({...p, ...m})); } } catch {} };
  const save = async () => { setSaving(true); try { for (const [k,v] of Object.entries(s)) { await fetch('/api/trpc/settings.settings.set', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({json:{key:k,value:v}}) }); } setOk(true); setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const u = (k: string, v: string) => setS(p => ({...p, [k]: v}));
  const F = ({label, k, type='text', options, ph}: {label:string;k:string;type?:string;options?:{v:string;l:string}[];ph?:string}) => (
    <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {options ? <select className="w-full border rounded-lg px-3 py-2" value={s[k]||''} onChange={e=>u(k,e.target.value)}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
    : <input type={type} className="w-full border rounded-lg px-3 py-2" value={s[k]||''} onChange={e=>u(k,e.target.value)} placeholder={ph} />}</div>);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">⚙️ إعدادات النظام</h1><p className="text-gray-500 mt-1">إعدادات عامة تطبَّق على كل النظام</p></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600 hover:bg-blue-700'}`}>{saving?'⏳':ok?'✅ تم':'💾 حفظ'}</button>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🏢 بيانات الشركة</h2>
        <div className="grid grid-cols-2 gap-4">
          <F label="اسم الشركة (عربي)" k="system.name" ph="منصة غيث" />
          <F label="Company Name (English)" k="system.nameEn" />
          <F label="رابط الشعار" k="system.logo" ph="https://..." />
          <F label="بداية السنة المالية (شهر)" k="system.fiscalYearStart" options={[...Array(12)].map((_,i)=>({v:String(i+1),l:`شهر ${i+1}`}))} />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🌍 الإعدادات الإقليمية</h2>
        <div className="grid grid-cols-3 gap-4">
          <F label="العملة" k="system.currency" options={CURRENCIES.map(c=>({v:c.c,l:`${c.l} (${c.s})`}))} />
          <F label="المنطقة الزمنية" k="system.timezone" options={TZS.map(t=>({v:t,l:t}))} />
          <F label="اللغة" k="system.language" options={[{v:'ar',l:'العربية'},{v:'en',l:'English'}]} />
          <F label="صيغة التاريخ" k="system.dateFormat" options={DATE_FMTS.map(f=>({v:f,l:f}))} />
        </div></div>

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-4">📁 الملفات والصيانة</h2>
        <div className="grid grid-cols-2 gap-4">
          <F label="الحد الأقصى لحجم الملف (MB)" k="system.maxFileSize" type="number" />
          <F label="أنواع الملفات المسموحة" k="system.allowedFileTypes" ph="pdf,jpg,png" />
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">وضع الصيانة</label>
            <button onClick={()=>u('system.maintenanceMode', s['system.maintenanceMode']==='true'?'false':'true')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${s['system.maintenanceMode']==='true'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>
              {s['system.maintenanceMode']==='true'?'🔴 مفعّل — النظام متوقف':'🟢 معطّل — النظام يعمل'}</button></div>
        </div></div>
    </div>);
}
