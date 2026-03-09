import { Clock, Calendar, DollarSign, FileText, ShieldAlert, Building2, User, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction } from '@/components/dashboard_elements';

const roleLabelsAr: Record<string, string> = {
    OWNER: 'مالك',
    GENERAL_MANAGER: 'مدير عام',
    DEPARTEMENT_MANAGER: 'مدير قسم',
    SUPERVISOR: 'مشرف',
    EMPLOYEE: 'موظف',
    AGENT: 'مندوب',
};

export function EmployeeDashboard({ stats, user, roleLabel, currentEmployee }: any) {
    const emp = currentEmployee;
    const displayName = emp ? `${emp.firstName} ${emp.lastName}` : (user?.username || '');
    const department = emp?.department?.nameAr || emp?.department?.name || '';
    const position = emp?.position?.title || emp?.position || '';
    const empNumber = emp?.employeeNumber || '';
    const empRole = roleLabelsAr[emp?.user?.role || emp?.role || ''] || roleLabel || 'موظف';
    const managerName = emp?.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '';

    return (
        <div className="space-y-6">
            {/* Employee Welcome Card */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">مرحباً، {displayName} 👋</h1>
                        <p className="text-blue-100 text-sm">لوحة التحكم الخاصة بك — طلباتك وبياناتك في مكان واحد.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>

                {/* Employee Info Bar */}
                <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {empNumber && (
                        <div className="flex items-center gap-1.5 text-blue-100">
                            <Badge className="bg-white/20 text-white border-none text-xs">{empNumber}</Badge>
                        </div>
                    )}
                    {department && (
                        <div className="flex items-center gap-1.5 text-blue-100">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{department}</span>
                        </div>
                    )}
                    {position && (
                        <div className="flex items-center gap-1.5 text-blue-100">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{position}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-blue-100">
                        <User className="w-3.5 h-3.5" />
                        <span>{empRole}</span>
                    </div>
                    {managerName && (
                        <div className="flex items-center gap-1.5 text-blue-100">
                            <span>المدير: {managerName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="رصيد الإجازات"
                    value={stats?.leaveBalance || 0}
                    icon={Calendar} color="blue"
                    sub="يوم متاح"
                />
                <StatCard
                    title="ساعات العمل (الشهر)"
                    value={stats?.workingHours || 0}
                    icon={Clock} color="green"
                />
                <StatCard
                    title="الراتب المتوقع"
                    value={stats?.expectedSalary || 0}
                    icon={DollarSign} color="indigo"
                    sub="قبل الاستقطاعات"
                />
                <StatCard
                    title="المخالفات"
                    value={stats?.totalViolations || 0}
                    icon={ShieldAlert} color="red"
                    alert={stats?.totalViolations > 0}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">خدماتي الذاتية</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <QuickAction icon={Clock} label="تسجيل الحضور" link="/hr/attendance" color="green" />
                    <QuickAction icon={Calendar} label="طلب إجازة" link="/hr/leave-management" color="blue" />
                    <QuickAction icon={FileText} label="طلباتي" link="/requests" color="amber" />
                    <QuickAction icon={ShieldAlert} label="مخالفاتي" link="/hr/my-violations" color="red" />
                    <QuickAction icon={User} label="ملفي الشخصي" link="/profile" color="purple" />
                </div>
            </div>
        </div>
    );
}
