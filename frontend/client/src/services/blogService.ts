import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const blogService = {
  getPosts: async () => (await api.get("/blog/posts")).data,
  createPost: async (data: any) => (await api.post("/blog/posts", data)).data,
  updatePost: async (id: number, data: any) => (await api.put(`/blog/posts/${id}`, data)).data,
  deletePost: async (id: number) => { await api.delete(`/blog/posts/${id}`); },
};

export function useBlogPosts() {
  return useQuery({ queryKey: ["blog-posts"], queryFn: blogService.getPosts });
}
export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => blogService.createPost(data), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }) });
}
export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...data }: any) => blogService.updatePost(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }) });
}
export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => blogService.deletePost(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }) });
}
