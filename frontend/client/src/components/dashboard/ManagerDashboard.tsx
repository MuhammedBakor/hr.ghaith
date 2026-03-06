import { Users, FileText, CheckCircle2, TrendingUp, AlertCircle, BarChart3, Clock, DollarSign, Target, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard, QuickAction, PendingActionRow, ModuleHealthBadge } from '@/components/dashboard_elements';

export function ManagerDashboard({ stats, pendingActions, kpis, moduleIssues, user, roleLabel }: any) {
    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'صباح الخير';
        if (h < 17) return 'مساء الخير';
        return 'مساء النور';
    };

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {greetingTime()}، {user?.username?.split(' ')[0] ?? 'المدير'} 👋
                    </h1>
                    <p className="text-sm text-gray-500">
                        نظرة عامة على أداء القسم والمهام المعلقة اليوم.
                    </p>
                </div>
                <Badge variant="outline" className="text-sm py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                    {roleLabel}
                </Badge>
            </div>

            {/* ─── Department Overview Stats ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="موظفي القسم"
                    value={stats?.employees || 0}
                    icon={Users} color="blue"
                    sub="إجمالي الموظفين في قسمك"
                />
                <StatCard
                    title="طلبات معلقة"
                    value={pendingActions?.total || 0}
                    icon={FileText} color="amber"
                    alert={(pendingActions?.total || 0) > 5}
                    sub="طلبات تحتاج مراجعتك"
                />
                <StatCard
                    title="معدل الإنجاز"
                    value={kpis?.completionRate || 0}
                    icon={CheckCircle2} color="green"
                    trend={kpis?.completionTrend}
                />
                <StatCard
                    title="تنبيهات حرجة"
                    value={moduleIssues?.length || 0}
                    icon={AlertCircle} color="red"
                    alert={moduleIssues?.length > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">إجراءات مطلوبة من المدير</h2>
                        {pendingActions?.total > 0 && <Badge className="bg-red-500">{pendingActions.total}</Badge>}
                    </div>
                    <div className="space-y-1">
                        {pendingActions?.items?.map((item: any, i: number) => (
                            <PendingActionRow key={i} item={item} />
                        ))}
                        {(!pendingActions?.items || pendingActions.items.length === 0) && (
                            <div className="py-10 text-center text-gray-400">لا توجد طلبات معلقة حالياً</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">اختصارات إدارية</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction icon={Users} label="الموظفون" link="/hr/employees" color="blue" />
                        <QuickAction icon={FileText} label="الطلبات" link="/requests" color="amber" />
                        <QuickAction icon={BarChart3} label="التقارير" link="/bi" color="green" />
                        <QuickAction icon={Target} label="الأداء" link="/hr/performance" color="purple" />
                    </div>
                </div>
            </div>
        </div>
    );
}
