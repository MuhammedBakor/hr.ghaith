import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const integrationsService = {
  getIntegrations: async () => (await api.get("/integrations")).data,
  updateIntegration: async (id: number, data: any) => (await api.put(`/integrations/${id}`, data)).data,
  testConnection: async (id: number) => (await api.post(`/integrations/${id}/test`)).data,
  toggleIntegration: async (id: number, enabled: boolean) => (await api.put(`/integrations/${id}/toggle`, { enabled })).data,
};

export function useIntegrations() {
  return useQuery({ queryKey: ["integrations"], queryFn: integrationsService.getIntegrations });
}
export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => integrationsService.updateIntegration(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }) });
}
export function useTestConnection() {
  return useMutation({ mutationFn: (id: number) => integrationsService.testConnection(id) });
}
export function useToggleIntegration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, enabled }: any) => integrationsService.toggleIntegration(id, enabled), onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }) });
}
