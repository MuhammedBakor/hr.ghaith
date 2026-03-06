import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, LogOut, RefreshCw, Loader2, Search, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { PrintButton } from "@/components/PrintButton";

export default function Session() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'userId': '', 'duration': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
        if (!formData.userId?.toString().trim()) errors.userId = 'مطلوب';
    if (!formData.duration?.toString().trim()) errors.duration = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/sessions', data).then(r => r.data),
    onSuccess: () => {
      setFormData({ 'userId': '', 'duration': '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      setIsSubmitting(false);
      alert('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuth();

  // جلب الجلسات من API
  const { data: sessions, isLoading, refetch } = useQuery({ queryKey: ['sessions'], queryFn: () => api.get('/auth/sessions').then(r => r.data), enabled: isAuthenticated });

  // mutation لإنهاء جلسة
  const terminateMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/sessions/terminate', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنهاء الجلسة بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في إنهاء الجلسة: ' + error.message);
    },
  });

  // mutation لإنهاء جميع الجلسات الأخرى
  const terminateOthersMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/sessions/terminate-others', data).then(r => r.data),
    onSuccess: (result) => {
      toast.success(`تم إنهاء ${result.count || 0} جلسة`);
      refetch();
    },
    onError: (error) => {
      toast.error('فشل في إنهاء الجلسات: ' + error.message);
    },
  });

  const filteredSessions = (sessions || []).filter(session =>
    (session.userAgent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (userAgent: string | null) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceType = (userAgent: string | null) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return 'جوال';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'تابلت';
    }
    return 'كمبيوتر';
  };

  const getBrowserInfo = (userAgent: string | null) => {
    const ua = userAgent || '';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'متصفح غير معروف';
  };

  const getOsInfo = (userAgent: string | null) => {
    const ua = userAgent || '';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
    return 'نظام غير معروف';
  };

  const handleTerminateSession = (sessionId: string) => {
    terminateMutation.mutate({ sessionId, reason: 'user_terminated' });
  };

  const handleTerminateAllOthers = () => {
    if (!sessions || sessions.length <= 1) {
      toast.info('لا توجد جلسات أخرى لإنهائها');
      return;
    }
    // استخدام أول جلسة كجلسة حالية (الأحدث نشاطاً)
    const currentSessionId = sessions[0]?.sessionId || '';
    terminateOthersMutation.mutate({ currentSessionId });
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return 'غير معروف';
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">المستخدم</label>
            <input value={formData.userId || ""} onChange={(e) => handleFieldChange("userId", e.target.value)} placeholder="المستخدم" className={`w-full px-3 py-2 border rounded-lg ${formErrors.userId ? "border-red-500" : ""}`} />
            {formErrors.userId && <span className="text-xs text-red-500">{formErrors.userId}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المدة</label>
            <input value={formData.duration || ""} onChange={(e) => handleFieldChange("duration", e.target.value)} placeholder="المدة" className={`w-full px-3 py-2 border rounded-lg ${formErrors.duration ? "border-red-500" : ""}`} />
            {formErrors.duration && <span className="text-xs text-red-500">{formErrors.duration}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center" dir="rtl">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">يجب تسجيل الدخول</h3>
        <p className="text-gray-500">يرجى تسجيل الدخول لعرض جلساتك النشطة</p>
      </div>
    );
  }

  const activeSessions = sessions?.length || 0;
  const currentSession = sessions?.[0]; // أحدث جلسة

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الجلسات</h2>
          <p className="text-gray-500">عرض وإدارة جلسات تسجيل الدخول النشطة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleTerminateAllOthers}
            disabled={terminateOthersMutation.isPending}
            className="gap-2"
          >
            {terminateOthersMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            إنهاء الجلسات الأخرى
          </Button>
        </div>
      </div>

      {currentSession && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              الجلسة الحالية
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  {getDeviceIcon(currentSession.userAgent)}
                </div>
                <div>
                  <p className="font-medium">{getBrowserInfo(currentSession.userAgent)} على {getOsInfo(currentSession.userAgent)}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {currentSession.ipAddress || 'غير معروف'}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">نشطة الآن</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الجلسات النشطة</p>
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">حالة الأمان</p>
              <p className="text-2xl font-bold">آمن</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المستخدم</p>
              <p className="text-2xl font-bold">{user?.name || 'غير معروف'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              جميع الجلسات
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد جلسات نشطة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الجهاز</TableHead>
                  <TableHead className="text-end">المتصفح / النظام</TableHead>
                  <TableHead className="text-end">عنوان IP</TableHead>
                  <TableHead className="text-end">آخر نشاط</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session, index) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.userAgent)}
                        <span>{getDeviceType(session.userAgent)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getBrowserInfo(session.userAgent)}</p>
                        <p className="text-sm text-gray-500">{getOsInfo(session.userAgent)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>{session.ipAddress || 'غير معروف'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatTimeAgo(session.lastActivityAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {index === 0 ? (
                        <Badge className="bg-green-100 text-green-800">الحالية</Badge>
                      ) : (
                        <Badge variant="outline">نشطة</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleTerminateSession(session.sessionId)}
                          disabled={terminateMutation.isPending}
                        >
                          {terminateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            نصائح أمنية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              قم بتسجيل الخروج من الأجهزة التي لا تستخدمها بانتظام
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              تحقق من الجلسات النشطة بشكل دوري للتأكد من عدم وجود وصول غير مصرح به
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              استخدم كلمة مرور قوية وفريدة لحسابك
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
