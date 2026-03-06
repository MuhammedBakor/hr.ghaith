import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const queryClient = useQueryClient();
  const { data: services = [], isLoading, refetch } = useQuery({ queryKey: ['finance-automation-services'], queryFn: () => api.get('/finance/automation/services').then(r => r.data) });
  const { data: logs    = [] }                      = useQuery({ queryKey: ['finance-automation-logs'], queryFn: () => api.get('/finance/automation/logs', { params: { limit: 200 } }).then(r => r.data) });
  const { data: stats }                             = useQuery({ queryKey: ['finance-automation-stats'], queryFn: () => api.get('/finance/automation/stats').then(r => r.data) });

  const invalidateAll = () => { queryClient.invalidateQueries({ queryKey: ['finance-automation-services'] }); queryClient.invalidateQueries({ queryKey: ['finance-automation-logs'] }); queryClient.invalidateQueries({ queryKey: ['finance-automation-stats'] }); };
  const toggleMut = useMutation({ mutationFn: (data: any) => api.post('/finance/automation/toggle', data).then(r => r.data), onSuccess: () => { invalidateAll(); } });
  const runNowMut = useMutation({ mutationFn: (data: any) => api.post('/finance/automation/run', data).then(r => r.data), onSuccess: () => { invalidateAll(); } });
  const updateMut = useMutation({ mutationFn: (data: any) => api.put('/finance/automation/update', data).then(r => r.data), onSuccess: () => { invalidateAll(); } });
  const initMut   = useMutation({ mutationFn: () => api.post('/finance/automation/initialize').then(r => r.data), onSuccess: () => { invalidateAll(); } });

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
