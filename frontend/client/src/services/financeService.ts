import api from "@/lib/api";

export interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    totalAfterTax?: number;
}

export interface InvoicePayment {
    id?: number;
    paymentNumber: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
}

export interface InvoiceStatusHistory {
    id?: number;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    createdAt?: string;
}

export interface Invoice {
    id?: number;
    invoiceNumber: string;
    clientName?: string | null;
    amount: number | string;
    issueDate?: string | Date | null;
    dueDate?: string | Date | null;
    status: string;
    createdAt?: string;
    items?: InvoiceItem[];
    payments?: InvoicePayment[];
    statusHistory?: InvoiceStatusHistory[];
}

export interface Expense {
    id?: number;
    description?: string | null;
    category: string;
    amount: number | string;
    expenseDate?: string | Date | null;
    employeeId?: number | null;
    status: string;
}

export const financeService = {
    // Invoices
    getInvoices: async (branchId?: number) => {
        const response = await api.get<Invoice[]>("/finance/invoices", {
            params: { branchId }
        });
        return response.data;
    },

    getInvoiceById: async (id: number) => {
        const response = await api.get<Invoice>(`/finance/invoices/${id}`);
        return response.data;
    },

    createInvoice: async (invoice: Invoice, branchId?: number) => {
        const response = await api.post<Invoice>("/finance/invoices", invoice, {
            params: { branchId }
        });
        return response.data;
    },

    updateInvoice: async (id: number, invoice: Invoice) => {
        const response = await api.put<Invoice>(`/finance/invoices/${id}`, invoice);
        return response.data;
    },

    updateInvoiceStatus: async (id: number, status: string, reason: string) => {
        const response = await api.put<Invoice>(`/finance/invoices/${id}/status`, { status, reason });
        return response.data;
    },

    recordPayment: async (id: number, payment: any) => {
        const response = await api.post<Invoice>(`/finance/invoices/${id}/payments`, payment);
        return response.data;
    },

    deleteInvoice: async (id: number) => {
        await api.delete(`/finance/invoices/${id}`);
    },

    // Expenses
    getExpenses: async () => {
        const response = await api.get<Expense[]>("/finance/expenses");
        return response.data;
    },

    getExpensesByEmployee: async (employeeId: number) => {
        const response = await api.get<Expense[]>(`/finance/expenses/employee/${employeeId}`);
        return response.data;
    },

    getExpenseById: async (id: number) => {
        const response = await api.get<Expense>(`/finance/expenses/${id}`);
        return response.data;
    },

    createExpense: async (expense: Expense) => {
        const response = await api.post<Expense>("/finance/expenses", expense);
        return response.data;
    },

    updateExpense: async (id: number, expense: Expense) => {
        const response = await api.put<Expense>(`/finance/expenses/${id}`, expense);
        return response.data;
    },

    deleteExpense: async (id: number) => {
        await api.delete(`/finance/expenses/${id}`);
    },

    // Budgets
    getBudgets: async () => {
        const response = await api.get("/finance/budgets");
        return response.data;
    },
    createBudget: async (budget: any) => {
        const response = await api.post("/finance/budgets", budget);
        return response.data;
    },
    updateBudget: async (id: number, budget: any) => {
        const response = await api.put(`/finance/budgets/${id}`, budget);
        return response.data;
    },
    deleteBudget: async (id: number) => {
        await api.delete(`/finance/budgets/${id}`);
    },

    // Custodies
    getCustodies: async () => {
        const response = await api.get("/finance/custodies");
        return response.data;
    },
    createCustody: async (custody: any) => {
        const response = await api.post("/finance/custodies", custody);
        return response.data;
    },
    updateCustody: async (id: number, custody: any) => {
        const response = await api.put(`/finance/custodies/${id}`, custody);
        return response.data;
    },
    deleteCustody: async (id: number) => {
        await api.delete(`/finance/custodies/${id}`);
    },

    // Payments
    getPayments: async () => {
        const response = await api.get("/finance/payments");
        return response.data;
    },
    createPayment: async (payment: any) => {
        const response = await api.post("/finance/payments", payment);
        return response.data;
    },
    updatePayment: async (id: number, payment: any) => {
        const response = await api.put(`/finance/payments/${id}`, payment);
        return response.data;
    },
    deletePayment: async (id: number) => {
        await api.delete(`/finance/payments/${id}`);
    },

    // Receivables
    getReceivables: async () => {
        const response = await api.get("/finance/receivables");
        return response.data;
    },
    createReceivable: async (receivable: any) => {
        const response = await api.post("/finance/receivables", receivable);
        return response.data;
    },
    updateReceivable: async (id: number, receivable: any) => {
        const response = await api.put(`/finance/receivables/${id}`, receivable);
        return response.data;
    },
    deleteReceivable: async (id: number) => {
        await api.delete(`/finance/receivables/${id}`);
    },

    // Fiscal Periods
    getFiscalPeriods: async () => {
        const response = await api.get("/finance/fiscal-periods");
        return response.data;
    },
    createFiscalPeriod: async (period: any) => {
        const response = await api.post("/finance/fiscal-periods", period);
        return response.data;
    },
    updateFiscalPeriod: async (id: number, period: any) => {
        const response = await api.put(`/finance/fiscal-periods/${id}`, period);
        return response.data;
    },
    deleteFiscalPeriod: async (id: number) => {
        await api.delete(`/finance/fiscal-periods/${id}`);
    },

    // Salary Advances
    getSalaryAdvances: async () => {
        const response = await api.get("/finance/salary-advances");
        return response.data;
    },
    createSalaryAdvance: async (advance: any) => {
        const response = await api.post("/finance/salary-advances", advance);
        return response.data;
    },
    updateSalaryAdvance: async (id: number, advance: any) => {
        const response = await api.put(`/finance/salary-advances/${id}`, advance);
        return response.data;
    },
    deleteSalaryAdvance: async (id: number) => {
        await api.delete(`/finance/salary-advances/${id}`);
    },

    // Finance Automation
    getFinanceAutomationServices: async () => {
        const response = await api.get("/finance/automation/services");
        return response.data;
    },
    getFinanceAutomationLogs: async (limit?: number) => {
        const response = await api.get("/finance/automation/logs", { params: { limit } });
        return response.data;
    },
    getFinanceAutomationStats: async () => {
        const response = await api.get("/finance/automation/stats");
        return response.data;
    },
    toggleFinanceAutomation: async (data: any) => {
        const response = await api.post("/finance/automation/toggle", data);
        return response.data;
    },
    runFinanceAutomation: async (data: any) => {
        const response = await api.post("/finance/automation/run", data);
        return response.data;
    },
    updateFinanceAutomation: async (data: any) => {
        const response = await api.put("/finance/automation/update", data);
        return response.data;
    },
    initFinanceAutomation: async () => {
        const response = await api.post("/finance/automation/initialize");
        return response.data;
    },
};
