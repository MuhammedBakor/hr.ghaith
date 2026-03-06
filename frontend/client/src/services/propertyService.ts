import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const propertyService = {
  getProperties: async () => (await api.get("/property/properties")).data,
  createProperty: async (data: any) => (await api.post("/property/properties", data)).data,
  updateProperty: async (id: number, data: any) => (await api.put(`/property/properties/${id}`, data)).data,
  deleteProperty: async (id: number) => { await api.delete(`/property/properties/${id}`); },

  getLeases: async () => (await api.get("/property/leases")).data,
  createLease: async (data: any) => (await api.post("/property/leases", data)).data,
  updateLease: async (id: number, data: any) => (await api.put(`/property/leases/${id}`, data)).data,
  deleteLease: async (id: number) => { await api.delete(`/property/leases/${id}`); },

  getTenants: async () => (await api.get("/property/tenants")).data,
  createTenant: async (data: any) => (await api.post("/property/tenants", data)).data,
  updateTenant: async (id: number, data: any) => (await api.put(`/property/tenants/${id}`, data)).data,
  deleteTenant: async (id: number) => { await api.delete(`/property/tenants/${id}`); },

  getContracts: async () => (await api.get("/property/contracts")).data,
  createContract: async (data: any) => (await api.post("/property/contracts", data)).data,
  updateContract: async (id: number, data: any) => (await api.put(`/property/contracts/${id}`, data)).data,
  deleteContract: async (id: number) => { await api.delete(`/property/contracts/${id}`); },

  getMaintenance: async () => (await api.get("/property/maintenance")).data,
  createMaintenance: async (data: any) => (await api.post("/property/maintenance", data)).data,
  updateMaintenance: async (id: number, data: any) => (await api.put(`/property/maintenance/${id}`, data)).data,
  deleteMaintenance: async (id: number) => { await api.delete(`/property/maintenance/${id}`); },

  getAutomationServices: async () => (await api.get("/property/automation/services")).data,
  toggleAutomation: async (data: any) => (await api.post("/property/automation/toggle", data)).data,
  runAutomation: async (data: any) => (await api.post("/property/automation/run", data)).data,
};

export function useProperties() {
  return useQuery({ queryKey: ["properties"], queryFn: propertyService.getProperties });
}
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => propertyService.createProperty(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }) });
}
export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => propertyService.updateProperty(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }) });
}
export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => propertyService.deleteProperty(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }) });
}
export function useLeases() {
  return useQuery({ queryKey: ["leases"], queryFn: propertyService.getLeases });
}
export function useCreateLease() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => propertyService.createLease(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["leases"] }) });
}
export function useUpdateLease() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => propertyService.updateLease(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["leases"] }) });
}
export function useDeleteLease() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => propertyService.deleteLease(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["leases"] }) });
}
export function useTenants() {
  return useQuery({ queryKey: ["tenants"], queryFn: propertyService.getTenants });
}
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => propertyService.createTenant(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }) });
}
export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => propertyService.updateTenant(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }) });
}
export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => propertyService.deleteTenant(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }) });
}
export function usePropertyContracts() {
  return useQuery({ queryKey: ["property-contracts"], queryFn: propertyService.getContracts });
}
export function useCreatePropertyContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => propertyService.createContract(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-contracts"] }) });
}
export function useUpdatePropertyContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => propertyService.updateContract(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-contracts"] }) });
}
export function useDeletePropertyContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => propertyService.deleteContract(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-contracts"] }) });
}
export function usePropertyMaintenance() {
  return useQuery({ queryKey: ["property-maintenance"], queryFn: propertyService.getMaintenance });
}
export function useCreatePropertyMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => propertyService.createMaintenance(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-maintenance"] }) });
}
export function useUpdatePropertyMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => propertyService.updateMaintenance(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-maintenance"] }) });
}
export function useDeletePropertyMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => propertyService.deleteMaintenance(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["property-maintenance"] }) });
}