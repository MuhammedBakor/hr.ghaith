import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const commsService = {
  getCorrespondences: async (params?: any) => (await api.get("/comms/correspondences", { params })).data,
  createCorrespondence: async (data: any) => (await api.post("/comms/correspondences", data)).data,
  updateCorrespondence: async (id: number, data: any) => (await api.put(`/comms/correspondences/${id}`, data)).data,
  deleteCorrespondence: async (id: number) => { await api.delete(`/comms/correspondences/${id}`); },
  sendCorrespondence: async (id: number) => (await api.post(`/comms/correspondences/${id}/send`)).data,
  updateCorrespondenceStatus: async (id: number, status: string) => (await api.put(`/comms/correspondences/${id}/status`, { status })).data,
  getCorrespondenceStats: async () => (await api.get("/comms/correspondences/stats")).data,

  getOfficialComms: async () => (await api.get("/comms/official")).data,
  createOfficialComm: async (data: any) => (await api.post("/comms/official", data)).data,
  updateOfficialComm: async (id: number, data: any) => (await api.put(`/comms/official/${id}`, data)).data,
  deleteOfficialComm: async (id: number) => { await api.delete(`/comms/official/${id}`); },
};

export function useCorrespondences(params?: any) {
  return useQuery({ queryKey: ["correspondences", params], queryFn: () => commsService.getCorrespondences(params) });
}
export function useCorrespondenceStats() {
  return useQuery({ queryKey: ["correspondence-stats"], queryFn: commsService.getCorrespondenceStats });
}
export function useCreateCorrespondence() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => commsService.createCorrespondence(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["correspondences"] }) });
}
export function useUpdateCorrespondence() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => commsService.updateCorrespondence(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["correspondences"] }) });
}
export function useDeleteCorrespondence() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => commsService.deleteCorrespondence(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["correspondences"] }) });
}
export function useSendCorrespondence() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => commsService.sendCorrespondence(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["correspondences"] }) });
}
export function useUpdateCorrespondenceStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: any) => commsService.updateCorrespondenceStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["correspondences"] }) });
}
export function useOfficialComms() {
  return useQuery({ queryKey: ["official-comms"], queryFn: commsService.getOfficialComms });
}
export function useCreateOfficialComm() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => commsService.createOfficialComm(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["official-comms"] }) });
}
export function useUpdateOfficialComm() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => commsService.updateOfficialComm(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["official-comms"] }) });
}
export function useDeleteOfficialComm() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => commsService.deleteOfficialComm(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["official-comms"] }) });
}