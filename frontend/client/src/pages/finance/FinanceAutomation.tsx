import { trpc } from '@/lib/trpc';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  FileText, BarChart3, CreditCard, Receipt, BookOpen,
} from 'lucide-react';

const CATEGORY_META: Record<string, CategoryMeta> = {
  invoices:   { icon: <FileText    className="w-4 h-4"/>, label: 'الفواتير والمستحقات',  color: 'bg-blue-50 text-blue-700 border-blue-200'    },
  reports:    { icon: <BarChart3   className="w-4 h-4"/>, label: 'الميزانية والتقارير',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  payments:   { icon: <CreditCard  className="w-4 h-4"/>, label: 'المدفوعات والتحصيل',  color: 'bg-green-50 text-green-700 border-green-200'  },
  tax:        { icon: <Receipt     className="w-4 h-4"/>, label: 'الضرائب والامتثال',   color: 'bg-red-50 text-red-700 border-red-200'        },
  accounting: { icon: <BookOpen    className="w-4 h-4"/>, label: 'الحسابات والتسوية',   color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export default function FinanceAutomation() {
  const { data: services = [], isLoading, refetch } = trpc.financeAutomation.list.useQuery();
  const { data: logs    = [] }                      = trpc.financeAutomation.logs.useQuery({ limit: 200 });
  const { data: stats }                             = trpc.financeAutomation.stats.useQuery();

  const toggleMut = trpc.financeAutomation.toggle.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const runNowMut = trpc.financeAutomation.runNow.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const updateMut = trpc.financeAutomation.update.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });
  const initMut   = trpc.financeAutomation.initialize.useMutation({ onSuccess: () => { utils.invalidateQueries(); } });

  return (
    <AutomationDashboard
      moduleName="المالية"
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
