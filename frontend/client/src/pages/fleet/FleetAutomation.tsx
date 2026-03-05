import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  Wrench, Shield, Users, AlertOctagon, BarChart3, DollarSign,
} from 'lucide-react';

const CATEGORY_META: Record<string, CategoryMeta> = {
  maintenance: { icon: <Wrench   className="w-4 h-4"/>, label: 'الصيانة',             color: 'bg-orange-50 text-orange-700 border-orange-200' },
  insurance:   { icon: <Shield   className="w-4 h-4"/>, label: 'التأمين والتسجيل',     color: 'bg-blue-50 text-blue-700 border-blue-200'     },
  drivers:     { icon: <Users    className="w-4 h-4"/>, label: 'السائقون',             color: 'bg-purple-50 text-purple-700 border-purple-200' },
  incidents:   { icon: <AlertOctagon className="w-4 h-4"/>, label: 'الحوادث والمخالفات', color: 'bg-red-50 text-red-700 border-red-200'       },
  operations:  { icon: <BarChart3 className="w-4 h-4"/>, label: 'التشغيل والعمليات',   color: 'bg-green-50 text-green-700 border-green-200'   },
  costs:       { icon: <DollarSign className="w-4 h-4"/>, label: 'التكاليف والميزانية', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export default function FleetAutomation() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['fleet-automation'],
    queryFn: () => api.get('/api/fleet-automation').then(r => r.data),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['fleet-automation', 'logs'],
    queryFn: () => api.get('/api/fleet-automation/logs', { params: { limit: 200 } }).then(r => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['fleet-automation', 'stats'],
    queryFn: () => api.get('/api/fleet-automation/stats').then(r => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet-automation/toggle', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-automation'] }); },
  });
  const runNowMut = useMutation({
    mutationFn: (data: any) => api.post('/api/fleet-automation/run-now', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-automation'] }); },
  });
  const updateMut = useMutation({
    mutationFn: (data: any) => api.put('/api/fleet-automation', data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-automation'] }); },
  });
  const initMut = useMutation({
    mutationFn: () => api.post('/api/fleet-automation/initialize').then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-automation'] }); },
  });

  return (
    <AutomationDashboard
      moduleName="الأسطول"
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
