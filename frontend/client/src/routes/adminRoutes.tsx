// client/src/routes/adminRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const UnifiedInboxPage = lazy(() => import("@/pages/admin/UnifiedInbox"));
const PendingReservesPage = lazy(() => import("@/pages/admin/PendingReserves"));
const StateHistoryPage = lazy(() => import("@/pages/admin/StateHistory"));
const SecurityDashboard = lazy(() => import("@/pages/admin/SecurityDashboard"));
const SystemAdmin = lazy(() => import("@/pages/admin/SystemAdmin"));
const JobsDashboard = lazy(() => import("@/pages/admin/JobsDashboard"));
const SchedulerDashboard = lazy(() => import("@/pages/admin/SchedulerDashboard"));
const AutomationCenter = lazy(() => import("@/pages/admin/AutomationCenter"));
const GovernanceDashboard = lazy(() => import("@/pages/admin/GovernanceDashboard"));
const SLADashboard = lazy(() => import("@/pages/admin/SLADashboard"));
const GovernanceAuditLog = lazy(() => import("@/pages/admin/GovernanceAuditLog"));
const WorkflowsDashboard = lazy(() => import("@/pages/admin/WorkflowsDashboard"));
const ExceptionsDashboard = lazy(() => import("@/pages/admin/ExceptionsDashboard"));
const DecisionsDashboard = lazy(() => import("@/pages/admin/DecisionsDashboard"));
const Subscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const LetterheadSettings = lazy(() => import("@/pages/admin/LetterheadSettings"));
const SystemCatalog = lazy(() => import("@/pages/admin/SystemCatalog"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Roles = lazy(() => import("@/pages/admin/Roles"));
const Delegations = lazy(() => import("@/pages/admin/Delegations"));
const ApprovalSettingsPage = lazy(() => import("@/pages/admin/ApprovalSettings"));
const PendingBalancesPage = lazy(() => import("@/pages/admin/PendingBalances"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const BeneficiaryRules = lazy(() => import("@/pages/admin/BeneficiaryRules"));
const PrintTemplates = lazy(() => import("@/pages/admin/PrintTemplates"));
const SalaryAdvancesPage = lazy(() => import("@/pages/finance/SalaryAdvances"));
const WorkflowAudit = lazy(() => import("@/pages/system/WorkflowAudit"));
const EventLog = lazy(() => import("@/pages/system/EventLog"));
const ApprovalSettings = lazy(() => import("@/pages/admin/ApprovalSettings"));
const Delegations = lazy(() => import("@/pages/admin/Delegations"));
const LetterheadSettingsAdmin = lazy(() => import("@/pages/admin/LetterheadSettings"));

export function AdminRoutes() {
  return (
    <>
    <Route path="/admin">
    <DashboardLayout>
    <SystemCatalog />
    </DashboardLayout>
    </Route>
    <Route path="/admin/users">
    <DashboardLayout>
    <Users />
    </DashboardLayout>
    </Route>
    <Route path="/admin/roles">
    <DashboardLayout>
    <Roles />
    </DashboardLayout>
    </Route>
    <Route path="/admin/inbox" element={<DashboardLayout><Suspense fallback={<div>...</div>}><UnifiedInboxPage /></Suspense></DashboardLayout>} />
    <Route path="/hr/salary-advances" element={<DashboardLayout><Suspense fallback={<div>...</div>}><SalaryAdvancesPage /></Suspense></DashboardLayout>} />
    <Route path="/admin/pending-reserves" element={<DashboardLayout><Suspense fallback={<div>...</div>}><PendingReservesPage /></Suspense></DashboardLayout>} />
    <Route path="/governance/state-history" element={<DashboardLayout><Suspense fallback={<div>...</div>}><StateHistoryPage /></Suspense></DashboardLayout>} />
    <Route path="/admin/pending-balances">
    <DashboardLayout>
    <PendingBalancesPage />
    </DashboardLayout>
    </Route>
    <Route path="/admin/logs">
    <DashboardLayout>
    <AuditLogs />
    </DashboardLayout>
    </Route>
    <Route path="/admin/event-log">
    <DashboardLayout>
    <EventLog />
    </DashboardLayout>
    </Route>
    <Route path="/admin/workflow-audit">
    <DashboardLayout>
    <WorkflowAudit />
    </DashboardLayout>
    </Route>
    <Route path="/admin/system">
    <DashboardLayout>
    <SystemAdmin />
    </DashboardLayout>
    </Route>
    <Route path="/admin/automation">
    <DashboardLayout>
    <AutomationCenter />
    </DashboardLayout>
    </Route>
    <Route path="/admin/governance" /* MOVED: use /governance instead */>
    <DashboardLayout>
    <GovernanceDashboard />
    </DashboardLayout>
    </Route>
    <Route path="/admin/sla">
    <DashboardLayout>
    <SLADashboard />
    </DashboardLayout>
    </Route>
    <Route path="/admin/subscriptions">
    <DashboardLayout>
    <Subscriptions />
    </DashboardLayout>
    </Route>
    <Route path="/admin/security">
    <DashboardLayout>
    <SecurityDashboard />
    </DashboardLayout>
    </Route>
    <Route path="/admin/beneficiary-rules">
    <DashboardLayout>
    <BeneficiaryRules />
    </DashboardLayout>
    </Route>
        <Route path="/admin/approval-settings" element={<DashboardLayout><ApprovalSettings /></DashboardLayout>} />
    <Route path="/admin/delegations" element={<DashboardLayout><Delegations /></DashboardLayout>} />
    <Route path="/admin/letterhead" element={<DashboardLayout><LetterheadSettingsAdmin /></DashboardLayout>} />
    <Route path="/admin/decisions"><DashboardLayout><DecisionsDashboard /></DashboardLayout></Route>
    <Route path="/admin/exceptions"><DashboardLayout><ExceptionsDashboard /></DashboardLayout></Route>
    <Route path="/admin/governance-audit"><DashboardLayout><GovernanceAuditLog /></DashboardLayout></Route>
    <Route path="/admin/jobs"><DashboardLayout><JobsDashboard /></DashboardLayout></Route>
    <Route path="/admin/scheduler"><DashboardLayout><SchedulerDashboard /></DashboardLayout></Route>
    <Route path="/admin/workflows"><DashboardLayout><WorkflowsDashboard /></DashboardLayout></Route>
    <Route path="/admin/print-templates"><DashboardLayout><PrintTemplates /></DashboardLayout></Route>
    </>
  );
}
