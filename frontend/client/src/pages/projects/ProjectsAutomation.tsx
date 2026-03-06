import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import AutomationDashboard, { CategoryMeta } from '@/components/automation/AutomationDashboard';
import {
  FolderOpen, Monitor, CheckSquare, DollarSign, FileText, Users, Shield,
} from 'lucide-react';

const CATEGORY_META: CategoryMeta = {
  monitoring: { icon: <Monitor className="w-4 h-4" />,     label: 'المراقبة والتتبع',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  tasks:      { icon: <CheckSquare className="w-4 h-4" />, label: 'المهام والأنشطة',     color: 'bg-green-50 text-green-700 border-green-200' },
  budget:     { icon: <DollarSign className="w-4 h-4" />,  label: 'الميزانية والتكاليف', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  reports:    { icon: <FileText className="w-4 h-4" />,    label: 'التقارير والملخصات',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  team:       { icon: <Users className="w-4 h-4" />,       label: 'إدارة الفريق',        color: 'bg-pink-50 text-pink-700 border-pink-200' },
  quality:    { icon: <Shield className="w-4 h-4" />,      label: 'الجودة والمخاطر',     color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ProjectsAutomation() {
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['operations-automation'],
    queryFn: () => api.get('/operations/automation').then(r => r.data),
  });

  const initMut = useMutation({
    mutationFn: (data: any) => api.post('/operations/automation/initialize', data).then(r => r.data),
    onSuccess: (r: any) => { toast.success(`تهيئة: ${r.initialized} جديد، ${r.existing} موجود`); queryClient.invalidateQueries({ queryKey: ['operations-automation'] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (data: any) => api.post('/operations/automation/toggle', data).then(r => r.data),
    onSuccess: (_: any, vars: any) => { toast.success(vars.isEnabled ? 'تم التفعيل' : 'تم الإيقاف'); queryClient.invalidateQueries({ queryKey: ['operations-automation'] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const runNowMut = useMutation({
    mutationFn: (data: any) => api.post('/operations/automation/run', data).then(r => r.data),
    onSuccess: (r: any) => toast.success(`${r.message} — ${r.affected} سجل`),
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (data: any) => api.put('/operations/automation', data).then(r => r.data),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); queryClient.invalidateQueries({ queryKey: ['operations-automation'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AutomationDashboard
      title="أتمتة المشاريع"
      description="24 خدمة آلية لمراقبة المشاريع والمهام والميزانية وأداء الفريق"
      icon={<FolderOpen className="w-6 h-6 text-blue-700" />}
      accentColor="bg-blue-100"
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
