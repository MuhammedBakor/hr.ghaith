import { Truck, MapPin, Fuel, Wrench, MessageSquare, ListTodo, Navigation, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard, QuickAction } from '@/components/dashboard_elements';

export function AgentDashboard({ stats, user, roleLabel }: any) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">أهلاً بك، {user?.username} 👋</h1>
                    <p className="text-sm text-gray-500">لوحة تحكم المناديب - المهام الميدانية والأسطول.</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-4 py-1.5">{roleLabel}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="المهام الموكلة"
                    value={stats?.assignedTasks || 0}
                    icon={ListTodo} color="orange"
                    sub="مهام اليوم"
                />
                <StatCard
                    title="حالة المركبة"
                    value={stats?.vehicleStatus || 'جاهزة'}
                    icon={Truck} color="blue"
                />
                <StatCard
                    title="استهلاك الوقود (الأسبوع)"
                    value={stats?.fuelConsumption || 0}
                    icon={Fuel} color="green"
                    sub="لتر"
                />
                <StatCard
                    title="بلاغات الدعم"
                    value={stats?.activeTickets || 0}
                    icon={MessageSquare} color="amber"
                    alert={stats?.activeTickets > 0}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">أدوات العمل الميداني</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QuickAction icon={MapPin} label="تتبع الموقع" link="/fleet/map" color="blue" />
                    <QuickAction icon={Navigation} label="رحلات اليوم" link="/fleet/trips" color="indigo" />
                    <QuickAction icon={Fuel} label="تسجيل وقود" link="/fleet/fuel" color="green" />
                    <QuickAction icon={Wrench} label="طلب صيانة" link="/fleet/maintenance" color="red" />
                    <QuickAction icon={MessageSquare} label="الدعم الفني" link="/support/tickets" color="amber" />
                    <QuickAction icon={Calendar} label="الطلبات" link="/requests" color="gray" />
                </div>
            </div>
        </div>
    );
}
