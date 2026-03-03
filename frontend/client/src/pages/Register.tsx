import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';
import { useRegister } from '@/services/authService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const registerMut = useRegister();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.name || !formData.password) {
      setError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    registerMut.mutate(
      {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password,
      },
      {
        onSuccess: () => {
          setLocation('/login?registered=true');
        },
        onError: (err: any) => {
          setError(err.response?.data?.message || err.message || 'فشل إنشاء الحساب');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl w-fit shadow-lg">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-lg md:text-2xl font-bold text-gray-900">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-gray-500">انضم إلى منصة غيث</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">الاسم الكامل *</Label>
              <div className="relative">
                <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={formData.name}
                  onChange={handleChange('name')}
                  className="pe-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  disabled={registerMut.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">اسم المستخدم *</Label>
              <div className="relative">
                <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={formData.username}
                  onChange={handleChange('username')}
                  className="pe-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  autoComplete="username"
                  disabled={registerMut.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className="pe-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  autoComplete="email"
                  disabled={registerMut.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  value={formData.password}
                  onChange={handleChange('password')}
                  className="pe-10 ps-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  autoComplete="new-password"
                  disabled={registerMut.isPending}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">تأكيد كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="pe-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  autoComplete="new-password"
                  disabled={registerMut.isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              disabled={registerMut.isPending}
            >
              {registerMut.isPending ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="w-full border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 text-center">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
