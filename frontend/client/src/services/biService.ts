import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface BiDashboard {
    id: number;
    name: string;
    description: string;
    type: string;
    config: string;
    isFavorite: boolean;
    ownerId?: number;
    createdAt: string;
}

export const useBiDashboards = () => useQuery<BiDashboard[]>({
    queryKey: ['bi-dashboards'],
    queryFn: () => api.get('/bi/dashboards').then(res => res.data),
});

export const useBiDashboard = (id: number) => useQuery<BiDashboard>({
    queryKey: ['bi-dashboards', id],
    queryFn: () => api.get(`/bi/dashboards/${id}`).then(res => res.data),
    enabled: !!id,
});

export const useCreateBiDashboard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<BiDashboard>) => api.post('/bi/dashboards', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bi-dashboards'] }),
    });
};

export const useUpdateBiDashboard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<BiDashboard> & { id: number }) =>
            api.put(`/bi/dashboards/${id}`, data).then(res => res.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bi-dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['bi-dashboards', variables.id] });
        },
    });
};

export const useDeleteBiDashboard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/bi/dashboards/${id}`).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bi-dashboards'] }),
    });
};
