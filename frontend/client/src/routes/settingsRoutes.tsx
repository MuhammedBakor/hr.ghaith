// client/src/routes/settingsRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const SecuritySettingsPage = lazy(() => import("@/pages/settings/SecuritySettings"));
const SmtpSettings = lazy(() => import("@/pages/settings/SmtpSettings"));
const HrSettings = lazy(() => import("@/pages/settings/HrSettings"));
const FinanceSettingsPage = lazy(() => import("@/pages/settings/FinanceSettings"));
const FleetSettings = lazy(() => import("@/pages/settings/FleetSettings"));
const DomainsSettings = lazy(() => import("@/pages/settings/DomainsSettings"));
const LetterTemplates = lazy(() => import("@/pages/settings/LetterTemplates"));
const AuditLogViewer = lazy(() => import("@/pages/settings/AuditLogViewer"));
const Settings = lazy(() => import("@/pages/settings/Settings"));
const SystemSettings = lazy(() => import("@/pages/settings/SystemSettings"));
const NotificationSettings = lazy(() => import("@/pages/settings/NotificationSettings"));
const Backup = lazy(() => import("@/pages/settings/Backup"));
const BranchSettings = lazy(() => import("@/pages/settings/BranchSettings"));
const DepartmentSettings = lazy(() => import("@/pages/settings/DepartmentSettings"));
const RoleSettings = lazy(() => import("@/pages/settings/RoleSettings"));
const CodePrefixes = lazy(() => import("@/pages/settings/CodePrefixes"));
const EmailSettings = lazy(() => import("@/pages/settings/EmailSettings"));
const WhatsAppSettings = lazy(() => import("@/pages/settings/WhatsAppSettings"));
const SmsSettings = lazy(() => import("@/pages/settings/SmsSettings"));
const MessageTemplates = lazy(() => import("@/pages/settings/MessageTemplates"));
const Positions = lazy(() => import("@/pages/hr/Positions"));
const LeaveTypes = lazy(() => import("@/pages/hr/LeaveTypes"));
const FiscalPeriods = lazy(() => import("@/pages/finance/FiscalPeriods"));
const PrintTemplates = lazy(() => import("@/pages/admin/PrintTemplates"));
const WorkSchedules = lazy(() => import("@/pages/hr/WorkSchedules"));
const LetterheadSettings = lazy(() => import("@/pages/admin/LetterheadSettings"));

const NotFound = lazy(() => import("@/pages/NotFound"));

export function SettingsRoutes() {
  return (
    <>
      <Route path="/settings/branding">
        <DashboardLayout>
          <LetterheadSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/system">
        <DashboardLayout>
          <SystemSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/notifications">
        <DashboardLayout>
          <NotificationSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/backup">
        <DashboardLayout>
          <Backup />
        </DashboardLayout>
      </Route>
      <Route path="/settings/branches">
        <DashboardLayout>
          <BranchSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/departments">
        <DashboardLayout>
          <DepartmentSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/roles">
        <DashboardLayout>
          <RoleSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/code-prefixes">
        <DashboardLayout>
          <CodePrefixes />
        </DashboardLayout>
      </Route>
      <Route path="/settings/email">
        <DashboardLayout>
          <EmailSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/whatsapp">
        <DashboardLayout>
          <WhatsAppSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/sms">
        <DashboardLayout>
          <SmsSettings />
        </DashboardLayout>
      </Route>
      <Route path="/settings/message-templates">
        <DashboardLayout>
          <MessageTemplates />
        </DashboardLayout>
      </Route>
      <Route path="/settings/finance/fiscal-periods">
        <DashboardLayout>
          <FiscalPeriods />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/leave-types">
        <DashboardLayout>
          <LeaveTypes />
        </DashboardLayout>
      </Route>
      <Route path="/settings/templates">
        <DashboardLayout>
          <PrintTemplates />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/work-schedules">
        <DashboardLayout>
          <WorkSchedules />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/positions">
        <DashboardLayout>
          <Positions />
        </DashboardLayout>
      </Route>
      <Route path="/settings/security-config">
        <DashboardLayout><SecuritySettingsPage /></DashboardLayout>
      </Route>
      <Route path="/settings/smtp">
        <DashboardLayout><SmtpSettings /></DashboardLayout>
      </Route>
      <Route path="/settings/hr-config">
        <DashboardLayout><HrSettings /></DashboardLayout>
      </Route>
      <Route path="/settings/finance-config">
        <DashboardLayout><FinanceSettingsPage /></DashboardLayout>
      </Route>
      <Route path="/settings/fleet-config">
        <DashboardLayout><FleetSettings /></DashboardLayout>
      </Route>
      <Route path="/settings/domains">
        <DashboardLayout><DomainsSettings /></DashboardLayout>
      </Route>
      <Route path="/settings/letter-templates">
        <DashboardLayout><LetterTemplates /></DashboardLayout>
      </Route>
      <Route path="/settings/audit-log">
        <DashboardLayout><AuditLogViewer /></DashboardLayout>
      </Route>

      <Route path="/404">
        <Suspense fallback={<div>Loading...</div>}>
          <NotFound />
        </Suspense>
      </Route>
    </>
  );
}
