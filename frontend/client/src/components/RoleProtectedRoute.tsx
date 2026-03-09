import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAppContext, ModuleType } from '@/contexts/AppContext';
import { useAuth } from '@/_core/hooks/useAuth';

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    module?: ModuleType;
    hrSubPage?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, module, hrSubPage }) => {
    const { canAccessModule, canAccessHrSubPage } = useAppContext();
    const { isAuthenticated, loading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            setLocation('/login');
            return;
        }

        if (!loading && isAuthenticated) {
            if (module && !canAccessModule(module)) {
                setLocation('/');
                return;
            }

            if (hrSubPage && !canAccessHrSubPage(hrSubPage)) {
                setLocation('/');
                return;
            }
        }
    }, [loading, isAuthenticated, module, hrSubPage, canAccessModule, canAccessHrSubPage, setLocation]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (module && !canAccessModule(module)) return null;
    if (hrSubPage && !canAccessHrSubPage(hrSubPage)) return null;

    return <>{children}</>;
};

