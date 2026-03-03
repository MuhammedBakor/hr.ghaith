import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface User {
    id: number;
    email: string;
    username: string;
    role: string;
}

export const authService = {
    login: async (credentials: any) => {
        // Map username to email because the backend expects 'email' field for authentication
        const loginData = {
            email: credentials.username,
            password: credentials.password
        };
        const response = await api.post("/auth/authenticate", loginData);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post("/auth/register", data);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    },
    verifyCode: async (code: string) => {
        const response = await api.get(`/auth/verify-code?code=${code}`);
        return response.data;
    },
    sendResetCode: async (data: { code: string; method: string; contact: string }) => {
        const response = await api.post("/auth/send-reset-code", data);
        return response.data;
    },
    resetPassword: async (data: any) => {
        const response = await api.post("/auth/reset-password", data);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("selectedRole");
        localStorage.removeItem("selectedBranchId");
    },
    getMe: async (): Promise<User> => {
        const response = await api.get("/auth/me");
        return response.data;
    },
};

export const useUser = () => {
    return useQuery({
        queryKey: ["user"],
        queryFn: authService.getMe,
        retry: false,
        enabled: !!localStorage.getItem("token"),
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authService.login,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
};

export const useRegister = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authService.register,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
};

export const useVerifyCode = (code: string) => {
    return useQuery({
        queryKey: ["verifyCode", code],
        queryFn: () => authService.verifyCode(code),
        enabled: !!code,
        retry: false,
    });
};

export const useSendPasswordResetCode = () => {
    return useMutation({
        mutationFn: authService.sendResetCode,
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: authService.resetPassword,
    });
};
