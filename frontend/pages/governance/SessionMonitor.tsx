import React, { useState, useEffect } from 'react';

interface Session { id: string; userId: number; userName?: string; ipAddress: string; userAgent: string; createdAt: string; lastActivityAt?: string; isRevoked: boolean; }

export default function SessionMonitor() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const load = async () => {
    try {
      const r = await fetch('/api/trpc/auth.sessions.list');
      const d = await r.json();
      if (d?.result?.data) setSessions(d.result.data);
    } catch {} finally { setLoading(false); }
  };

  const terminate = async (sessionId: string) => {
    try {
      await fetch('/api/trpc/auth.sessions.terminate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { sessionId, reason: 'admin_terminated' } }) });
      await load();
    } catch (e) { console.error(e); }
  };

  const activeSessions = sessions.filter(s => !s.isRevoked);
  const parseUA = (ua: string) => { if (ua.includes('Chrome')) return '🌐 Chrome'; if (ua.includes('Firefox')) return '🦊 Firefox'; if (ua.includes('Safari')) return '🧭 Safari'; if (ua.includes('Mobile')) return '📱 Mobile'; return '💻 Other'; };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">مراقبة الجلسات</h1>
          <p className="text-gray-500 mt-1">جلسات نشطة الآن — تحديث كل 30 ثانية</p></div>
        <div className="flex gap-3 items-center">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">🟢 {activeSessions.length} نشطة</span>
          <button onClick={load} className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">🔄 تحديث</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">⏳ جاري التحميل...</div> : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full">
            <thead><tr className="bg-gray-800 text-white">
              <th className="px-4 py-3 text-right">المستخدم</th>
              <th className="px-4 py-3 text-right">IP</th>
              <th className="px-4 py-3 text-right">المتصفح</th>
              <th className="px-4 py-3 text-right">بدأت</th>
              <th className="px-4 py-3 text-right">آخر نشاط</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-center">إجراء</th>
            </tr></thead>
            <tbody>{sessions.map((s, i) => (
              <tr key={s.id} className={`${i%2===0 ? 'bg-white' : 'bg-gray-50'} ${s.isRevoked ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2 font-medium">{s.userName || `User #${s.userId}`}</td>
                <td className="px-4 py-2 font-mono text-sm">{s.ipAddress}</td>
                <td className="px-4 py-2 text-sm">{parseUA(s.userAgent)}</td>
                <td className="px-4 py-2 text-sm">{new Date(s.createdAt).toLocaleString('ar-SA')}</td>
                <td className="px-4 py-2 text-sm">{s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleString('ar-SA') : '—'}</td>
                <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${s.isRevoked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{s.isRevoked ? '🔴 مُلغاة' : '🟢 نشطة'}</span></td>
                <td className="px-4 py-2 text-center">{!s.isRevoked && <button onClick={() => terminate(s.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100">إنهاء</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
