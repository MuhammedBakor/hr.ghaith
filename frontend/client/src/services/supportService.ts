import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Ticket {
    id: number;
    ticketNumber: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    authorId?: number;
    assignedToId?: number;
    authorName?: string;
    authorRole?: string;
    authorDepartment?: string;
    authorBranch?: string;
    createdAt: string;
}

export interface TicketComment {
    id: number;
    ticketId: number;
    authorId: number;
    content: string;
    userName?: string;
    createdAt: string;
}

export const useTickets = () => useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: () => api.get('/support/tickets').then(res => res.data),
});

export const useTicket = (id: number) => useQuery<Ticket>({
    queryKey: ['tickets', id],
    queryFn: () => api.get(`/support/tickets/${id}`).then(res => res.data),
    enabled: !!id,
});

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Ticket>) => api.post('/support/tickets', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Ticket> & { id: number }) =>
            api.put(`/support/tickets/${id}`, data).then(res => res.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
        },
    });
};

export const useDeleteTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/support/tickets/${id}`).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useTicketComments = (ticketId: number) => useQuery<TicketComment[]>({
    queryKey: ['tickets', ticketId, 'comments'],
    queryFn: () => api.get(`/support/tickets/${ticketId}/comments`).then(res => res.data),
    enabled: ticketId > 0,
});

export const useAddTicketComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ticketId, ...data }: Partial<TicketComment> & { ticketId: number }) =>
            api.post(`/support/tickets/${ticketId}/comments`, data).then(res => res.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId, 'comments'] });
        },
    });
};
