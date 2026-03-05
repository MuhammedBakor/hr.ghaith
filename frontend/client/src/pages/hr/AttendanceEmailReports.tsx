import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Calendar, Clock, Users, Send, Settings, CheckCircle2, Loader2, Bell, FileText } from 'lucide-react';

export default function AttendanceEmailReports() {
  const { data: currentUser, isError, error, isLoading, refetch} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [recipientEmail, setRecipientEmail] = useState('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [sendDay, setSendDay] = useState('1');

  // جلب الفروع
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/hr/branches').then(res => res.data),
  });

  // إرسال التقرير
  const sendReportMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/attendance/send-monthly-report', data).then(res => res.data),
    onSuccess: () => {
      toast.success('تم إرسال التقرير بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'فشل في إرسال التقرير');
    },
  });

  // حفظ إعدادات الإرسال التلقائي
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/attendance/report-settings', data).then(res => res.data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'فشل في حفظ الإعدادات');
    },
  });

  const handleSendReport = () => {
    if (!recipientEmail.trim()) {
      toast.error('الرجاء إدخال البريد الإلكتروني');
      return;
    }

    sendReportMutation.mutate({
      branchId: selectedBranch === 'all' ? undefined : parseInt(selectedBranch),
      month: selectedMonth,
      recipientEmail: recipientEmail.trim(),
      includeDetails,
      includeStats,
    });
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      autoSend,
      sendDay: parseInt(sendDay),
      recipientEmail: recipientEmail.trim(),
      branchId: selectedBranch === 'all' ? undefined : parseInt(selectedBranch),
    });
  };

  const months = [
    { value: '01', label: 'يناير' },
    { value: '02', label: 'فبراير' },
    { value: '03', label: 'مارس' },
    { value: '04', label: 'أبريل' },
    { value: '05', label: 'مايو' },
    { value: '06', label: 'يونيو' },
    { value: '07', label: 'يوليو' },
    { value: '08', label: 'أغسطس' },
    { value: '09', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' },
  ];

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  
  return (
    <div className="space-y-6" dir="rtl">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إرسال تقارير الحضور</h2>
          <p className="text-muted-foreground">إرسال تقارير الحضور الشهرية للمدراء عبر البريد الإلكتروني</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* إرسال تقرير يدوي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              إرسال تقرير
            </CardTitle>
            <CardDescription>
              إرسال تقرير حضور شهري للبريد الإلكتروني
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الفرع</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  {branches?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الشهر</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>البريد الإلكتروني للمستلم</Label>
              <Input
                type="email"
                placeholder="مثال"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-details">تضمين تفاصيل الحضور</Label>
                <Switch
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={setIncludeDetails}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-stats">تضمين الإحصائيات</Label>
                <Switch
                  id="include-stats"
                  checked={includeStats}
                  onCheckedChange={setIncludeStats}
                />
              </div>
            </div>

            <Button
              onClick={handleSendReport}
              disabled={sendReportMutation.isPending}
              className="w-full"
            >
              {sendReportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Mail className="h-4 w-4 ms-2" />
              )}
              إرسال التقرير
            </Button>
          </CardContent>
        </Card>

        {/* إعدادات الإرسال التلقائي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              الإرسال التلقائي
            </CardTitle>
            <CardDescription>
              إعداد إرسال تقارير شهرية تلقائية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">تفعيل الإرسال التلقائي</p>
                  <p className="text-sm text-muted-foreground">
                    إرسال تقرير شهري تلقائياً
                  </p>
                </div>
              </div>
              <Switch
                checked={autoSend}
                onCheckedChange={setAutoSend}
              />
            </div>

            {autoSend && (
              <>
                <div className="space-y-2">
                  <Label>يوم الإرسال من كل شهر</Label>
                  <Select value={sendDay} onValueChange={setSendDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اليوم" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          اليوم {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>البريد الإلكتروني للمستلم</Label>
                  <Input
                    type="email"
                    placeholder="مثال"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الفرع</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
        {(!branches || branches.length === 0) && <div className="text-center text-gray-500 py-8">لا توجد بيانات</div>}
                      {branches?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {saveSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ms-2" />
              )}
              حفظ الإعدادات
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* معلومات التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            محتوى التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">بيانات الموظفين</span>
              </div>
              <p className="text-sm text-muted-foreground">
                قائمة بجميع الموظفين مع سجل حضورهم الشهري
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-medium">إحصائيات الحضور</span>
              </div>
              <p className="text-sm text-muted-foreground">
                نسبة الحضور، التأخير، الغياب، والخروج المبكر
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="font-medium">ملخص الشهر</span>
              </div>
              <p className="text-sm text-muted-foreground">
                إجمالي أيام العمل، الإجازات، والعطل الرسمية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
