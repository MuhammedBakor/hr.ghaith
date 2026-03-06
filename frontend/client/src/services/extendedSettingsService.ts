import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const extendedSettingsService = {
  // SMTP / Email
  getSmtpSettings: async () => (await api.get("/settings/smtp")).data,
  updateSmtpSettings: async (data: any) => (await api.put("/settings/smtp", data)).data,
  testSmtpConnection: async (data: any) => (await api.post("/settings/smtp/test", data)).data,

  // SMS
  getSmsSettings: async () => (await api.get("/settings/sms")).data,
  updateSmsSettings: async (data: any) => (await api.put("/settings/sms", data)).data,
  testSms: async (data: any) => (await api.post("/settings/sms/test", data)).data,

  // WhatsApp
  getWhatsAppSettings: async () => (await api.get("/settings/whatsapp")).data,
  updateWhatsAppSettings: async (data: any) => (await api.put("/settings/whatsapp", data)).data,
  testWhatsApp: async (data: any) => (await api.post("/settings/whatsapp/test", data)).data,

  // Message Templates
  getMessageTemplates: async () => (await api.get("/settings/message-templates")).data,
  createMessageTemplate: async (data: any) => (await api.post("/settings/message-templates", data)).data,
  updateMessageTemplate: async (id: number, data: any) => (await api.put(`/settings/message-templates/${id}`, data)).data,
  deleteMessageTemplate: async (id: number) => { await api.delete(`/settings/message-templates/${id}`); },

  // Letter Templates
  getLetterTemplates: async () => (await api.get("/settings/letter-templates")).data,
  createLetterTemplate: async (data: any) => (await api.post("/settings/letter-templates", data)).data,
  updateLetterTemplate: async (id: number, data: any) => (await api.put(`/settings/letter-templates/${id}`, data)).data,
  deleteLetterTemplate: async (id: number) => { await api.delete(`/settings/letter-templates/${id}`); },

  // Code Prefixes
  getCodePrefixes: async () => (await api.get("/settings/code-prefixes")).data,
  updateCodePrefixes: async (data: any) => (await api.put("/settings/code-prefixes", data)).data,

  // Backup
  getBackups: async () => (await api.get("/settings/backups")).data,
  createBackup: async (data: any) => (await api.post("/settings/backups", data)).data,
  restoreBackup: async (id: number) => (await api.post(`/settings/backups/${id}/restore`)).data,
  deleteBackup: async (id: number) => { await api.delete(`/settings/backups/${id}`); },
};

export function useSmtpSettings() {
  return useQuery({ queryKey: ["smtp-settings"], queryFn: extendedSettingsService.getSmtpSettings });
}
export function useUpdateSmtpSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.updateSmtpSettings(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["smtp-settings"] }) });
}
export function useTestSmtp() {
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.testSmtpConnection(data) });
}
export function useSmsSettings() {
  return useQuery({ queryKey: ["sms-settings"], queryFn: extendedSettingsService.getSmsSettings });
}
export function useUpdateSmsSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.updateSmsSettings(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["sms-settings"] }) });
}
export function useTestSms() {
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.testSms(data) });
}
export function useWhatsAppSettings() {
  return useQuery({ queryKey: ["whatsapp-settings"], queryFn: extendedSettingsService.getWhatsAppSettings });
}
export function useUpdateWhatsAppSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.updateWhatsAppSettings(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-settings"] }) });
}
export function useTestWhatsApp() {
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.testWhatsApp(data) });
}
export function useMessageTemplates() {
  return useQuery({ queryKey: ["message-templates"], queryFn: extendedSettingsService.getMessageTemplates });
}
export function useCreateMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.createMessageTemplate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }) });
}
export function useUpdateMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => extendedSettingsService.updateMessageTemplate(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }) });
}
export function useDeleteMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => extendedSettingsService.deleteMessageTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["message-templates"] }) });
}
export function useLetterTemplates() {
  return useQuery({ queryKey: ["letter-templates"], queryFn: extendedSettingsService.getLetterTemplates });
}
export function useCreateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.createLetterTemplate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["letter-templates"] }) });
}
export function useUpdateLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => extendedSettingsService.updateLetterTemplate(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["letter-templates"] }) });
}
export function useDeleteLetterTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => extendedSettingsService.deleteLetterTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["letter-templates"] }) });
}
export function useCodePrefixes() {
  return useQuery({ queryKey: ["code-prefixes"], queryFn: extendedSettingsService.getCodePrefixes });
}
export function useUpdateCodePrefixes() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.updateCodePrefixes(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["code-prefixes"] }) });
}
export function useBackups() {
  return useQuery({ queryKey: ["backups"], queryFn: extendedSettingsService.getBackups });
}
export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => extendedSettingsService.createBackup(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }) });
}
export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => extendedSettingsService.restoreBackup(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }) });
}
export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => extendedSettingsService.deleteBackup(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }) });
}
