import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const operationsService = {
  getProjects: async () => (await api.get("/operations/projects")).data,
  createProject: async (data: any) => (await api.post("/operations/projects", data)).data,
  updateProject: async (id: number, data: any) => (await api.put(`/operations/projects/${id}`, data)).data,
  deleteProject: async (id: number) => { await api.delete(`/operations/projects/${id}`); },

  getOpsStats: async () => (await api.get("/operations/stats")).data,
  getDispatch: async () => (await api.get("/operations/dispatch")).data,

  getAutomationServices: async () => (await api.get("/operations/automation/services")).data,
  toggleAutomation: async (data: any) => (await api.post("/operations/automation/toggle", data)).data,
  runAutomation: async (data: any) => (await api.post("/operations/automation/run", data)).data,
};

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: operationsService.getProjects });
}
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => operationsService.createProject(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => operationsService.updateProject(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => operationsService.deleteProject(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}
export function useOpsStats() {
  return useQuery({ queryKey: ["ops-stats"], queryFn: operationsService.getOpsStats });
}
export function useDispatch() {
  return useQuery({ queryKey: ["ops-dispatch"], queryFn: operationsService.getDispatch });
}
