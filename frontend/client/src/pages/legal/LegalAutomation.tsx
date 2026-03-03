import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  Scale, FileText, Briefcase, Shield, BarChart3, CreditCard,
} from 'lucide-react';

const CATEGORY_META: CategoryMeta = {
  contracts:  { icon: <FileText className="w-4 h-4" />,   label: 'العقود والوثائق',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  cases:      { icon: <Briefcase className="w-4 h-4" />,  label: 'القضايا والنزاعات', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  compliance: { icon: <Shield className="w-4 h-4" />,     label: 'الامتثال والمخاطر', color: 'bg-red-50 text-red-700 border-red-200' },
  reports:    { icon: <BarChart3 className="w-4 h-4" />,  label: 'التقارير القانونية', color: 'bg-green-50 text-green-700 border-green-200' },
  payments:   { icon: <CreditCard className="w-4 h-4" />, label: 'المدفوعات القانونية', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export default function LegalAutomation() {
  const utils = trpc.useContext();

  const { data: services, isLoading } = trpc.legalRouters.legalAutomation.list.useQuery();

  const initMut   = trpc.legalRouters.legalAutomation.initialize.useMutation({
    onSuccess: r => { toast.success(`تهيئة: ${r.initialized} جديد، ${r.existing} موجود`); utils.legalRouters.legalAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });
  const toggleMut = trpc.legalRouters.legalAutomation.toggle.useMutation({
    onSuccess: (_, v) => { toast.success(v.isEnabled ? 'تم التفعيل' : 'تم الإيقاف'); utils.legalRouters.legalAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });
  const runNowMut = trpc.legalRouters.legalAutomation.runNow.useMutation({
    onSuccess: r => toast.success(`✅ ${r.message} — ${r.affected} سجل`),
    onError:   e => toast.error(e.message),
  });
  const updateMut = trpc.legalRouters.legalAutomation.update.useMutation({
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); utils.legalRouters.legalAutomation.list.invalidate(); },
    onError:   e => toast.error(e.message),
  });

  return (
    <AutomationDashboard
      title="أتمتة الشؤون القانونية"
      description="18 خدمة آلية لإدارة العقود والقضايا والامتثال والتقارير القانونية"
      icon={<Scale className="w-6 h-6 text-indigo-700" />}
      accentColor="bg-indigo-100"
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
