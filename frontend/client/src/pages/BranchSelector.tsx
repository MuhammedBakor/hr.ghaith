import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, User, Loader2 } from 'lucide-react';
import { roleLabels, UserRoleType } from '@/contexts/AppContext';

// Map server role to UI role
const mapServerRole = (sr: string): string => {
  if (!sr) return 'employee';
  const s = sr.toLowerCase();
  if (s === 'owner' || s === 'admin' || s === 'system_admin') return 'admin';
  if (s === 'general_manager') return 'general_manager';
  if (s === 'departement_manager') return 'department_manager';
  if (s === 'supervisor') return 'supervisor';
  if (s === 'agent') return 'agent';
  return 'employee';
};

export default function BranchSelector() {
  const [, setLocation] = useLocation();
  const {
    allowedBranches,
    setSelectedBranchId,
    setSelectedCompanyId,
    setSelectedRole,
    setSelectedEmployeeId,
    currentUserId
  } = useAppContext();
  const { user, loading: authLoading } = useAuth();

  const handleAdminEntry = () => {
    setSelectedBranchId(null);
    setSelectedCompanyId(null);
    setLocation('/');
  };

  const handleBranchEntry = (access: any) => {
    setSelectedBranchId(access.branchId);
    setSelectedEmployeeId(access.employeeId);
    setSelectedRole(mapServerRole(access.role) as UserRoleType);
    setLocation('/');
  };

  const isLoading = authLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <Loader2 size={40} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const displayName = (user?.username || user?.email || 'المستخدم').toUpperCase();

  const isAdminOrGM = user?.role && (
    ['owner', 'admin', 'system_admin', 'general_manager'].includes(user.role.toLowerCase())
  );

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

      {/* Admin Panel Card - Only for Admin/GM */}
      {isAdminOrGM ? (
        <>
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
        </>
      ) : (
        <div style={{ width: '100%', maxWidth: '900px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#4b5563', borderRight: '4px solid #C9A84C', paddingRight: '16px' }}>
            اختر فرعاً محدداً
          </h2>
        </div>
      )}

      {/* Branches Grid */}
      {allowedBranches.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>لا توجد فروع متاحة أو سجلات موظفين نشطة</p>
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
          {allowedBranches.map((access, idx) => (
            <div
              key={idx}
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
                    backgroundColor: 'rgba(201, 168, 76, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={20} style={{ color: '#C9A84C' }} />
                </div>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1a202c' }}>
                    {access.branchName}
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    الدور: {roleLabels[mapServerRole(access.role) as UserRoleType] || access.role}
                    {access.employeeStatus !== 'active' && (
                      <span style={{ color: '#ef4444', marginRight: '8px' }}>
                        ({access.employeeStatus === 'suspended' ? 'موقوف' : access.employeeStatus})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBranchEntry(access)}
                disabled={access.employeeStatus === 'suspended' || access.employeeStatus === 'terminated'}
                style={{
                  backgroundColor: 'white',
                  color: '#C9A84C',
                  border: '2px solid #C9A84C',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontWeight: '700',
                  cursor: (access.employeeStatus === 'suspended' || access.employeeStatus === 'terminated') ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  opacity: (access.employeeStatus === 'suspended' || access.employeeStatus === 'terminated') ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (access.employeeStatus === 'active' || access.employeeStatus === 'incomplete') {
                    e.currentTarget.style.backgroundColor = '#C9A84C';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={e => {
                  if (access.employeeStatus === 'active' || access.employeeStatus === 'incomplete') {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#C9A84C';
                  }
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
