
// ═══ Centralized TanStack Query Configuration ═══
// Optimizes caching and reduces unnecessary API calls

export const queryDefaults = {
  staleTime: 2 * 60 * 1000,        // 2 minutes — data freshness window
  gcTime: 10 * 60 * 1000,           // 10 minutes — garbage collection
  refetchOnWindowFocus: false,       // Don't refetch on tab switch
  refetchOnReconnect: true,          // Refetch after network restore
  retry: 2,                          // Retry failed queries twice
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
};

// ═══ Per-module stale times ═══
export const staleTimes = {
  auth: 5 * 60 * 1000,         // 5 min — rarely changes
  siteSettings: 10 * 60 * 1000, // 10 min — very stable
  lists: 3 * 60 * 1000,         // 3 min — moderate freshness
  dashboard: 30 * 1000,         // 30 sec — needs live data
  notifications: 15 * 1000,     // 15 sec — near real-time
  reports: 5 * 60 * 1000,       // 5 min — computed data
};

// ═══ Mutation defaults ═══
export const mutationDefaults = {
  retry: 1,
  retryDelay: 2000,
};

export default { queryDefaults, staleTimes, mutationDefaults };
