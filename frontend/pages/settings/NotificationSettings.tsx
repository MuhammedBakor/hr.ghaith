import React, { useState, useEffect } from 'react';
import settingsService from '../../client/src/services/settingsService';

type S = Record<string, string>;

export default function NotificationSettings() {
  const [s, setS] = useState<S>({
    'notifications.emailEnabled': 'true', 'notifications.smsEnabled': 'false',
    'notifications.whatsappEnabled': 'false', 'notifications.pushEnabled': 'true',
    'notifications.internalEnabled': 'true', 'notifications.digestEnabled': 'false',
    'notifications.digestHour': '8', 'notifications.quietHoursStart': '22',
    'notifications.quietHoursEnd': '7', 'notifications.quietHoursEnabled': 'false',
    'notifications.whatsappApiUrl': '', 'notifications.whatsappApiKey': '',
    'notifications.smsApiUrl': '', 'notifications.smsApiKey': '', 'notifications.smsSenderName': '',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsService.getAllSettings();
        if (data) {
          const m: S = {};
          data.forEach((x: any) => m[x.settingKey] = x.settingValue);
          setS(p => ({ ...p, ...m }));
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      for (const [k, v] of Object.entries(s)) {
        if (k.startsWith('notifications.')) {
          await settingsService.setSetting(k, v);
        }
      }
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
    setSaving(false);
  };
  const u = (k: string, v: string) => setS(p => ({ ...p, [k]: v }));
  const Ch = ({ l, k, icon, desc }: { l: string; k: string; icon: string; desc: string }) => (
    <div className="bg-white rounded-xl border p-5"><div className="flex items-center justify-between">
      <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><h3 className="font-bold">{l}</h3><p className="text-xs text-gray-400">{desc}</p></div></div>
      <button onClick={() => u(k, s[k] === 'true' ? 'false' : 'true')} className={`px-4 py-2 rounded-lg text-sm font-bold ${s[k] === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s[k] === 'true' ? '🟢 مفعّل' : '⬜ معطّل'}</button>
    </div></div>);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">🔔 إعدادات الإشعارات</h1></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok ? 'bg-green-500' : 'bg-blue-600'}`}>{saving ? '⏳' : ok ? '✅' : '💾 حفظ'}</button></div>

      <div className="space-y-3 mb-6">
        <Ch l="البريد الإلكتروني" k="notifications.emailEnabled" icon="📧" desc="إشعارات عبر SMTP" />
        <Ch l="إشعارات داخلية" k="notifications.internalEnabled" icon="🔔" desc="إشعارات داخل النظام" />
        <Ch l="Push Notifications" k="notifications.pushEnabled" icon="📲" desc="إشعارات فورية" />
        <Ch l="WhatsApp" k="notifications.whatsappEnabled" icon="💬" desc="يحتاج API key" />
        <Ch l="SMS" k="notifications.smsEnabled" icon="📱" desc="يحتاج مزود SMS" />
      </div>

      {s['notifications.whatsappEnabled'] === 'true' && (
        <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-3">💬 WhatsApp API</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">API URL</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.whatsappApiUrl'] || ''} onChange={e => u('notifications.whatsappApiUrl', e.target.value)} /></div>
            <div><label className="text-sm font-medium">API Key</label><input type="password" className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.whatsappApiKey'] || ''} onChange={e => u('notifications.whatsappApiKey', e.target.value)} /></div>
          </div></div>)}

      {s['notifications.smsEnabled'] === 'true' && (
        <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-3">📱 SMS API</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-sm font-medium">API URL</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.smsApiUrl'] || ''} onChange={e => u('notifications.smsApiUrl', e.target.value)} /></div>
            <div><label className="text-sm font-medium">API Key</label><input type="password" className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.smsApiKey'] || ''} onChange={e => u('notifications.smsApiKey', e.target.value)} /></div>
            <div><label className="text-sm font-medium">اسم المرسل</label><input className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.smsSenderName'] || ''} onChange={e => u('notifications.smsSenderName', e.target.value)} /></div>
          </div></div>)}

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-3">🌙 ساعات الهدوء والملخص</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="font-medium text-sm">ساعات هدوء (عدم إرسال)</span>
            <button onClick={() => u('notifications.quietHoursEnabled', s['notifications.quietHoursEnabled'] === 'true' ? 'false' : 'true')} className={`px-3 py-1 rounded-full text-xs font-bold ${s['notifications.quietHoursEnabled'] === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{s['notifications.quietHoursEnabled'] === 'true' ? '✅' : '⬜'}</button></div>
          {s['notifications.quietHoursEnabled'] === 'true' && <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">من ساعة</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.quietHoursStart'] || ''} onChange={e => u('notifications.quietHoursStart', e.target.value)} min="0" max="23" /></div>
            <div><label className="text-sm font-medium">إلى ساعة</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={s['notifications.quietHoursEnd'] || ''} onChange={e => u('notifications.quietHoursEnd', e.target.value)} min="0" max="23" /></div></div>}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="font-medium text-sm">ملخص يومي (Digest)</span>
            <button onClick={() => u('notifications.digestEnabled', s['notifications.digestEnabled'] === 'true' ? 'false' : 'true')} className={`px-3 py-1 rounded-full text-xs font-bold ${s['notifications.digestEnabled'] === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{s['notifications.digestEnabled'] === 'true' ? '✅' : '⬜'}</button></div>
        </div></div>
    </div>);
}
