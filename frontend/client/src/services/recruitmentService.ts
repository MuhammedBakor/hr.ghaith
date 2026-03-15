import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface RecruitmentJob {
    id: number;
    title: string;
    titleAr?: string;
    location?: string;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
    description?: string;
    requirements?: string;
    benefits?: string;
    openings: number;
    applicationDeadline?: string;
    status: 'draft' | 'open' | 'closed' | 'filled' | 'on_hold';
    createdAt: string;
}

export interface JobApplication {
    id: number;
    applicantName: string;
    position: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    status: 'pending' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';
    appliedAt: string;
}

export interface Interview {
    id: number;
    applicationId: number;
    interviewDate?: string;
    scheduledAt?: string;
    interviewer?: string;
    interviewType?: 'phone' | 'video' | 'in_person' | 'technical' | 'hr' | 'final';
    duration?: number;
    location?: string;
    meetingLink?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'reschedulled';
    notes?: string;
}

export const recruitmentService = {
    // Jobs
    getJobs: async () => {
        const response = await api.get<RecruitmentJob[]>("/recruitment/jobs");
        return response.data;
    },
    getJob: async (id: number) => {
        const response = await api.get<RecruitmentJob>(`/recruitment/jobs/${id}`);
        return response.data;
    },
    createJob: async (data: Partial<RecruitmentJob>) => {
        const response = await api.post<RecruitmentJob>("/recruitment/jobs", data);
        return response.data;
    },
    updateJob: async ({ id, ...data }: { id: number } & Partial<RecruitmentJob>) => {
        const response = await api.put<RecruitmentJob>(`/recruitment/jobs/${id}`, data);
        return response.data;
    },
    deleteJob: async (id: number) => {
        await api.delete(`/recruitment/jobs/${id}`);
    },

    // Applications
    getApplications: async () => {
        const response = await api.get<JobApplication[]>("/recruitment/applications");
        return response.data;
    },
    updateApplicationStatus: async ({ id, status }: { id: number, status: string }) => {
        // Standardizing status to uppercase for the backend enum if needed, 
        // but the controller handles it. Let's send it clearly.
        const response = await api.put<JobApplication>(`/recruitment/applications/${id}/status`, status, {
            headers: { 'Content-Type': 'text/plain' }
        });
        return response.data;
    },

    // Interviews
    getInterviews: async () => {
        const response = await api.get<Interview[]>("/recruitment/interviews");
        return response.data;
    },
    createInterview: async (data: Partial<Interview> & { applicationId?: number }) => {
        const { applicationId, ...rest } = data as any;
        const payload = { ...rest, ...(applicationId ? { application: { id: applicationId } } : {}) };
        const response = await api.post<Interview>("/recruitment/interviews", payload);
        return response.data;
    }
};

// Hooks
export const useRecruitmentJobs = () => {
    return useQuery({
        queryKey: ["recruitment", "jobs"],
        queryFn: recruitmentService.getJobs,
    });
};

export const useCreateRecruitmentJob = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.createJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
        },
    });
};

export const useUpdateRecruitmentJob = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.updateJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
        },
    });
};

export const useDeleteRecruitmentJob = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.deleteJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
        },
    });
};

export const useRecruitmentApplications = () => {
    return useQuery({
        queryKey: ["recruitment", "applications"],
        queryFn: recruitmentService.getApplications,
    });
};

export const useUpdateApplicationStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.updateApplicationStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
        },
    });
};

export const useRecruitmentInterviews = () => {
    return useQuery({
        queryKey: ["recruitment", "interviews"],
        queryFn: recruitmentService.getInterviews,
    });
};

export const useCreateInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: recruitmentService.createInterview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
            queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
        },
    });
};

// Aliases for pages that use shorter names
export const useInterviews = useRecruitmentInterviews;
export const useApplications = useRecruitmentApplications;
export const useScheduleInterview = useCreateInterview;
export const useUpdateInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number } & Partial<Interview>) =>
            api.put(`/recruitment/interviews/${data.id}`, data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
    });
};
export const useDeleteInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/recruitment/interviews/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
    });
};
export const useCancelInterview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.put(`/recruitment/interviews/${id}/cancel`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] });
        },
    });
};
export const useCreateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<JobApplication>) =>
            api.post('/recruitment/applications', data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
        },
    });
};
export const useUpdateApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: number } & Partial<JobApplication>) =>
            api.put(`/recruitment/applications/${id}`, data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
        },
    });
};
export const useDeleteApplication = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/recruitment/applications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] });
        },
    });
};
