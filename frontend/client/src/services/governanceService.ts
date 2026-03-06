import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const governanceService = {
  getAccessRestrictions: async () => (await api.get("/governance/access-restrictions")).data,
  createAccessRestriction: async (data: any) => (await api.post("/governance/access-restrictions", data)).data,
  updateAccessRestriction: async (id: number, data: any) => (await api.put(`/governance/access-restrictions/${id}`, data)).data,
  deleteAccessRestriction: async (id: number) => { await api.delete(`/governance/access-restrictions/${id}`); },

  getBusinessRules: async () => (await api.get("/governance/business-rules")).data,
  createBusinessRule: async (data: any) => (await api.post("/governance/business-rules", data)).data,
  updateBusinessRule: async (id: number, data: any) => (await api.put(`/governance/business-rules/${id}`, data)).data,
  deleteBusinessRule: async (id: number) => { await api.delete(`/governance/business-rules/${id}`); },
};

export function useAccessRestrictions() {
  return useQuery({ queryKey: ["access-restrictions"], queryFn: governanceService.getAccessRestrictions });
}
export function useCreateAccessRestriction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => governanceService.createAccessRestriction(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["access-restrictions"] }) });
}
export function useUpdateAccessRestriction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => governanceService.updateAccessRestriction(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["access-restrictions"] }) });
}
export function useDeleteAccessRestriction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => governanceService.deleteAccessRestriction(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["access-restrictions"] }) });
}
export function useBusinessRules() {
  return useQuery({ queryKey: ["business-rules"], queryFn: governanceService.getBusinessRules });
}
export function useCreateBusinessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => governanceService.createBusinessRule(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["business-rules"] }) });
}
export function useUpdateBusinessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => governanceService.updateBusinessRule(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["business-rules"] }) });
}
export function useDeleteBusinessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => governanceService.deleteBusinessRule(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["business-rules"] }) });
}
