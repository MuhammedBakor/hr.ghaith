import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';

/**
 * Business Rules Builder — محرك قواعد العمل
 * مثال: "إذا المبلغ > 50,000 → موافقة مزدوجة من المالية + المدير العام"
 */

const MODULES = ['finance', 'hr', 'fleet', 'store', 'projects', 'legal', 'comms', 'crm', 'support', 'governance'];
const MODULE_LABELS: Record<string, string> = {
  finance: '💰 المالية', hr: '👥 HR', fleet: '🚗 الأسطول', store: '📦 المخزون',
  projects: '📊 المشاريع', legal: '⚖️ القانونية', comms: '📨 المراسلات',
  crm: '🤝 العملاء', support: '🎧 الدعم', governance: '🛡️ الحوكمة',
};
const EVENTS = [
  { key: 'create', label: 'عند الإنشاء' }, { key: 'update', label: 'عند التعديل' },
  { key: 'delete', label: 'عند الحذف' }, { key: 'approve', label: 'عند الموافقة' },
  { key: 'submit', label: 'عند الإرسال' },
];
const OPERATORS = [
  { key: 'gt', label: 'أكبر من >', sym: '>' }, { key: 'gte', label: 'أكبر أو يساوي ≥', sym: '≥' },
  { key: 'lt', label: 'أقل من <', sym: '<' }, { key: 'lte', label: 'أقل أو يساوي ≤', sym: '≤' },
  { key: 'eq', label: 'يساوي =', sym: '=' }, { key: 'neq', label: 'لا يساوي ≠', sym: '≠' },
  { key: 'between', label: 'بين', sym: 'بين' }, { key: 'in', label: 'ضمن القائمة', sym: 'ضمن' },
];
const ACTIONS = [
  { key: 'require_approval', label: 'يحتاج موافقة', icon: '✋', desc: 'لازم يوافق شخص قبل التنفيذ' },
  { key: 'require_dual_approval', label: 'موافقة مزدوجة', icon: '✋✋', desc: 'لازم يوافق شخصين مختلفين' },
  { key: 'block', label: 'منع العملية', icon: '🚫', desc: 'العملية ممنوعة بالكامل' },
  { key: 'notify', label: 'إشعار فقط', icon: '🔔', desc: 'العملية تمر + إشعار للمسؤول' },
  { key: 'escalate', label: 'تصعيد', icon: '⬆️', desc: 'تصعيد تلقائي للمستوى الأعلى' },
  { key: 'require_document', label: 'يحتاج مستند', icon: '📎', desc: 'لازم يرفق مستند مرفق' },
  { key: 'auto_approve', label: 'موافقة تلقائية', icon: '✅', desc: 'الموافقة تلقائية إذا الشرط تحقق' },
];
const EXAMPLE_RULES = [
  { name: 'مصروف كبير', nameAr: 'مصروف > 50 ألف يحتاج موافقة مزدوجة', module: 'finance', entityType: 'expense', triggerEvent: 'create', conditionField: 'amount', conditionOperator: 'gt', conditionValue: '50000', actionType: 'require_dual_approval' },
  { name: 'إجازة طويلة', nameAr: 'إجازة > 14 يوم تحتاج موافقة المدير العام', module: 'hr', entityType: 'leave', triggerEvent: 'submit', conditionField: 'days', conditionOperator: 'gt', conditionValue: '14', actionType: 'escalate' },
  { name: 'حذف فاتورة', nameAr: 'منع حذف الفواتير نهائياً', module: 'finance', entityType: 'invoice', triggerEvent: 'delete', conditionField: 'status', conditionOperator: 'neq', conditionValue: 'draft', actionType: 'block' },
];

interface Rule {
  id?: number; name: string; nameAr: string; module: string; entityType: string;
  triggerEvent: string; conditionField: string; conditionOperator: string;
  conditionValue: string; actionType: string; priority: number; isActive: boolean;
}

export default function BusinessRulesBuilder() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Rule>>({ module: 'finance', triggerEvent: 'create', conditionOperator: 'gt', actionType: 'require_approval', priority: 100, isActive: true });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const { data } = await api.get('/governance/business-rules');
      if (data) setRules(data);
    } catch { /* empty */ }
  };

  const save = async () => {
    const rule: Rule = {
      ...(form as Rule), name: form.name || form.nameAr || `Rule ${rules.length + 1}`,
      nameAr: form.nameAr || form.name || '', entityType: form.entityType || 'general',
      conditionField: form.conditionField || 'amount', conditionValue: form.conditionValue || '0',
      priority: form.priority || 100, isActive: true,
    };
    try {
      await api.post('/governance/business-rules', rule);
      setRules(prev => [...prev, { ...rule, id: Date.now() }]);
      setShowForm(false);
      setForm({ module: 'finance', triggerEvent: 'create', conditionOperator: 'gt', actionType: 'require_approval', priority: 100, isActive: true });
    } catch (e) { console.error(e); }
  };

  const toggleActive = (idx: number) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = async (idx: number) => {
    const rule = rules[idx];
    if (rule.id) { try { await api.delete(`/governance/business-rules/${rule.id}`); } catch { /* */ } }
    setRules(prev => prev.filter((_, i) => i !== idx));
  };

  const useExample = (ex: typeof EXAMPLE_RULES[0]) => {
    setForm({ ...ex, priority: 100, isActive: true });
    setShowForm(true);
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📋 قواعد العمل</h1>
          <p className="text-gray-500 mt-1">عرّف شروط تلقائية تتحكم بالنظام — بدون أي تعديل في الكود</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">+ قاعدة جديدة</button>
      </div>

      {/* Examples */}
      {rules.length === 0 && !showForm && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-600 mb-3">💡 أمثلة جاهزة (اضغط لاستخدامها)</h3>
          <div className="grid grid-cols-3 gap-3">
            {EXAMPLE_RULES.map((ex, i) => (
              <button key={i} onClick={() => useExample(ex)} className="border-2 border-dashed rounded-lg p-4 text-right hover:border-blue-400 hover:bg-blue-50 transition-all">
                <div className="font-bold text-sm">{ex.nameAr}</div>
                <div className="text-xs text-gray-500 mt-1">{MODULE_LABELS[ex.module]} → {ACTIONS.find(a=>a.key===ex.actionType)?.icon} {ACTIONS.find(a=>a.key===ex.actionType)?.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3 mb-6">
        {rules.map((rule, i) => (
          <div key={rule.id || i} className={`border rounded-lg p-4 bg-white shadow-sm ${!rule.isActive ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{rule.nameAr || rule.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {MODULE_LABELS[rule.module]} → عند <span className="text-blue-600">{EVENTS.find(e=>e.key===rule.triggerEvent)?.label}</span>
                  {' '}إذا <span className="font-mono bg-gray-100 px-1 rounded">{rule.conditionField}</span>
                  {' '}<span className="text-red-600 font-bold">{OPERATORS.find(o=>o.key===rule.conditionOperator)?.sym}</span>
                  {' '}<span className="font-mono bg-gray-100 px-1 rounded">{rule.conditionValue}</span>
                  {' '}→ {ACTIONS.find(a=>a.key===rule.actionType)?.icon} <span className="text-green-700 font-bold">{ACTIONS.find(a=>a.key===rule.actionType)?.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(i)} className={`px-3 py-1 rounded text-xs ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {rule.isActive ? '🟢 فعّال' : '⚫ معطّل'}
                </button>
                <button onClick={() => deleteRule(i)} className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-100">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div className="border-2 border-blue-300 rounded-xl p-6 bg-blue-50 shadow-lg">
          <h3 className="text-lg font-bold mb-4">🆕 قاعدة جديدة</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">📝 وصف القاعدة</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.nameAr || ''} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value, name: e.target.value }))} placeholder="مثال: مصروف كبير يحتاج موافقة مزدوجة" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📦 الوحدة</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value }))}>
                {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">⚡ الحدث</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.triggerEvent} onChange={e => setForm(p => ({ ...p, triggerEvent: e.target.value }))}>
                {EVENTS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">🎯 نوع الكيان</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.entityType || ''} onChange={e => setForm(p => ({ ...p, entityType: e.target.value }))} placeholder="invoice, expense, leave, contract..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📊 حقل الشرط</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.conditionField || ''} onChange={e => setForm(p => ({ ...p, conditionField: e.target.value }))} placeholder="amount, days, status, quantity..." />
            </div>
            <div className="flex gap-2">
              <div className="w-2/5">
                <label className="block text-sm font-medium mb-1">↔️ العلاقة</label>
                <select className="w-full border rounded-lg px-3 py-2" value={form.conditionOperator} onChange={e => setForm(p => ({ ...p, conditionOperator: e.target.value }))}>
                  {OPERATORS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <div className="w-3/5">
                <label className="block text-sm font-medium mb-1">🔢 القيمة</label>
                <input className="w-full border rounded-lg px-3 py-2" value={form.conditionValue || ''} onChange={e => setForm(p => ({ ...p, conditionValue: e.target.value }))} placeholder="50000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📌 الأولوية (أقل = أهم)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.priority || 100} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">🎬 الإجراء</label>
              <div className="grid grid-cols-4 gap-2">
                {ACTIONS.map(a => (
                  <button key={a.key} onClick={() => setForm(p => ({ ...p, actionType: a.key }))}
                    className={`p-3 rounded-lg text-sm text-right transition-all ${form.actionType === a.key ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-white border hover:bg-gray-50'}`}>
                    <div className="text-lg">{a.icon}</div>
                    <div className="font-bold text-xs mt-1">{a.label}</div>
                    <div className={`text-xs mt-0.5 ${form.actionType === a.key ? 'text-blue-100' : 'text-gray-400'}`}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <span className="text-xs text-gray-500">معاينة: </span>
            <span className="text-sm">
              في <b>{MODULE_LABELS[form.module || 'finance']}</b>، عند <b>{EVENTS.find(e=>e.key===form.triggerEvent)?.label}</b>
              {' '}نوع <b>{form.entityType || '...'}</b>:
              {' '}إذا <code>{form.conditionField || '...'}</code> {OPERATORS.find(o=>o.key===form.conditionOperator)?.sym} <code>{form.conditionValue || '...'}</code>
              {' '}→ {ACTIONS.find(a=>a.key===form.actionType)?.icon} <b>{ACTIONS.find(a=>a.key===form.actionType)?.label}</b>
            </span>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={save} className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">💾 حفظ القاعدة</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}
