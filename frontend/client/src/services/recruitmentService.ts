import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type ApplicationStatus = "pending" | "reviewing" | "interviewed" | "accepted" | "rejected";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "reschedulled";

export interface JobApplication {
    id: number;
    applicantName: string;
    position: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    status: ApplicationStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface Interview {
    id: number;
    application?: JobApplication;
    applicationId?: number;
    interviewDate: string;
    interviewer?: string;
    location?: string;
    status: InterviewStatus;
    notes?: string;
}

export const recruitmentService = {
    // Applications
    getApplications: async (): Promise<JobApplication[]> => {
        const response = await api.get("/recruitment/applications");
        return response.data;
    },
    getApplication: async (id: number): Promise<JobApplication> => {
        const response = await api.get(`/recruitment/applications/${id}`);
        return response.data;
    },
    createApplication: async (application: Partial<JobApplication>): Promise<JobApplication> => {
        const response = await api.post("/recruitment/applications", application);
        return response.data;
    },
    updateApplication: async ({ id, ...data }: { id: number } & Partial<JobApplication>): Promise<JobApplication> => {
        const response = await api.put(`/recruitment/applications/${id}`, data);
        return response.data;
    },
    deleteApplication: async (id: number): Promise<void> => {
        await api.delete(`/recruitment/applications/${id}`);
    },

    // Interviews
    getInterviews: async (): Promise<Interview[]> => {
        const response = await api.get("/recruitment/interviews");
        return response.data;
    },
    getInterviewsByApplication: async (applicationId: number): Promise<Interview[]> => {
        const response = await api.get(`/recruitment/interviews/application/${applicationId}`);
        return response.data;
    },
    scheduleInterview: async (interview: Partial<Interview>): Promise<Interview> => {
        const response = await api.post("/recruitment/interviews", interview);
        return response.data;
    },
    updateInterview: async ({ id, ...data }: { id: number } & Partial<Interview>): Promise<Interview> => {
        const response = await api.put(`/recruitment/interviews/${id}`, data);
        return response.data;
    },
    deleteInterview: async (id: number): Promise<void> => {
        await api.delete(`/recruitment/interviews/${id}`);
    },
};

// Hooks
export const useApplications = () => {
    return useQuery({
        queryKey: ["recruitment-applications"],
        queryFn: recruitmentService.getApplications,
    });
};

export const useCreateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.createApplication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-applications"] });
        },
    });
};

export const useUpdateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.updateApplication,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-applications"] });
            queryClient.invalidateQueries({ queryKey: ["recruitment-application", variables.id] });
        },
    });
};

export const useDeleteApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.deleteApplication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-applications"] });
        },
    });
};

export const useInterviews = () => {
    return useQuery({
        queryKey: ["recruitment-interviews"],
        queryFn: recruitmentService.getInterviews,
    });
};

export const useScheduleInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.scheduleInterview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
        },
    });
};

export const useUpdateInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.updateInterview,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
            queryClient.invalidateQueries({ queryKey: ["recruitment-interview", variables.id] });
        },
    });
};

export const useDeleteInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.deleteInterview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
        },
    });
};
