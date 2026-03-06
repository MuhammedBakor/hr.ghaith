import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const platformService = {
  // Unified Inbox
  getInboxTasks: async () => (await api.get("/platform/inbox")).data,
  updateInboxTask: async (id: number, data: any) => (await api.put(`/platform/inbox/${id}`, data)).data,

  // Sessions
  getSessions: async () => (await api.get("/auth/sessions")).data,
  terminateSession: async (sessionId: string) => (await api.post("/auth/sessions/terminate", { sessionId })).data,

  // Search
  globalSearch: async (query: string) => (await api.get("/platform/search", { params: { query } })).data,

  // Monitoring
  getMonitoring: async () => (await api.get("/platform/monitoring")).data,

  // Notifications
  getNotifications: async () => (await api.get("/platform/notifications")).data,
  markNotificationRead: async (id: number) => (await api.put(`/platform/notifications/${id}/read`)).data,
  markAllRead: async () => (await api.post("/platform/notifications/read-all")).data,

  getNotifyRules: async () => (await api.get("/platform/notify-rules")).data,
  createNotifyRule: async (data: any) => (await api.post("/platform/notify-rules", data)).data,
  updateNotifyRule: async (id: number, data: any) => (await api.put(`/platform/notify-rules/${id}`, data)).data,
  deleteNotifyRule: async (id: number) => { await api.delete(`/platform/notify-rules/${id}`); },

  getNotifyPreferences: async () => (await api.get("/platform/notify-preferences")).data,
  updateNotifyPreferences: async (data: any) => (await api.put("/platform/notify-preferences", data)).data,

  // DMS
  getDmsDocuments: async () => (await api.get("/platform/dms")).data,
  createDmsDocument: async (data: any) => (await api.post("/platform/dms", data)).data,
  updateDmsDocument: async (id: number, data: any) => (await api.put(`/platform/dms/${id}`, data)).data,
  deleteDmsDocument: async (id: number) => { await api.delete(`/platform/dms/${id}`); },

  // Calendar
  getEvents: async () => (await api.get("/platform/calendar")).data,
  createEvent: async (data: any) => (await api.post("/platform/calendar", data)).data,
  updateEvent: async (id: number, data: any) => (await api.put(`/platform/calendar/${id}`, data)).data,
  deleteEvent: async (id: number) => { await api.delete(`/platform/calendar/${id}`); },

  // Alerts
  getAlerts: async () => (await api.get("/platform/alerts")).data,
  markAlertRead: async (id: number) => (await api.put(`/platform/alerts/${id}/read`)).data,

  // AI Policy
  getAiPolicies: async () => (await api.get("/platform/ai-policies")).data,
  createAiPolicy: async (data: any) => (await api.post("/platform/ai-policies", data)).data,
  updateAiPolicy: async (id: number, data: any) => (await api.put(`/platform/ai-policies/${id}`, data)).data,

  // Upgrades
  getUpgrades: async () => (await api.get("/platform/upgrades")).data,
  installUpgrade: async (id: number) => (await api.post(`/platform/upgrades/${id}/install`)).data,
};

export function useInboxTasks() {
  return useQuery({ queryKey: ["inbox-tasks"], queryFn: platformService.getInboxTasks });
}
export function useUpdateInboxTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => platformService.updateInboxTask(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox-tasks"] }) });
}
export function useSessions() {
  return useQuery({ queryKey: ["sessions"], queryFn: platformService.getSessions });
}
export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (sessionId: string) => platformService.terminateSession(sessionId), onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }) });
}
export function useGlobalSearch(query: string) {
  return useQuery({ queryKey: ["global-search", query], queryFn: () => platformService.globalSearch(query), enabled: query.length > 1 });
}
export function useMonitoring() {
  return useQuery({ queryKey: ["monitoring"], queryFn: platformService.getMonitoring, refetchInterval: 30000 });
}
export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: platformService.getNotifications });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => platformService.markNotificationRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => platformService.markAllRead(), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
export function useNotifyRules() {
  return useQuery({ queryKey: ["notify-rules"], queryFn: platformService.getNotifyRules });
}
export function useCreateNotifyRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => platformService.createNotifyRule(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notify-rules"] }) });
}
export function useUpdateNotifyRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => platformService.updateNotifyRule(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notify-rules"] }) });
}
export function useDeleteNotifyRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => platformService.deleteNotifyRule(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["notify-rules"] }) });
}
export function useNotifyPreferences() {
  return useQuery({ queryKey: ["notify-preferences"], queryFn: platformService.getNotifyPreferences });
}
export function useUpdateNotifyPreferences() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => platformService.updateNotifyPreferences(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notify-preferences"] }) });
}
export function useDmsDocuments() {
  return useQuery({ queryKey: ["dms-documents"], queryFn: platformService.getDmsDocuments });
}
export function useCreateDmsDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => platformService.createDmsDocument(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["dms-documents"] }) });
}
export function useUpdateDmsDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => platformService.updateDmsDocument(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["dms-documents"] }) });
}
export function useDeleteDmsDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => platformService.deleteDmsDocument(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["dms-documents"] }) });
}
export function useCalendarEvents() {
  return useQuery({ queryKey: ["calendar-events"], queryFn: platformService.getEvents });
}
export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => platformService.createEvent(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }) });
}
export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => platformService.updateEvent(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }) });
}
export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => platformService.deleteEvent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }) });
}
export function usePlatformAlerts() {
  return useQuery({ queryKey: ["platform-alerts"], queryFn: platformService.getAlerts });
}
export function useAiPolicies() {
  return useQuery({ queryKey: ["ai-policies"], queryFn: platformService.getAiPolicies });
}
export function useUpgrades() {
  return useQuery({ queryKey: ["upgrades"], queryFn: platformService.getUpgrades });
}
