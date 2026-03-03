// client/src/routes/financeRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const SalaryAdvancesPage = lazy(() => import("@/pages/finance/SalaryAdvances"));
const CustodiesPage = lazy(() => import("@/pages/finance/Custodies"));
const FinanceAutomation = lazy(() => import("@/pages/finance/FinanceAutomation"));
const InvoiceList = lazy(() => import("@/pages/finance/InvoiceList"));
const InvoiceDetails = lazy(() => import("@/pages/finance/InvoiceDetails"));
const Expenses = lazy(() => import("@/pages/finance/Expenses"));
const Budget = lazy(() => import("@/pages/finance/Budget"));
const Accounts = lazy(() => import("@/pages/finance/Accounts"));
const JournalEntries = lazy(() => import("@/pages/finance/JournalEntries"));
const FinancialRequests = lazy(() => import("@/pages/finance/FinancialRequests"));
const Vouchers = lazy(() => import("@/pages/finance/Vouchers"));
const FinanceReports = lazy(() => import("@/pages/finance/Reports"));
const Vendors = lazy(() => import("@/pages/finance/Vendors"));
const PurchaseOrders = lazy(() => import("@/pages/finance/PurchaseOrders"));
const Warehouses = lazy(() => import("@/pages/finance/Warehouses"));
const TaxSystem = lazy(() => import("@/pages/finance/TaxSystem"));
const P2PWorkflow = lazy(() => import("@/pages/finance/P2PWorkflow"));
const FinancialCommitments = lazy(() => import("@/pages/finance/FinancialCommitments"));
const Budgets = lazy(() => import("@/pages/finance/Budgets"));
const FiscalPeriods = lazy(() => import("@/pages/finance/FiscalPeriods"));
const Receivables = lazy(() => import("@/pages/finance/Receivables"));
const Payments = lazy(() => import("@/pages/finance/Payments"));
const CustodiesFinance = lazy(() => import("@/pages/finance/Custodies"));
const SalaryAdvancesFinance = lazy(() => import("@/pages/finance/SalaryAdvances"));
const FinancialRequests = lazy(() => import("@/pages/finance/FinancialRequests"));
const WarehousesPage = lazy(() => import("@/pages/finance/Warehouses"));

export function FinanceRoutes() {
  return (
    <>
    <Route path="/finance/automation">
    <DashboardLayout>
    <FinanceAutomation />
    </DashboardLayout>
    </Route>
    <Route path="/finance">
    <DashboardLayout>
    <InvoiceList />
    </DashboardLayout>
    </Route>
    <Route path="/finance/invoices">
    <DashboardLayout>
    <InvoiceList />
    </DashboardLayout>
    </Route>
    <Route path="/finance/invoice/:id">
    <DashboardLayout>
    <InvoiceDetails />
    </DashboardLayout>
    </Route>
    <Route path="/finance/expenses">
    <DashboardLayout>
    <Expenses />
    </DashboardLayout>
    </Route>
    <Route path="/finance/budget" /* MERGED: redirects to /finance/budgets */>
    <DashboardLayout>
    <Budget />
    </DashboardLayout>
    </Route>
    <Route path="/finance/accounts">
    <DashboardLayout>
    <Accounts />
    </DashboardLayout>
    </Route>
    <Route path="/finance/journal-entries">
    <DashboardLayout>
    <JournalEntries />
    </DashboardLayout>
    </Route>
    <Route path="/finance/requests">
    <DashboardLayout>
    <FinancialRequests />
    </DashboardLayout>
    </Route>
    <Route path="/finance/vouchers">
    <DashboardLayout>
    <Vouchers />
    </DashboardLayout>
    </Route>
    <Route path="/finance/reports">
    <DashboardLayout>
    <FinanceReports />
    </DashboardLayout>
    </Route>
    <Route path="/finance/vendors">
    <DashboardLayout>
    <Vendors />
    </DashboardLayout>
    </Route>
    <Route path="/finance/purchase-orders">
    <DashboardLayout>
    <PurchaseOrders />
    </DashboardLayout>
    </Route>
    <Route path="/finance/tax">
    <DashboardLayout>
    <TaxSystem />
    </DashboardLayout>
    </Route>
    <Route path="/finance/p2p">
    <DashboardLayout>
    <P2PWorkflow />
    </DashboardLayout>
    </Route>
    <Route path="/finance/commitments">
    <DashboardLayout>
    <FinancialCommitments />
    </DashboardLayout>
    </Route>
    <Route path="/finance/budgets">
    <DashboardLayout>
    <Budgets />
    </DashboardLayout>
    </Route>
    <Route path="/finance/receivables">
    <DashboardLayout>
    <Receivables />
    </DashboardLayout>
    </Route>
    <Route path="/finance/payments">
    <DashboardLayout>
    <Payments />
    </DashboardLayout>
    </Route>
        <Route path="/finance/custodies" element={<DashboardLayout><CustodiesFinance /></DashboardLayout>} />
    <Route path="/finance/salary-advances" element={<DashboardLayout><SalaryAdvancesFinance /></DashboardLayout>} />
    <Route path="/finance/financial-requests" element={<DashboardLayout><FinancialRequests /></DashboardLayout>} />
    <Route path="/finance/warehouses" element={<DashboardLayout><WarehousesPage /></DashboardLayout>} />
    </>
  );
}
