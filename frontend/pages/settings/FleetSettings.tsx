import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';
type S = Record<string, string>;

export default function FleetSettings() {
  const [s, setS] = useState<S>({
    'fleet.maintenanceIntervalDays': '90', 'fleet.maintenanceIntervalKm': '10000',
    'fleet.fuelAlertThreshold': '20', 'fleet.speedLimit': '120',
    'fleet.geofenceAlertEnabled': 'true', 'fleet.tripAutoEnd': 'true',
    'fleet.tripAutoEndMinutes': '30', 'fleet.insuranceAlertDays': '30',
    'fleet.licenseAlertDays': '30', 'fleet.inspectionAlertDays': '14',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);
  useEffect(() => { (async () => { try { const { data } = await api.get('/settings/fleet'); if(data){const m:S={};(data as any[]).forEach((x:any)=>m[x.settingKey]=x.settingValue);setS(p=>({...p,...m}));} } catch {} })(); }, []);
  const save = async () => { setSaving(true); try { for(const [k,v] of Object.entries(s)) if(k.startsWith('fleet.')) await api.post('/settings/fleet',{key:k,value:v}); setOk(true);setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const u=(k:string,v:string)=>setS(p=>({...p,[k]:v}));
  const N=({l,k,u:unit}:{l:string;k:string;u?:string})=>(<div><label className="text-sm font-medium">{l} {unit&&<span className="text-gray-400">({unit})</span>}</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={s[k]||''} onChange={e=>u(k,e.target.value)} min="0"/></div>);
  const Tog=({l,k}:{l:string;k:string})=>(<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="font-medium text-sm">{l}</span><button onClick={()=>u(k,s[k]==='true'?'false':'true')} className={`px-3 py-1 rounded-full text-xs font-bold ${s[k]==='true'?'bg-green-100 text-green-700':'bg-gray-200 text-gray-500'}`}>{s[k]==='true'?'✅':'⬜'}</button></div>);

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">🚗 إعدادات الأسطول</h1></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600'}`}>{saving?'⏳':ok?'✅':'💾 حفظ'}</button></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🔧 الصيانة</h2>
        <div className="grid grid-cols-2 gap-4">
          <N l="فترة الصيانة الدورية" k="fleet.maintenanceIntervalDays" u="يوم" />
          <N l="فترة الصيانة بالمسافة" k="fleet.maintenanceIntervalKm" u="كم" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">⛽ الوقود والسرعة</h2>
        <div className="grid grid-cols-2 gap-4">
          <N l="تنبيه الوقود المنخفض" k="fleet.fuelAlertThreshold" u="%" />
          <N l="الحد الأقصى للسرعة" k="fleet.speedLimit" u="كم/ساعة" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">📋 التنبيهات</h2>
        <div className="grid grid-cols-3 gap-4">
          <N l="تنبيه التأمين قبل" k="fleet.insuranceAlertDays" u="يوم" />
          <N l="تنبيه الرخصة قبل" k="fleet.licenseAlertDays" u="يوم" />
          <N l="تنبيه الفحص قبل" k="fleet.inspectionAlertDays" u="يوم" />
        </div></div>

      <div className="bg-white rounded-xl border p-6"><h2 className="text-lg font-bold mb-4">⚡ تلقائي</h2>
        <div className="space-y-2">
          <Tog l="تنبيه خروج من السياج الجغرافي" k="fleet.geofenceAlertEnabled" />
          <Tog l="إنهاء الرحلة تلقائياً عند التوقف" k="fleet.tripAutoEnd" />
        </div>
        {s['fleet.tripAutoEnd']==='true' && <div className="mt-3"><N l="بعد توقف" k="fleet.tripAutoEndMinutes" u="دقيقة" /></div>}
      </div>
    </div>);
}
