import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const reportsService = {
  getCustomReports: async () => (await api.get("/reports/custom")).data,
  createCustomReport: async (data: any) => (await api.post("/reports/custom", data)).data,
  updateCustomReport: async (id: number, data: any) => (await api.put(`/reports/custom/${id}`, data)).data,
  deleteCustomReport: async (id: number) => { await api.delete(`/reports/custom/${id}`); },
  runReport: async (id: number) => (await api.post(`/reports/custom/${id}/run`)).data,

  getScheduledReports: async () => (await api.get("/reports/scheduled")).data,
  createScheduledReport: async (data: any) => (await api.post("/reports/scheduled", data)).data,
  updateScheduledReport: async (id: number, data: any) => (await api.put(`/reports/scheduled/${id}`, data)).data,
  deleteScheduledReport: async (id: number) => { await api.delete(`/reports/scheduled/${id}`); },
};

export function useCustomReports() {
  return useQuery({ queryKey: ["custom-reports"], queryFn: reportsService.getCustomReports });
}
export function useCreateCustomReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => reportsService.createCustomReport(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-reports"] }) });
}
export function useUpdateCustomReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => reportsService.updateCustomReport(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-reports"] }) });
}
export function useDeleteCustomReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => reportsService.deleteCustomReport(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-reports"] }) });
}
export function useScheduledReports() {
  return useQuery({ queryKey: ["scheduled-reports"], queryFn: reportsService.getScheduledReports });
}
export function useCreateScheduledReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => reportsService.createScheduledReport(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-reports"] }) });
}
export function useUpdateScheduledReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => reportsService.updateScheduledReport(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-reports"] }) });
}
export function useDeleteScheduledReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => reportsService.deleteScheduledReport(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-reports"] }) });
}
