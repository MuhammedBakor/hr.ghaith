import React, { useState, useEffect, useCallback } from 'react';

const MODULES = [
  { key: 'hr', label: 'الموارد البشرية', icon: '👥', resources: ['employees', 'attendance', 'leaves', 'payroll'] },
  { key: 'finance', label: 'المالية', icon: '💰', resources: ['invoices', 'budget', 'reports', 'vouchers'] },
  { key: 'fleet', label: 'الأسطول', icon: '🚗', resources: ['vehicles', 'maintenance', 'trips'] },
  { key: 'store', label: 'المخزون', icon: '📦', resources: ['products', 'orders', 'inventory'] },
  { key: 'crm', label: 'العملاء', icon: '🤝', resources: ['customers', 'campaigns'] },
  { key: 'projects', label: 'المشاريع', icon: '📊', resources: ['view', 'create', 'manage', 'tasks'] },
  { key: 'legal', label: 'القانونية', icon: '⚖️', resources: ['contracts', 'cases'] },
  { key: 'comms', label: 'المراسلات', icon: '📨', resources: ['correspondence'] },
  { key: 'documents', label: 'المستندات', icon: '📄', resources: ['view', 'create', 'approve'] },
  { key: 'governance', label: 'الحوكمة', icon: '🛡️', resources: ['policies', 'risks', 'audits'] },
  { key: 'bi', label: 'BI', icon: '📈', resources: ['dashboards', 'reports'] },
  { key: 'support', label: 'الدعم', icon: '🎧', resources: ['tickets'] },
  { key: 'workflow', label: 'سير العمل', icon: '🔄', resources: ['templates', 'instances'] },
  { key: 'requests', label: 'الطلبات', icon: '📋', resources: ['view', 'create', 'approve'] },
  { key: 'settings', label: 'الإعدادات', icon: '⚙️', resources: ['manage'] },
  { key: 'admin', label: 'الإدارة', icon: '👑', resources: ['users', 'system', 'backups'] },
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'manage'];
const ACTION_AR: Record<string, string> = { view: 'عرض', create: 'إنشاء', edit: 'تعديل', delete: 'حذف', approve: 'موافقة', manage: 'إدارة' };

const ROLES = [
  { key: 'admin', label: 'مدير النظام', color: '#C0392B' },
  { key: 'general_manager', label: 'المدير العام', color: '#8E44AD' },
  { key: 'hr_manager', label: 'مدير HR', color: '#2980B9' },
  { key: 'finance_manager', label: 'المدير المالي', color: '#27AE60' },
  { key: 'fleet_manager', label: 'مدير الأسطول', color: '#D35400' },
  { key: 'store_manager', label: 'مدير المخازن', color: '#16A085' },
  { key: 'project_manager', label: 'مدير المشاريع', color: '#2C3E50' },
  { key: 'department_manager', label: 'مدير القسم', color: '#7F8C8D' },
  { key: 'accountant', label: 'محاسب', color: '#1ABC9C' },
  { key: 'supervisor', label: 'مشرف', color: '#3498DB' },
  { key: 'employee', label: 'موظف', color: '#95A5A6' },
];

type Perms = Record<string, Record<string, boolean>>;

export default function PermissionMatrix() {
  const [perms, setPerms] = useState<Perms>({});
  const [module, setModule] = useState('hr');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    try {
      const r = await fetch('/api/trpc/admin.permissions.list');
      const data = await r.json();
      if (data?.result?.data) setPerms(data.result.data);
    } catch { /* use empty state */ }
  };

  const toggle = useCallback((role: string, perm: string) => {
    if (role === 'admin') return;
    setPerms(p => ({ ...p, [role]: { ...p[role], [perm]: !p[role]?.[perm] } }));
    setDirty(true);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/trpc/admin.permissions.updateMatrix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { permissions: perms } }),
      });
      setDirty(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const mod = MODULES.find(m => m.key === module);
  const filtered = MODULES.filter(m => !search || m.label.includes(search) || m.key.includes(search));

  return (
    <div className="p-6 max-w-full" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مصفوفة الصلاحيات</h1>
          <p className="text-gray-500 mt-1">اضغط ✅/❌ لتبديل الصلاحية — ثم احفظ</p>
        </div>
        {dirty && <button onClick={save} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">{saving ? '⏳' : '💾'} حفظ</button>}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {filtered.map(m => (
          <button key={m.key} onClick={() => setModule(m.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${module === m.key ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full">
          <thead><tr className="bg-gray-800 text-white">
            <th className="px-4 py-3 text-right min-w-[160px]">الدور</th>
            {ACTIONS.map(a => <th key={a} className="px-3 py-3 text-center min-w-[70px]">{ACTION_AR[a]}</th>)}
          </tr></thead>
          <tbody>{ROLES.map((role, i) => (
            <tr key={role.key} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
              <td className="px-4 py-2.5 font-medium">
                <span className="w-3 h-3 rounded-full inline-block ml-2" style={{ backgroundColor: role.color }} />{role.label}
              </td>
              {ACTIONS.map(action => {
                const pk = `${module}.${action}`;
                const on = role.key === 'admin' || perms[role.key]?.[pk];
                return <td key={action} className="px-3 py-2 text-center">
                  <button onClick={() => toggle(role.key, pk)} disabled={role.key === 'admin'}
                    className={`w-8 h-8 rounded-lg text-base transition-transform ${on ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'} ${role.key === 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}>
                    {on ? '✅' : '❌'}
                  </button>
                </td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-6 text-xs text-gray-400">
        <span>✅ مسموح</span><span>❌ محظور</span><span>🔒 admin = كل الصلاحيات</span>
        <span className="mr-auto">{ROLES.length} أدوار × {MODULES.length} وحدة × {ACTIONS.length} إجراء = {ROLES.length * MODULES.length * ACTIONS.length} خلية</span>
      </div>
    </div>
  );
}
