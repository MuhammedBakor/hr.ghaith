import { Users, Clock, MapPin, CheckSquare, AlertTriangle, Calendar, Building2, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction, PendingActionRow } from '@/components/dashboard_elements';

const roleLabelsAr: Record<string, string> = {
    OWNER: 'مالك', GENERAL_MANAGER: 'مدير عام', DEPARTEMENT_MANAGER: 'مدير قسم',
    SUPERVISOR: 'مشرف', EMPLOYEE: 'موظف', AGENT: 'مندوب',
};

export function SupervisorDashboard({ stats, pendingActions, user, roleLabel, currentEmployee }: any) {
    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'صباح الخير';
        if (h < 17) return 'مساء الخير';
        return 'مساء النور';
    };

    const emp = currentEmployee;
    const displayName = emp ? `${emp.firstName} ${emp.lastName}` : (user?.username || 'المشرف');
    const department = emp?.department?.nameAr || emp?.department?.name || '';
    const position = emp?.position?.title || emp?.position || '';
    const empNumber = emp?.employeeNumber || '';
    const empRole = roleLabelsAr[emp?.user?.role || emp?.role || ''] || roleLabel || 'مشرف';
    const managerName = emp?.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '';

    return (
        <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-l from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">{greetingTime()}، {displayName} 👋</h1>
                        <p className="text-cyan-100 text-sm">لوحة تحكم المشرف - متابعة الفريق والعمليات الميدانية.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {empNumber && (
                        <div className="flex items-center gap-1.5 text-cyan-100">
                            <Badge className="bg-white/20 text-white border-none text-xs">{empNumber}</Badge>
                        </div>
                    )}
                    {department && (
                        <div className="flex items-center gap-1.5 text-cyan-100">
                            <Building2 className="w-3.5 h-3.5" /><span>{department}</span>
                        </div>
                    )}
                    {position && (
                        <div className="flex items-center gap-1.5 text-cyan-100">
                            <Briefcase className="w-3.5 h-3.5" /><span>{position}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-cyan-100">
                        <User className="w-3.5 h-3.5" /><span>{empRole}</span>
                    </div>
                    {managerName && (
                        <div className="flex items-center gap-1.5 text-cyan-100">
                            <span>المدير: {managerName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="الموظفون المتاحون" value={stats?.teamPresent || 0} icon={Users} color="blue" sub={`من أصل ${stats?.teamTotal || 0} موظف`} />
                <StatCard title="حضور اليوم" value={stats?.attendanceRate + '%' || '0%'} icon={Clock} color="green" />
                <StatCard title="مهام ميدانية نشطة" value={stats?.activeFieldTasks || 0} icon={MapPin} color="purple" />
                <StatCard title="طلبات معلقة" value={pendingActions?.total || 0} icon={AlertTriangle} color="amber" alert={pendingActions?.total > 0} />
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
                        <QuickAction icon={Calendar} label="الإجازات" link="/hr/leave-management" color="blue" />
                        <QuickAction icon={CheckSquare} label="الطلبات" link="/requests" color="amber" />
                        <QuickAction icon={User} label="ملفي الشخصي" link="/profile" color="purple" />
                    </div>
                </div>
            </div>
        </div>
    );
}
