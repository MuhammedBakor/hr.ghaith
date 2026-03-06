import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';

export default function DomainsSettings() {
  const [domains, setDomains] = useState('hr.door.sa,console.door.sa,api.door.sa,ghaith.door.sa');
  const [newDomain, setNewDomain] = useState('');
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);

  useEffect(() => { (async () => { try { const { data } = await api.get('/settings/domains'); if(data) { const found = (data as any[]).find((x:any)=>x.settingKey==='cors.allowedDomains'); if(found?.settingValue) setDomains(found.settingValue); } } catch {} })(); }, []);
  const save = async () => { setSaving(true); try { await api.post('/settings/domains',{key:'cors.allowedDomains',value:domains}); setOk(true);setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const list = domains.split(',').map(d=>d.trim()).filter(Boolean);
  const add = () => { if(newDomain && !list.includes(newDomain)) { setDomains([...list, newDomain].join(',')); setNewDomain(''); } };
  const remove = (d: string) => setDomains(list.filter(x=>x!==d).join(','));

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">🌐 النطاقات المسموحة (CORS)</h1><p className="text-gray-500 mt-1">النطاقات المسموح لها بالاتصال بالنظام</p></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600'}`}>{saving?'⏳':ok?'✅':'💾 حفظ'}</button>
      </div>
      <div className="bg-white rounded-xl border p-6 mb-5">
        <div className="flex gap-2 mb-4">
          <input className="flex-1 border rounded-lg px-3 py-2" value={newDomain} onChange={e=>setNewDomain(e.target.value)} placeholder="subdomain.door.sa" onKeyDown={e=>e.key==='Enter'&&add()} />
          <button onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ إضافة</button>
        </div>
        <div className="space-y-2">{list.map(d=>(
          <div key={d} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-mono text-sm">🔗 https://{d}</span>
            <button onClick={()=>remove(d)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm">حذف</button>
          </div>
        ))}</div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">⚠️ يحتاج إعادة تشغيل الخادم لتطبيق التغييرات</div>
    </div>);
}
