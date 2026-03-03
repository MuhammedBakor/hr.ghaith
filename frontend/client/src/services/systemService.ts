import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AuditLogItem {
    id: number;
    module?: string;
    eventType: string;
    description: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    userId?: number;
    userName?: string;
    workflowName?: string;
    stepName?: string;
    action?: 'approved' | 'rejected' | 'pending' | 'escalated' | 'returned';
    comments?: string;
    entityId?: number;
    createdAt: string;
}

export const useAuditLogs = () => useQuery<AuditLogItem[]>({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit/logs').then(res => res.data),
});

export const useWorkflowAudit = () => useQuery<AuditLogItem[]>({
    queryKey: ['workflow-audit'],
    queryFn: () => api.get('/audit/workflow').then(res => res.data),
});
