import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const legalService = {
  // Contracts
  getContracts: async (params?: any) => {
    const response = await api.get("/legal/contracts", { params });
    return response.data;
  },
  createContract: async (data: any) => {
    const response = await api.post("/legal/contracts", data);
    return response.data;
  },
  updateContract: async (id: number, data: any) => {
    const response = await api.put(`/legal/contracts/${id}`, data);
    return response.data;
  },
  deleteContract: async (id: number) => {
    await api.delete(`/legal/contracts/${id}`);
  },
  renewContract: async (id: number, data: any) => {
    const response = await api.post(`/legal/contracts/${id}/renew`, data);
    return response.data;
  },
  getExpiringContracts: async (days: number) => {
    const response = await api.get("/legal/contracts/expiring", { params: { days } });
    return response.data;
  },

  // Cases
  getCases: async (params?: any) => {
    const response = await api.get("/legal/cases", { params });
    return response.data;
  },
  createCase: async (data: any) => {
    const response = await api.post("/legal/cases", data);
    return response.data;
  },
  updateCase: async (id: number, data: any) => {
    const response = await api.put(`/legal/cases/${id}`, data);
    return response.data;
  },
  deleteCase: async (id: number) => {
    await api.delete(`/legal/cases/${id}`);
  },

  // Stats
  getStats: async () => {
    const response = await api.get("/legal/stats");
    return response.data;
  },

  // Legal Documents
  getDocuments: async (params?: any) => {
    const response = await api.get("/legal/documents", { params });
    return response.data;
  },
  createDocument: async (data: any) => {
    const response = await api.post("/legal/documents", data);
    return response.data;
  },
  updateDocument: async (id: number, data: any) => {
    const response = await api.put(`/legal/documents/${id}`, data);
    return response.data;
  },
  deleteDocument: async (id: number) => {
    await api.delete(`/legal/documents/${id}`);
  },

  // Legal Automation
  getAutomationServices: async () => {
    const response = await api.get("/legal/automation/services");
    return response.data;
  },
  toggleAutomation: async (data: any) => {
    const response = await api.post("/legal/automation/toggle", data);
    return response.data;
  },
  runAutomation: async (data: any) => {
    const response = await api.post("/legal/automation/run", data);
    return response.data;
  },

  // Legal Audit
  getAuditLogs: async (params?: any) => {
    const response = await api.get("/legal/audit", { params });
    return response.data;
  },
};

// Hooks
export function useLegalContracts(params?: any) {
  return useQuery({ queryKey: ["legal-contracts", params], queryFn: () => legalService.getContracts(params) });
}
export function useCreateLegalContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => legalService.createContract(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-contracts"] }) });
}
export function useUpdateLegalContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => legalService.updateContract(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-contracts"] }) });
}
export function useDeleteLegalContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => legalService.deleteContract(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-contracts"] }) });
}
export function useRenewLegalContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => legalService.renewContract(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-contracts"] }) });
}
export function useExpiringContracts(days: number) {
  return useQuery({ queryKey: ["legal-contracts-expiring", days], queryFn: () => legalService.getExpiringContracts(days) });
}
export function useLegalCases(params?: any) {
  return useQuery({ queryKey: ["legal-cases", params], queryFn: () => legalService.getCases(params) });
}
export function useCreateLegalCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => legalService.createCase(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-cases"] }) });
}
export function useUpdateLegalCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => legalService.updateCase(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-cases"] }) });
}
export function useDeleteLegalCase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => legalService.deleteCase(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-cases"] }) });
}
export function useLegalStats() {
  return useQuery({ queryKey: ["legal-stats"], queryFn: () => legalService.getStats() });
}
export function useLegalDocuments(params?: any) {
  return useQuery({ queryKey: ["legal-documents", params], queryFn: () => legalService.getDocuments(params) });
}
export function useCreateLegalDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => legalService.createDocument(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-documents"] }) });
}
export function useUpdateLegalDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => legalService.updateDocument(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-documents"] }) });
}
export function useDeleteLegalDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => legalService.deleteDocument(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["legal-documents"] }) });
}
export function useLegalAudit(params?: any) {
  return useQuery({ queryKey: ["legal-audit", params], queryFn: () => legalService.getAuditLogs(params) });
}