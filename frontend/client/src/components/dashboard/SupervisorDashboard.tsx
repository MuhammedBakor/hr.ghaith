import { Users, Clock, MapPin, CheckSquare, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction, PendingActionRow } from '@/components/dashboard_elements';

export function SupervisorDashboard({ stats, pendingActions, user, roleLabel }: any) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">أهلاً بك، {user?.username} 👋</h1>
                    <p className="text-sm text-gray-500">لوحة تحكم المشرف - متابعة الفريق والعمليات الميدانية.</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-4 py-1.5">{roleLabel}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="الموظفون المتاحون"
                    value={stats?.teamPresent || 0}
                    icon={Users} color="blue"
                    sub={`من أصل ${stats?.teamTotal || 0} موظف`}
                />
                <StatCard
                    title="حضور اليوم"
                    value={stats?.attendanceRate + '%' || '0%'}
                    icon={Clock} color="green"
                />
                <StatCard
                    title="مهام ميدانية نشطة"
                    value={stats?.activeFieldTasks || 0}
                    icon={MapPin} color="purple"
                />
                <StatCard
                    title="طلبات معلقة"
                    value={pendingActions?.total || 0}
                    icon={AlertTriangle} color="amber"
                    alert={pendingActions?.total > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">طلبات الفريق</h2>
                    <div className="space-y-1">
                        {pendingActions?.items?.map((item: any, i: number) => (
                            <PendingActionRow key={i} item={item} />
                        ))}
                        {(!pendingActions?.items || pendingActions.items.length === 0) && (
                            <div className="py-10 text-center text-gray-400">لا توجد طلبات فريق معلقة</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">أدوات الإشراف</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <QuickAction icon={Clock} label="سجل الحضور" link="/hr/attendance" color="green" />
                        <QuickAction icon={MapPin} label="التتبع الميداني" link="/hr/field-tracking" color="purple" />
                        <QuickAction icon={Calendar} label="الجدول الزمني" link="/hr/shifts" color="blue" />
                        <QuickAction icon={CheckSquare} label="المصادقات" link="/requests" color="amber" />
                    </div>
                </div>
            </div>
        </div>
    );
}
