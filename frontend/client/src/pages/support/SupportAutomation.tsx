import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  HeadphonesIcon, Ticket, MessageCircle, Users, BarChart3, Shield,
} from 'lucide-react';

const CATEGORY_META: CategoryMeta = {
  tickets:       { icon: <Ticket className="w-4 h-4" />,          label: 'إدارة التذاكر',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  communication: { icon: <MessageCircle className="w-4 h-4" />,    label: 'التواصل مع العميل', color: 'bg-green-50 text-green-700 border-green-200' },
  performance:   { icon: <Users className="w-4 h-4" />,            label: 'أداء الفريق',       color: 'bg-purple-50 text-purple-700 border-purple-200' },
  reports:       { icon: <BarChart3 className="w-4 h-4" />,        label: 'التقارير',          color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  quality:       { icon: <Shield className="w-4 h-4" />,           label: 'الجودة والامتثال',  color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function SupportAutomation() {
  const utils = trpc.useContext();

  const { data: services, isLoading } = trpc.supportRouters.supportAutomation.list.useQuery();

  const initMut   = trpc.supportRouters.supportAutomation.initialize.useMutation({
    onSuccess: r => { toast.success(`تهيئة: ${r.initialized} جديد، ${r.existing} موجود`); utils.supportRouters.supportAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });
  const toggleMut = trpc.supportRouters.supportAutomation.toggle.useMutation({
    onSuccess: (_, v) => { toast.success(v.isEnabled ? 'تم التفعيل' : 'تم الإيقاف'); utils.supportRouters.supportAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });
  const runNowMut = trpc.supportRouters.supportAutomation.runNow.useMutation({
    onSuccess: r => toast.success(`✅ ${r.message} — ${r.affected} سجل`),
    onError:   e => toast.error(e.message),
  });
  const updateMut = trpc.supportRouters.supportAutomation.update.useMutation({
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); utils.supportRouters.supportAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });

  return (
    <AutomationDashboard
      title="أتمتة الدعم الفني"
      description="20 خدمة آلية لإدارة التذاكر وSLA وأداء الفريق ورضا العملاء"
      icon={<HeadphonesIcon className="w-6 h-6 text-teal-700" />}
      accentColor="bg-teal-100"
      services={services as any}
      isLoading={isLoading}
      catMeta={CATEGORY_META}
      onInitialize={() => initMut.mutate({})}
      onToggle={(key, val) => toggleMut.mutate({ serviceKey: key, isEnabled: val })}
      onRunNow={key => runNowMut.mutate({ serviceKey: key })}
      onUpdate={(key, data) => updateMut.mutate({ serviceKey: key, ...data as any })}
    />
  );
}
