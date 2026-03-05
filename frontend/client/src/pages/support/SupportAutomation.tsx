import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({ queryKey: ['support', 'automation', 'list'], queryFn: () => api.get('/support/automation').then(r => r.data) });

  const initMut = useMutation({
    mutationFn: (data: any) => api.post('/support/automation/initialize', data).then(r => r.data),
    onSuccess: (r: any) => { toast.success(`تهيئة: ${r.initialized} جديد، ${r.existing} موجود`); queryClient.invalidateQueries({ queryKey: ['support', 'automation', 'list'] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (data: any) => api.post('/support/automation/toggle', data).then(r => r.data),
    onSuccess: (_: any, v: any) => { toast.success(v.isEnabled ? 'تم التفعيل' : 'تم الإيقاف'); queryClient.invalidateQueries({ queryKey: ['support', 'automation', 'list'] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const runNowMut = useMutation({
    mutationFn: (data: any) => api.post('/support/automation/run-now', data).then(r => r.data),
    onSuccess: (r: any) => toast.success(`${r.message} — ${r.affected} سجل`),
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (data: any) => api.put('/support/automation/update', data).then(r => r.data),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); queryClient.invalidateQueries({ queryKey: ['support', 'automation', 'list'] }); },
    onError: (e: any) => toast.error(e.message),
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
