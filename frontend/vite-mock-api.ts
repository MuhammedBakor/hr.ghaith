import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

// ─── Fake data ────────────────────────────────────────────────────────────────

const FAKE_USER = {
    id: 1,
    name: "مدير النظام",
    email: "admin@demo.local",
    role: "admin",
    username: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
};

const FAKE_BRANCHES = [
    { id: 1, name: "الفرع الرئيسي", code: "HQ", isActive: true },
    { id: 2, name: "فرع الرياض", code: "RYD", isActive: true },
    { id: 3, name: "فرع جدة", code: "JED", isActive: true },
];

// ─── SuperJSON-compatible serializer (minimal) ────────────────────────────────
// tRPC's httpBatchLink with superjson transformer calls superjson.deserialize()
// on the response. The wire format is: { json: <any>, meta?: {...} }
// For plain objects/arrays/primitives there is no meta needed.

function superJsonWrap(data: unknown): unknown {
    return { json: data };
}

// ─── Per-procedure mock responses ────────────────────────────────────────────

function mockData(procedure: string): unknown {
    switch (procedure) {
        // auth
        case "auth.me":
            return FAKE_USER;
        case "auth.logout":
            return { success: true };

        // kernel
        case "controlKernel.branches.list":
            return FAKE_BRANCHES;
        case "controlKernel.context.update":
            return { success: true };

        // hr — return empty lists so pages don't crash
        case "hr.employees.list":
        case "hr.departments.list":
        case "hr.positions.list":
        case "hr.leaves.list":
        case "hr.attendance.list":
        case "hr.payroll.list":
        case "hr.violations.list":
        case "hr.shifts.list":
        case "hr.approvalChains.list":
        case "hr.leaveTypes.list":
        case "hr.workSchedules.list":
            return [];

        // finance
        case "finance.invoices.list":
        case "finance.expenses.list":
        case "finance.vendors.list":
        case "finance.accounts.list":
        case "finance.journalEntries.list":
        case "finance.purchaseOrders.list":
        case "finance.vouchers.list":
        case "finance.custodies.list":
        case "finance.salaryAdvances.list":
        case "finance.payments.list":
        case "finance.receivables.list":
            return [];

        // fleet
        case "fleet.vehicles.list":
        case "fleet.drivers.list":
        case "fleet.trips.list":
        case "fleet.maintenance.list":
        case "fleet.fuelLogs.list":
        case "fleet.reservations.list":
            return [];

        // property
        case "property.list":
        case "property.contracts.list":
        case "property.tenants.list":
        case "property.leases.list":
            return [];

        // governance
        case "governance.policies.list":
        case "governance.risks.list":
        case "governance.audits.list":
            return [];

        // admin
        case "admin.users.list":
        case "admin.roles.list":
        case "admin.auditLogs.list":
        case "admin.delegations.list":
            return [];

        // documents / reports / requests
        case "documents.list":
        case "documents.folders.list":
        case "documents.templates.list":
        case "requests.list":
        case "reports.list":
            return [];

        // legal
        case "legal.cases.list":
        case "legal.contracts.list":
        case "legal.documents.list":
            return [];

        // notifications
        case "notifications.list":
        case "platform.notifications.list":
            return [];

        // Catch-all: return empty array so list UI renders "no results"
        default:
            return [];
    }
}

// ─── tRPC response builder ────────────────────────────────────────────────────

function trpcOk(data: unknown) {
    // superjson transformer format
    return { result: { data: superJsonWrap(data) } };
}

function buildBody(procedures: string[]): string {
    if (procedures.length === 0) {
        return JSON.stringify({ result: { data: superJsonWrap(null) } });
    }
    const results = procedures.map((p) => trpcOk(mockData(p)));
    // tRPC batch returns array when batched, single obj when not
    return JSON.stringify(results.length === 1 ? results[0] : results);
}

// ─── Vite plugin ─────────────────────────────────────────────────────────────

export function mockApiPlugin(): Plugin {
    return {
        name: "mock-api",
        configureServer(server) {
            server.middlewares.use(
                "/api",
                (
                    req: IncomingMessage,
                    res: ServerResponse,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    next: (err?: any) => void
                ) => {
                    const rawUrl = req.url ?? "/";
                    const url = new URL(rawUrl, "http://localhost");

                    // ── CSRF token ────────────────────────────────────────────────────
                    if (url.pathname === "/csrf-token") {
                        res.setHeader("Content-Type", "application/json");
                        res.setHeader(
                            "Set-Cookie",
                            "csrf_token=mock-csrf; Path=/; SameSite=Strict"
                        );
                        res.end(JSON.stringify({ csrfToken: "mock-csrf" }));
                        return;
                    }

                    // ── Only handle /trpc paths ───────────────────────────────────────
                    if (!url.pathname.startsWith("/trpc")) {
                        next();
                        return;
                    }

                    // Extract procedure name(s) from path: /trpc/auth.me,controlKernel.branches.list
                    const proceduresPart = url.pathname.replace(/^\/trpc\/?/, "");
                    const procedures = proceduresPart
                        ? proceduresPart.split(",")
                        : [];

                    const sendResponse = () => {
                        res.setHeader("Content-Type", "application/json");
                        res.statusCode = 200;
                        res.end(buildBody(procedures));
                    };

                    if (req.method === "GET") {
                        sendResponse();
                        return;
                    }

                    if (req.method === "POST") {
                        // Must drain body before responding
                        let body = "";
                        req.on("data", (chunk) => (body += chunk));
                        req.on("end", sendResponse);
                        return;
                    }

                    next();
                }
            );
        },
    };
}
