import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TrainingProgram {
    id: number;
    name: string;
    description?: string;
    category?: string;
    instructor?: string;
    trainingType?: 'mandatory' | 'optional' | 'certification' | 'skill_development';
    provider?: string;
    duration?: number;
    durationUnit?: 'hours' | 'days' | 'weeks';
    cost?: number;
    maxParticipants?: number;
    startDate?: string;
    endDate?: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    createdAt: string;
}

export interface TrainingEnrollment {
    id: number;
    employeeId: number;
    employeeName?: string;
    programId: number;
    programName?: string;
    enrollmentDate: string;
    completionDate?: string;
    status: 'enrolled' | 'in_progress' | 'completed' | 'withdrawn';
    score?: number;
    progress?: number;
}

export const trainingService = {
    // Programs
    getPrograms: async () => {
        const response = await api.get<TrainingProgram[]>("/training/programs");
        return response.data;
    },
    getProgram: async (id: number) => {
        const response = await api.get<TrainingProgram>(`/training/programs/${id}`);
        return response.data;
    },
    createProgram: async (data: Partial<TrainingProgram>) => {
        const response = await api.post<TrainingProgram>("/training/programs", data);
        return response.data;
    },
    updateProgram: async ({ id, ...data }: { id: number } & Partial<TrainingProgram>) => {
        const response = await api.put<TrainingProgram>(`/training/programs/${id}`, data);
        return response.data;
    },
    deleteProgram: async (id: number) => {
        await api.delete(`/training/programs/${id}`);
    },

    // Enrollments
    getEnrollments: async () => {
        const response = await api.get<TrainingEnrollment[]>("/training/enrollments");
        return response.data;
    },
    createEnrollment: async (data: { employeeId: number, programId: number }) => {
        const response = await api.post<TrainingEnrollment>("/training/enrollments", data);
        return response.data;
    },
    updateEnrollment: async ({ id, ...data }: { id: number } & Partial<TrainingEnrollment>) => {
        const response = await api.put<TrainingEnrollment>(`/training/enrollments/${id}`, data);
        return response.data;
    },
    deleteEnrollment: async (id: number) => {
        await api.delete(`/training/enrollments/${id}`);
    }
};

// Hooks
export const useTrainingPrograms = () => {
    return useQuery({
        queryKey: ["training", "programs"],
        queryFn: trainingService.getPrograms,
    });
};

export const useCreateTrainingProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.createProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "programs"] });
        },
    });
};

export const useUpdateTrainingProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.updateProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "programs"] });
        },
    });
};

export const useDeleteTrainingProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.deleteProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "programs"] });
        },
    });
};

export const useTrainingEnrollments = () => {
    return useQuery({
        queryKey: ["training", "enrollments"],
        queryFn: trainingService.getEnrollments,
    });
};

export const useCreateTrainingEnrollment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.createEnrollment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "enrollments"] });
        },
    });
};

// Type aliases for pages
export type TrainingType = 'mandatory' | 'optional' | 'certification' | 'skill_development';
export type DurationUnit = 'hours' | 'days' | 'weeks';
export type ProgramStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Aliases for pages that use shorter names
export const usePrograms = useTrainingPrograms;
export const useCreateProgram = useCreateTrainingProgram;
export const useUpdateProgram = useUpdateTrainingProgram;
export const useDeleteProgram = useDeleteTrainingProgram;
export const useEnrollments = useTrainingEnrollments;

export const useEnrollEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { employeeId: number, programId: number }) => trainingService.createEnrollment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "enrollments"] });
        },
    });
};

export const useUpdateTrainingEnrollment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.updateEnrollment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training", "enrollments"] });
        },
    });
};
