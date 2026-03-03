import React, { useState, useEffect } from 'react';

type RType = 'ip_whitelist' | 'ip_blacklist' | 'device_limit' | 'session_limit';
const TYPES: { key: RType; label: string; icon: string; placeholder: string }[] = [
  { key: 'ip_whitelist', label: 'IP مسموحة', icon: '✅', placeholder: '192.168.1.0/24, 10.0.0.1' },
  { key: 'ip_blacklist', label: 'IP محظورة', icon: '🚫', placeholder: '1.2.3.4' },
  { key: 'device_limit', label: 'حد أجهزة', icon: '📱', placeholder: '3' },
  { key: 'session_limit', label: 'حد جلسات', icon: '🔗', placeholder: '2' },
];

interface Restriction { id: number; restrictionType: RType; value: string; userId?: number; roleId?: number; isActive: boolean; }

export default function AccessRestrictions() {
  const [items, setItems] = useState<Restriction[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ restrictionType: 'ip_whitelist' as RType, value: '', userId: '', roleId: '' });

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await fetch('/api/trpc/admin.accessRestrictions.list'); const d = await r.json(); if (d?.result?.data) setItems(d.result.data); } catch {} };

  const save = async () => {
    try {
      await fetch('/api/trpc/admin.accessRestrictions.create', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { ...form, userId: form.userId ? Number(form.userId) : null, roleId: form.roleId ? Number(form.roleId) : null, isActive: true } }) });
      await load(); setShow(false); setForm({ restrictionType: 'ip_whitelist', value: '', userId: '', roleId: '' });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">تقييد الوصول</h1><p className="text-gray-500 mt-1">IP + أجهزة + جلسات</p></div>
        <button onClick={() => setShow(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ تقييد</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">{TYPES.map(t => (
        <div key={t.key} className="border rounded-lg p-4 bg-white text-center">
          <div className="text-2xl">{t.icon}</div><div className="font-bold text-sm mt-1">{t.label}</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{items.filter(i => i.restrictionType === t.key && i.isActive).length}</div>
        </div>
      ))}</div>

      <div className="space-y-2">{items.map(i => (
        <div key={i.id} className="border rounded-lg p-3 flex justify-between bg-white">
          <span>{TYPES.find(t=>t.key===i.restrictionType)?.icon} {TYPES.find(t=>t.key===i.restrictionType)?.label}: <b>{i.value}</b></span>
          <span className={`px-2 py-1 rounded text-xs ${i.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{i.isActive ? 'فعّال' : 'معطّل'}</span>
        </div>
      ))}</div>

      {show && (
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">النوع</label><select className="w-full border rounded px-3 py-2 mt-1" value={form.restrictionType} onChange={e => setForm(p => ({...p, restrictionType: e.target.value as RType}))}>{TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
            <div><label className="text-sm font-medium">القيمة</label><input className="w-full border rounded px-3 py-2 mt-1" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} placeholder={TYPES.find(t=>t.key===form.restrictionType)?.placeholder} /></div>
            <div><label className="text-sm font-medium">مستخدم (اختياري)</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.userId} onChange={e => setForm(p => ({...p, userId: e.target.value}))} /></div>
            <div><label className="text-sm font-medium">دور (اختياري)</label><input type="number" className="w-full border rounded px-3 py-2 mt-1" value={form.roleId} onChange={e => setForm(p => ({...p, roleId: e.target.value}))} /></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={save} className="px-6 py-2 bg-green-600 text-white rounded-lg">💾 حفظ</button><button onClick={() => setShow(false)} className="px-4 py-2 bg-gray-200 rounded-lg">إلغاء</button></div>
        </div>
      )}
    </div>
  );
}
