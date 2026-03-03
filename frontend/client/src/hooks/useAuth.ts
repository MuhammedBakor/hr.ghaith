import { trpc } from "@/lib/trpc";

/**
 * Custom hook for authentication - centralizes auth.me calls
 * Reduces 115 individual auth.me useQuery calls to a single shared query
 */
export function useAuth() {
  const { data: user, isLoading, isError, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user && !isError,
    error,
    refetch,
    // Convenience accessors
    userId: user?.id,
    userName: user?.name || user?.username || '',
    userRole: user?.role || 'user',
    userEmail: user?.email || '',
    companyId: (user as any)?.companyId,
    branchId: (user as any)?.branchId,
  };
}

export default useAuth;
