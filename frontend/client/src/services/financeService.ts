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
};
