import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';
type S = Record<string, string>;
const DAYS = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

export default function HrSettings() {
  const [s, setS] = useState<S>({
    'hr.workingDays': '0,1,2,3,4', 'hr.workingHoursStart': '8', 'hr.workingHoursEnd': '17',
    'hr.annualLeaveBalance': '21', 'hr.sickLeaveBalance': '30', 'hr.probationPeriodDays': '90',
    'hr.overtimeRate': '1.5', 'hr.lateGracePeriodMinutes': '15', 'hr.absentDeductionPercent': '100',
    'hr.endOfServiceYearsMin': '2', 'hr.maxAdvancePercent': '50', 'hr.gosiEmployeePercent': '9.75',
    'hr.gosiEmployerPercent': '11.75', 'hr.vacationSettlementDays': '3',
  });
  const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const { data } = await api.get('/settings/hr'); if (data) { const m: S = {}; (data as any[]).forEach((x: any) => m[x.settingKey] = x.settingValue); setS(p => ({...p, ...m})); } } catch {} };
  const save = async () => { setSaving(true); try { for (const [k,v] of Object.entries(s)) if(k.startsWith('hr.')) await api.post('/settings/hr',{key:k,value:v}); setOk(true); setTimeout(()=>setOk(false),2000); } catch {} setSaving(false); };
  const u = (k: string, v: string) => setS(p => ({...p, [k]: v}));
  const N = ({l,k,unit,desc}:{l:string;k:string;unit?:string;desc?:string}) => (
    <div><label className="block text-sm font-medium text-gray-700 mb-1">{l} {unit&&<span className="text-gray-400">({unit})</span>}</label>
    <input type="number" className="w-full border rounded-lg px-3 py-2" value={s[k]||''} onChange={e=>u(k,e.target.value)} min="0" step="0.01" />
    {desc&&<p className="text-xs text-gray-400 mt-1">{desc}</p>}</div>);

  const workDays = (s['hr.workingDays']||'').split(',').map(Number);
  const toggleDay = (d: number) => { const nd = workDays.includes(d) ? workDays.filter(x=>x!==d) : [...workDays, d]; u('hr.workingDays', nd.sort().join(',')); };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold">👥 إعدادات الموارد البشرية</h1></div>
        <button onClick={save} disabled={saving} className={`px-6 py-2 rounded-lg text-white ${ok?'bg-green-500':'bg-blue-600'}`}>{saving?'⏳':ok?'✅':'💾 حفظ'}</button>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🕐 أيام وساعات العمل</h2>
        <div className="mb-4"><label className="block text-sm font-medium mb-2">أيام العمل</label>
          <div className="flex gap-2">{DAYS.map((d,i)=><button key={i} onClick={()=>toggleDay(i)} className={`px-3 py-2 rounded-lg text-sm font-medium ${workDays.includes(i)?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>{d}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-4">
          <N l="بداية الدوام" k="hr.workingHoursStart" unit="ساعة 24h" />
          <N l="نهاية الدوام" k="hr.workingHoursEnd" unit="ساعة 24h" />
          <N l="فترة سماح التأخير" k="hr.lateGracePeriodMinutes" unit="دقيقة" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">🏖️ الإجازات</h2>
        <div className="grid grid-cols-3 gap-4">
          <N l="رصيد الإجازة السنوية" k="hr.annualLeaveBalance" unit="يوم" />
          <N l="رصيد الإجازة المرضية" k="hr.sickLeaveBalance" unit="يوم" />
          <N l="أيام تسوية الإجازة" k="hr.vacationSettlementDays" unit="يوم" desc="قبل بداية الإجازة" />
        </div></div>

      <div className="bg-white rounded-xl border p-6 mb-5"><h2 className="text-lg font-bold mb-4">💰 الرواتب والمزايا</h2>
        <div className="grid grid-cols-3 gap-4">
          <N l="معدل الأوفرتايم" k="hr.overtimeRate" desc="1.5 = ساعة ونصف" />
          <N l="نسبة خصم الغياب" k="hr.absentDeductionPercent" unit="%" />
          <N l="حد أقصى سلفة" k="hr.maxAdvancePercent" unit="% من الراتب" />
          <N l="GOSI نسبة الموظف" k="hr.gosiEmployeePercent" unit="%" />
          <N l="GOSI نسبة صاحب العمل" k="hr.gosiEmployerPercent" unit="%" />
          <N l="فترة التجربة" k="hr.probationPeriodDays" unit="يوم" />
          <N l="حد مكافأة نهاية الخدمة" k="hr.endOfServiceYearsMin" unit="سنة" />
        </div></div>
    </div>);
}
