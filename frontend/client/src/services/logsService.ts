import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const logsService = {
  getMessageLogs: async (params?: any) => (await api.get("/logs/messages", { params })).data,
};

export function useMessageLogs(params?: any) {
  return useQuery({ queryKey: ["message-logs", params], queryFn: () => logsService.getMessageLogs(params) });
}
