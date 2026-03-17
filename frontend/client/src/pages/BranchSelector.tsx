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
  const { branches, branchesLoading, setSelectedBranchId, setSelectedCompanyId, selectedRole, currentEmployee } = useAppContext();

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

  // Redirect non-admin/GM users directly to home ONLY if they have 0 branches
  useEffect(() => {
    if (!authLoading && isAuthenticated && !branchesLoading && user?.role) {
      const role = user.role.toLowerCase();
      const isAdminOrGM = role === 'owner' || role === 'admin' || role === 'system_admin' || role === 'general_manager';

      if (!isAdminOrGM) {
        if (branches.length === 0) {
          // No branches found for this user
          setLocation('/');
        }
        // Always stay here for 1 or more branches to show the portal choice
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

  // Show employee full name (Arabic first, then English), fallback to username
  const displayName = currentEmployee
    ? (currentEmployee.firstNameAr && currentEmployee.lastNameAr
        ? `${currentEmployee.firstNameAr} ${currentEmployee.lastNameAr}`
        : `${currentEmployee.firstName || ''} ${currentEmployee.lastName || ''}`.trim())
    : (user?.username || 'المستخدم');

  const role = user?.role?.toLowerCase();
  const isAdminOrOwner = role === 'owner' || role === 'admin' || role === 'system_admin' || role === 'general_manager';
  const isEmployeeType = role === 'employee' || role === 'departement_manager' || role === 'agent' || role === 'supervisor';

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f5f7fa] dark:bg-[#0f172a] flex flex-col items-center px-4 py-16 font-sans transition-colors duration-300"
    >
      {/* Welcome Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-black text-[#1a202c] dark:text-white mb-2">
          مرحباً بك،{' '}
          <span className="text-[#C9A13B]">{displayName}</span>
        </h1>
        <p className="text-[#6b7280] dark:text-gray-400 text-lg">
          يرجى اختيار لوحة التحكم أو الفرع المطلوب للبدء
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Admin Panel Card */}
        {isAdminOrOwner && (
          <div
            onClick={handleAdminEntry}
            className="cursor-pointer group flex flex-col md:flex-row md:items-center justify-between p-8 rounded-2xl shadow-xl hover:shadow-[#C9A13B]/20 hover:scale-[1.01] transition-all duration-300 border border-gray-600 bg-gradient-to-l from-[#2F3440] to-[#4A4E59] text-white"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full border border-[#C9A13B] bg-black/20 flex items-center justify-center text-[#C9A13B] flex-shrink-0">
                <Shield size={32} />
              </div>
              <div>
                <h2 className="font-black text-2xl mb-1">لوحة تحكم المدير (كافة المؤسسات)</h2>
                <p className="text-sm text-gray-300">نظرة عامة وتقارير شاملة لجميع الكيانات والأفرع التابعة.</p>
              </div>
            </div>
            <button className="mt-6 md:mt-0 px-10 py-3.5 bg-[#C9A13B] hover:bg-[#A8842F] text-white font-black rounded-xl shadow-lg transition flex-shrink-0">
              دخول الإدارة
            </button>
          </div>
        )}

        {/* Employee Portal Card */}
        {isEmployeeType && (
          <div
            onClick={handleAdminEntry}
            className="cursor-pointer group flex flex-col md:flex-row md:items-center justify-between p-8 rounded-2xl shadow-xl hover:shadow-blue-500/20 hover:scale-[1.01] transition-all duration-300 border border-blue-400 bg-gradient-to-l from-[#1e3a8a] to-[#3b82f6] text-white"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full border border-blue-300 bg-white/10 flex items-center justify-center text-blue-100 flex-shrink-0">
                <User size={32} />
              </div>
              <div>
                <h2 className="font-black text-2xl mb-1">بوابة الموظف الموحدة</h2>
                <p className="text-sm text-blue-100">بوابة الموظف لعرض المهام والصلاحيات في جميع الفروع.</p>
              </div>
            </div>
            <button className="mt-6 md:mt-0 px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg transition flex-shrink-0">
              دخول البوابة
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-6 py-6 transition-opacity duration-500">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          <span className="text-[#9ca3af] font-bold text-sm whitespace-nowrap">
            أو اختر فرعاً محدداً للعمل عليه
          </span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <p className="text-[#9ca3af] dark:text-gray-500 font-bold">لا توجد فروع متاحة حالياً</p>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pb-20">
          {branches.map(branch => (
            <div
              key={branch.id}
              onClick={() => handleBranchEntry(branch.id)}
              className="group cursor-pointer bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-[#C9A13B]/40 hover:border-t-[#C9A13B]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[#9ca3af] group-hover:text-[#C9A13B] transition-colors duration-300">
                  <User size={28} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1a202c] dark:text-white group-hover:text-[#C9A13B] transition-colors">
                    {branch.name}
                  </h3>
                  {(branch.nameAr || branch.city) && (
                    <p className="text-sm text-[#6b7280] dark:text-gray-400 mt-1">
                      {branch.nameAr || branch.city}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBranchEntry(branch.id);
                }}
                className="bg-white dark:bg-transparent text-[#C9A13B] border-2 border-[#C9A13B] px-6 py-2 rounded-xl font-bold hover:bg-[#C9A13B] hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
              >
                دخول
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
