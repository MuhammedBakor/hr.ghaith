import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/**
 * Custom hook for site settings - uses REST API
 */
export function useSiteSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await api.get("/settings");
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const settings = Array.isArray(data) ? data : [];

  const getSetting = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find((s: any) => s.settingKey === key || s.key === key);
    return (setting?.settingValue as string) || (setting?.value as string) || defaultValue;
  };

  return { settings, isLoading, getSetting };
}

export default useSiteSettings;
