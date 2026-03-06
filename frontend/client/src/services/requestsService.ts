import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const requestsService = {
  getRequests: async () => (await api.get("/requests")).data,
  createRequest: async (data: any) => (await api.post("/requests", data)).data,
  updateRequest: async (id: number, data: any) => (await api.put(`/requests/${id}`, data)).data,
  deleteRequest: async (id: number) => { await api.delete(`/requests/${id}`); },

  getRequestTypes: async () => (await api.get("/requests/types")).data,
  createRequestType: async (data: any) => (await api.post("/requests/types", data)).data,
  updateRequestType: async (id: number, data: any) => (await api.put(`/requests/types/${id}`, data)).data,
  deleteRequestType: async (id: number) => { await api.delete(`/requests/types/${id}`); },

  getWorkflows: async () => (await api.get("/requests/workflows")).data,
  createWorkflow: async (data: any) => (await api.post("/requests/workflows", data)).data,
  updateWorkflow: async (id: number, data: any) => (await api.put(`/requests/workflows/${id}`, data)).data,
  deleteWorkflow: async (id: number) => { await api.delete(`/requests/workflows/${id}`); },
};

export function useRequests() {
  return useQuery({ queryKey: ["requests"], queryFn: requestsService.getRequests });
}
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => requestsService.createRequest(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }) });
}
export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => requestsService.updateRequest(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }) });
}
export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => requestsService.deleteRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }) });
}
export function useRequestTypes() {
  return useQuery({ queryKey: ["request-types"], queryFn: requestsService.getRequestTypes });
}
export function useCreateRequestType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => requestsService.createRequestType(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-types"] }) });
}
export function useUpdateRequestType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => requestsService.updateRequestType(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-types"] }) });
}
export function useDeleteRequestType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => requestsService.deleteRequestType(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-types"] }) });
}
export function useRequestWorkflows() {
  return useQuery({ queryKey: ["request-workflows"], queryFn: requestsService.getWorkflows });
}
export function useCreateRequestWorkflow() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => requestsService.createWorkflow(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-workflows"] }) });
}
export function useUpdateRequestWorkflow() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => requestsService.updateWorkflow(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-workflows"] }) });
}
export function useDeleteRequestWorkflow() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => requestsService.deleteWorkflow(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["request-workflows"] }) });
}