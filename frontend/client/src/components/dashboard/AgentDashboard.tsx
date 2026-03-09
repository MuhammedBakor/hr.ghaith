import { Truck, MapPin, Fuel, Wrench, MessageSquare, ListTodo, Navigation, Calendar, Building2, Briefcase, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction } from '@/components/dashboard_elements';

const roleLabelsAr: Record<string, string> = {
    OWNER: 'مالك', GENERAL_MANAGER: 'مدير عام', DEPARTEMENT_MANAGER: 'مدير قسم',
    SUPERVISOR: 'مشرف', EMPLOYEE: 'موظف', AGENT: 'مندوب',
};

export function AgentDashboard({ stats, user, roleLabel, currentEmployee }: any) {
    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'صباح الخير';
        if (h < 17) return 'مساء الخير';
        return 'مساء النور';
    };

    const emp = currentEmployee;
    const displayName = emp ? `${emp.firstName} ${emp.lastName}` : (user?.username || 'المندوب');
    const department = emp?.department?.nameAr || emp?.department?.name || '';
    const position = emp?.position?.title || emp?.position || '';
    const empNumber = emp?.employeeNumber || '';
    const empRole = roleLabelsAr[emp?.user?.role || emp?.role || ''] || roleLabel || 'مندوب';
    const managerName = emp?.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '';

    return (
        <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">{greetingTime()}، {displayName} 👋</h1>
                        <p className="text-orange-100 text-sm">لوحة تحكم المناديب - المهام الميدانية والأسطول.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                            <Truck className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {empNumber && (
                        <div className="flex items-center gap-1.5 text-orange-100">
                            <Badge className="bg-white/20 text-white border-none text-xs">{empNumber}</Badge>
                        </div>
                    )}
                    {department && (
                        <div className="flex items-center gap-1.5 text-orange-100">
                            <Building2 className="w-3.5 h-3.5" /><span>{department}</span>
                        </div>
                    )}
                    {position && (
                        <div className="flex items-center gap-1.5 text-orange-100">
                            <Briefcase className="w-3.5 h-3.5" /><span>{position}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-orange-100">
                        <User className="w-3.5 h-3.5" /><span>{empRole}</span>
                    </div>
                    {managerName && (
                        <div className="flex items-center gap-1.5 text-orange-100">
                            <span>المدير: {managerName}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="المهام الموكلة" value={stats?.assignedTasks || 0} icon={ListTodo} color="orange" sub="مهام اليوم" />
                <StatCard title="حالة المركبة" value={stats?.vehicleStatus || 'جاهزة'} icon={Truck} color="blue" />
                <StatCard title="استهلاك الوقود (الأسبوع)" value={stats?.fuelConsumption || 0} icon={Fuel} color="green" sub="لتر" />
                <StatCard title="بلاغات الدعم" value={stats?.activeTickets || 0} icon={MessageSquare} color="amber" alert={stats?.activeTickets > 0} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">أدوات العمل الميداني</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <QuickAction icon={MapPin} label="تتبع الموقع" link="/fleet/map" color="blue" />
                    <QuickAction icon={Navigation} label="رحلات اليوم" link="/fleet/trips" color="indigo" />
                    <QuickAction icon={Fuel} label="تسجيل وقود" link="/fleet/fuel" color="green" />
                    <QuickAction icon={Wrench} label="طلب صيانة" link="/fleet/maintenance" color="red" />
                    <QuickAction icon={MessageSquare} label="الدعم الفني" link="/support/tickets" color="amber" />
                    <QuickAction icon={Calendar} label="الطلبات" link="/requests" color="gray" />
                    <QuickAction icon={User} label="ملفي الشخصي" link="/profile" color="purple" />
                </div>
            </div>
        </div>
    );
}
