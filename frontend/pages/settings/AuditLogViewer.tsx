import React, { useState, useEffect } from 'react';
import api from '../../client/src/lib/api';

interface AuditEntry { id: number; action: string; userId: number; userName?: string; entityType?: string; entityId?: number; details?: string; ipAddress?: string; createdAt: string; }

const ACTION_ICONS: Record<string, string> = { create: '➕', update: '✏️', delete: '🗑️', login: '🔑', logout: '🚪', approve: '✅', reject: '❌', export: '📤', import: '📥' };
const ACTION_COLORS: Record<string, string> = { create: 'bg-green-50 text-green-700', update: 'bg-blue-50 text-blue-700', delete: 'bg-red-50 text-red-700', login: 'bg-purple-50 text-purple-700', approve: 'bg-green-50 text-green-700', reject: 'bg-red-50 text-red-700' };

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0); const pageSize = 50;

  useEffect(() => { load(); }, [page, actionFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), size: pageSize.toString() };
      if (actionFilter) params.action = actionFilter;

      const r = await api.get('/audit/logs', { params });
      const d = r.data;
      if (Array.isArray(d)) setLogs(d);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
    setLoading(false);
  };

  const filtered = logs.filter(l => !search || (l.action + (l.userName || '') + (l.details || '')).includes(search));
  const getActionType = (action: string) => { for (const k of Object.keys(ACTION_ICONS)) if (action.toLowerCase().includes(k)) return k; return 'update'; };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">📋 سجل المراجعة</h1><p className="text-gray-500 mt-1">كل العمليات التي تمت في النظام</p></div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{logs.length} سجل</span>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="🔍 بحث..." className="border rounded-lg px-3 py-2 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border rounded-lg px-3 py-2" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}>
          <option value="">كل العمليات</option>
          <option value="create">إنشاء</option><option value="update">تعديل</option><option value="delete">حذف</option>
          <option value="login">تسجيل دخول</option><option value="approve">موافقة</option>
        </select>
        <input type="date" className="border rounded-lg px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="border rounded-lg px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button onClick={() => load()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">🔄 تحديث</button>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">⏳ جاري التحميل...</div> : (
        <div className="border rounded-xl overflow-hidden">
          <table className="min-w-full">
            <thead><tr className="bg-gray-800 text-white">
              <th className="px-3 py-3 text-right w-16">#</th>
              <th className="px-3 py-3 text-right">العملية</th>
              <th className="px-3 py-3 text-right">المستخدم</th>
              <th className="px-3 py-3 text-right">الكيان</th>
              <th className="px-3 py-3 text-right">التفاصيل</th>
              <th className="px-3 py-3 text-right">الوقت</th>
            </tr></thead>
            <tbody>{filtered.map((l, i) => {
              const at = getActionType(l.action);
              return (
                <tr key={l.id || i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-3 py-2 text-gray-400 text-sm">{l.id}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[at] || 'bg-gray-50'}`}>{ACTION_ICONS[at] || '📝'} {l.action}</span></td>
                  <td className="px-3 py-2 text-sm font-medium">{l.userName || `#${l.userId}`}</td>
                  <td className="px-3 py-2 text-sm">{l.entityType ? `${l.entityType} #${l.entityId}` : '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">{l.details ? (l.details.length > 80 ? l.details.slice(0, 80) + '...' : l.details) : '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(l.createdAt).toLocaleString('ar-SA')}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">← السابق</button>
        <span className="text-sm text-gray-500">صفحة {page + 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={logs.length < pageSize} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">التالي →</button>
      </div>
    </div>
  );
}
