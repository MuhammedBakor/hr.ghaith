import { useUser } from "@/services/authService";

/**
 * Custom hook for authentication - centralizes auth.me calls
 * Uses REST API via authService instead of tRPC
 */
export function useAuth() {
  const { data: user, isLoading, isError, error, refetch } = useUser();

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user && !isError,
    error,
    refetch,
    // Convenience accessors
    userId: user?.id,
    userName: user?.username || '',
    userRole: user?.role || 'user',
    userEmail: user?.email || '',
    companyId: (user as any)?.companyId,
    branchId: (user as any)?.branchId,
  };
}

export default useAuth;
