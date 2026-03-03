import { trpc } from '@/lib/trpc';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  FileText, DollarSign, Wrench, Building2, Shield, BarChart3,
} from 'lucide-react';

const CATEGORY_META: Record<string, CategoryMeta> = {
  leases:      { icon: <FileText   className="w-4 h-4"/>, label: 'عقود الإيجار',        color: 'bg-blue-50 text-blue-700 border-blue-200'    },
  finance:     { icon: <DollarSign className="w-4 h-4"/>, label: 'المالية والإيجار',    color: 'bg-green-50 text-green-700 border-green-200'  },
  maintenance: { icon: <Wrench     className="w-4 h-4"/>, label: 'الصيانة',             color: 'bg-orange-50 text-orange-700 border-orange-200' },
  units:       { icon: <Building2  className="w-4 h-4"/>, label: 'الوحدات والعقارات',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  compliance:  { icon: <Shield     className="w-4 h-4"/>, label: 'الامتثال والضرائب',   color: 'bg-red-50 text-red-700 border-red-200'        },
  reports:     { icon: <BarChart3  className="w-4 h-4"/>, label: 'التقارير',            color: 'bg-gray-50 text-gray-700 border-gray-200'     },
};

export default function PropertyAutomation() {
  const { data: services = [], isLoading, refetch } = trpc.propertyAutomation.list.useQuery();
  const { data: logs    = [] }                      = trpc.propertyAutomation.logs.useQuery({ limit: 200 });
  const { data: stats }                             = trpc.propertyAutomation.stats.useQuery();

  const toggleMut = trpc.propertyAutomation.toggle.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const runNowMut = trpc.propertyAutomation.runNow.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const updateMut = trpc.propertyAutomation.update.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const initMut   = trpc.propertyAutomation.initialize.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });

  return (
    <AutomationDashboard
      moduleName="العقارات"
      services={services}
      logs={logs}
      stats={stats}
      categoryMeta={CATEGORY_META}
      isLoading={isLoading}
      onToggle={async (k, v) => { await toggleMut.mutateAsync({ serviceKey: k, enabled: v }); }}
      onRunNow={async k     => { await runNowMut.mutateAsync({ serviceKey: k }); }}
      onUpdate={async (k, d) => { await updateMut.mutateAsync({ serviceKey: k, ...d } as any); }}
      onInitialize={async () => { await initMut.mutateAsync(); }}
      refetch={refetch}
    />
  );
}
