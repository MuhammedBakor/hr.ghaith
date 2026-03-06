import { Clock, Calendar, DollarSign, Target, FileText, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction } from '@/components/dashboard_elements';

export function EmployeeDashboard({ stats, user, roleLabel }: any) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مرحباً، {user?.username} 👋</h1>
                    <p className="text-sm text-gray-500">لوحة تحكم الموظف - معلوماتك الشخصية وطلباتك.</p>
                </div>
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-none px-4 py-1.5">{roleLabel}</Badge>
            </div>

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

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">خدماتي الذاتية</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    <QuickAction icon={Clock} label="تسجيل الحضور" link="/hr/attendance" color="green" />
                    <QuickAction icon={Calendar} label="طلب إجازة" link="/hr/leaves" color="blue" />
                    <QuickAction icon={FileText} label="طلباتي" link="/requests" color="amber" />
                    <QuickAction icon={DollarSign} label="قسيمة الراتب" link="/hr/payroll" color="indigo" />
                    <QuickAction icon={ShieldAlert} label="مخالفاتي" link="/hr/my-violations" color="red" />
                </div>
            </div>
        </div>
    );
}
