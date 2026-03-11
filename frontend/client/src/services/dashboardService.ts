import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface DashboardSummary {
    stats: {
        hr: { active: number; pendingLeaves: number; monthHires: number };
        finance: { overdue: number; totalInvoices: number };
        fleet: { available: number; inMaintenance: number };
        support: { open: number; critical: number };
        legal: { openCases: number; expiringContracts: number };
        projects: { active: number; overdue: number };
        property: { total: number; vacant: number };
        governance: { pendingApprovals: number; openRisks: number };
    };
    systemStatus: 'healthy' | 'warning' | 'critical';
    criticalAlerts: Array<{
        id: string;
        message: string;
        module: string;
        link: string;
        severity: 'error' | 'warning';
    }>;
    health: Array<{
        id: string;
        nameAr: string;
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
    }>;
}

export interface PendingActions {
    total: number;
    items: Array<{
        id: number;
        type: string;
        title: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
        link: string;
        createdAt: string;
    }>;
}

export interface KpiSummary {
    week: {
        newTickets: number;
        resolvedTickets: number;
        ticketResolutionRate: number;
    };
    current: {
        pendingRequests: number;
        activeProjects: number;
    };
}

export interface QuickSearchResult {
    id: string | number;
    type: string;
    module: string;
    title: string;
    subtitle?: string;
    link: string;
    badge?: string;
    badgeColor?: string;
}

export const useDashboardSummary = (branchId?: number | null) => {
    return useQuery<DashboardSummary>({
        queryKey: ['dashboard-summary', branchId ?? null],
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (branchId) params.branchId = branchId;
            const { data } = await api.get('/dashboard/summary', { params });
            return data;
        },
        refetchInterval: 60000,
    });
};

export const usePendingActions = () => {
    return useQuery<PendingActions>({
        queryKey: ['pending-actions'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/pending-actions');
            return data;
        },
        refetchInterval: 30000,
    });
};

export const useKpiSummary = () => {
    return useQuery<KpiSummary>({
        queryKey: ['kpi-summary'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/kpi-summary');
            return data;
        },
        refetchInterval: 120000,
    });
};

export const useQuickSearch = (query: string) => {
    return useQuery<QuickSearchResult[]>({
        queryKey: ['quick-search', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];
            const { data } = await api.get('/dashboard/search', { params: { query } });
            return data;
        },
        enabled: query.length >= 2,
    });
};
