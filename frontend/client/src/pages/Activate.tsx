import React from "react";
import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, KeyRound, User, Lock, Eye, EyeOff } from 'lucide-react';


export default function Activate() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const empFromUrl = params.get('emp') || '';
  const codeFromUrl = params.get('code') || '';

  const [step, setStep] = useState<'verify' | 'password'>('verify');
  const [employeeNumber, setEmployeeNumber] = useState(empFromUrl);
  const [activationCode, setActivationCode] = useState(codeFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');

  // Mutation للتحقق من الكود
  const verifyMutation = useMutation({
    mutationFn: (data: { employeeNumber: string; activationCode: string }) =>
      api.post('/auth/employee-invitation/verify', data).then(res => res.data),
    onSuccess: (result) => {
      if (result.valid) {
        setEmployeeName(result.employeeName || '');
        setEmployeeEmail(result.email || '');

        // If user already exists (multi-branch), skip password step
        if (result.userExists) {
          toast.success('مرحباً بعودتك! جاري تفعيل حسابك في الفرع الجديد...');
          completeMutation.mutate({
            employeeNumber,
            activationCode,
            password: '' // Backend will skip password update if empty
          });
        } else {
          setStep('password');
          toast.success('تم التحقق من الكود بنجاح');
        }
      } else {
        toast.error(result.error || 'كود التفعيل غير صحيح');
      }
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error.response?.data?.message || error.message));
    },
  });

  // Mutation لإكمال التسجيل
  const completeMutation = useMutation({
    mutationFn: (data: { employeeNumber: string; activationCode: string; password: string }) =>
      api.post('/auth/employee-invitation/complete', data).then(res => res.data),
    onSuccess: (result) => {
      if (result.success) {
        if (result.token) {
          localStorage.setItem('token', result.token);
        }

        // Redirect to home if profile is already complete (full add)
        if (result.profileComplete) {
          toast.success('تم تفعيل حسابك بنجاح!');
          navigate('/');
        } else {
          toast.success('تم تفعيل حسابك بنجاح! يرجى إكمال بياناتك');
          navigate(`/complete-profile?employeeId=${result.employeeId}`);
        }
      } else {
        toast.error(result.error || 'فشل تفعيل الحساب');
      }
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error.response?.data?.message || error.message));
    },
  });


  const handleVerify = () => {
    if (!employeeNumber || !activationCode) {
      toast.error('يرجى إدخال الرقم الوظيفي وكود التفعيل');
      return;
    }
    verifyMutation.mutate({ employeeNumber, activationCode });
  };

  const handleComplete = () => {
    if (!password || !confirmPassword) {
      toast.error('يرجى إدخال كلمة المرور');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    completeMutation.mutate({ employeeNumber, activationCode, password });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-lg md:text-2xl">
            {step === 'verify' && 'تفعيل الحساب'}
            {step === 'password' && 'إنشاء كلمة المرور'}
          </CardTitle>
          <CardDescription>
            {step === 'verify' && 'أدخل الرقم الوظيفي وكود التفعيل'}
            {step === 'password' && `مرحباً ${employeeName}، قم بإنشاء كلمة مرور جديدة`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'verify' && (
            <>
              <div className="space-y-2">
                <Label>الرقم الوظيفي</Label>
                <div className="relative">
                  <User className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="أدخل..."
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="pe-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>كود التفعيل</Label>
                <div className="relative">
                  <KeyRound className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="أدخل..."
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    className="pe-10 font-mono tracking-widest"
                    dir="ltr"
                    maxLength={10}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleVerify} disabled={verifyMutation.isPending}>
                {verifyMutation.isPending
                  ? <><Loader2 className="h-4 w-4 ms-2 animate-spin" />جاري التحقق...</>
                  : 'تفعيل'}
              </Button>
            </>
          )}

          {step === 'password' && (
            <>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">8 أحرف على الأقل</p>
              </div>

              <div className="space-y-2">
                <Label>تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pe-10"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري التفعيل...
                  </>
                ) : (
                  'تفعيل الحساب'
                )}
              </Button>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
