import { trpc } from "@/lib/trpc";

/**
 * Custom hook for site settings - centralizes siteSettings.list calls
 */
export function useSiteSettings() {
  const { data, isLoading } = trpc.siteSettings.list.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const settings = Array.isArray(data) ? data : [];
  
  const getSetting = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find((s: any) => s.key === key);
    return (setting?.value as string) || defaultValue;
  };

  return { settings, isLoading, getSetting };
}

export default useSiteSettings;
