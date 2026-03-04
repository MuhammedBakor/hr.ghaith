import React, { useState, useEffect } from 'react';

/**
 * Permission Change Log — سجل تغييرات الصلاحيات
 * يعرض كل تغيير: من غيّر، ماذا، لمن، متى
 */

interface ChangeEntry {
  id: number; changedBy: number; changedByName?: string;
  changeType: string; targetUserId?: number; targetUserName?: string;
  targetRoleId?: number; targetRoleName?: string;
  details: string; reason?: string; ipAddress?: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  role_assigned: { label: 'تعيين دور', icon: '🟢', color: 'text-green-600' },
  role_revoked: { label: 'سحب دور', icon: '🔴', color: 'text-red-600' },
  permission_granted: { label: 'منح صلاحية', icon: '✅', color: 'text-green-600' },
  permission_revoked: { label: 'سحب صلاحية', icon: '❌', color: 'text-red-600' },
  scope_granted: { label: 'منح نطاق', icon: '🟢', color: 'text-green-600' },
  scope_revoked: { label: 'سحب نطاق', icon: '🔴', color: 'text-red-600' },
  delegation_created: { label: 'تفويض جديد', icon: '📋', color: 'text-blue-600' },
  delegation_revoked: { label: 'إلغاء تفويض', icon: '📋', color: 'text-orange-600' },
  limit_set: { label: 'تعيين حد', icon: '⏱️', color: 'text-purple-600' },
  restriction_added: { label: 'إضافة تقييد', icon: '🔒', color: 'text-red-600' },
  restriction_removed: { label: 'إزالة تقييد', icon: '🔓', color: 'text-green-600' },
  bulk_update: { label: 'تحديث شامل', icon: '📦', color: 'text-blue-600' },
};

export default function PermissionChangeLog() {
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/v1/audit/logs');
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d)) {
          // Filter governance logs if needed, or mapping fields
          setEntries(d.map((l: any) => ({
            ...l,
            changeType: l.eventType,
            changedByName: l.userName,
            details: l.description,
            createdAt: l.createdAt
          })));
        }
      }
    } catch { /* */ }
    setLoading(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ar-SA') + ' ' + date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const filtered = entries.filter(e => typeFilter === 'all' || e.changeType === typeFilter);
  const types = [...new Set(entries.map(e => e.changeType))];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📋 سجل تغييرات الصلاحيات</h1>
          <p className="text-gray-500 mt-1">كل تغيير في الأدوار والصلاحيات مُسجل هنا</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">🔄 تحديث</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-full text-sm ${typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>الكل ({entries.length})</button>
        {types.map(t => {
          const info = TYPE_LABELS[t] || { label: t, icon: '•', color: '' };
          const count = entries.filter(e => e.changeType === t).length;
          return (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-sm ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {info.icon} {info.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {loading ? <div className="text-center py-8 text-gray-400">⏳ جاري التحميل...</div> :
          filtered.length === 0 ? <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">📋</div><p>لا توجد تغييرات مسجلة</p></div> :
            filtered.map(e => {
              const info = TYPE_LABELS[e.changeType] || { label: e.changeType, icon: '•', color: '' };
              return (
                <div key={e.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{info.icon}</span>
                      <div>
                        <span className={`font-bold text-sm ${info.color}`}>{info.label}</span>
                        {e.targetUserName && <span className="text-gray-600 mr-2">← {e.targetUserName}</span>}
                        {e.targetRoleName && <span className="text-blue-600 mr-2">[{e.targetRoleName}]</span>}
                        <div className="text-xs text-gray-500 mt-1">{e.details}</div>
                        {e.reason && <div className="text-xs text-gray-400 mt-0.5">السبب: {e.reason}</div>}
                      </div>
                    </div>
                    <div className="text-left text-xs text-gray-400">
                      <div>{formatDate(e.createdAt)}</div>
                      <div>بواسطة: {e.changedByName || `#${e.changedBy}`}</div>
                      {e.ipAddress && <div className="font-mono">{e.ipAddress}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
