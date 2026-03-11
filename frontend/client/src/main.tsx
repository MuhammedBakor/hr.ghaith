import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./contexts/AppContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,   // لا إعادة تحميل عند التركيز على النافذة
      refetchOnReconnect: false,     // لا إعادة تحميل عند إعادة الاتصال
      staleTime: 2 * 60 * 1000,     // البيانات صالحة لمدة دقيقتين قبل إعادة التحميل
    },
  },
});

// Redirect to login page when unauthorized (401)
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error as any;
    console.error("[API Query Error]", error);
    if (error?.response?.status === 401) {
      const authPages = ['/login', '/register'];
      const isOnAuthPage = authPages.some(page => window.location.pathname.includes(page));
      if (!isOnAuthPage) {
        window.location.href = '/login';
      }
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error as any;
    console.error("[API Mutation Error]", error);
    if (error?.response?.status === 401) {
      const authPages = ['/login', '/register'];
      const isOnAuthPage = authPages.some(page => window.location.pathname.includes(page));
      if (!isOnAuthPage) {
        window.location.href = '/login';
      }
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <App />
    </AppProvider>
  </QueryClientProvider>
);

