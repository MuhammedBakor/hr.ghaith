import React, { useState, useEffect } from 'react';
type S = Record<string, string>;

export default function FinanceSettings() {
  const [s, setS] = useState<S>({
    'finance.vatRate': '15', 'finance.invoiceDueDays': '30', 'finance.budgetWarningThreshold': '80',
    'finance.budgetCriticalThreshold': '95', 'finance.autoApproveLimit': '5000',
    'finance.invoicePrefix': 'INV', 'finance.receiptPrefix': 'REC', 'finance.voucherPrefix': 'VCH',
    'finance.decimalPlaces': '2', 'finance.roundingMethod': 'nearest',
    'finance.taxNumber': '', 'finance.commercialRegister': '',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);
  useEffect(() => { (async () => { try { const r = await fetch('/api/trpc/settings.settings.list'); const d = await r.json(); if(d?.result?.data){const m:S={};(d.result.data as any[]).forEach((x:any)=>m[x.settingKey]=x.settingValue);setS(p=>({...p,...m}));} } catch {} })(); }, []);
  const save = async () => { setSaving(true); try { for(const [k,v] of Object.entries(s)) if(k.startsWith('finance.')) await fetch('/api/trpc/settings.settings.set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:{key:k,value:v}})}); setOk(true);setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const u=(k:string,v:string)=>setS(p=>({...p,[k]:v}));
  const N=({l,k,unit}:{l:string;k:string;unit?:string})=>(<div><label className="text-sm font-medium">{l} {unit&&<span className="text-gray-400">({unit})</span>}</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={s[k]||''} onChange={e=>u(k,e.target.value)} min="0" step="0.01"/></div>);
  const T=({l,k,ph}:{l:string;k:string;ph?:string})=>(<div><label className="text-sm font-medium">{l}</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s[k]||''} onChange={e=>u(k,e.target.value)} placeholder={ph}/></div>);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">💰 إعدادات المالية</h1></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600'}`}>{saving?'⏳':ok?'✅':'💾 حفظ'}</button></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🧾 الفواتير</h2>
        <div className="grid grid-cols-3 gap-4">
          <N l="نسبة ضريبة القيمة المضافة" k="finance.vatRate" unit="%" />
          <N l="مهلة سداد الفاتورة" k="finance.invoiceDueDays" unit="يوم" />
          <N l="حد الموافقة التلقائية" k="finance.autoApproveLimit" unit="ريال" />
          <T l="بادئة الفاتورة" k="finance.invoicePrefix" ph="INV" />
          <T l="بادئة الإيصال" k="finance.receiptPrefix" ph="REC" />
          <T l="بادئة السند" k="finance.voucherPrefix" ph="VCH" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">📊 الميزانية</h2>
        <div className="grid grid-cols-2 gap-4">
          <N l="حد تنبيه الميزانية" k="finance.budgetWarningThreshold" unit="%" />
          <N l="حد حرج الميزانية" k="finance.budgetCriticalThreshold" unit="%" />
        </div></div>

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-4">🏛️ بيانات ضريبية</h2>
        <div className="grid grid-cols-2 gap-4">
          <T l="الرقم الضريبي" k="finance.taxNumber" ph="300..." />
          <T l="السجل التجاري" k="finance.commercialRegister" ph="101..." />
          <N l="عدد الخانات العشرية" k="finance.decimalPlaces" />
          <div><label className="text-sm font-medium">طريقة التقريب</label>
            <select className="w-full border rounded-lg px-3 py-2 mt-1" value={s['finance.roundingMethod']||''} onChange={e=>u('finance.roundingMethod',e.target.value)}>
              <option value="nearest">أقرب</option><option value="up">لأعلى</option><option value="down">لأسفل</option></select></div>
        </div></div>
    </div>);
}
