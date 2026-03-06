import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';

const OPERATORS = [
  { key: 'gt', label: '>', labelAr: 'أكبر من' },
  { key: 'gte', label: '>=', labelAr: 'أكبر أو يساوي' },
  { key: 'lt', label: '<', labelAr: 'أقل من' },
  { key: 'lte', label: '<=', labelAr: 'أقل أو يساوي' },
  { key: 'eq', label: '=', labelAr: 'يساوي' },
  { key: 'between', label: 'بين', labelAr: 'بين' },
];

const ACTIONS = [
  { key: 'require_approval', label: 'يحتاج موافقة', icon: '✋', desc: 'تحويل للموافقة' },
  { key: 'require_dual_approval', label: 'موافقة مزدوجة', icon: '✋✋', desc: 'يحتاج موافقتين' },
  { key: 'block', label: 'منع', icon: '🚫', desc: 'رفض العملية' },
  { key: 'notify', label: 'إشعار', icon: '🔔', desc: 'إشعار فقط' },
  { key: 'escalate', label: 'تصعيد', icon: '⬆️', desc: 'تصعيد للمدير' },
  { key: 'require_document', label: 'مستند مطلوب', icon: '📎', desc: 'يحتاج مرفق' },
  { key: 'auto_approve', label: 'موافقة تلقائية', icon: '✅', desc: 'موافقة بدون مراجعة' },
];

const MODULES = ['finance', 'hr', 'fleet', 'store', 'projects', 'legal', 'comms', 'crm', 'support', 'governance'];
const EVENTS = ['create', 'update', 'delete', 'approve', 'submit'];
const EVENT_AR: Record<string, string> = { create: 'إنشاء', update: 'تعديل', delete: 'حذف', approve: 'موافقة', submit: 'إرسال' };

interface Rule {
  id: number; name: string; nameAr: string; module: string; entityType: string;
  triggerEvent: string; conditionField: string; conditionOperator: string;
  conditionValue: string; actionType: string; priority: number; isActive: boolean;
}

export default function BusinessRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameAr: '', module: 'finance', entityType: 'invoice', triggerEvent: 'create', conditionField: 'amount', conditionOperator: 'gt', conditionValue: '', actionType: 'require_approval', priority: 100 });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const { data } = await api.get('/governance/business-rules');
      if (data) setRules(data);
    } catch {}
  };

  const save = async () => {
    try {
      await api.post('/governance/business-rules', { ...form, name: form.nameAr, isActive: true });
      await loadRules();
      setShowForm(false);
      setForm({ nameAr: '', module: 'finance', entityType: 'invoice', triggerEvent: 'create', conditionField: 'amount', conditionOperator: 'gt', conditionValue: '', actionType: 'require_approval', priority: 100 });
    } catch (e) { console.error(e); }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/governance/business-rules/${id}`, { isActive: !isActive });
      await loadRules();
    } catch {}
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">قواعد العمل</h1>
          <p className="text-gray-500 mt-1">قواعد تلقائية تتحكم في سلوك النظام بدون كود</p></div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">+ قاعدة جديدة</button>
      </div>

      {/* Examples */}
      {rules.length === 0 && !showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-3">💡 أمثلة على قواعد العمل:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded p-3">إذا <b>المبلغ {'>'} 50,000</b> → <span className="text-red-600">يحتاج موافقة مزدوجة</span></div>
            <div className="bg-white rounded p-3">إذا <b>الإجازة {'>'} 5 أيام</b> → <span className="text-orange-600">تصعيد للمدير العام</span></div>
            <div className="bg-white rounded p-3">إذا <b>المصروف {'>'} 10,000</b> → <span className="text-blue-600">يحتاج مستند مرفق</span></div>
            <div className="bg-white rounded p-3">إذا <b>المبلغ {'<'} 500</b> → <span className="text-green-600">موافقة تلقائية</span></div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-2 mb-6">
        {rules.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-white flex justify-between items-center shadow-sm">
            <div>
              <div className="font-bold">{r.nameAr || r.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {r.module} / {r.entityType} / {EVENT_AR[r.triggerEvent] || r.triggerEvent} →{' '}
                إذا <span className="text-blue-600 font-medium">{r.conditionField}</span>
                {' '}{OPERATORS.find(o => o.key === r.conditionOperator)?.label}
                {' '}<span className="text-red-600 font-medium">{r.conditionValue}</span>
                {' '}→ <span className="text-green-600 font-medium">{ACTIONS.find(a => a.key === r.actionType)?.icon} {ACTIONS.find(a => a.key === r.actionType)?.label}</span>
              </div>
            </div>
            <button onClick={() => toggleActive(r.id, r.isActive)}
              className={`px-3 py-1 rounded text-sm ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {r.isActive ? '🟢 فعّال' : '⚪ معطّل'}
            </button>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <h3 className="text-lg font-bold mb-4">قاعدة جديدة</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3"><label className="block text-sm font-medium mb-1">اسم القاعدة</label>
              <input className="w-full border rounded px-3 py-2" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} placeholder="مصروف كبير يحتاج موافقة مزدوجة" /></div>
            <div><label className="block text-sm font-medium mb-1">الوحدة</label>
              <select className="w-full border rounded px-3 py-2" value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value }))}>{MODULES.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">نوع الكيان</label>
              <input className="w-full border rounded px-3 py-2" value={form.entityType} onChange={e => setForm(p => ({ ...p, entityType: e.target.value }))} placeholder="invoice, expense, leave" /></div>
            <div><label className="block text-sm font-medium mb-1">الحدث</label>
              <select className="w-full border rounded px-3 py-2" value={form.triggerEvent} onChange={e => setForm(p => ({ ...p, triggerEvent: e.target.value }))}>{EVENTS.map(e => <option key={e} value={e}>{EVENT_AR[e]}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">حقل الشرط</label>
              <input className="w-full border rounded px-3 py-2" value={form.conditionField} onChange={e => setForm(p => ({ ...p, conditionField: e.target.value }))} placeholder="amount, days" /></div>
            <div><label className="block text-sm font-medium mb-1">العلاقة</label>
              <select className="w-full border rounded px-3 py-2" value={form.conditionOperator} onChange={e => setForm(p => ({ ...p, conditionOperator: e.target.value }))}>{OPERATORS.map(o => <option key={o.key} value={o.key}>{o.labelAr} ({o.label})</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">القيمة</label>
              <input className="w-full border rounded px-3 py-2" value={form.conditionValue} onChange={e => setForm(p => ({ ...p, conditionValue: e.target.value }))} placeholder="50000" /></div>
            <div className="col-span-3"><label className="block text-sm font-medium mb-2">الإجراء</label>
              <div className="flex gap-2 flex-wrap">{ACTIONS.map(a => (
                <button key={a.key} onClick={() => setForm(p => ({ ...p, actionType: a.key }))}
                  className={`px-3 py-2 rounded-lg text-sm transition ${form.actionType === a.key ? 'bg-blue-600 text-white shadow' : 'bg-white border hover:bg-gray-50'}`}>{a.icon} {a.label}</button>
              ))}</div></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="px-6 py-2 bg-green-600 text-white rounded-lg">💾 حفظ القاعدة</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
