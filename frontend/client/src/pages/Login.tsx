import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff, KeyRound, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLogin, useSendPasswordResetCode, useResetPassword } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

type ViewType = 'main' | 'login' | 'reset-request' | 'reset-verify' | 'reset-success' | 'activate-verify' | 'activate-password' | 'activate-success';

// ─── Brand colours (matches gyth.html) ───────────────────────────────────────
const GOLD = '#C9A13B';
const GOLD_HOVER = '#A8842F';
const PRIMARY = '#2F3440';
const APP_BG = '#F5F7FA';

// ─── Decorative card (matches gyth.html landing section) ─────────────────────
function DecorativeCard({ small = false }: { small?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const radius = small ? '1.25rem' : '3rem';
  const gap = small ? '0.4rem' : '1rem';
  return (
    <div className="relative w-full select-none h-28 sm:h-40 lg:h-60">
      {/* Back layer */}
      <div
        className="absolute inset-0 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #2F3440, #1F2430, #C9A13B)', borderRadius: radius, transform: 'rotate(3deg)', opacity: 0.9 }}
      />
      {/* Front layer */}
      <div
        className="absolute inset-0 shadow-lg flex items-center justify-center p-4"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(2px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: radius, transform: hovered ? 'rotate(0deg)' : 'rotate(-3deg)', transition: 'transform 0.5s ease' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="grid grid-cols-2 w-full h-full" style={{ gap, opacity: 0.9 }}>
          <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="rounded-xl" style={{ background: 'rgba(201,161,59,0.4)' }} />
          <div className="rounded-xl" style={{ background: 'rgba(47,52,64,0.4)' }} />
          <div className="rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white';

export default function Login() {
  useAppContext();
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('main');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  const [empNumber, setEmpNumber] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [confirmActivatePassword, setConfirmActivatePassword] = useState('');
  const [showActivatePassword, setShowActivatePassword] = useState(false);
  const [activateError, setActivateError] = useState('');
  const [activateEmpName, setActivateEmpName] = useState('');

  const loginMut = useLogin();
  const sendResetCodeMutation = useSendPasswordResetCode();
  const verifyResetMutation = useResetPassword();

  const verifyActivationMut = useMutation({
    mutationFn: (data: { employeeNumber: string; activationCode: string }) =>
      api.post('/auth/employee-invitation/verify', data).then(res => res.data),
  });

  const completeActivationMut = useMutation({
    mutationFn: (data: { employeeNumber: string; activationCode: string; password: string }) =>
      api.post('/auth/employee-invitation/complete', data).then(res => res.data),
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) setLocation('/select-branch');
  }, [isAuthenticated, authLoading, setLocation]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username || !password) { setLoginError('الرجاء إدخال اسم المستخدم وكلمة المرور'); return; }
    loginMut.mutate({ username, password }, {
      onSuccess: () => { window.location.href = '/select-branch'; },
      onError: (err: any) => { setLoginError(err.response?.data?.error || err.response?.data?.message || err.message || 'فشل تسجيل الدخول'); },
    });
  };

  const handleSendResetCode = () => {
    if (!resetEmail.trim()) { setResetError('يرجى إدخال البريد الإلكتروني'); return; }
    setResetError('');
    sendResetCodeMutation.mutate({ email: resetEmail.trim() }, {
      onSuccess: () => setCurrentView('reset-verify'),
      onError: (err: any) => { setResetError(err.response?.data?.message || err.message || 'فشل إرسال الرمز'); },
    });
  };

  const handleVerifyAndReset = () => {
    if (!resetCode.trim()) { setResetError('يرجى إدخال رمز التحقق'); return; }
    if (!newPassword || newPassword.length < 6) { setResetError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { setResetError('كلمة المرور غير متطابقة'); return; }
    setResetError('');
    verifyResetMutation.mutate({ email: resetEmail.trim(), verificationCode: resetCode.trim(), newPassword }, {
      onSuccess: () => setCurrentView('reset-success'),
      onError: (err: any) => { setResetError(err.response?.data?.message || err.message || 'فشل إعادة تعيين كلمة المرور'); },
    });
  };

  const handleActivateVerify = () => {
    if (!empNumber.trim() || !activationCode.trim()) { setActivateError('يرجى إدخال الرقم الوظيفي وكود التفعيل'); return; }
    setActivateError('');
    verifyActivationMut.mutate({ employeeNumber: empNumber.trim(), activationCode: activationCode.trim() }, {
      onSuccess: (result) => {
        if (result.valid) {
          setActivateEmpName(result.employeeName || '');
          if (result.userExists) {
            // Existing user (multi-branch) — complete directly
            completeActivationMut.mutate({ employeeNumber: empNumber.trim(), activationCode: activationCode.trim(), password: '' }, {
              onSuccess: (res) => {
                if (res.success) {
                  if (res.token) localStorage.setItem('token', res.token);
                  setCurrentView('activate-success');
                } else { setActivateError(res.error || 'فشل تفعيل الحساب'); }
              },
              onError: (err: any) => { setActivateError(err.response?.data?.message || err.message || 'فشل تفعيل الحساب'); },
            });
          } else {
            setCurrentView('activate-password');
          }
        } else {
          setActivateError(result.error || 'كود التفعيل غير صحيح');
        }
      },
      onError: (err: any) => { setActivateError(err.response?.data?.message || err.message || 'فشل التحقق'); },
    });
  };

  const handleActivateComplete = () => {
    if (!activatePassword || activatePassword.length < 8) { setActivateError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (activatePassword !== confirmActivatePassword) { setActivateError('كلمات المرور غير متطابقة'); return; }
    setActivateError('');
    completeActivationMut.mutate({ employeeNumber: empNumber.trim(), activationCode: activationCode.trim(), password: activatePassword }, {
      onSuccess: (result) => {
        if (result.success) {
          if (result.token) localStorage.setItem('token', result.token);
          setCurrentView('activate-success');
        } else { setActivateError(result.error || 'فشل تفعيل الحساب'); }
      },
      onError: (err: any) => { setActivateError(err.response?.data?.message || err.message || 'فشل تفعيل الحساب'); },
    });
  };

  const resetAllStates = () => {
    setUsername(''); setPassword(''); setLoginError('');
    setResetEmail(''); setResetCode(''); setNewPassword(''); setConfirmPassword(''); setResetError('');
    setEmpNumber(''); setActivationCode(''); setActivatePassword(''); setConfirmActivatePassword(''); setActivateError(''); setActivateEmpName('');
  };

  // ─── Services carousel drag-to-scroll ────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  const onCarouselMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = carouselRef.current?.scrollLeft ?? 0;
    (carouselRef.current as HTMLElement).style.cursor = 'grabbing';
  };
  const onCarouselMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    carouselRef.current.scrollLeft = scrollStartX.current - (e.clientX - dragStartX.current);
  };
  const stopDrag = () => {
    isDragging.current = false;
    if (carouselRef.current) (carouselRef.current as HTMLElement).style.cursor = 'grab';
  };

  // ─── Contact form state ───────────────────────────────────────────────────
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: APP_BG }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  // ─── Gold button helpers ─────────────────────────────────────────────────
  const goldBtn = {
    style: { backgroundColor: GOLD, color: '#fff' } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.backgroundColor = GOLD_HOVER; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.backgroundColor = GOLD; },
  };

  const outlineBtn = {
    style: { backgroundColor: 'transparent', color: PRIMARY, border: `2px solid ${PRIMARY}` } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.backgroundColor = '#f0f0f0'; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.backgroundColor = 'transparent'; },
  };

  // ─── Back button ─────────────────────────────────────────────────────────
  const BackBtn = ({ to }: { to: ViewType }) => (
    <button
      onClick={() => { resetAllStates(); setCurrentView(to); }}
      className="flex items-center gap-1.5 text-xs mb-8 transition-colors"
      style={{ color: '#9ca3af' }}
      onMouseEnter={e => { (e.currentTarget).style.color = GOLD; }}
      onMouseLeave={e => { (e.currentTarget).style.color = '#9ca3af'; }}
    >
      ← رجوع
    </button>
  );

  // ─── Error banner ─────────────────────────────────────────────────────────
  const ErrorBanner = ({ msg }: { msg: string }) => msg ? (
    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm"
      style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      {msg}
    </div>
  ) : null;

  // ─── Shared glass panel style ─────────────────────────────────────────────
  const glassPanel: React.CSSProperties = {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(228,231,236,0.8)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  };

  // ─── Service cards data ───────────────────────────────────────────────────
  const services = [
    { title: 'إدارة العقارات', desc: 'نظام متكامل لإدارة الأملاك، ومتابعة المستأجرين، وتحصيل الإيجارات بفعالية.', accent: GOLD },
    { title: 'تأجير السيارات', desc: 'إدارة الحجوزات، تتبع العقود، وإدارة الأسطول والفحوصات الدورية.', accent: PRIMARY },
    { title: 'أسطول التريلات', desc: 'تتبع مسارات الشحنات، وإدارة السائقين والصيانة والوقود.', accent: '#3B82F6' },
    { title: 'العمرة والحج', desc: 'إدارة التفويج، الحجوزات، والسكن والإعاشة للمعتمرين والحجاج.', accent: '#22C55E' },
    { title: 'إدارة المشاريع', desc: 'تتبع إنجاز المشاريع وتوزيع المهام بدقة عالية وفعالية.', accent: GOLD },
    { title: 'ذكاء الأعمال', desc: 'تقارير وإحصائيات مفصلة لدعم اتخاذ القرارات السريعة.', accent: PRIMARY },
    { title: 'الموارد البشرية', desc: 'إدارة شاملة للموظفين، الرواتب، الإجازات، والحضور والانصراف.', accent: '#8B5CF6' },
    { title: 'الشؤون القانونية', desc: 'متابعة القضايا والعقود والوثائق القانونية بكل سهولة.', accent: '#6B7280' },
  ];

  // ─── Views ───────────────────────────────────────────────────────────────
  const renderContent = () => {
    // ── MAIN (landing) ────────────────────────────────────────────────────
    if (currentView === 'main') return (
      <>
        {/* Hero */}
        <section
          className="flex items-center justify-center px-4 sm:px-6 py-6 relative overflow-hidden"
          style={{ animation: 'fadeIn 0.4s ease-in-out', minHeight: '45vh' }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 800, height: 800,
              background: `radial-gradient(circle, rgba(201,161,59,0.06) 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
          <div className="max-w-6xl mx-auto w-full grid grid-cols-2 gap-4 lg:gap-12 items-center relative z-10 px-2 sm:px-4 md:px-0">
            {/* Text — right column in RTL */}
            <div className="space-y-3 md:space-y-6 text-right">
              <h1
                className="font-extrabold leading-tight"
                style={{ fontSize: 'clamp(1.1rem, 5vw, 3rem)', color: PRIMARY }}
              >
                الإدارة المؤسسية
                <br />
                <span style={{ color: GOLD }}>برؤية حديثة</span>
              </h1>
              <p className="text-xs md:text-base" style={{ color: '#6b7280' }}>
                يساهم نظام غيث في تنظيم وتسهيل إدارة المؤسسات والشركات من خلال
                إتاحة خدمات إلكترونية متطورة لتمكين العملاء من إجراء معاملاتهم
                بكل سهولة وأمان.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4">
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-5 md:px-8 py-2.5 md:py-3 rounded-xl font-bold transition text-sm md:text-base"
                  style={{ backgroundColor: GOLD, color: '#fff', boxShadow: `0 4px 14px rgba(201,161,59,0.35)` }}
                  onMouseEnter={e => { (e.currentTarget).style.backgroundColor = GOLD_HOVER; }}
                  onMouseLeave={e => { (e.currentTarget).style.backgroundColor = GOLD; }}
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => setCurrentView('activate-verify')}
                  className="px-5 md:px-8 py-2.5 md:py-3 rounded-xl font-bold transition text-sm md:text-base"
                  {...outlineBtn}
                >
                  تفعيل حساب موظف
                </button>
              </div>
            </div>
            {/* Decorative card — left column in RTL, compact on mobile */}
            <DecorativeCard small />
          </div>
        </section>

        {/* ── خدماتنا الرئيسية ─────────────────────────────── */}
        <section className="py-6 relative z-10" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: PRIMARY }}>خدماتنا الرئيسية</h2>
          </div>
          {/* Marquee container — overflow hidden, full width */}
          <div dir="ltr" style={{ overflow: 'hidden', width: '100%' }}>
            {/* Track — contains 2 copies for seamless loop */}
            <div
              className="marquee-track"
              style={{ display: 'flex', gap: '16px', width: 'max-content', paddingBottom: '16px', paddingInline: '16px' }}
            >
              {[...services, ...services].map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 flex-shrink-0 transition-transform hover:scale-105"
                  style={{
                    ...glassPanel,
                    width: '240px',
                    borderTop: `4px solid ${s.accent}`,
                    userSelect: 'none',
                  }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: PRIMARY }}>{s.title}</h3>
                  <p className="text-sm" style={{ color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── من نحن ───────────────────────────────────────── */}
        <section
          className="py-10 md:py-16 relative z-10"
          style={{ backgroundColor: '#fff', borderTop: '1px solid rgba(228,231,236,0.8)', borderBottom: '1px solid rgba(228,231,236,0.8)' }}
          dir="rtl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: PRIMARY }}>من نحن</h2>
            <p className="max-w-3xl mx-auto text-sm md:text-base leading-relaxed" style={{ color: '#6b7280' }}>
              نحن منصة رقمية متكاملة تهدف إلى رقمنة وأتمتة العمليات الإدارية والتشغيلية للمؤسسات.
              نقدم حلولاً مبتكرة تجمع بين القوة والمرونة لتناسب قطاعات الأعمال المختلفة،
              ونسعى لنكون الشريك الاستراتيجي الأول في رحلة التحول الرقمي.
            </p>
          </div>
        </section>

        {/* ── تواصل معنا ───────────────────────────────────── */}
        <section className="py-10 md:py-16 relative z-10" dir="rtl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl md:rounded-3xl p-6 md:p-10 text-center" style={{ ...glassPanel, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: PRIMARY }}>تواصل معنا</h2>
              <p className="mb-6 text-sm md:text-base" style={{ color: '#9ca3af' }}>نحن هنا للإجابة على جميع استفساراتك ومساعدتك في البدء.</p>
              <div className="space-y-4 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="الاسم الكريم"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ border: '1px solid #e5e7eb', background: '#fff', color: PRIMARY }}
                    onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ border: '1px solid #e5e7eb', background: '#fff', color: PRIMARY }}
                    onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  />
                </div>
                <textarea
                  placeholder="رسالتك..."
                  rows={4}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                  style={{ border: '1px solid #e5e7eb', background: '#fff', color: PRIMARY }}
                  onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                />
                <button
                  className="w-full py-3 rounded-xl font-bold transition"
                  style={{ backgroundColor: GOLD, color: '#fff', boxShadow: `0 4px 14px rgba(201,161,59,0.35)` }}
                  onMouseEnter={e => { (e.currentTarget).style.backgroundColor = GOLD_HOVER; }}
                  onMouseLeave={e => { (e.currentTarget).style.backgroundColor = GOLD; }}
                >
                  إرسال الرسالة
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm" style={{ color: '#9ca3af', borderTop: '1px solid rgba(228,231,236,0.6)' }}>
          © {new Date().getFullYear()} نظام غيث — جميع الحقوق محفوظة
        </footer>
      </>
    );

    // ── Sub-views (login, reset) — centered card ──────────────────────────
    return (
      <section className="flex-1 flex items-center justify-center px-4 py-6 md:py-12">
        <div
          className="w-full max-w-md rounded-2xl p-6 md:p-10"
          dir="rtl"
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(228,231,236,0.8)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {/* ── LOGIN ─────────────────────────────────────────── */}
          {currentView === 'login' && (
            <>
              <BackBtn to="main" />
              <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY }}>تسجيل الدخول</h2>
              <p className="text-sm mb-7" style={{ color: '#9ca3af' }}>أدخل بيانات حسابك للمتابعة</p>
              <ErrorBanner msg={loginError} />
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>اسم المستخدم</Label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type="text" placeholder="أدخل اسم المستخدم" value={username}
                      onChange={e => setUsername(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px' }} disabled={loginMut.isPending} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type={showPassword ? 'text' : 'password'} placeholder="أدخل كلمة المرور"
                      value={password} onChange={e => setPassword(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px', paddingInlineStart: '40px' }} disabled={loginMut.isPending} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2" style={{ color: '#9ca3af', insetInlineStart: '14px' }}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loginMut.isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold mt-2 transition flex items-center justify-center gap-2"
                  {...goldBtn}>
                  {loginMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loginMut.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </button>
                <div className="text-center pt-1 space-y-2">
                  <button type="button" onClick={() => { resetAllStates(); setCurrentView('reset-request'); }}
                    className="text-xs transition-colors block mx-auto" style={{ color: '#9ca3af' }}
                    onMouseEnter={e => { (e.currentTarget).style.color = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = '#9ca3af'; }}>
                    نسيت كلمة المرور؟
                  </button>
                  <button type="button" onClick={() => { resetAllStates(); setCurrentView('activate-verify'); }}
                    className="text-xs transition-colors block mx-auto" style={{ color: '#9ca3af' }}
                    onMouseEnter={e => { (e.currentTarget).style.color = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = '#9ca3af'; }}>
                    موظف جديد؟ تفعيل الحساب
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── RESET REQUEST ──────────────────────────────────── */}
          {currentView === 'reset-request' && (
            <>
              <BackBtn to="main" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(201,161,59,0.12)' }}>
                <KeyRound className="h-6 w-6" style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY }}>استعادة كلمة المرور</h2>
              <p className="text-sm mb-7" style={{ color: '#9ca3af' }}>أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق</p>
              <ErrorBanner msg={resetError} />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type="email" placeholder="أدخل بريدك الإلكتروني" value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px' }} disabled={sendResetCodeMutation.isPending} />
                  </div>
                </div>
                <button onClick={handleSendResetCode} disabled={sendResetCodeMutation.isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  {...goldBtn}>
                  {sendResetCodeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sendResetCodeMutation.isPending ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </button>
              </div>
            </>
          )}

          {/* ── RESET VERIFY ───────────────────────────────────── */}
          {currentView === 'reset-verify' && (
            <>
              <BackBtn to="reset-request" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(201,161,59,0.12)' }}>
                <KeyRound className="h-6 w-6" style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY }}>إعادة تعيين كلمة المرور</h2>
              <p className="text-sm mb-7" style={{ color: '#9ca3af' }}>تم إرسال رمز التحقق إلى بريدك الإلكتروني</p>
              <ErrorBanner msg={resetError} />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>رمز التحقق</Label>
                  <input type="text" placeholder="أدخل رمز التحقق" value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    className={`${inputCls} text-center font-mono tracking-widest text-base`}
                    maxLength={6} disabled={verifyResetMutation.isPending} />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type={showNewPassword ? 'text' : 'password'} placeholder="أدخل كلمة المرور الجديدة"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px', paddingInlineStart: '40px' }} disabled={verifyResetMutation.isPending} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute top-1/2 -translate-y-1/2" style={{ color: '#9ca3af', insetInlineStart: '14px' }}>
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type={showNewPassword ? 'text' : 'password'} placeholder="أعد إدخال كلمة المرور"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px' }} disabled={verifyResetMutation.isPending} />
                  </div>
                </div>
                <button onClick={handleVerifyAndReset} disabled={verifyResetMutation.isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  {...goldBtn}>
                  {verifyResetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verifyResetMutation.isPending ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleSendResetCode}
                    className="text-xs transition-colors" style={{ color: '#9ca3af' }}
                    onMouseEnter={e => { (e.currentTarget).style.color = GOLD; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = '#9ca3af'; }}>
                    لم يصلك الرمز؟ إعادة الإرسال
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── RESET SUCCESS ───────────────────────────────────── */}
          {currentView === 'reset-success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>تم بنجاح!</h2>
              <p className="text-sm mb-8" style={{ color: '#9ca3af' }}>
                تم إعادة تعيين كلمة المرور. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </p>
              <button onClick={() => { resetAllStates(); setCurrentView('login'); }}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition"
                {...goldBtn}>
                تسجيل الدخول
              </button>
            </div>
          )}

          {/* ── ACTIVATE VERIFY ──────────────────────────────────── */}
          {currentView === 'activate-verify' && (
            <>
              <BackBtn to="main" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(201,161,59,0.12)' }}>
                <ShieldCheck className="h-6 w-6" style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY }}>تفعيل حساب موظف</h2>
              <p className="text-sm mb-7" style={{ color: '#9ca3af' }}>أدخل الرقم الوظيفي وكود التفعيل المرسل إلى بريدك الإلكتروني</p>
              <ErrorBanner msg={activateError} />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>الرقم الوظيفي</Label>
                  <div className="relative">
                    <User className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type="text" placeholder="أدخل الرقم الوظيفي" value={empNumber}
                      onChange={e => setEmpNumber(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px' }} dir="ltr"
                      disabled={verifyActivationMut.isPending} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>كود التفعيل</Label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type="text" placeholder="أدخل كود التفعيل" value={activationCode}
                      onChange={e => setActivationCode(e.target.value)}
                      className={`${inputCls} font-mono tracking-widest`}
                      style={{ paddingInlineEnd: '40px' }} dir="ltr" maxLength={10}
                      disabled={verifyActivationMut.isPending} />
                  </div>
                </div>
                <button onClick={handleActivateVerify} disabled={verifyActivationMut.isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  {...goldBtn}>
                  {verifyActivationMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {verifyActivationMut.isPending ? 'جاري التحقق...' : 'تحقق وتفعيل'}
                </button>
              </div>
            </>
          )}

          {/* ── ACTIVATE PASSWORD ─────────────────────────────────── */}
          {currentView === 'activate-password' && (
            <>
              <BackBtn to="activate-verify" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(201,161,59,0.12)' }}>
                <ShieldCheck className="h-6 w-6" style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY }}>إنشاء كلمة المرور</h2>
              <p className="text-sm mb-7" style={{ color: '#9ca3af' }}>
                مرحباً {activateEmpName ? activateEmpName : ''}، قم بإنشاء كلمة مرور لحسابك
              </p>
              <ErrorBanner msg={activateError} />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type={showActivatePassword ? 'text' : 'password'} placeholder="أدخل كلمة المرور"
                      value={activatePassword} onChange={e => setActivatePassword(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px', paddingInlineStart: '40px' }} disabled={completeActivationMut.isPending} />
                    <button type="button" onClick={() => setShowActivatePassword(!showActivatePassword)}
                      className="absolute top-1/2 -translate-y-1/2" style={{ color: '#9ca3af', insetInlineStart: '14px' }}>
                      {showActivatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>8 أحرف على الأقل</p>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9ca3af', insetInlineEnd: '14px' }} />
                    <input type={showActivatePassword ? 'text' : 'password'} placeholder="أعد إدخال كلمة المرور"
                      value={confirmActivatePassword} onChange={e => setConfirmActivatePassword(e.target.value)} className={inputCls}
                      style={{ paddingInlineEnd: '40px' }} disabled={completeActivationMut.isPending} />
                  </div>
                </div>
                <button onClick={handleActivateComplete} disabled={completeActivationMut.isPending}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  {...goldBtn}>
                  {completeActivationMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {completeActivationMut.isPending ? 'جاري التفعيل...' : 'تفعيل الحساب'}
                </button>
              </div>
            </>
          )}

          {/* ── ACTIVATE SUCCESS ──────────────────────────────────── */}
          {currentView === 'activate-success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="h-8 w-8" style={{ color: '#10b981' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>تم تفعيل حسابك بنجاح!</h2>
              <p className="text-sm mb-8" style={{ color: '#9ca3af' }}>
                يمكنك الآن تسجيل الدخول باستخدام بياناتك الجديدة.
              </p>
              <button onClick={() => { resetAllStates(); setCurrentView('login'); }}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition"
                {...goldBtn}>
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ backgroundColor: APP_BG, fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', overflowX: 'hidden', width: '100%' }}>
      {/* Fade-in keyframes */}
      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; width: 100%; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(228,231,236,0.8)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo */}
            <button
              onClick={() => { resetAllStates(); setCurrentView('main'); }}
              className="flex items-center gap-3 focus:outline-none"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-110"
                style={{ backgroundColor: PRIMARY, color: GOLD }}
              >
                غ
              </div>
              <span className="font-bold text-xl md:text-2xl" style={{ color: PRIMARY }}>نظام غيث</span>
            </button>
            {/* Mobile indicator or small label could go here if needed */}
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className={currentView === 'main' ? 'flex flex-col' : 'flex-1 flex flex-col'}>
        {renderContent()}
      </main>
    </div>
  );
}
