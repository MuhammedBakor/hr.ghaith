import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { Building2, MapPin, Globe } from 'lucide-react';

export default function CompaniesOverview() {
  const { setSelectedBranchId, setSelectedCompanyId } = useAppContext();
  const [, setLocation] = useLocation();

  const { data: adminCompanies, isLoading } = useQuery<any[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-6 min-h-screen" style={{ background: '#F5F7FA' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black" style={{ color: '#2F3440' }}>المؤسسات والشركات</h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>انقر على مؤسسة للدخول إلى لوحة التحكم الخاصة بها</p>
        </div>
        <div className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A13B' }}>
          {adminCompanies?.length || 0} مؤسسة
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#C9A13B', borderTopColor: 'transparent' }} />
        </div>
      ) : (!adminCompanies || adminCompanies.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <Building2 className="w-14 h-14 mb-4" style={{ color: '#d1d5db' }} />
          <p className="text-base font-medium" style={{ color: '#9ca3af' }}>لا توجد شركات مضافة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {adminCompanies.map((company: any) => (
            <div
              key={company.id}
              className="rounded-2xl p-4 md:p-5 cursor-pointer group transition-all duration-200"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #f0f0f0',
                boxShadow: '0 4px 20px rgba(30,58,95,0.08)',
              }}
              onClick={() => {
                setSelectedCompanyId(company.id);
                setSelectedBranchId(company.branchId ?? company.id);
                setLocation('/');
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(30,58,95,0.15)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgb(201,168,76)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(30,58,95,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}>
                <Building2 className="w-6 h-6" style={{ color: 'rgb(201,168,76)' }} />
              </div>
              <h3 className="font-bold text-base mb-1 truncate" style={{ color: '#1a2035' }}>
                {company.nameAr || company.name}
              </h3>
              {company.nameEn && company.nameEn !== company.nameAr && (
                <p className="text-xs mb-2 truncate" style={{ color: '#9ca3af' }}>{company.nameEn}</p>
              )}
              <div className="space-y-1 mt-3">
                {company.city && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{company.city}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b7280' }}>
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
                {company.status && (
                  <div className="mt-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: company.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: company.status === 'active' ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {company.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
