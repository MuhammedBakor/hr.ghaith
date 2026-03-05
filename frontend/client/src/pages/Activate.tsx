import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, KeyRound, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";


export default function Activate() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [step, setStep] = useState<'verify' | 'password' | 'success'>('verify');
  const [employeeNumber, setEmployeeNumber] = useState(params.get('emp') || '');
  const [activationCode, setActivationCode] = useState(params.get('code') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [employeeName, setEmployeeName] = useState('');

  // Mutation للتحقق من الكود
  const verifyMutation = useMutation({
    mutationFn: (data: { employeeNumber: string; activationCode: string }) =>
      api.post('/auth/employee-invitation/verify', data).then(res => res.data),
    onSuccess: (result) => {
      if (result.valid) {
        setEmployeeName(result.employeeName || '');
        setStep('password');
        toast.success('تم التحقق من الكود بنجاح');
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
        setStep('success');
        toast.success('تم تفعيل حسابك بنجاح');
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


  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {step === 'success' ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <KeyRound className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-lg md:text-2xl">
            {step === 'verify' && 'تفعيل الحساب'}
            {step === 'password' && 'إنشاء كلمة المرور'}
            {step === 'success' && 'تم التفعيل بنجاح'}
          </CardTitle>
          <CardDescription>
            {step === 'verify' && 'أدخل الرقم الوظيفي وكود التفعيل'}
            {step === 'password' && `مرحباً ${employeeName}، قم بإنشاء كلمة مرور جديدة`}
            {step === 'success' && 'يمكنك الآن تسجيل الدخول إلى النظام'}
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
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    className="pe-10 font-mono tracking-widest"
                    dir="ltr"
                    maxLength={8}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تحقق من الكود'
                )}
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

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-700">
                  تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور الجديدة.
                </p>
              </div>

              <Button className="w-full" onClick={() => navigate('/')}>
                الذهاب لتسجيل الدخول
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
