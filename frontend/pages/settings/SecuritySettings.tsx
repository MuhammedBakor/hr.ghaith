import React, { useState, useEffect } from 'react';

type S = Record<string, string>;

export default function SecuritySettings() {
  const [s, setS] = useState<S>({
    'security.jwtExpiry': '8', 'security.sessionDuration': '8',
    'security.rememberMeDays': '30', 'security.passwordMinLength': '8',
    'security.passwordMinScore': '40', 'security.loginMaxAttempts': '10',
    'security.loginLockoutMinutes': '15', 'security.registerMaxAttempts': '5',
    'security.registerLockoutMinutes': '15', 'security.passwordResetMaxAttempts': '3',
    'security.passwordResetLockoutMinutes': '15', 'security.requireMfa': 'false',
    'security.sessionInvalidateOnPasswordChange': 'true',
    'security.maxConcurrentSessions': '5', 'security.forcePasswordChangeAfterDays': '0',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await fetch('/api/trpc/settings.settings.list'); const d = await r.json(); if (d?.result?.data) { const m: S = {}; (d.result.data as any[]).forEach((x: any) => m[x.settingKey] = x.settingValue); setS(p => ({...p, ...m})); } } catch {} };
  const save = async () => { setSaving(true); try { for (const [k,v] of Object.entries(s)) { if (k.startsWith('security.')) await fetch('/api/trpc/settings.settings.set', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({json:{key:k,value:v}}) }); } setOk(true); setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const u = (k: string, v: string) => setS(p => ({...p, [k]: v}));
  const N = ({label, k, unit, desc}: {label:string;k:string;unit?:string;desc?:string}) => (
    <div><label className="block text-sm font-medium text-gray-700 mb-1">{label} {unit && <span className="text-gray-400">({unit})</span>}</label>
    <input type="number" className="w-full border rounded-lg px-3 py-2" value={s[k]||''} onChange={e=>u(k,e.target.value)} min="0" />
    {desc && <p className="text-xs text-gray-400 mt-1">{desc}</p>}</div>);
  const T = ({label, k, desc}: {label:string;k:string;desc?:string}) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div><span className="font-medium text-sm">{label}</span>{desc && <p className="text-xs text-gray-400">{desc}</p>}</div>
      <button onClick={()=>u(k, s[k]==='true'?'false':'true')}
        className={`px-3 py-1 rounded-full text-xs font-bold ${s[k]==='true'?'bg-green-100 text-green-700':'bg-gray-200 text-gray-500'}`}>
        {s[k]==='true'?'✅ مفعّل':'⬜ معطّل'}</button></div>);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">🔐 إعدادات الأمان</h1><p className="text-gray-500 mt-1">JWT, جلسات, كلمات مرور, rate limiting</p></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600'}`}>{saving?'⏳':ok?'✅ تم':'💾 حفظ'}</button>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🎟️ JWT والجلسات</h2>
        <div className="grid grid-cols-3 gap-4">
          <N label="مدة صلاحية JWT" k="security.jwtExpiry" unit="ساعات" desc="الوقت قبل انتهاء التوكن" />
          <N label="مدة الجلسة العادية" k="security.sessionDuration" unit="ساعات" desc="بدون تذكرني" />
          <N label="مدة تذكرني" k="security.rememberMeDays" unit="أيام" desc="عند اختيار تذكرني" />
          <N label="أقصى جلسات متزامنة" k="security.maxConcurrentSessions" desc="لكل مستخدم" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🔑 كلمة المرور</h2>
        <div className="grid grid-cols-3 gap-4">
          <N label="الحد الأدنى للأحرف" k="security.passwordMinLength" desc="حالياً 8" />
          <N label="الحد الأدنى للقوة" k="security.passwordMinScore" unit="0-100" desc="40 = متوسطة" />
          <N label="تغيير إجباري كل" k="security.forcePasswordChangeAfterDays" unit="أيام" desc="0 = معطّل" />
        </div>
        <div className="mt-4 space-y-2">
          <T label="إلغاء الجلسات بعد تغيير كلمة المرور" k="security.sessionInvalidateOnPasswordChange" desc="كل الجلسات الأخرى تُلغى" />
          <T label="المصادقة الثنائية (MFA)" k="security.requireMfa" desc="مستقبلي — يحتاج ربط مع TOTP/SMS" />
        </div></div>

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-4">🚦 Rate Limiting</h2>
        <div className="grid grid-cols-2 gap-4">
          <N label="محاولات تسجيل الدخول" k="security.loginMaxAttempts" desc="قبل الحظر المؤقت" />
          <N label="مدة حظر تسجيل الدخول" k="security.loginLockoutMinutes" unit="دقيقة" />
          <N label="محاولات التسجيل" k="security.registerMaxAttempts" desc="لكل IP" />
          <N label="مدة حظر التسجيل" k="security.registerLockoutMinutes" unit="دقيقة" />
          <N label="محاولات استعادة كلمة المرور" k="security.passwordResetMaxAttempts" />
          <N label="مدة حظر الاستعادة" k="security.passwordResetLockoutMinutes" unit="دقيقة" />
        </div></div>
    </div>);
}
