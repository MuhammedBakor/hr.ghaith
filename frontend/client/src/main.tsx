import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { AppProvider } from "./contexts/AppContext";
import "./index.css";

const queryClient = new QueryClient();

// Redirect to login page when unauthorized
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Only redirect if not already on auth pages
  const authPages = ['/login', '/register'];
  const isOnAuthPage = authPages.some(page => window.location.pathname.includes(page));
  if (!isOnAuthPage) {
    window.location.href = '/login';
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
    
    // Global toast for mutation errors (only if no local onError handler)
    const mutation = event.mutation;
    const hasLocalHandler = !!(mutation.options as any)?.onError;
    if (!hasLocalHandler && typeof window !== 'undefined') {
      const msg = error instanceof TRPCClientError 
        ? (error.message || 'حدث خطأ في العملية')
        : 'حدث خطأ غير متوقع';
      // Dispatch custom event for toast system
      window.dispatchEvent(new CustomEvent('global-mutation-error', { detail: { message: msg } }));
    }
  }
});

// SECURITY FIX v82: CSRF — fetch token once, send as header
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
// Request CSRF token on first load
fetch('/api/csrf-token', { credentials: 'include' }).catch(() => {});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const csrfToken = getCsrfToken();
        const headers = new Headers((init as any)?.headers);
        if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <App />
      </AppProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
