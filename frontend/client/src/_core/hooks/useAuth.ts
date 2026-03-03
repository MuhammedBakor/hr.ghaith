import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo } from "react";
import { authService, useUser } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const queryClient = useQueryClient();

  const userQuery = useUser();

  const logout = useCallback(async () => {
    try {
      authService.logout();
      queryClient.setQueryData(["user"], null);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      window.location.href = redirectPath;
    }
  }, [queryClient, redirectPath]);

  const state = useMemo(() => {
    try {
      if (userQuery.data) {
        const { id, username: name, role } = userQuery.data;
        localStorage.setItem("erp-user-context", JSON.stringify({ id, name, role }));
      } else {
        localStorage.removeItem("erp-user-context");
      }
    } catch { }

    return {
      user: userQuery.data ?? null,
      loading: userQuery.isLoading,
      error: userQuery.error ?? null,
      isAuthenticated: Boolean(userQuery.data),
    };
  }, [userQuery.data, userQuery.error, userQuery.isLoading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (userQuery.isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    userQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => userQuery.refetch(),
    logout,
  };
}
