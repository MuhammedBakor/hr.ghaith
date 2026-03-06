import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const workflowService = {
  getTemplates: async () => (await api.get("/workflow/templates")).data,
  createTemplate: async (data: any) => (await api.post("/workflow/templates", data)).data,
  updateTemplate: async (id: number, data: any) => (await api.put(`/workflow/templates/${id}`, data)).data,
  deleteTemplate: async (id: number) => { await api.delete(`/workflow/templates/${id}`); },

  getApprovals: async () => (await api.get("/workflow/approvals")).data,
  approveRequest: async (id: number, data?: any) => (await api.post(`/workflow/approvals/${id}/approve`, data)).data,
  rejectRequest: async (id: number, data?: any) => (await api.post(`/workflow/approvals/${id}/reject`, data)).data,
};

export function useWorkflowTemplates() {
  return useQuery({ queryKey: ["workflow-templates"], queryFn: workflowService.getTemplates });
}
export function useCreateWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => workflowService.createTemplate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-templates"] }) });
}
export function useUpdateWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => workflowService.updateTemplate(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-templates"] }) });
}
export function useDeleteWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => workflowService.deleteTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-templates"] }) });
}
export function useApprovals() {
  return useQuery({ queryKey: ["approvals"], queryFn: workflowService.getApprovals });
}
export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => workflowService.approveRequest(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }) });
}
export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => workflowService.rejectRequest(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }) });
}