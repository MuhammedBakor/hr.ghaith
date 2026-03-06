import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const documentService = {
  getDocuments: async () => (await api.get("/documents")).data,
  createDocument: async (data: any) => (await api.post("/documents", data)).data,
  updateDocument: async (id: number, data: any) => (await api.put(`/documents/${id}`, data)).data,
  deleteDocument: async (id: number) => { await api.delete(`/documents/${id}`); },

  getFolders: async () => (await api.get("/documents/folders")).data,
  createFolder: async (data: any) => (await api.post("/documents/folders", data)).data,
  updateFolder: async (id: number, data: any) => (await api.put(`/documents/folders/${id}`, data)).data,
  deleteFolder: async (id: number) => { await api.delete(`/documents/folders/${id}`); },

  getTemplates: async () => (await api.get("/documents/templates")).data,
  createTemplate: async (data: any) => (await api.post("/documents/templates", data)).data,
  updateTemplate: async (id: number, data: any) => (await api.put(`/documents/templates/${id}`, data)).data,
  deleteTemplate: async (id: number) => { await api.delete(`/documents/templates/${id}`); },

  getArchive: async () => (await api.get("/documents/archive")).data,
  archiveDocument: async (id: number) => (await api.post(`/documents/${id}/archive`)).data,
  restoreDocument: async (id: number) => (await api.post(`/documents/archive/${id}/restore`)).data,
  deleteArchived: async (id: number) => { await api.delete(`/documents/archive/${id}`); },
};

export function useDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: documentService.getDocuments });
}
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => documentService.createDocument(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => documentService.updateDocument(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => documentService.deleteDocument(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}
export function useFolders() {
  return useQuery({ queryKey: ["folders"], queryFn: documentService.getFolders });
}
export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => documentService.createFolder(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }) });
}
export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => documentService.updateFolder(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }) });
}
export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => documentService.deleteFolder(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }) });
}
export function useDocumentTemplates() {
  return useQuery({ queryKey: ["document-templates"], queryFn: documentService.getTemplates });
}
export function useCreateDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => documentService.createTemplate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["document-templates"] }) });
}
export function useUpdateDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => documentService.updateTemplate(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["document-templates"] }) });
}
export function useDeleteDocumentTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => documentService.deleteTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["document-templates"] }) });
}
export function useArchive() {
  return useQuery({ queryKey: ["document-archive"], queryFn: documentService.getArchive });
}
export function useArchiveDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => documentService.archiveDocument(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); qc.invalidateQueries({ queryKey: ["document-archive"] }); } });
}
export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => documentService.restoreDocument(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); qc.invalidateQueries({ queryKey: ["document-archive"] }); } });
}