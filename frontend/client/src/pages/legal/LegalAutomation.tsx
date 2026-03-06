import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['legal-automation-services'],
    queryFn: () => api.get('/legal/automation/services').then(r => r.data),
  });

  const initMut = useMutation({
    mutationFn: (data: any) => api.post('/legal/automation/services/initialize', data).then(r => r.data),
    onSuccess: (r: any) => { toast.success(`تهيئة: ${r.initialized} جديد، ${r.existing} موجود`); queryClient.invalidateQueries({ queryKey: ['legal-automation-services'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (data: any) => api.post('/legal/automation/services/toggle', data).then(r => r.data),
    onSuccess: (_: any, v: any) => { toast.success(v.isEnabled ? 'تم التفعيل' : 'تم الإيقاف'); queryClient.invalidateQueries({ queryKey: ['legal-automation-services'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const runNowMut = useMutation({
    mutationFn: (data: any) => api.post('/legal/automation/services/run-now', data).then(r => r.data),
    onSuccess: (r: any) => toast.success(`${r.message} — ${r.affected} سجل`),
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ serviceKey, ...data }: any) => api.put(`/legal/automation/services/${serviceKey}`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); queryClient.invalidateQueries({ queryKey: ['legal-automation-services'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.message),
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
