import React, { useState, useEffect } from 'react';

export default function SmtpSettings() {
  const [s, setS] = useState({ host:'', port:'587', username:'', password:'', fromName:'', fromEmail:'', encryption:'tls' as string, isActive:'true' });
  const [saving, setSaving] = useState(false); const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ok:boolean;msg:string}|null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await fetch('/api/trpc/governance.smtp.get'); const d = await r.json(); if (d?.result?.data) setS(prev=>({...prev,...d.result.data, password:''})); } catch {} };
  const save = async () => { setSaving(true); try { await fetch('/api/trpc/governance.smtp.update', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({json:s}) }); } catch {} setSaving(false); };
  const test = async () => { setTesting(true); setTestResult(null); try { const r = await fetch('/api/trpc/governance.smtp.test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:{to:s.fromEmail}})}); const d = await r.json(); setTestResult({ok:d?.result?.data?.success, msg:d?.result?.data?.success?'✅ تم الإرسال بنجاح':'❌ فشل الإرسال'}); } catch(e:any) { setTestResult({ok:false,msg:e.message}); } setTesting(false); };
  const u = (k: string, v: string) => setS(p => ({...p, [k]: v}));

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">📧 إعدادات البريد (SMTP)</h1><p className="text-gray-500 mt-1">إعداد خادم البريد لإرسال الإشعارات والرسائل</p></div>
        <div className="flex gap-2">
          <button onClick={test} disabled={testing} className="px-4 py-2 bg-yellow-500 text-white rounded-lg">{testing?'⏳':'🧪 اختبار'}</button>
          <button onClick={save} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg">{saving?'⏳':'💾 حفظ'}</button>
        </div>
      </div>

      {testResult && <div className={`mb-4 p-3 rounded-lg ${testResult.ok?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{testResult.msg}</div>}

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🖥️ خادم البريد</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><label className="text-sm font-medium">SMTP Host</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s.host} onChange={e=>u('host',e.target.value)} placeholder="smtp.gmail.com" /></div>
          <div><label className="text-sm font-medium">Port</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={s.port} onChange={e=>u('port',e.target.value)} /></div>
          <div><label className="text-sm font-medium">Username</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s.username} onChange={e=>u('username',e.target.value)} /></div>
          <div><label className="text-sm font-medium">Password</label><input type="password" className="w-full border rounded-lg px-3 py-2 mt-1" value={s.password} onChange={e=>u('password',e.target.value)} placeholder="••••••••" /></div>
          <div><label className="text-sm font-medium">التشفير</label>
            <select className="w-full border rounded-lg px-3 py-2 mt-1" value={s.encryption} onChange={e=>u('encryption',e.target.value)}>
              <option value="tls">TLS (587)</option><option value="ssl">SSL (465)</option><option value="none">None (25)</option>
            </select></div>
        </div></div>

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-4">✉️ بيانات المُرسِل</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">اسم المُرسِل</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s.fromName} onChange={e=>u('fromName',e.target.value)} placeholder="منصة غيث" /></div>
          <div><label className="text-sm font-medium">بريد المُرسِل</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s.fromEmail} onChange={e=>u('fromEmail',e.target.value)} placeholder="noreply@door.sa" /></div>
          <div className="col-span-2 flex items-center gap-3">
            <label className="text-sm font-medium">حالة SMTP</label>
            <button onClick={()=>u('isActive', s.isActive==='true'?'false':'true')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${s.isActive==='true'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
              {s.isActive==='true'?'🟢 مفعّل':'🔴 معطّل'}</button>
          </div>
        </div></div>
    </div>);
}
