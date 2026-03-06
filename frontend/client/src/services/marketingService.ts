import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const marketingService = {
  getCampaigns: async () => (await api.get("/marketing/campaigns")).data,
  createCampaign: async (data: any) => (await api.post("/marketing/campaigns", data)).data,
  updateCampaign: async (id: number, data: any) => (await api.put(`/marketing/campaigns/${id}`, data)).data,
  deleteCampaign: async (id: number) => { await api.delete(`/marketing/campaigns/${id}`); },

  getLeads: async () => (await api.get("/marketing/leads")).data,
  createLead: async (data: any) => (await api.post("/marketing/leads", data)).data,
  updateLead: async (id: number, data: any) => (await api.put(`/marketing/leads/${id}`, data)).data,
  deleteLead: async (id: number) => { await api.delete(`/marketing/leads/${id}`); },
};

export function useCampaigns() {
  return useQuery({ queryKey: ["campaigns"], queryFn: marketingService.getCampaigns });
}
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => marketingService.createCampaign(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });
}
export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => marketingService.updateCampaign(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });
}
export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => marketingService.deleteCampaign(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });
}
export function useLeads() {
  return useQuery({ queryKey: ["leads"], queryFn: marketingService.getLeads });
}
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => marketingService.createLead(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }) });
}
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => marketingService.updateLead(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }) });
}
export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => marketingService.deleteLead(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }) });
}
