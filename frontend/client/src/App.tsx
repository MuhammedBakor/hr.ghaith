import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy loaded pages
const UnifiedInboxPage = lazy(() => import("@/pages/admin/UnifiedInbox"));
const SalaryAdvancesPage = lazy(() => import("@/pages/finance/SalaryAdvances"));
const CustodiesPage = lazy(() => import("@/pages/finance/Custodies"));
const PendingReservesPage = lazy(() => import("@/pages/admin/PendingReserves"));
const StateHistoryPage = lazy(() => import("@/pages/admin/StateHistory"));

// HR Module


// Finance Module

// Admin Module

// Fleet Module

// Property Module

// Governance Module
// v52: Governance Control Pages

// v52: Settings Pages


// BI Module

// Requests Module

// Support Module

// Legal Module

// System Module

// Projects Module

// Documents Module

// Reports Module

// Admin Module

// Setup Module

// Settings Module

import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";

// v56: Lazy loaded pages for performance
const NotFound = lazy(() => import("@/pages/NotFound"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const SecurityDashboard = lazy(() => import("@/pages/admin/SecurityDashboard"));
const Activate = lazy(() => import("@/pages/Activate"));
const CompleteProfile = lazy(() => import("@/pages/hr/CompleteProfile"));
const Home = lazy(() => import("@/pages/Home"));
const BranchSelector = lazy(() => import("@/pages/BranchSelector"));
const EmployeeList = lazy(() => import("@/pages/hr/EmployeeList"));
const AttendanceMonitoring = lazy(() => import("@/pages/hr/AttendanceMonitoring"));
const Leaves = lazy(() => import("@/pages/hr/Leaves"));
const Payroll = lazy(() => import("@/pages/hr/Payroll"));
const SalaryComponents = lazy(() => import("@/pages/hr/SalaryComponents"));
const Performance = lazy(() => import("@/pages/hr/Performance"));
const Training = lazy(() => import("@/pages/hr/Training"));
const Organization = lazy(() => import("@/pages/hr/Organization"));
const ApplicationList = lazy(() => import("@/pages/hr/recruitment/ApplicationList"));
const EmployeeProfile = lazy(() => import("@/pages/hr/EmployeeProfile"));
const AddEmployee = lazy(() => import("@/pages/hr/AddEmployee"));
const AddEmployeeSimple = lazy(() => import("@/pages/hr/AddEmployeeSimple"));
const EmployeeActivation = lazy(() => import("@/pages/hr/EmployeeActivation"));
const EmployeeDocs = lazy(() => import("@/pages/hr/EmployeeDocs"));
const LeaveManagement = lazy(() => import("@/pages/hr/LeaveManagement"));
const PerformanceAdvanced = lazy(() => import("@/pages/hr/PerformanceAdvanced"));
const TrainingAdvanced = lazy(() => import("@/pages/hr/TrainingAdvanced"));
const FleetAutomation = lazy(() => import("@/pages/fleet/FleetAutomation"));
const FinanceAutomation = lazy(() => import("@/pages/finance/FinanceAutomation"));
const PropertyAutomation = lazy(() => import("@/pages/property/PropertyAutomation"));
const ProjectsAutomation = lazy(() => import("@/pages/projects/ProjectsAutomation"));
const SupportAutomation = lazy(() => import("@/pages/support/SupportAutomation"));
const LegalAutomation = lazy(() => import("@/pages/legal/LegalAutomation"));
const RecruitmentAdvanced = lazy(() => import("@/pages/hr/RecruitmentAdvanced"));
const OrganizationStructure = lazy(() => import("@/pages/hr/OrganizationStructure"));
const DepartmentEmployees = lazy(() => import("@/pages/hr/DepartmentEmployees"));
const ViolationsManagement = lazy(() => import("@/pages/hr/ViolationsManagement"));
const PenaltyEscalation = lazy(() => import("@/pages/hr/PenaltyEscalation"));
const MyViolations = lazy(() => import("@/pages/hr/MyViolations"));
const AttendanceReports = lazy(() => import("@/pages/hr/AttendanceReports"));
const AttendanceEmailReports = lazy(() => import("@/pages/hr/AttendanceEmailReports"));
const ShiftsManagement = lazy(() => import("@/pages/hr/ShiftsManagement"));
const OfficialLetters = lazy(() => import("@/pages/hr/OfficialLetters"));
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
const BranchComparison = lazy(() => import("@/pages/admin/BranchComparison"));
const CompaniesOverview = lazy(() => import("@/pages/admin/CompaniesOverview"));
const LetterheadSettings = lazy(() => import("@/pages/admin/LetterheadSettings"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const FleetLive = lazy(() => import("@/pages/fleet/FleetLive"));
const Vehicles = lazy(() => import("@/pages/fleet/Vehicles"));
const Maintenance = lazy(() => import("@/pages/fleet/Maintenance"));
const FuelConsumption = lazy(() => import("@/pages/fleet/FuelConsumption"));
const Drivers = lazy(() => import("@/pages/fleet/Drivers"));
const FleetMap = lazy(() => import("@/pages/fleet/FleetMap"));
const FleetAlerts = lazy(() => import("@/pages/fleet/FleetAlerts"));
const FleetReports = lazy(() => import("@/pages/fleet/FleetReports"));
const FleetTrips = lazy(() => import("@/pages/fleet/FleetTrips"));
const FleetGeofences = lazy(() => import("@/pages/fleet/FleetGeofences"));
const FleetInsights = lazy(() => import("@/pages/fleet/FleetInsights"));
const PropertyHome = lazy(() => import("@/pages/property/PropertyHome"));
const PropertyDetails = lazy(() => import("@/pages/property/PropertyDetails"));
const Properties = lazy(() => import("@/pages/property/Properties"));
const Contracts = lazy(() => import("@/pages/property/Contracts"));
const Tenants = lazy(() => import("@/pages/property/Tenants"));
const PropertyMaintenance = lazy(() => import("@/pages/property/PropertyMaintenance"));
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
const SecuritySettingsPage = lazy(() => import("@/pages/settings/SecuritySettings"));
const SmtpSettings = lazy(() => import("@/pages/settings/SmtpSettings"));
const HrSettings = lazy(() => import("@/pages/settings/HrSettings"));
const FinanceSettingsPage = lazy(() => import("@/pages/settings/FinanceSettings"));
const FleetSettings = lazy(() => import("@/pages/settings/FleetSettings"));
const DomainsSettings = lazy(() => import("@/pages/settings/DomainsSettings"));
const LetterTemplates = lazy(() => import("@/pages/settings/LetterTemplates"));
const AuditLogViewer = lazy(() => import("@/pages/settings/AuditLogViewer"));
const BI = lazy(() => import("@/pages/bi/BI"));
const Dashboards = lazy(() => import("@/pages/bi/Dashboards"));
const KPIs = lazy(() => import("@/pages/bi/KPIs"));
const AnalyticsReports = lazy(() => import("@/pages/bi/AnalyticsReports"));
const DecisionEngine = lazy(() => import("@/pages/bi/DecisionEngine"));
const BIAudit = lazy(() => import("@/pages/bi/BIAudit"));
const BIDataSources = lazy(() => import("@/pages/bi/BIDataSources"));
const RequestList = lazy(() => import("@/pages/requests/RequestList"));
const Tickets = lazy(() => import("@/pages/support/Tickets"));
const TicketComments = lazy(() => import("@/pages/support/TicketComments"));
const LegalDocuments = lazy(() => import("@/pages/legal/LegalDocuments"));
const LegalAudit = lazy(() => import("@/pages/legal/LegalAudit"));
const EventLog = lazy(() => import("@/pages/system/EventLog"));
const WorkflowAudit = lazy(() => import("@/pages/system/WorkflowAudit"));
const ProjectTasks = lazy(() => import("@/pages/projects/ProjectTasks"));
const ProjectMembers = lazy(() => import("@/pages/projects/ProjectMembers"));
const ProjectsAudit = lazy(() => import("@/pages/projects/ProjectsAudit"));
const RequestTypes = lazy(() => import("@/pages/requests/RequestTypes"));
const Workflows = lazy(() => import("@/pages/requests/Workflows"));
const DocumentList = lazy(() => import("@/pages/documents/DocumentList"));
const Folders = lazy(() => import("@/pages/documents/Folders"));
const Templates = lazy(() => import("@/pages/documents/Templates"));
const Archive = lazy(() => import("@/pages/documents/Archive"));
const ReportsDashboard = lazy(() => import("@/pages/reports/ReportsDashboard"));
const CustomReports = lazy(() => import("@/pages/reports/CustomReports"));
const ScheduledReports = lazy(() => import("@/pages/reports/ScheduledReports"));
const SystemCatalog = lazy(() => import("@/pages/admin/SystemCatalog"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Roles = lazy(() => import("@/pages/admin/Roles"));
const Delegations = lazy(() => import("@/pages/admin/Delegations"));
const ApprovalSettingsPage = lazy(() => import("@/pages/admin/ApprovalSettings"));
const PendingBalancesPage = lazy(() => import("@/pages/admin/PendingBalances"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const SetupWizard = lazy(() => import("@/pages/setup/SetupWizard"));
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
const MessageLogs = lazy(() => import("@/pages/logs/MessageLogs.tsx"));
const DmsAdvanced = lazy(() => import("@/pages/platform/DmsAdvanced"));
const AiPolicy = lazy(() => import("@/pages/platform/AiPolicy"));
const PlatformMonitoring = lazy(() => import("@/pages/platform/PlatformMonitoring"));
const EvidencePacks = lazy(() => import("@/pages/platform/EvidencePacks"));
const UpgradeManager = lazy(() => import("@/pages/platform/UpgradeManager"));
const Alerts = lazy(() => import("@/pages/platform/Alerts"));
const Calendar = lazy(() => import("@/pages/platform/Calendar"));
const NotificationsCenter = lazy(() => import("@/pages/platform/NotificationsCenter"));
const NotifyRules = lazy(() => import("@/pages/platform/NotifyRules"));
const NotifyPreferences = lazy(() => import("@/pages/platform/NotifyPreferences"));
const Search = lazy(() => import("@/pages/platform/Search"));
const Session = lazy(() => import("@/pages/platform/Session"));
const Ops = lazy(() => import("@/pages/operations/Ops"));
const Projects = lazy(() => import("@/pages/operations/Projects"));
const Integrations = lazy(() => import("@/pages/integrations/Integrations"));
const Communications = lazy(() => import("@/pages/comms/Communications"));
const Letters = lazy(() => import("@/pages/comms/Letters"));
const OutgoingMail = lazy(() => import("@/pages/correspondence/OutgoingMail"));
const IncomingMail = lazy(() => import("@/pages/correspondence/IncomingMail"));
const Transactions = lazy(() => import("@/pages/correspondence/Transactions"));
const Legal = lazy(() => import("@/pages/legal/Legal"));
const LegalContracts = lazy(() => import("@/pages/legal/Contracts"));
const Marketing = lazy(() => import("@/pages/marketing/Marketing"));
const Store = lazy(() => import("@/pages/store/Store"));
const Orders = lazy(() => import("@/pages/store/Orders"));
const Workflow = lazy(() => import("@/pages/workflow/Workflow"));
const Approvals = lazy(() => import("@/pages/workflow/Approvals"));
const PublicSite = lazy(() => import("@/pages/public_site/PublicSite"));
const Blog = lazy(() => import("@/pages/public_site/Blog"));
const JobApply = lazy(() => import("@/pages/public/JobApply"));
const BeneficiaryRules = lazy(() => import("@/pages/admin/BeneficiaryRules"));
const Budgets = lazy(() => import("@/pages/finance/Budgets"));
const Cases = lazy(() => import("@/pages/legal/Cases"));
const DispatchDashboard = lazy(() => import("@/pages/operations/DispatchDashboard"));
const FiscalPeriods = lazy(() => import("@/pages/finance/FiscalPeriods"));
const FleetDailyReports = lazy(() => import("@/pages/fleet/FleetDailyReports"));
const FleetDailyRoutes = lazy(() => import("@/pages/fleet/FleetDailyRoutes"));
const FleetDispatchRecs = lazy(() => import("@/pages/fleet/FleetDispatchRecs"));
const FleetDriverScores = lazy(() => import("@/pages/fleet/FleetDriverScores"));
const FleetETA = lazy(() => import("@/pages/fleet/FleetETA"));
const FleetExports = lazy(() => import("@/pages/fleet/FleetExports"));
const FleetGeoEvents = lazy(() => import("@/pages/fleet/FleetGeoEvents"));
const FleetHeatmap = lazy(() => import("@/pages/fleet/FleetHeatmap"));
const FleetIncidentAssist = lazy(() => import("@/pages/fleet/FleetIncidentAssist"));
const FleetReplay = lazy(() => import("@/pages/fleet/FleetReplay"));
const FleetRouteTargets = lazy(() => import("@/pages/fleet/FleetRouteTargets"));
const FleetStops = lazy(() => import("@/pages/fleet/FleetStops"));
const FleetTripRisk = lazy(() => import("@/pages/fleet/FleetTripRisk"));
const FleetTripSegments = lazy(() => import("@/pages/fleet/FleetTripSegments"));
const FuelLogs = lazy(() => import("@/pages/fleet/FuelLogs"));
const Insurance = lazy(() => import("@/pages/fleet/Insurance"));
const IntegrationsHub = lazy(() => import("@/pages/integrations/IntegrationsHub"));
const Leases = lazy(() => import("@/pages/property/Leases"));
const LeaveTypes = lazy(() => import("@/pages/hr/LeaveTypes"));
const OfficialCommunications = lazy(() => import("@/pages/comms/OfficialCommunications"));
const PrintTemplates = lazy(() => import("@/pages/admin/PrintTemplates"));
const Receivables = lazy(() => import("@/pages/finance/Receivables"));
const Reservations = lazy(() => import("@/pages/fleet/Reservations"));
const WorkSchedules = lazy(() => import("@/pages/hr/WorkSchedules"));
const Campaigns = lazy(() => import("@/pages/marketing/Campaigns"));
const Enrollments = lazy(() => import("@/pages/training/Enrollments"));
const Interviews = lazy(() => import("@/pages/recruitment/Interviews"));
const Leads = lazy(() => import("@/pages/marketing/Leads"));
const Payments = lazy(() => import("@/pages/finance/Payments"));
const Positions = lazy(() => import("@/pages/hr/Positions"));
const Programs = lazy(() => import("@/pages/training/Programs"));
const DepartmentsHub = lazy(() => import("@/pages/DepartmentsHub"));


// Platform Modules

// Communications Module

// Correspondence Module - نظام الصادر والوارد

// Legal Module

// Marketing Module

// Store Module

// Workflow Module

// Public Site Module

// ═══ Auto-wired orphan pages ═══

function Router() {
  return (
    <Switch>
      {/* Public Routes — no auth required */}
      <Route path="/jobs/:id" component={JobApply} />

      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/activate" component={Activate} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/setup" component={SetupWizard} />
      <Route path="/select-branch" component={BranchSelector} />

      {/* Protected Routes */}
      <Route path="/inbox">
        <Inbox />
      </Route>
      <Route path="/">
        <DashboardLayout>
          <Home />
        </DashboardLayout>
      </Route>

      {/* Departments Hub - for admin and general_manager */}
      <Route path="/departments">
        <DashboardLayout>
          <DepartmentsHub />
        </DashboardLayout>
      </Route>

      {/* Specific top-level department pages that must come before the :dept catch-all */}
      <Route path="/departments/requests">
        <DashboardLayout>
          <RequestList />
        </DashboardLayout>
      </Route>

      {/* Department detail (services list) - /departments/hr, /departments/finance, etc. */}
      <Route path="/departments/:dept">
        <DashboardLayout>
          <DepartmentsHub />
        </DashboardLayout>
      </Route>

      {/* Department service sub-pages */}
      <Route path="/departments/hr/employees">
        <DashboardLayout>
          <EmployeeList />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/attendance-monitoring">
        <DashboardLayout>
          <AttendanceMonitoring />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/attendance">
        <DashboardLayout>
          <AttendanceMonitoring />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/leave-management">
        <DashboardLayout>
          <LeaveManagement />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/payroll">
        <DashboardLayout>
          <Payroll />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/performance-advanced">
        <DashboardLayout>
          <PerformanceAdvanced />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/training-advanced">
        <DashboardLayout>
          <TrainingAdvanced />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/organization-structure">
        <DashboardLayout>
          <OrganizationStructure />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/recruitment-advanced">
        <DashboardLayout>
          <RecruitmentAdvanced />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/violations">
        <RoleProtectedRoute module="hr" hrSubPage="violations">
          <DashboardLayout>
            <ViolationsManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/my-violations">
        <RoleProtectedRoute module="hr" hrSubPage="my_violations">
          <DashboardLayout>
            <MyViolations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/shifts">
        <RoleProtectedRoute module="hr" hrSubPage="shifts">
          <DashboardLayout>
            <ShiftsManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/official-letters">
        <RoleProtectedRoute module="hr" hrSubPage="letters">
          <DashboardLayout>
            <OfficialLetters />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/attendance-reports">
        <RoleProtectedRoute module="hr" hrSubPage="reports">
          <DashboardLayout>
            <AttendanceReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/penalty-escalation">
        <RoleProtectedRoute module="hr" hrSubPage="escalation">
          <DashboardLayout>
            <PenaltyEscalation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/salary-components">
        <RoleProtectedRoute module="hr" hrSubPage="salary">
          <DashboardLayout>
            <SalaryComponents />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/leave-balances">
        <RoleProtectedRoute module="hr" hrSubPage="leave-balances">
          <DashboardLayout>
            <LeaveManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/hr/employees/add">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <AddEmployeeSimple />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Requests department sub-pages */}
      <Route path="/departments/requests-workflow/workflows">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <Workflows />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/departments/support/tickets">
        <RoleProtectedRoute module="support">
          <DashboardLayout>
            <Tickets />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* HR Module Routes */}
      <Route path="/hr">
        <DashboardLayout>
          <DepartmentsHub />
        </DashboardLayout>
      </Route>

      <Route path="/hr/attendance">
        <RoleProtectedRoute module="hr" hrSubPage="attendance">
          <DashboardLayout>
            <AttendanceMonitoring />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/attendance-reports">
        <RoleProtectedRoute module="hr" hrSubPage="reports">
          <DashboardLayout>
            <AttendanceReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/attendance-monitoring">
        <RoleProtectedRoute module="hr" hrSubPage="attendance-monitoring">
          <DashboardLayout>
            <AttendanceMonitoring />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>



      <Route path="/hr/email-reports">
        <RoleProtectedRoute module="hr" hrSubPage="reports">
          <DashboardLayout>
            <AttendanceEmailReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/shifts">
        <RoleProtectedRoute module="hr" hrSubPage="shifts">
          <DashboardLayout>
            <ShiftsManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/official-letters">
        <RoleProtectedRoute module="hr" hrSubPage="letters">
          <DashboardLayout>
            <OfficialLetters />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/leaves">
        <RoleProtectedRoute module="hr" hrSubPage="leaves">
          <DashboardLayout>
            <Leaves />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/payroll">
        <RoleProtectedRoute module="hr" hrSubPage="payroll">
          <DashboardLayout>
            <Payroll />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/salary-components">
        <RoleProtectedRoute module="hr" hrSubPage="salary">
          <DashboardLayout>
            <SalaryComponents />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>


      <Route path="/hr/performance">
        <RoleProtectedRoute module="hr" hrSubPage="performance">
          <DashboardLayout>
            <Performance />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/training">
        <RoleProtectedRoute module="hr" hrSubPage="training">
          <DashboardLayout>
            <Training />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/organization">
        <RoleProtectedRoute module="hr" hrSubPage="organization">
          <DashboardLayout>
            <Organization />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/recruitment">
        <RoleProtectedRoute module="hr" hrSubPage="recruitment">
          <DashboardLayout>
            <ApplicationList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/employees">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <EmployeeList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/employees/add">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <AddEmployeeSimple />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/employees/add-full">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <AddEmployee />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/employees/:id">
        {(params) => (
          <RoleProtectedRoute module="hr" hrSubPage="employees">
            <DashboardLayout>
              <EmployeeProfile id={params.id} />
            </DashboardLayout>
          </RoleProtectedRoute>
        )}
      </Route>

      <Route path="/hr/activate">
        <EmployeeActivation />
      </Route>

      <Route path="/hr/employee-docs">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <EmployeeDocs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/leave-management">
        <RoleProtectedRoute module="hr" hrSubPage="leaves">
          <DashboardLayout>
            <LeaveManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/performance-advanced">
        <RoleProtectedRoute module="hr" hrSubPage="performance">
          <DashboardLayout>
            <PerformanceAdvanced />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/training-advanced">
        <RoleProtectedRoute module="hr" hrSubPage="training">
          <DashboardLayout>
            <TrainingAdvanced />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/automation">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/finance/automation">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <FinanceAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/property/automation">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <PropertyAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/projects/automation">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <ProjectsAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/support/automation">
        <RoleProtectedRoute module="support">
          <DashboardLayout>
            <SupportAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/legal/automation">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <LegalAutomation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/recruitment-advanced">
        <RoleProtectedRoute module="hr" hrSubPage="recruitment">
          <DashboardLayout>
            <RecruitmentAdvanced />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/organization-structure">
        <RoleProtectedRoute module="hr" hrSubPage="organization">
          <DashboardLayout>
            <OrganizationStructure />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/department-employees">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout>
            <DepartmentEmployees />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/violations">
        <RoleProtectedRoute module="hr" hrSubPage="violations">
          <DashboardLayout>
            <ViolationsManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/my-violations">
        <RoleProtectedRoute module="hr" hrSubPage="my_violations">
          <DashboardLayout>
            <MyViolations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/hr/penalty-escalation">
        <RoleProtectedRoute module="hr" hrSubPage="escalation">
          <DashboardLayout>
            <PenaltyEscalation />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Finance Module Routes */}
      <Route path="/finance/invoices">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <InvoiceList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/invoice/:id">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <InvoiceDetails />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/expenses">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Expenses />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/budget" /* MERGED: redirects to /finance/budgets */>
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Budget />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/accounts">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Accounts />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/journal-entries">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <JournalEntries />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/requests">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <FinancialRequests />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/vouchers">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Vouchers />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/reports">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <FinanceReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/vendors">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Vendors />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/purchase-orders">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <PurchaseOrders />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/operations/warehouses">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <Warehouses />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/tax">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <TaxSystem />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/p2p">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <P2PWorkflow />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/commitments">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <FinancialCommitments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/custodies">
        <RoleProtectedRoute module="finance">
          <DashboardLayout><Suspense fallback={<div>...</div>}><CustodiesPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/salary-advances">
        <RoleProtectedRoute module="finance">
          <DashboardLayout><Suspense fallback={<div>...</div>}><SalaryAdvancesPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/finance/warehouses">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Warehouses />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Base /finance route - must come AFTER specific /finance/* routes */}
      <Route path="/finance">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <InvoiceList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Fleet Module Routes */}
      <Route path="/fleet">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetLive />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/vehicles">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <Vehicles />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/maintenance">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <Maintenance />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/fuel">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FuelConsumption />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/drivers">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <Drivers />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/map">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetMap />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/alerts">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetAlerts />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/reports">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/trips">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetTrips />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/geofences">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetGeofences />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/fleet/insights">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetInsights />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Property Module Routes */}
      <Route path="/property">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <PropertyHome />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/property/list">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <Properties />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/property/contracts">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <Contracts />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/property/tenants">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <Tenants />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/property/maintenance">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <PropertyMaintenance />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/property/leases">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <PropertyDetails />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Governance Module Routes */}
      <Route path="/governance">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <GovernanceLayer />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/policies">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <Policies />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/risks">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <Risks />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/audits">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <Audits />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/iam">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <IAM />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/compliance">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <Compliance />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/iam-advanced">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <IamAdvanced />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/role-packs">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <RolePacks />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/dual-control">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <DualControl />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/anomaly-rules">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <AnomalyRules />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/anomaly-detections">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <AnomalyDetections />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* BI Module Routes */}
      <Route path="/bi">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <BI />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/dashboards">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <Dashboards />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/kpis">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <KPIs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/reports">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <AnalyticsReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/decision-engine">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <DecisionEngine />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/audit">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <BIAudit />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/bi/data-sources">
        <RoleProtectedRoute module="bi">
          <DashboardLayout>
            <BIDataSources />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Requests Module Routes */}
      <Route path="/requests">
        <RoleProtectedRoute module="requests">
          <DashboardLayout>
            <RequestList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/requests/types">
        <RoleProtectedRoute module="requests">
          <DashboardLayout>
            <RequestTypes />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/requests/workflows">
        <RoleProtectedRoute module="requests">
          <DashboardLayout>
            <Workflows />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/support/tickets">
        <RoleProtectedRoute module="support">
          <DashboardLayout>
            <Tickets />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/support/tickets/:id/comments">
        <RoleProtectedRoute module="support">
          <DashboardLayout>
            <TicketComments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Documents Module Routes */}
      <Route path="/documents">
        <RoleProtectedRoute module="documents">
          <DashboardLayout>
            <DocumentList />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/documents/folders">
        <RoleProtectedRoute module="documents">
          <DashboardLayout>
            <Folders />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/documents/templates">
        <RoleProtectedRoute module="documents">
          <DashboardLayout>
            <Templates />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/documents/archive">
        <RoleProtectedRoute module="documents">
          <DashboardLayout>
            <Archive />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Reports Module Routes */}
      <Route path="/reports">
        <RoleProtectedRoute module="reports">
          <DashboardLayout>
            <ReportsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/reports/custom">
        <RoleProtectedRoute module="reports">
          <DashboardLayout>
            <CustomReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/reports/scheduled">
        <RoleProtectedRoute module="reports">
          <DashboardLayout>
            <ScheduledReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/operations">
        <RoleProtectedRoute module="projects">
          <DashboardLayout>
            <Ops />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/operations/projects">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <Projects />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/projects/tasks">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <ProjectTasks />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/projects/members">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <ProjectMembers />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/projects/audit">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <ProjectsAudit />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/integrations">
        <RoleProtectedRoute module="integrations">
          <DashboardLayout>
            <Integrations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/integrations/integrations-hub">
        <RoleProtectedRoute module="integrations">
          <DashboardLayout>
            <Integrations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Admin Module Routes */}
      <Route path="/admin">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <SystemCatalog />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/roles">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <Roles />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/workflow/delegations">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <Delegations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/workflow/settings">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <ApprovalSettingsPage />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/inbox">
        <RoleProtectedRoute module="admin">
          <DashboardLayout><Suspense fallback={<div>...</div>}><UnifiedInboxPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/salary-advances">
        <RoleProtectedRoute module="hr" hrSubPage="payroll">
          <DashboardLayout><Suspense fallback={<div>...</div>}><SalaryAdvancesPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/custodies">
        <RoleProtectedRoute module="hr" hrSubPage="employees">
          <DashboardLayout><Suspense fallback={<div>...</div>}><CustodiesPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/pending-reserves">
        <RoleProtectedRoute module="admin">
          <DashboardLayout><Suspense fallback={<div>...</div>}><PendingReservesPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/governance/state-history">
        <RoleProtectedRoute module="governance">
          <DashboardLayout><Suspense fallback={<div>...</div>}><StateHistoryPage /></Suspense></DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/admin/pending-balances">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <PendingBalancesPage />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/logs">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <AuditLogs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/event-log">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <EventLog />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/workflow-audit">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <WorkflowAudit />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/system">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <SystemAdmin />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/jobs">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <JobsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/scheduler">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <SchedulerDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/automation">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <AutomationCenter />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/governance" /* MOVED: use /governance instead */>
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <GovernanceDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/sla">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <SLADashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/audit-log">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <GovernanceAuditLog />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/workflow/flows">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <WorkflowsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/exceptions">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <ExceptionsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/subscriptions">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <Subscriptions />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/comparison">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <BranchComparison />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/companies-overview">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <CompaniesOverview />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/governance/decisions">
        <RoleProtectedRoute module="governance">
          <DashboardLayout>
            <DecisionsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/decisions">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <DecisionsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/delegations">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <Delegations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/approval-settings">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <ApprovalSettingsPage />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/exceptions">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <ExceptionsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/state-history">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <StateHistoryPage />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/workflows">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <WorkflowsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/scheduler">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <SchedulerDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/jobs">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <JobsDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/letterhead">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <LetterheadSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/admin/governance-audit">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <GovernanceAuditLog />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/branding">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <LetterheadSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Settings Module Routes */}
      <Route path="/settings">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* User Profile Route */}
      <Route path="/profile">
        <DashboardLayout>
          <UserProfile />
        </DashboardLayout>
      </Route>

      {/* Security & Performance Dashboard */}
      <Route path="/admin/security">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <SecurityDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/system">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <SystemSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/notifications">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <NotificationSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/backup">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <Backup />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/branches">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <BranchSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/departments">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <DepartmentSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/roles">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <RoleSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/code-prefixes">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <CodePrefixes />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/email">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <EmailSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/whatsapp">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <WhatsAppSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/sms">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <SmsSettings />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/settings/message-templates">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <MessageTemplates />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/logs/messages">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <MessageLogs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/dms">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <DmsAdvanced />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/ai-policy">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <AiPolicy />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/monitoring">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <PlatformMonitoring />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/evidence">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <EvidencePacks />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/upgrades">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <UpgradeManager />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/alerts">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <Alerts />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/calendar">
        <DashboardLayout>
          <Calendar />
        </DashboardLayout>
      </Route>

      <Route path="/platform/notifications">
        <DashboardLayout>
          <NotificationsCenter />
        </DashboardLayout>
      </Route>

      <Route path="/platform/notify-rules">
        <RoleProtectedRoute module="platform">
          <DashboardLayout>
            <NotifyRules />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/platform/notify-prefs">
        <DashboardLayout>
          <NotifyPreferences />
        </DashboardLayout>
      </Route>

      <Route path="/platform/search">
        <DashboardLayout>
          <Search />
        </DashboardLayout>
      </Route>

      <Route path="/platform/session">
        <DashboardLayout>
          <Session />
        </DashboardLayout>
      </Route>

      {/* Communications Module Routes */}
      <Route path="/comms">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <Communications />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/comms/letters">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <Letters />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/comms/official-letters">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <OfficialLetters />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Correspondence Module Routes - نظام الصادر والوارد */}
      <Route path="/correspondence/outgoing">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <OutgoingMail />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/correspondence/incoming">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <IncomingMail />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/correspondence/transactions">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <Transactions />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Legal Module Routes */}
      <Route path="/legal">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <Legal />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/legal/contracts">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <LegalContracts />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/legal/documents">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <LegalDocuments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/legal/audit">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <LegalAudit />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Marketing Module Routes */}
      <Route path="/marketing">
        <RoleProtectedRoute module="marketing">
          <DashboardLayout>
            <Marketing />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Store Module Routes */}
      <Route path="/store">
        <RoleProtectedRoute module="store">
          <DashboardLayout>
            <Store />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/store/orders">
        <RoleProtectedRoute module="store">
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Workflow Module Routes */}
      <Route path="/workflow">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <Workflow />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/workflow/approvals">
        <RoleProtectedRoute module="workflow">
          <DashboardLayout>
            <Approvals />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* Public Site Module Routes */}
      <Route path="/public-site">
        <RoleProtectedRoute module="public_site">
          <DashboardLayout>
            <PublicSite />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/public-site/blog">
        <RoleProtectedRoute module="public_site">
          <DashboardLayout>
            <Blog />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      {/* ═══ Auto-wired orphan pages ═══ */}
      <Route path="/admin/beneficiary-rules">
        <RoleProtectedRoute module="admin">
          <DashboardLayout>
            <BeneficiaryRules />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/finance/budgets">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Budgets />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/legal/cases">
        <RoleProtectedRoute module="legal">
          <DashboardLayout>
            <Cases />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/operations/dispatch-dashboard">
        <RoleProtectedRoute module="operations">
          <DashboardLayout>
            <DispatchDashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/settings/finance/fiscal-periods">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <FiscalPeriods />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-daily-reports">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetDailyReports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-daily-routes">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetDailyRoutes />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-dispatch-recs">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetDispatchRecs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-driver-scores">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetDriverScores />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-e-t-a">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetETA />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-exports">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetExports />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-geo-events">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetGeoEvents />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-heatmap">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetHeatmap />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-incident-assist">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetIncidentAssist />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-replay">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetReplay />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-route-targets">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetRouteTargets />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-stops">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetStops />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-trip-risk">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetTripRisk />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-trip-segments">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FleetTripSegments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fuel-logs">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <FuelLogs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/insurance">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <Insurance />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/integrations/:rest*">
        <RoleProtectedRoute module="integrations">
          <DashboardLayout>
            <IntegrationsHub />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/property/:id">
        <RoleProtectedRoute module="property">
          <DashboardLayout>
            <Leases />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/settings/hr/leave-types">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <LeaveTypes />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/comms/official-communications">
        <RoleProtectedRoute module="comms">
          <DashboardLayout>
            <OfficialCommunications />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/settings/templates">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <PrintTemplates />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/finance/receivables">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Receivables />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/reservations">
        <RoleProtectedRoute module="fleet">
          <DashboardLayout>
            <Reservations />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/settings/hr/work-schedules">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <WorkSchedules />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/marketing/campaigns">
        <RoleProtectedRoute module="marketing">
          <DashboardLayout>
            <Campaigns />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/enrollments">
        <RoleProtectedRoute module="hr" hrSubPage="training">
          <DashboardLayout>
            <Enrollments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/interviews">
        <RoleProtectedRoute module="hr" hrSubPage="recruitment">
          <DashboardLayout>
            <Interviews />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/marketing/leads">
        <RoleProtectedRoute module="marketing">
          <DashboardLayout>
            <Leads />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/finance/payments">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <Payments />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/settings/hr/positions">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <Positions />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/programs">
        <RoleProtectedRoute module="hr" hrSubPage="training">
          <DashboardLayout>
            <Programs />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>


      {/* v52: Governance Control Routes */}
      <Route path="/governance/permissions">
        <RoleProtectedRoute module="governance"><DashboardLayout><PermissionMatrix /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/operation-limits">
        <RoleProtectedRoute module="governance"><DashboardLayout><OperationLimits /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/business-rules">
        <RoleProtectedRoute module="governance"><DashboardLayout><BusinessRulesPage /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/business-rules-builder">
        <RoleProtectedRoute module="governance"><DashboardLayout><BusinessRulesBuilder /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/session-monitor">
        <RoleProtectedRoute module="governance"><DashboardLayout><SessionMonitor /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/access-restrictions">
        <RoleProtectedRoute module="governance"><DashboardLayout><AccessRestrictions /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/governance/permission-log">
        <RoleProtectedRoute module="governance"><DashboardLayout><PermissionChangeLog /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/security-config">
        <RoleProtectedRoute module="settings"><DashboardLayout><SecuritySettingsPage /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/smtp">
        <RoleProtectedRoute module="settings"><DashboardLayout><SmtpSettings /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/hr-config">
        <RoleProtectedRoute module="settings"><DashboardLayout><HrSettings /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/finance-config">
        <RoleProtectedRoute module="settings"><DashboardLayout><FinanceSettingsPage /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/fleet-config">
        <RoleProtectedRoute module="settings"><DashboardLayout><FleetSettings /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/domains">
        <RoleProtectedRoute module="settings"><DashboardLayout><DomainsSettings /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/letter-templates">
        <RoleProtectedRoute module="settings"><DashboardLayout><LetterTemplates /></DashboardLayout></RoleProtectedRoute>
      </Route>
      <Route path="/settings/audit-log">
        <RoleProtectedRoute module="settings"><DashboardLayout><AuditLogViewer /></DashboardLayout></RoleProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}


// Auth Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return null; // useAuth handles redirection
  return <>{children}</>;
}

const Applications = lazy(() => import('./pages/recruitment/Applications'));
const ApprovalSettings = lazy(() => import('./pages/admin/ApprovalSettings'));
const BusinessRules = lazy(() => import('./pages/governance/BusinessRules'));
const Correspondences = lazy(() => import('./pages/comms/Correspondences'));
const Custodies = lazy(() => import('./pages/finance/Custodies'));
const FinanceSettings = lazy(() => import('./pages/settings/FinanceSettings'));
const LeaveBalances = lazy(() => import('./pages/hr/LeaveBalances'));
const Penalties = lazy(() => import('./pages/hr/Penalties'));
const PendingBalances = lazy(() => import('./pages/admin/PendingBalances'));
const PendingReserves = lazy(() => import('./pages/admin/PendingReserves'));
const SecuritySettings = lazy(() => import('./pages/settings/SecuritySettings'));
const StateHistory = lazy(() => import('./pages/admin/StateHistory'));

function App() {
  // Global mutation error handler — catches errors from 160+ pages without local onError
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message || 'حدث خطأ في العملية';
      toast.error(msg);
    };
    window.addEventListener('global-mutation-error', handler);
    return () => window.removeEventListener('global-mutation-error', handler);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
