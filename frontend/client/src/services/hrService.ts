import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type EmployeeStatus = "active" | "inactive" | "terminated" | "on_leave" | "suspended";

export interface Employee {
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    status: EmployeeStatus;
    salary?: number;
}

export interface LeaveRequest {
    id: number;
    employee?: Employee;
    employeeId?: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: LeaveStatus;
    reason?: string;
    managerRemarks?: string;
}

export const hrService = {
    // Employees
    getEmployees: async (): Promise<Employee[]> => {
        const response = await api.get("/hr/employees");
        return response.data;
    },
    getEmployee: async (id: number): Promise<Employee> => {
        const response = await api.get(`/hr/employees/${id}`);
        return response.data;
    },
    createEmployee: async (employee: Partial<Employee>): Promise<Employee> => {
        const response = await api.post("/hr/employees", employee);
        return response.data;
    },
    updateEmployee: async ({ id, ...data }: { id: number } & Partial<Employee>): Promise<Employee> => {
        const response = await api.put(`/hr/employees/${id}`, data);
        return response.data;
    },
    deleteEmployee: async (id: number): Promise<void> => {
        await api.delete(`/hr/employees/${id}`);
    },

    // Leaves
    getLeaves: async (): Promise<LeaveRequest[]> => {
        const response = await api.get("/hr/leaves");
        return response.data;
    },
    getLeavesByEmployee: async (employeeId: number): Promise<LeaveRequest[]> => {
        const response = await api.get(`/hr/leaves/employee/${employeeId}`);
        return response.data;
    },
    createLeaveRequest: async (leaveRequest: Partial<LeaveRequest>): Promise<LeaveRequest> => {
        const response = await api.post("/hr/leaves", leaveRequest);
        return response.data;
    },
    updateLeaveRequest: async ({ id, ...data }: { id: number } & Partial<LeaveRequest>): Promise<LeaveRequest> => {
        const response = await api.put(`/hr/leaves/${id}`, data);
        return response.data;
    },
    deleteLeaveRequest: async (id: number): Promise<void> => {
        await api.delete(`/hr/leaves/${id}`);
    },
};

// Hooks
// Employees
export const useEmployees = () => useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/hr/employees').then(res => res.data),
});

// Branches
export const useBranches = () => useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/hr/branches').then(res => res.data),
});

// Roles
export const useRoles = () => useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/hr/roles').then(res => res.data),
});

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/employees', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/employees/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/employees/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
};

export const useUpdateEmployeeStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            api.patch(`/hr/employees/${id}/status`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
};

export const useEmployee = (id: number) => useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get(`/hr/employees/${id}`).then(res => res.data),
    enabled: !!id,
});

// Specialized Employee Hooks
export const useCreateSimpleEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/employees/simple', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    });
};

export const useInviteEmployee = () => {
    return useMutation({
        mutationFn: ({ employeeId, method }: { employeeId: number, method: string }) =>
            api.post(`/hr/employees/${employeeId}/invite`, { method }).then(res => res.data),
    });
};

export const useEmployeeByUserId = (userId: number) => useQuery({
    queryKey: ['employees', 'user', userId],
    queryFn: () => api.get(`/hr/employees/user/${userId}`).then(res => res.data),
    enabled: !!userId,
});

export const useSubordinates = (managerId: number) => useQuery({
    queryKey: ['employees', 'subordinates', managerId],
    queryFn: () => api.get(`/hr/employees/${managerId}/subordinates`).then(res => res.data),
    enabled: !!managerId,
});

// Departments
export const useDepartments = () => useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/hr/departments').then(res => res.data),
});

export const useCreateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/departments', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
    });
};

export const useUpdateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/departments/${id}`, data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
    });
};

export const useDeleteDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/departments/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
    });
};

// Positions
export const usePositions = () => useQuery({
    queryKey: ['positions'],
    queryFn: () => api.get('/hr/positions').then(res => res.data),
});

export const useCreatePosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/positions', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
    });
};

export const useUpdatePosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/positions/${id}`, data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
    });
};

export const useDeletePosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/positions/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
    });
};

// Leaves
export const useLeaves = () => useQuery({
    queryKey: ['leaves'],
    queryFn: () => api.get('/hr/leaves').then(res => res.data),
});

export const useCreateLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/leaves', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
    });
};

export const useUpdateLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/leaves/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
    });
};

export const useDeleteLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/leaves/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
    });
};

export const useLeavesByEmployee = (employeeId: number) => useQuery({
    queryKey: ['leaves', 'employee', employeeId],
    queryFn: () => api.get(`/hr/leaves/employee/${employeeId}`).then(res => res.data),
    enabled: !!employeeId,
});
// Attendance
export const useAttendance = (date?: string) => useQuery({
    queryKey: ['attendance', date],
    queryFn: () => api.get('/hr/attendance', { params: { date } }).then(res => res.data),
});

export const useAttendanceByEmployee = (employeeId: number) => useQuery({
    queryKey: ['attendance', 'employee', employeeId],
    queryFn: () => api.get(`/hr/attendance/employee/${employeeId}`).then(res => res.data),
    enabled: !!employeeId,
});

export const useCheckIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/attendance/check-in', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    });
};

export const useCheckOut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: number } & any) => api.post(`/hr/attendance/${id}/check-out`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    });
};

export const useManualAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/attendance/manual', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    });
};

export const useRequestEarlyLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/attendance/early-leave', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    });
};

// Payroll
export const usePayroll = (branchId?: number) => useQuery({
    queryKey: ['payroll', branchId],
    queryFn: () => api.get('/hr/payroll', { params: { branchId } }).then(res => res.data),
});

export const usePayrollByEmployee = (employeeId: number) => useQuery({
    queryKey: ['payroll', 'employee', employeeId],
    queryFn: () => api.get(`/hr/payroll/employee/${employeeId}`).then(res => res.data),
    enabled: !!employeeId,
});

export const useCreatePayroll = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/payroll', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
    });
};

export const useUpdatePayrollStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/hr/payroll/${id}/status`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
    });
};

// QR Scanner
export const useCheckInWithQR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, ...data }: { userId: number } & any) => api.post(`/hr/attendance/check-in-with-qr`, data, { params: { userId } }).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    });
};

// Shifts
export const useShifts = () => useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.get('/hr/shifts').then(res => res.data),
});

export const useCreateShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/shifts', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });
};

export const useUpdateShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/shifts/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });
};

export const useDeleteShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/shifts/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });
};

export const useSeedShifts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/hr/shifts/seed-defaults'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['attendance-policies'] });
        },
    });
};

// Attendance Policies
export const useAttendancePolicies = () => useQuery({
    queryKey: ['attendance-policies'],
    queryFn: () => api.get('/hr/attendance-policies').then(res => res.data),
});

export const useCreatePolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/attendance-policies', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policies'] }),
    });
};

export const useUpdatePolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/hr/attendance-policies/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policies'] }),
    });
};

export const useDeletePolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`/hr/attendance-policies/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policies'] }),
    });
};

export const useSeedPolicies = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/hr/attendance-policies/seed-defaults'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policies'] }),
    });
};

// Field Tracking
export const useFieldTrackingSessionsByEmployee = (employeeId: number) => useQuery({
    queryKey: ['field-tracking', 'employee', employeeId],
    queryFn: () => api.get(`/hr/field-tracking/employee/${employeeId}`).then(res => res.data),
    enabled: !!employeeId,
});

export const useStartFieldTracking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/field-tracking/start', data).then(res => res.data),
        onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['field-tracking'] }),
    });
};

export const useEndFieldTracking = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/field-tracking/end', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['field-tracking'] }),
    });
};

export const useRecordTrackingPoint = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/field-tracking/record-point', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['field-tracking'] }),
    });
};
// Performance Management
export const usePerformanceReviews = () => useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => api.get('/hr/performance').then(res => res.data),
});

export const useGoals = () => useQuery({
    queryKey: ['performance-goals'],
    queryFn: () => api.get('/hr/goals').then(res => res.data),
});

export const useCreateGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/goals', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-goals'] }),
    });
};

export const useKPIs = () => useQuery({
    queryKey: ['performance-kpis'],
    queryFn: () => api.get('/hr/kpis').then(res => res.data),
});

export const useCreatePerformanceReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.post('/hr/performance', data).then(res => res.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-reviews'] }),
    });
};
