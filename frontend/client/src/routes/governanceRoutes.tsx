// client/src/routes/governanceRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const GovernanceLayer = lazy(() => import("@/pages/governance/GovernanceLayer"));
const Policies = lazy(() => import("@/pages/governance/Policies"));
const Risks = lazy(() => import("@/pages/governance/Risks"));
const Audits = lazy(() => import("@/pages/governance/Audits"));
const IAM = lazy(() => import("@/pages/governance/IAM"));
const Compliance = lazy(() => import("@/pages/governance/Compliance"));
const IamAdvanced = lazy(() => import("@/pages/governance/IamAdvanced"));
const RolePacks = lazy(() => import("@/pages/governance/RolePacks"));
const DualControl = lazy(() => import("@/pages/governance/DualControl"));
const AnomalyRules = lazy(() => import("@/pages/governance/AnomalyRules"));
const AnomalyDetections = lazy(() => import("@/pages/governance/AnomalyDetections"));
const PermissionMatrix = lazy(() => import("@/pages/governance/PermissionMatrix"));
const OperationLimits = lazy(() => import("@/pages/governance/OperationLimits"));
const BusinessRulesPage = lazy(() => import("@/pages/governance/BusinessRules"));
const SessionMonitor = lazy(() => import("@/pages/governance/SessionMonitor"));
const AccessRestrictions = lazy(() => import("@/pages/governance/AccessRestrictions"));
const BusinessRulesBuilder = lazy(() => import("@/pages/governance/BusinessRulesBuilder"));
const PermissionChangeLog = lazy(() => import("@/pages/governance/PermissionChangeLog"));
const SystemAdmin = lazy(() => import("@/pages/admin/SystemAdmin"));
const ExceptionsDashboard = lazy(() => import("@/pages/admin/ExceptionsDashboard"));
const EventLog = lazy(() => import("@/pages/system/EventLog"));
const JobsDashboard = lazy(() => import("@/pages/admin/JobsDashboard"));
const DecisionsDashboard = lazy(() => import("@/pages/admin/DecisionsDashboard"));
const AutomationCenter = lazy(() => import("@/pages/admin/AutomationCenter"));
const SchedulerDashboard = lazy(() => import("@/pages/admin/SchedulerDashboard"));
const WorkflowAudit = lazy(() => import("@/pages/system/WorkflowAudit"));
const StateHistoryPage = lazy(() => import("@/pages/admin/StateHistory"));
const GovernanceAuditLog = lazy(() => import("@/pages/admin/GovernanceAuditLog"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const PendingBalancesPage = lazy(() => import("@/pages/admin/PendingBalances"));
const SecuritySettingsPage = lazy(() => import("@/pages/settings/SecuritySettings"));

export function GovernanceRoutes() {
  return (
    <>
    <Route path="/governance" element={<DashboardLayout><GovernanceLayer /></DashboardLayout>} />
    <Route path="/governance/policies" element={<DashboardLayout><Policies /></DashboardLayout>} />
    <Route path="/governance/risks" element={<DashboardLayout><Risks /></DashboardLayout>} />
    <Route path="/governance/audits" element={<DashboardLayout><Audits /></DashboardLayout>} />
    <Route path="/governance/iam" element={<DashboardLayout><IAM /></DashboardLayout>} />
    <Route path="/governance/compliance" element={<DashboardLayout><Compliance /></DashboardLayout>} />
    <Route path="/governance/iam-advanced" element={<DashboardLayout><IamAdvanced /></DashboardLayout>} />
    <Route path="/governance/role-packs" element={<DashboardLayout><RolePacks /></DashboardLayout>} />
    <Route path="/governance/dual-control" element={<DashboardLayout><DualControl /></DashboardLayout>} />
    <Route path="/governance/anomaly-rules" element={<DashboardLayout><AnomalyRules /></DashboardLayout>} />
    <Route path="/governance/anomaly-detections" element={<DashboardLayout><AnomalyDetections /></DashboardLayout>} />
    <Route path="/governance/state-history" element={<DashboardLayout><Suspense fallback={<div>...</div>}><StateHistoryPage /></Suspense></DashboardLayout>} />
    <Route path="/admin/pending-balances" element={<DashboardLayout><PendingBalancesPage /></DashboardLayout>} />
    
    <Route path="/admin/logs" element={<DashboardLayout><AuditLogs /></DashboardLayout>} />
    
    <Route path="/admin/event-log" element={<DashboardLayout><EventLog /></DashboardLayout>} />
    
    <Route path="/admin/workflow-audit" element={<DashboardLayout><WorkflowAudit /></DashboardLayout>} />
    
    <Route path="/admin/system" element={<DashboardLayout><SystemAdmin /></DashboardLayout>} />
    
    <Route path="/platform/jobs" element={<DashboardLayout><JobsDashboard /></DashboardLayout>} />
    
    <Route path="/platform/scheduler" element={<DashboardLayout><SchedulerDashboard /></DashboardLayout>} />
    
    <Route path="/admin/automation" element={<DashboardLayout><AutomationCenter /></DashboardLayout>} />
    
    <Route path="/governance/audit-log" element={<DashboardLayout><GovernanceAuditLog /></DashboardLayout>} />
    <Route path="/governance/exceptions" element={<DashboardLayout><ExceptionsDashboard /></DashboardLayout>} />
    <Route path="/governance/decisions" element={<DashboardLayout><DecisionsDashboard /></DashboardLayout>} />
    <Route path="/governance/permissions" element={<DashboardLayout><PermissionMatrix /></DashboardLayout>} />
    <Route path="/governance/operation-limits" element={<DashboardLayout><OperationLimits /></DashboardLayout>} />
    <Route path="/governance/business-rules" element={<DashboardLayout><BusinessRulesPage /></DashboardLayout>} />
    <Route path="/governance/business-rules-builder" element={<DashboardLayout><BusinessRulesBuilder /></DashboardLayout>} />
    <Route path="/governance/session-monitor" element={<DashboardLayout><SessionMonitor /></DashboardLayout>} />
    <Route path="/governance/access-restrictions" element={<DashboardLayout><AccessRestrictions /></DashboardLayout>} />
    <Route path="/governance/permission-log" element={<DashboardLayout><PermissionChangeLog /></DashboardLayout>} />
    <Route path="/settings/security-config" element={<DashboardLayout><SecuritySettingsPage /></DashboardLayout>} />
        <Route path="/admin/decisions" element={<DashboardLayout><DecisionsDashboard /></DashboardLayout>} />
    <Route path="/admin/exceptions" element={<DashboardLayout><ExceptionsDashboard /></DashboardLayout>} />
    <Route path="/admin/governance-audit" element={<DashboardLayout><GovernanceAuditLog /></DashboardLayout>} />
    <Route path="/admin/state-history" element={<DashboardLayout><StateHistory /></DashboardLayout>} />
        <Route path="/logs" element={<DashboardLayout><AuditLogs /></DashboardLayout>} />
    </>
  );
}
