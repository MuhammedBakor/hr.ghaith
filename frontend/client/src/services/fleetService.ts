import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const fleetService = {
  getVehicles: async () => (await api.get("/fleet/vehicles")).data,
  createVehicle: async (data: any) => (await api.post("/fleet/vehicles", data)).data,
  updateVehicle: async (id: number, data: any) => (await api.put(`/fleet/vehicles/${id}`, data)).data,
  deleteVehicle: async (id: number) => { await api.delete(`/fleet/vehicles/${id}`); },

  getDrivers: async () => (await api.get("/fleet/drivers")).data,
  createDriver: async (data: any) => (await api.post("/fleet/drivers", data)).data,
  updateDriver: async (id: number, data: any) => (await api.put(`/fleet/drivers/${id}`, data)).data,
  deleteDriver: async (id: number) => { await api.delete(`/fleet/drivers/${id}`); },

  getMaintenance: async () => (await api.get("/fleet/maintenance")).data,
  createMaintenance: async (data: any) => (await api.post("/fleet/maintenance", data)).data,
  updateMaintenance: async (id: number, data: any) => (await api.put(`/fleet/maintenance/${id}`, data)).data,
  deleteMaintenance: async (id: number) => { await api.delete(`/fleet/maintenance/${id}`); },

  getFuelLogs: async () => (await api.get("/fleet/fuel")).data,
  createFuelLog: async (data: any) => (await api.post("/fleet/fuel", data)).data,
  updateFuelLog: async (id: number, data: any) => (await api.put(`/fleet/fuel/${id}`, data)).data,
  deleteFuelLog: async (id: number) => { await api.delete(`/fleet/fuel/${id}`); },

  getTrips: async () => (await api.get("/fleet/trips")).data,
  createTrip: async (data: any) => (await api.post("/fleet/trips", data)).data,

  getDailyReports: async (params?: any) => (await api.get("/fleet/daily-reports", { params })).data,
  getDailyRoutes: async (params?: any) => (await api.get("/fleet/daily-routes", { params })).data,

  getDispatchRecs: async () => (await api.get("/fleet/dispatch")).data,
  createDispatch: async (data: any) => (await api.post("/fleet/dispatch", data)).data,
  updateDispatch: async (id: number, data: any) => (await api.put(`/fleet/dispatch/${id}`, data)).data,

  getIncidents: async () => (await api.get("/fleet/incidents")).data,
  createIncident: async (data: any) => (await api.post("/fleet/incidents", data)).data,
  updateIncident: async (id: number, data: any) => (await api.put(`/fleet/incidents/${id}`, data)).data,

  getAlerts: async () => (await api.get("/fleet/alerts")).data,

  getAutomationServices: async () => (await api.get("/fleet/automation/services")).data,
  toggleAutomation: async (data: any) => (await api.post("/fleet/automation/toggle", data)).data,
  runAutomation: async (data: any) => (await api.post("/fleet/automation/run", data)).data,
};

export function useVehicles() {
  return useQuery({ queryKey: ["vehicles"], queryFn: fleetService.getVehicles });
}
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createVehicle(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }) });
}
export function useDrivers() {
  return useQuery({ queryKey: ["drivers"], queryFn: fleetService.getDrivers });
}
export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createDriver(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }) });
}
export function useFleetMaintenance() {
  return useQuery({ queryKey: ["fleet-maintenance"], queryFn: fleetService.getMaintenance });
}
export function useCreateFleetMaintenance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createMaintenance(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["fleet-maintenance"] }) });
}
export function useFuelLogs() {
  return useQuery({ queryKey: ["fuel-logs"], queryFn: fleetService.getFuelLogs });
}
export function useCreateFuelLog() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createFuelLog(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["fuel-logs"] }) });
}
export function useTrips() {
  return useQuery({ queryKey: ["trips"], queryFn: fleetService.getTrips });
}
export function useDailyReports(params?: any) {
  return useQuery({ queryKey: ["daily-reports", params], queryFn: () => fleetService.getDailyReports(params) });
}
export function useDailyRoutes(params?: any) {
  return useQuery({ queryKey: ["daily-routes", params], queryFn: () => fleetService.getDailyRoutes(params) });
}
export function useDispatchRecs() {
  return useQuery({ queryKey: ["dispatch-recs"], queryFn: fleetService.getDispatchRecs });
}
export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createDispatch(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch-recs"] }) });
}
export function useUpdateDispatch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => fleetService.updateDispatch(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch-recs"] }) });
}
export function useIncidents() {
  return useQuery({ queryKey: ["fleet-incidents"], queryFn: fleetService.getIncidents });
}
export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => fleetService.createIncident(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["fleet-incidents"] }) });
}
export function useFleetAlerts() {
  return useQuery({ queryKey: ["fleet-alerts"], queryFn: fleetService.getAlerts });
}
