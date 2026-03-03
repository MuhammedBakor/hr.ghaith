import React, { useState, useEffect } from 'react';

const MODULES = ['hr', 'finance', 'fleet', 'store', 'projects', 'legal', 'comms', 'crm', 'support', 'governance'];
const ACTIONS = ['create', 'update', 'delete', 'approve', 'export'];
const DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

interface Limit { id: number; roleId?: number; module: string; action: string; maxPerDay?: number; maxPerMonth?: number; maxAmount?: number; maxDailyAmount?: number; allowedFromHour?: number; allowedToHour?: number; allowedDays?: number[]; isActive: boolean; }

export default function OperationLimits() {
  const [limits, setLimits] = useState<Limit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ module: 'finance', action: 'create', maxPerDay: '', maxPerMonth: '', maxAmount: '', maxDailyAmount: '', allowedFromHour: '', allowedToHour: '', allowedDays: [0,1,2,3,4] as number[] });

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await fetch('/api/trpc/admin.operationLimits.list'); const d = await r.json(); if (d?.result?.data) setLimits(d.result.data); } catch {} };

  const save = async () => {
    try {
      await fetch('/api/trpc/admin.operationLimits.create', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { ...form, maxPerDay: form.maxPerDay ? Number(form.maxPerDay) : null, maxPerMonth: form.maxPerMonth ? Number(form.maxPerMonth) : null, maxAmount: form.maxAmount ? Number(form.maxAmount) : null, maxDailyAmount: form.maxDailyAmount ? Number(form.maxDailyAmount) : null, allowedFromHour: form.allowedFromHour ? Number(form.allowedFromHour) : null, allowedToHour: form.allowedToHour ? Number(form.allowedToHour) : null, isActive: true } }) });
      await load(); setShowForm(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">حدود العمليات</h1><p className="text-gray-500 mt-1">تحكم في عدد ومبلغ وتوقيت العمليات لكل دور</p></div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ حد جديد</button>
      </div>

      <div className="space-y-2 mb-6">{limits.map(l => (
        <div key={l.id} className="border rounded-lg p-4 bg-white flex justify-between">
          <div>
            <span className="font-bold">{l.module}.{l.action}</span>
            <div className="text-sm text-gray-500 mt-1">
              {l.maxPerDay && <span className="ml-3">📅 {l.maxPerDay}/يوم</span>}
              {l.maxPerMonth && <span className="ml-3">📆 {l.maxPerMonth}/شهر</span>}
              {l.maxAmount && <span className="ml-3">💰 حد {l.maxAmount.toLocaleString()}</span>}
              {l.allowedFromHour != null && <span className="ml-3">🕐 {l.allowedFromHour}:00–{l.allowedToHour}:00</span>}
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${l.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{l.isActive ? 'فعّال' : 'معطّل'}</span>
        </div>
      ))}</div>

      {showForm && (
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <h3 className="font-bold mb-4">حد جديد</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-sm font-medium">الوحدة</label><select className="w-full border rounded px-3 py-2 mt-1" value={form.module} onChange={e => setForm(p => ({...p, module: e.target.value}))}>{MODULES.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className="text-sm font-medium">الإجراء</label><select className="w-full border rounded px-3 py-2 mt-1" value={form.action} onChange={e => setForm(p => ({...p, action: e.target.value}))}>{ACTIONS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label className="text-sm font-medium">حد يومي</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.maxPerDay} onChange={e => setForm(p => ({...p, maxPerDay: e.target.value}))} placeholder="10" /></div>
            <div><label className="text-sm font-medium">حد شهري</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.maxPerMonth} onChange={e => setForm(p => ({...p, maxPerMonth: e.target.value}))} placeholder="200" /></div>
            <div><label className="text-sm font-medium">حد مبلغ/عملية</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.maxAmount} onChange={e => setForm(p => ({...p, maxAmount: e.target.value}))} placeholder="50000" /></div>
            <div><label className="text-sm font-medium">حد مبلغ يومي</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.maxDailyAmount} onChange={e => setForm(p => ({...p, maxDailyAmount: e.target.value}))} placeholder="100000" /></div>
            <div><label className="text-sm font-medium">من ساعة</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.allowedFromHour} onChange={e => setForm(p => ({...p, allowedFromHour: e.target.value}))} placeholder="8" min="0" max="23" /></div>
            <div><label className="text-sm font-medium">إلى ساعة</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.allowedToHour} onChange={e => setForm(p => ({...p, allowedToHour: e.target.value}))} placeholder="17" min="0" max="23" /></div>
            <div><label className="text-sm font-medium">الأيام</label>
              <div className="flex gap-1 mt-1">{DAYS.map((d, i) => (
                <button key={i} onClick={() => setForm(p => ({...p, allowedDays: p.allowedDays.includes(i) ? p.allowedDays.filter(x=>x!==i) : [...p.allowedDays, i]}))}
                  className={`px-2 py-1 rounded text-xs ${form.allowedDays.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{d}</button>
              ))}</div></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="px-6 py-2 bg-green-600 text-white rounded-lg">💾 حفظ</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
