import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, User, Loader2 } from 'lucide-react';

export default function BranchSelector() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { branches, branchesLoading, setSelectedBranchId, setSelectedCompanyId, selectedRole } = useAppContext();

  // Fetch companies to map branchId → companyId
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated]);

  // Redirect non-admin/GM users directly to home ONLY if they have 0 or 1 branch
  useEffect(() => {
    if (!authLoading && isAuthenticated && !branchesLoading && user?.role) {
      const role = user.role.toLowerCase();
      const isAdminOrGM = role === 'owner' || role === 'admin' || role === 'system_admin' || role === 'general_manager';

      if (!isAdminOrGM) {
        if (branches.length === 1) {
          // If only one branch, auto-select it and go home
          handleBranchEntry(branches[0].id);
        } else if (branches.length === 0) {
          // No branches found for this user
          setLocation('/');
        }
        // If more than 1 branch, stay here and let them choose
      }
    }
  }, [authLoading, isAuthenticated, branchesLoading, user?.role, branches.length]);

  const handleAdminEntry = () => {
    setSelectedBranchId(null);
    setSelectedCompanyId(null);
    setLocation('/');
  };

  const handleBranchEntry = (branchId: number) => {
    // Find the company associated with this branch
    const company = (companies as any[]).find((c: any) => c.branchId === branchId);
    if (company) setSelectedCompanyId(company.id);
    setSelectedBranchId(branchId);
    setLocation('/');
  };

  const isLoading = authLoading || branchesLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <Loader2 size={40} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const displayName = (user?.username || user?.email || 'المستخدم').toUpperCase();

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 24px',
        fontFamily: 'inherit',
      }}
    >
      {/* Welcome Header */}
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a202c', margin: 0 }}>
          مرحباً بك يا{' '}
          <span style={{ color: '#C9A84C' }}>{displayName}</span>
        </h1>
        <p style={{ color: '#6b7280', marginTop: '10px', fontSize: '1rem' }}>
          يرجى اختيار لوحة التحكم المطلوبة للبدء
        </p>
      </div>

      {/* Admin Panel Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          backgroundColor: '#3d4554',
          borderRadius: '16px',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '44px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1 }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(201, 168, 76, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #C9A84C',
              flexShrink: 0,
            }}
          >
            <Shield size={24} style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
              لوحة تحكم المدير (كافة المؤسسات)
            </h2>
            <p style={{ color: '#9ca3af', marginTop: '5px', fontSize: '0.88rem', margin: '5px 0 0 0' }}>
              نظرة عامة وتقارير شاملة لجميع الكيانات والأفرع التابعة.
            </p>
          </div>
        </div>
        <button
          onClick={handleAdminEntry}
          style={{
            backgroundColor: '#C9A84C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 26px',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b8972f')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C9A84C')}
        >
          دخول الإدارة
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }} />
        <span style={{ color: '#9ca3af', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
          أو اختر فرعاً محدداً
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }} />
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>لا توجد فروع متاحة</p>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '16px',
          }}
        >
          {branches.map(branch => (
            <div
              key={branch.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={20} style={{ color: '#9ca3af' }} />
                </div>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '1rem', color: '#1a202c' }}>
                    {branch.name}
                  </span>
                  {(branch.nameAr || branch.city) && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                      {branch.nameAr}{branch.nameAr && branch.city ? ' — ' : ''}{branch.city}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleBranchEntry(branch.id)}
                style={{
                  backgroundColor: 'white',
                  color: '#C9A84C',
                  border: '2px solid #C9A84C',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#C9A84C';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#C9A84C';
                }}
              >
                دخول النظام
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
