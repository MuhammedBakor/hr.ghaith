import { formatDate, formatDateTime } from '@/lib/formatDate';
/**
 * USER PROFILE v3 — صفحة الملف الشخصي الشاملة المتكاملة
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext, roleLabels, roleColors } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, Bell, Shield, Moon, Sun, Monitor, Lock, Activity, Eye, EyeOff, CheckCircle2, AlertTriangle, Palette, Type, Clock, Grid3x3, List, Mail, Smartphone, Loader2, Check, X, Info, TrendingUp, Calendar, Building, Volume2, Briefcase, Bell as BellIcon, Save, Key, AlertCircle, History } from 'lucide-react';
import { toast } from 'sonner';

// PasswordStrengthBar — since there's no matching service hook, we use a simple local check
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password || password.length < 3) return null;

  // Simple client-side strength check
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  const level = score >= 80 ? 'very_strong' : score >= 60 ? 'strong' : score >= 40 ? 'good' : score >= 25 ? 'fair' : 'weak';
  const colors: Record<string, string> = { weak: 'bg-red-500', fair: 'bg-amber-500', good: 'bg-blue-500', strong: 'bg-emerald-500', very_strong: 'bg-emerald-600' };
  const widths: Record<string, number> = { weak: 20, fair: 40, good: 65, strong: 85, very_strong: 100 };
  const labels: Record<string, string> = { weak: 'ضعيفة جداً', fair: 'مقبولة', good: 'جيدة', strong: 'قوية', very_strong: 'قوية جداً' };

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">قوة كلمة المرور</span>
        <span className={`font-semibold ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-blue-600' : score >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
          {labels[level]} ({score}/100)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[level]}`} style={{ width: `${widths[level]}%` }} />
      </div>
    </div>
  );
}

// KPI CARD
function KPICard({ label, value, icon: Icon, color = 'blue', sub }: { label: string; value: string | number; icon: React.ComponentType<{className?: string}>; color?: string; sub?: string }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className={`rounded-xl p-4 ${c.bg} border border-white`}>
      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// NOTIFICATION ITEM
function NotifItem({ n, onMarkRead }: { n: any; onMarkRead: (id: string) => void }) {
  const typeIcons: Record<string, React.ComponentType<{className?: string}>> = { success: CheckCircle2, error: X, warning: AlertTriangle, info: Info };
  const typeColors: Record<string, string> = { success: 'text-emerald-600 bg-emerald-50', error: 'text-red-600 bg-red-50', warning: 'text-amber-600 bg-amber-50', info: 'text-blue-600 bg-blue-50' };
  const Icon = typeIcons[n.type] ?? Info;
  return (
    <div className={`flex gap-3 p-3 rounded-xl border transition-colors ${!n.read ? 'border-blue-100 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type] ?? typeColors.info}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{n.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
      </div>
      {!n.read && (
        <button onClick={() => onMarkRead(n.id)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white text-blue-500">
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ACTIVITY ITEM
function ActivityItem({ a }: { a: any }) {
  const resultColors: Record<string, string> = { success: 'bg-emerald-500', failure: 'bg-red-500', warning: 'bg-amber-500' };
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${resultColors[a.result ?? 'success']}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{a.action}</p>
        {a.details && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.details}</p>}
      </div>
      <div className="shrink-0 text-end">
        <span className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</span>
        {a.module && <div className="mt-0.5"><Badge variant="outline" className="text-xs px-1 py-0">{a.module}</Badge></div>}
      </div>
    </div>
  );
}

// MAIN COMPONENT
export default function UserProfile() {
  const { user } = useAuth();
  const { selectedRole, currentEmployee } = useAppContext();
  const queryClient = useQueryClient();

  // Data - using direct API calls since there's no userProfile service
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get('/user/profile').then(res => res.data),
  });

  const { data: activity } = useQuery({
    queryKey: ['user-activity'],
    queryFn: () => api.get('/user/activity', { params: { limit: 30 } }).then(res => res.data),
  });

  const { data: notifications } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: () => api.get('/user/notifications', { params: { limit: 20 } }).then(res => res.data),
  });

  const { data: kpis } = useQuery({
    queryKey: ['user-kpis'],
    queryFn: () => api.get('/user/kpis').then(res => res.data),
  });

  const { data: unread } = useQuery({
    queryKey: ['user-notifications-unread'],
    queryFn: () => api.get('/user/notifications/unread-count').then(res => res.data),
  });

  // Mutations
  const updateProfile = useMutation({
    mutationFn: (data: any) => api.put('/user/profile', data).then(res => res.data),
    onSuccess: () => { toast.success('تم حفظ الملف الشخصي'); queryClient.invalidateQueries({ queryKey: ['user-profile'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message),
  });

  const changePassword = useMutation({
    mutationFn: (data: any) => api.post('/user/change-password', data).then(res => res.data),
    onSuccess: () => { toast.success('تم تغيير كلمة المرور بنجاح'); setPassForm({ current: '', newPass: '', confirm: '' }); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message),
  });

  const updatePrefs = useMutation({
    mutationFn: (data: any) => api.put('/user/preferences', data).then(res => res.data),
    onSuccess: () => { toast.success('تم حفظ التفضيلات'); queryClient.invalidateQueries({ queryKey: ['user-profile'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message),
  });

  const markRead = useMutation({
    mutationFn: (data: { id: string }) => api.post('/user/notifications/mark-read', data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'حدث خطأ'),
  });

  const markAllRead = useMutation({
    mutationFn: (data: { id: string }) => api.post('/user/notifications/mark-read', data).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['user-notifications'] }); queryClient.invalidateQueries({ queryKey: ['user-notifications-unread'] }); },
  });

  // Form state
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', jobTitle: '', department: '', bio: '' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    if (profile) {
      const emp = currentEmployee;
      setProfileForm({
        name: profile.name ?? (emp ? `${emp.firstName} ${emp.lastName}` : ''),
        email: profile.email ?? emp?.email ?? '',
        phone: (profile as any).phone ?? emp?.phone ?? '',
        jobTitle: (profile as any).jobTitle ?? emp?.position?.title ?? emp?.position ?? '',
        department: (profile as any).department ?? emp?.department?.nameAr ?? emp?.department?.name ?? '',
        bio: (profile as any).bio ?? '',
      });
    }
  }, [profile]);

  const completeness = profile?.completeness;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500">جارٍ تحميل ملفك الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-16 h-16 border-2 border-white shadow-md">
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? 'م'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -end-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : (profile?.name ?? 'المستخدم')}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge style={{ backgroundColor: roleColors[selectedRole] + '20', color: roleColors[selectedRole] }} className="border-0 text-xs font-medium">
                      {roleLabels[selectedRole]}
                    </Badge>
                    {(profile as any)?.jobTitle && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />{(profile as any).jobTitle}
                      </span>
                    )}
                    {(profile as any)?.department && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Building className="w-3 h-3" />{(profile as any).department}
                      </span>
                    )}
                  </div>
                </div>
                {unread?.count ? (
                  <Badge className="bg-red-100 text-red-700 border-0">
                    {unread.count} إشعار جديد
                  </Badge>
                ) : null}
              </div>

              {/* Completeness */}
              {completeness && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">اكتمال الملف الشخصي</span>
                    <span className={`font-semibold ${completeness.score >= 80 ? 'text-emerald-600' : completeness.score >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {completeness.score}%
                    </span>
                  </div>
                  <Progress value={completeness.score} className="h-1.5" />
                  {completeness.score < 100 && completeness.suggestions?.[0] && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />{completeness.suggestions[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KPIs */}
          {kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <KPICard icon={Activity} label="إجراءات اليوم" value={kpis.todayActions} color="blue" />
              <KPICard icon={TrendingUp} label="إجراءات الأسبوع" value={kpis.weekActions} color="green" />
              <KPICard icon={Clock} label="مهام معلقة" value={kpis.pendingTasks} color="orange" />
              <KPICard icon={CheckCircle2} label="مهام منجزة" value={kpis.completedTasks} color="purple" />
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full mb-4 bg-white border border-gray-100 rounded-xl p-1">
            <TabsTrigger value="profile" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><User className="w-3.5 h-3.5" />الملف</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Settings className="w-3.5 h-3.5" />التفضيلات</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Bell className="w-3.5 h-3.5" />الإشعارات
              {unread?.count ? <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{Math.min(unread.count, 9)}</span> : null}
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Shield className="w-3.5 h-3.5" />الأمان</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"><Activity className="w-3.5 h-3.5" />النشاط</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">معلومات الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">الاسم الكامل</Label>
                    <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="أدخل اسمك الكامل" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">البريد الإلكتروني</Label>
                    <Input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="example@company.com" className="h-9" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">رقم الجوال</Label>
                    <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+966 5X XXX XXXX" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">المسمى الوظيفي</Label>
                    <Input value={profileForm.jobTitle} onChange={e => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))}
                      placeholder="المسمى الوظيفي" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">القسم</Label>
                    <Input value={profileForm.department} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                      placeholder="القسم أو الإدارة" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">نبذة شخصية</Label>
                  <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="اكتب نبذة قصيرة عنك..." rows={3}
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <Button onClick={() => updateProfile.mutate(profileForm as any)} disabled={updateProfile.isPending} size="sm">
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Save className="w-4 h-4 ms-2" />}
                  حفظ التعديلات
                </Button>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-gray-100 shadow-sm mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4" />تغيير كلمة المرور</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">كلمة المرور الحالية</Label>
                  <div className="relative">
                    <Input value={passForm.current} onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))}
                      type={showPass ? 'text' : 'password'} className="h-9 ps-9" />
                    <button onClick={() => setShowPass(!showPass)} className="absolute start-2.5 top-2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">كلمة المرور الجديدة</Label>
                  <Input value={passForm.newPass} onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))}
                    type={showPass ? 'text' : 'password'} className="h-9" />
                  <PasswordStrengthBar password={passForm.newPass} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">تأكيد كلمة المرور</Label>
                  <Input value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
                    type={showPass ? 'text' : 'password'} className="h-9" />
                  {passForm.confirm && passForm.newPass !== passForm.confirm && (
                    <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
                  )}
                </div>
                <Button onClick={() => changePassword.mutate({ currentPassword: passForm.current, newPassword: passForm.newPass, confirmPassword: passForm.confirm })}
                  disabled={changePassword.isPending || !passForm.current || !passForm.newPass || passForm.newPass !== passForm.confirm}
                  size="sm" variant="outline">
                  {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Lock className="w-4 h-4 ms-2" />}
                  تغيير كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences">
            <div className="space-y-4">
              {/* Appearance */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />المظهر والواجهة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">السمة</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[{ value: 'light', label: 'فاتح', icon: Sun }, { value: 'dark', label: 'داكن', icon: Monitor }, { value: 'auto', label: 'تلقائي', icon: Moon }].map(t => (
                        <button key={t.value}
                          onClick={() => updatePrefs.mutate({ theme: t.value as any })}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${profile?.preferences?.theme === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <t.icon className="w-4 h-4" />{t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">حجم الخط</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[{ value: 'small', label: 'صغير' }, { value: 'normal', label: 'عادي' }, { value: 'large', label: 'كبير' }].map(s => (
                        <button key={s.value}
                          onClick={() => updatePrefs.mutate({ fontSize: s.value as any })}
                          className={`p-2 rounded-xl border text-sm ${profile?.preferences?.fontSize === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800">وضع مضغوط</p>
                      <p className="text-xs text-gray-500">تقليل المسافات لعرض أكثر</p>
                    </div>
                    <Switch
                      checked={profile?.preferences?.compactMode ?? false}
                      onCheckedChange={v => updatePrefs.mutate({ compactMode: v })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications prefs */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />تفضيلات الإشعارات</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'email', label: 'إشعارات البريد الإلكتروني', icon: Mail },
                    { key: 'sms', label: 'إشعارات الرسائل النصية', icon: Smartphone },
                    { key: 'inApp', label: 'إشعارات داخل التطبيق', icon: BellIcon },
                    { key: 'desktop', label: 'إشعارات سطح المكتب', icon: Monitor },
                    { key: 'sound', label: 'صوت الإشعارات', icon: Volume2 },
                  ].map(item => {
                    const prefs = profile?.preferences?.notifications as Record<string, boolean> | undefined;
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </div>
                        <Switch
                          checked={prefs?.[item.key] ?? false}
                          onCheckedChange={v => updatePrefs.mutate({ notifications: { [item.key]: v } as any })}
                        />
                      </div>
                    );
                  })}
                  <Separator />
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">تكرار الملخص</Label>
                    <Select
                      value={profile?.preferences?.notifications?.digest ?? 'instant'}
                      onValueChange={v => updatePrefs.mutate({ notifications: { digest: v as any } })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">فوري</SelectItem>
                        <SelectItem value="hourly">كل ساعة</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="never">لا أريد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard prefs */}
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Grid3x3 className="w-4 h-4" />تفضيلات لوحة التحكم</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">طريقة العرض الافتراضية</Label>
                    <div className="flex gap-2">
                      {[{ v: 'grid', l: 'شبكة', i: Grid3x3 }, { v: 'list', l: 'قائمة', i: List }].map(item => (
                        <button key={item.v}
                          onClick={() => updatePrefs.mutate({ dashboard: { defaultView: item.v as any } })}
                          className={`flex items-center gap-2 flex-1 p-2 rounded-xl border text-sm ${profile?.preferences?.dashboard?.defaultView === item.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <item.i className="w-4 h-4" />{item.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {[
                    { key: 'showWelcome', label: 'عرض رسالة الترحيب' },
                    { key: 'showSystemStatus', label: 'عرض حالة النظام' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <Switch
                        checked={(profile?.preferences?.dashboard as Record<string, boolean> | undefined)?.[item.key] ?? true}
                        onCheckedChange={v => updatePrefs.mutate({ dashboard: { [item.key]: v } as any })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications">
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">الإشعارات</CardTitle>
                  <div className="flex gap-2">
                    {(notifications?.length ?? 0) > 0 && (
                      <Button variant="outline" size="sm" onClick={() => markAllRead.mutate({ id: 'all' })} className="text-xs h-7">
                        <Check className="w-3 h-3 ms-1" />قراءة الكل
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!notifications?.length ? (
                  <div className="py-12 text-center">
                    <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((n: any) => (
                      <NotifItem key={n.id} n={n} onMarkRead={id => markRead.mutate({ id })} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security">
            <div className="space-y-4">
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />حالة الأمان</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl ${profile?.twoFactorEnabled ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {profile?.twoFactorEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                        <span className={`text-xs font-semibold ${profile?.twoFactorEnabled ? 'text-emerald-700' : 'text-red-700'}`}>
                          التحقق الثنائي
                        </span>
                      </div>
                      <p className={`text-xs ${profile?.twoFactorEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
                        {profile?.twoFactorEnabled ? 'مفعّل' : 'غير مفعّل'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">حالة الحساب</span>
                      </div>
                      <p className="text-xs text-blue-600 capitalize">{profile?.status ?? 'نشط'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" />آخر تسجيل دخول</span>
                      <span className="text-gray-800 font-medium">
                        {profile?.lastSignedIn ? formatDateTime(profile.lastSignedIn) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />عدد مرات الدخول</span>
                      <span className="text-gray-800 font-medium">{profile?.loginCount ?? 0} مرة</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />تاريخ الإنشاء</span>
                      <span className="text-gray-800 font-medium">
                        {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                      </span>
                    </div>
                  </div>
                  {!profile?.twoFactorEnabled && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700 text-sm">
                        يُنصح بتفعيل التحقق الثنائي لحماية حسابك من الاختراق. تواصل مع مدير النظام للتفعيل.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity">
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">سجل النشاط</CardTitle>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">آخر 30 إجراء</span>
                </div>
              </CardHeader>
              <CardContent>
                {!activity?.length ? (
                  <div className="py-12 text-center">
                    <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">لا يوجد نشاط مسجّل</p>
                  </div>
                ) : (
                  <div>
                    {activity.map((a: any, i: number) => <ActivityItem key={i} a={a} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
