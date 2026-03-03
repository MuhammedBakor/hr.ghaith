import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CloudRain, User, Lock, AlertCircle, Eye, EyeOff, Building2, KeyRound, Mail, Phone, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLogin, useVerifyCode, useSendPasswordResetCode, useResetPassword } from '@/services/authService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type ViewType = 'main' | 'login' | 'activate' | 'reset-request' | 'reset-verify' | 'reset-success';

export default function Login() {
  const { selectedRole: userRole } = useAppContext();

  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('main');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [activateCode, setActivateCode] = useState('');
  const [activateError, setActivateError] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [activateSuccess, setActivateSuccess] = useState(false);

  const [resetSubscriptionCode, setResetSubscriptionCode] = useState('');
  const [resetMethod, setResetMethod] = useState<'email' | 'whatsapp'>('email');
  const [resetContact, setResetContact] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  const loginMut = useLogin();

  const [codeToVerify, setCodeToVerify] = useState('');
  const { data: verifyCodeResult, isLoading: isVerifyingCode, isError } = useVerifyCode(codeToVerify);

  const sendResetCodeMutation = useSendPasswordResetCode();
  const verifyResetMutation = useResetPassword();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Handle login submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!username || !password) {
      setLoginError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    loginMut.mutate(
      { username, password },
      {
        onSuccess: () => {
          window.location.href = '/';
        },
        onError: (err: any) => {
          setLoginError(err.response?.data?.message || err.message || 'فشل تسجيل الدخول');
        }
      }
    );
  };

  // Handle verify subscription code
  const handleVerifyCode = async () => {
    if (!activateCode.trim()) {
      setActivateError('يرجى إدخال رمز التفعيل المُرسل إليك');
      return;
    }
    setActivateError('');
    setCodeToVerify(activateCode.trim());
  };

  useEffect(() => {
    if (verifyCodeResult) {
      if (verifyCodeResult.success && verifyCodeResult.subscription) {
        setSubscriptionData(verifyCodeResult.subscription);
        setActivateSuccess(true);
        setResetSubscriptionCode(activateCode.trim());
      } else {
        setActivateError(verifyCodeResult.error || 'رمز التفعيل غير صحيح أو منتهي الصلاحية');
      }
    }
  }, [verifyCodeResult, activateCode]);

  // Handle send reset code
  const handleSendResetCode = () => {
    if (!resetSubscriptionCode.trim()) {
      setResetError('يرجى إدخال كود الاشتراك');
      return;
    }

    setResetError('');
    sendResetCodeMutation.mutate({
      code: resetSubscriptionCode.trim(),
      method: resetMethod,
      contact: resetContact
    }, {
      onSuccess: () => {
        setCurrentView('reset-verify');
      },
      onError: (err: any) => {
        setResetError(err.response?.data?.message || err.message || 'فشل إرسال الرمز');
      }
    });
  };

  // Handle verify reset code and set new password
  const handleVerifyAndReset = () => {
    if (!resetCode.trim()) {
      setResetError('يرجى إدخال رمز التحقق');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('كلمة المرور غير متطابقة');
      return;
    }

    setResetError('');
    verifyResetMutation.mutate({
      code: resetSubscriptionCode.trim(),
      verificationCode: resetCode.trim(),
      newPassword
    }, {
      onSuccess: () => {
        setCurrentView('reset-success');
      },
      onError: (err: any) => {
        setResetError(err.response?.data?.message || err.message || 'فشل إعادة تعيين كلمة المرور');
      }
    });
  };

  // Reset all states
  const resetAllStates = () => {
    setUsername('');
    setPassword('');
    setLoginError('');
    setActivateCode('');
    setActivateError('');
    setSubscriptionData(null);
    setActivateSuccess(false);
    setResetSubscriptionCode('');
    setResetContact('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  // Go back to main view
  const goBack = () => {
    resetAllStates();
    setCurrentView('main');
  };

  if (authLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-blue-700">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <CloudRain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">منصة غيث</h1>
              <p className="text-xs text-gray-500">نظام إدارة الموارد المؤسسية</p>
            </div>
          </div>
          {currentView !== 'main' && (
            <Button variant="ghost" onClick={goBack} className="text-gray-600 hover:text-gray-900">
              <ArrowRight className="h-4 w-4 ms-2" />
              العودة للقائمة الرئيسية
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Main Menu View */}
        {currentView === 'main' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">مرحباً بك في منصة غيث</h2>
              <p className="text-gray-600">اختر الخدمة المطلوبة للمتابعة</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* تسجيل الدخول */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-200 group"
                onClick={() => setCurrentView('login')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">تسجيل الدخول</h3>
                      <p className="text-sm text-gray-500">للمستخدمين الذين لديهم حساب مفعّل</p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              {/* تفعيل حساب جديد */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-200 group"
                onClick={() => setCurrentView('activate')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <Building2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">تفعيل حساب جديد</h3>
                      <p className="text-sm text-gray-500">للشركات التي تلقت رمز التفعيل عبر الواتساب أو الإيميل</p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              {/* استعادة كلمة المرور */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-amber-200 group md:col-span-2"
                onClick={() => setCurrentView('reset-request')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <KeyRound className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">استعادة كلمة المرور</h3>
                      <p className="text-sm text-gray-500">نسيت كلمة المرور؟ أدخل كود الاشتراك لإرسال رمز تحقق جديد</p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Login View */}
        {currentView === 'login' && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-xl w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
              <CardDescription>أدخل بيانات حسابك للدخول إلى النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم أو كود الاشتراك</Label>
                  <div className="relative">
                    <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="أدخل اسم المستخدم"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pe-10"
                      autoComplete="username"
                      disabled={loginMut.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pe-10 ps-10"
                      autoComplete="current-password"
                      disabled={loginMut.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMut.isPending}
                >
                  {loginMut.isPending ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>

                <div className="text-center pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setCurrentView('reset-request')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Activate Account View */}
        {currentView === 'activate' && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-emerald-50 rounded-xl w-fit">
                <Building2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">تفعيل حساب جديد</CardTitle>
              <CardDescription>
                أدخل رمز التفعيل الذي تم إرساله إليك عبر الواتساب أو البريد الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activateSuccess ? (
                <div className="space-y-4">
                  {activateError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{activateError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="activateCode">رمز التفعيل (كود الاشتراك)</Label>
                    <div className="relative">
                      <KeyRound className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="activateCode"
                        type="text"
                        placeholder="مثال: GH-202602-XXXX"
                        value={activateCode}
                        onChange={(e) => setActivateCode(e.target.value)}
                        className="pe-10 text-center font-mono tracking-wider"
                        disabled={isVerifyingCode}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      الرمز يتكون من حروف وأرقام ويُرسل من النظام تلقائياً
                    </p>
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isVerifyingCode}
                  >
                    {isVerifyingCode ? (
                      <>
                        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      'التحقق من الرمز'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-emerald-800 mb-1">تم التحقق بنجاح!</h3>
                    <p className="text-sm text-emerald-600">
                      مرحباً بك في {subscriptionData?.companyName || 'النظام'}
                    </p>
                  </div>

                  {subscriptionData && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">اسم الشركة:</span>
                        <span className="font-medium">{subscriptionData.companyName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">كود الاشتراك:</span>
                        <span className="font-mono">{subscriptionData.code}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">الحالة:</span>
                        <span className="text-emerald-600">نشط</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      لإكمال التفعيل، يرجى إعادة تعيين كلمة المرور
                    </p>
                    <Button
                      onClick={() => setCurrentView('reset-request')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      متابعة لإعادة تعيين كلمة المرور
                      <ArrowLeft className="me-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reset Password - Request View */}
        {currentView === 'reset-request' && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-amber-50 rounded-xl w-fit">
                <KeyRound className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-xl">استعادة كلمة المرور</CardTitle>
              <CardDescription>أدخل كود الاشتراك لإرسال رمز التحقق</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resetError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resetCode">كود الاشتراك</Label>
                  <div className="relative">
                    <Building2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetCode"
                      type="text"
                      placeholder="مثال: GH-202602-XXXX"
                      value={resetSubscriptionCode}
                      onChange={(e) => setResetSubscriptionCode(e.target.value)}
                      className="pe-10 text-center font-mono tracking-wider"
                      disabled={sendResetCodeMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>طريقة إرسال رمز التحقق</Label>
                  <RadioGroup
                    value={resetMethod}
                    onValueChange={(v) => setResetMethod(v as 'email' | 'whatsapp')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse flex-1">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4 text-gray-500" />
                        البريد الإلكتروني
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse flex-1">
                      <RadioGroupItem value="whatsapp" id="whatsapp" />
                      <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                        <Phone className="h-4 w-4 text-gray-500" />
                        واتساب
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleSendResetCode}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={sendResetCodeMutation.isPending}
                >
                  {sendResetCodeMutation.isPending ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رمز التحقق'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Password - Verify View */}
        {currentView === 'reset-verify' && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-amber-50 rounded-xl w-fit">
                <KeyRound className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-xl">إعادة تعيين كلمة المرور</CardTitle>
              <CardDescription>
                تم إرسال رمز التحقق إلى {resetMethod === 'email' ? 'بريدك الإلكتروني' : 'رقم الواتساب'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resetError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verifyCode">رمز التحقق</Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    placeholder="أدخل رمز التحقق المُرسل"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="text-center font-mono tracking-widest text-lg"
                    maxLength={6}
                    disabled={verifyResetMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pe-10 ps-10"
                      disabled={verifyResetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="أعد إدخال كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pe-10"
                      disabled={verifyResetMutation.isPending}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleVerifyAndReset}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={verifyResetMutation.isPending}
                >
                  {verifyResetMutation.isPending ? (
                    <>
                      <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      جاري إعادة التعيين...
                    </>
                  ) : (
                    'إعادة تعيين كلمة المرور'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('reset-request')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    لم يصلك الرمز؟ إعادة الإرسال
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Password - Success View */}
        {currentView === 'reset-success' && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-8 pb-6">
              <div className="text-center space-y-4">
                <div className="mx-auto p-4 bg-emerald-50 rounded-full w-fit">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">تم بنجاح!</h3>
                <p className="text-gray-600">
                  تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
                </p>
                <Button
                  onClick={() => {
                    resetAllStates();
                    setCurrentView('login');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                >
                  الذهاب لتسجيل الدخول
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Footer */}
      <div className="fixed bottom-0 start-0 end-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-3">
        <div className="text-center text-sm text-gray-500">
          © 2026 منصة غيث - جميع الحقوق محفوظة
        </div>
      </div>

      {true && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">

        <div className="mb-4 border-b pb-3">
          <h3 className="text-lg font-bold">تفاصيل</h3>
        </div>
        <div className="py-4 text-sm text-muted-foreground">محتوى</div>

      </div>)}

    </div>
  );
}
