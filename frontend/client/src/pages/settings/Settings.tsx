import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Settings as SettingsIcon, Building2, Users, Bell, Shield, Database, Hash, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { useAppContext, UserRoleType } from '@/contexts/AppContext';

// Define which roles can see which settings cards
// 'all' means visible to anyone who can access the settings module
type SettingsAccess = 'system_owner' | 'all';

interface SettingsCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  count: number | null;
  access: SettingsAccess;
}

// Roles that can see ALL settings (system-level)
const SYSTEM_OWNER_ROLES: UserRoleType[] = ['admin', 'general_manager'];

export default function Settings() {
  const queryClient = useQueryClient();
  const { selectedRole, permissions } = useAppContext();

  const isSystemOwner = SYSTEM_OWNER_ROLES.includes(selectedRole);

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/settings', data).then(r => r.data),
    onError: (e: any) => { alert(e.message || "حدث خطأ"); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-branches'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      window.location.reload();
    },
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const { data: branches, isLoading, isError } = useQuery({
    queryKey: ['hr-branches'],
    queryFn: () => api.get('/hr-branches').then(r => r.data),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  const allSettingsCards: SettingsCard[] = [
    { title: 'الفروع', description: 'إدارة فروع المنظمة', icon: Building2, href: '/settings/branches', count: branches?.length || 0, access: 'system_owner' },
    { title: 'الأقسام', description: 'إدارة أقسام المنظمة', icon: Users, href: '/settings/departments', count: null, access: 'system_owner' },
    { title: 'الأدوار والصلاحيات', description: 'إدارة أدوار المستخدمين', icon: Shield, href: '/settings/roles', count: roles?.length || 0, access: 'system_owner' },
    { title: 'الإشعارات', description: 'إعدادات الإشعارات', icon: Bell, href: '/settings/notifications', count: null, access: 'all' },
    { title: 'النسخ الاحتياطي', description: 'إدارة النسخ الاحتياطية', icon: Database, href: '/settings/backup', count: null, access: 'system_owner' },
    { title: 'إعدادات النظام', description: 'الإعدادات العامة للنظام', icon: SettingsIcon, href: '/settings/system', count: null, access: 'system_owner' },
    { title: 'بادئات الأكواد', description: 'تخصيص بادئات الأكواد التلقائية', icon: Hash, href: '/settings/code-prefixes', count: null, access: 'system_owner' },
    { title: 'إعدادات البريد', description: 'تكوين خادم SMTP للبريد الإلكتروني', icon: Mail, href: '/settings/email', count: null, access: 'system_owner' },
    { title: 'إعدادات WhatsApp', description: 'تكوين WhatsApp Business API', icon: MessageCircle, href: '/settings/whatsapp', count: null, access: 'system_owner' },
    { title: 'إعدادات SMS', description: 'تكوين خدمة الرسائل النصية', icon: MessageSquare, href: '/settings/sms', count: null, access: 'system_owner' },
  ];

  // Filter settings cards based on user role
  const settingsCards = useMemo(() => {
    return allSettingsCards.filter(card => {
      if (card.access === 'system_owner') return isSystemOwner;
      return true; // 'all' cards visible to everyone with settings access
    });
  }, [isSystemOwner, branches, roles]);

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <p className="text-gray-500">إدارة إعدادات النظام والتكوينات</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card, index) => (
          <Link key={index} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                    {card.count !== null && (
                      <p className="text-sm text-primary mt-2">{card.count} عنصر</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
