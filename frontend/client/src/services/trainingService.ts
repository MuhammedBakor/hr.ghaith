import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type TrainingType = "mandatory" | "optional" | "certification" | "skill_development";
export type DurationUnit = "hours" | "days" | "weeks";
export type ProgramStatus = "draft" | "active" | "completed" | "cancelled";
export type EnrollmentStatus = "enrolled" | "in_progress" | "completed" | "withdrawn";

export interface TrainingProgram {
    id: number;
    name: string;
    description: string;
    trainingType: TrainingType;
    provider: string;
    duration: number;
    durationUnit: DurationUnit;
    cost: number;
    maxParticipants: number;
    status: ProgramStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface TrainingEnrollment {
    id: number;
    program?: TrainingProgram;
    employee?: any; // Will refine when Employee interface is available
    enrollmentDate: string;
    completionDate?: string;
    status: EnrollmentStatus;
    score?: number;
    certificate?: string;
    feedback?: string;
}

export const trainingService = {
    // Programs
    getPrograms: async (): Promise<TrainingProgram[]> => {
        const response = await api.get("/training/programs");
        return response.data;
    },
    getProgram: async (id: number): Promise<TrainingProgram> => {
        const response = await api.get(`/training/programs/${id}`);
        return response.data;
    },
    createProgram: async (program: Partial<TrainingProgram>): Promise<TrainingProgram> => {
        const response = await api.post("/training/programs", program);
        return response.data;
    },
    updateProgram: async ({ id, ...data }: { id: number } & Partial<TrainingProgram>): Promise<TrainingProgram> => {
        const response = await api.put(`/training/programs/${id}`, data);
        return response.data;
    },
    deleteProgram: async (id: number): Promise<void> => {
        await api.delete(`/training/programs/${id}`);
    },

    // Enrollments
    getEnrollments: async (): Promise<TrainingEnrollment[]> => {
        const response = await api.get("/training/enrollments");
        return response.data;
    },
    getEnrollment: async (id: number): Promise<TrainingEnrollment> => {
        const response = await api.get(`/training/enrollments/${id}`);
        return response.data;
    },
    getEnrollmentsByEmployee: async (employeeId: number): Promise<TrainingEnrollment[]> => {
        const response = await api.get(`/training/enrollments/employee/${employeeId}`);
        return response.data;
    },
    getEnrollmentsByProgram: async (programId: number): Promise<TrainingEnrollment[]> => {
        const response = await api.get(`/training/enrollments/program/${programId}`);
        return response.data;
    },
    enrollEmployee: async (enrollment: Partial<TrainingEnrollment>): Promise<TrainingEnrollment> => {
        const response = await api.post("/training/enrollments", enrollment);
        return response.data;
    },
    updateEnrollment: async ({ id, ...data }: { id: number } & Partial<TrainingEnrollment>): Promise<TrainingEnrollment> => {
        const response = await api.put(`/training/enrollments/${id}`, data);
        return response.data;
    },
    deleteEnrollment: async (id: number): Promise<void> => {
        await api.delete(`/training/enrollments/${id}`);
    },
};

// Hooks for Programs
export const usePrograms = () => {
    return useQuery({
        queryKey: ["training-programs"],
        queryFn: trainingService.getPrograms,
    });
};

export const useProgram = (id: number) => {
    return useQuery({
        queryKey: ["training-program", id],
        queryFn: () => trainingService.getProgram(id),
        enabled: !!id,
    });
};

export const useCreateProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.createProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training-programs"] });
        },
    });
};

export const useUpdateProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.updateProgram,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["training-programs"] });
            queryClient.invalidateQueries({ queryKey: ["training-program", variables.id] });
        },
    });
};

export const useDeleteProgram = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.deleteProgram,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training-programs"] });
        },
    });
};

// Hooks for Enrollments
export const useEnrollments = () => {
    return useQuery({
        queryKey: ["training-enrollments"],
        queryFn: trainingService.getEnrollments,
    });
};

export const useEnrollEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: trainingService.enrollEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training-enrollments"] });
        },
    });
};
