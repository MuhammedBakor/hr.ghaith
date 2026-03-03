import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface StoreProduct {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    stockQuantity: number;
    imageUrl?: string;
    sku?: string;
    status: 'in_stock' | 'out_of_stock' | 'discontinued';
    createdAt: string;
}

export interface StoreOrder {
    id: number;
    orderNumber: string;
    customerId: number;
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: string;
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    paymentMethod: string;
    createdAt: string;
}

export const useStoreProducts = () => useQuery<StoreProduct[]>({
    queryKey: ['store-products'],
    queryFn: () => api.get('/store/products').then(res => res.data),
});

export const useStoreProduct = (id: number) => useQuery<StoreProduct>({
    queryKey: ['store-products', id],
    queryFn: () => api.get(`/store/products/${id}`).then(res => res.data),
    enabled: !!id,
});

export const useCreateStoreProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<StoreProduct>) => api.post('/store/products', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-products'] }),
    });
};

export const useUpdateStoreProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<StoreProduct> & { id: number }) =>
            api.put(`/store/products/${id}`, data).then(res => res.data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['store-products'] });
            queryClient.invalidateQueries({ queryKey: ['store-products', variables.id] });
        },
    });
};

export const useStoreOrders = () => useQuery<StoreOrder[]>({
    queryKey: ['store-orders'],
    queryFn: () => api.get('/store/orders').then(res => res.data),
});

export const useCreateStoreOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<StoreOrder>) => api.post('/store/orders', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-orders'] }),
    });
};

export const useDeleteStoreProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/store/products/${id}`).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-products'] }),
    });
};
