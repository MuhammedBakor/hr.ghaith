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
        <DashboardLayout>
          <ViolationsManagement />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/my-violations">
        <DashboardLayout>
          <MyViolations />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/shifts">
        <DashboardLayout>
          <ShiftsManagement />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/official-letters">
        <DashboardLayout>
          <OfficialLetters />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/attendance-reports">
        <DashboardLayout>
          <AttendanceReports />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/penalty-escalation">
        <DashboardLayout>
          <PenaltyEscalation />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/salary-components">
        <DashboardLayout>
          <SalaryComponents />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/leave-balances">
        <DashboardLayout>
          <LeaveManagement />
        </DashboardLayout>
      </Route>
      <Route path="/departments/hr/employees/add">
        <DashboardLayout>
          <AddEmployeeSimple />
        </DashboardLayout>
      </Route>

      {/* Requests department sub-pages */}
      <Route path="/departments/requests-workflow/workflows">
        <DashboardLayout>
          <Workflows />
        </DashboardLayout>
      </Route>
      <Route path="/departments/support/tickets">
        <DashboardLayout>
          <Tickets />
        </DashboardLayout>
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
        <RoleProtectedRoute module="hr" hrSubPage="official-letters">
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
        <DashboardLayout>
          <FleetAutomation />
        </DashboardLayout>
      </Route>
      <Route path="/finance/automation">
        <DashboardLayout>
          <FinanceAutomation />
        </DashboardLayout>
      </Route>
      <Route path="/property/automation">
        <DashboardLayout>
          <PropertyAutomation />
        </DashboardLayout>
      </Route>

      <Route path="/projects/automation">
        <DashboardLayout>
          <ProjectsAutomation />
        </DashboardLayout>
      </Route>

      <Route path="/support/automation">
        <DashboardLayout>
          <SupportAutomation />
        </DashboardLayout>
      </Route>

      <Route path="/legal/automation">
        <DashboardLayout>
          <LegalAutomation />
        </DashboardLayout>
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
      <Route path="/finance">
        <RoleProtectedRoute module="finance">
          <DashboardLayout>
            <InvoiceList />
          </DashboardLayout>
        </RoleProtectedRoute>
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

      <Route path="/operations/warehouses">
        <DashboardLayout>
          <Warehouses />
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
        <DashboardLayout>
          <FuelConsumption />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/drivers">
        <DashboardLayout>
          <Drivers />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/map">
        <DashboardLayout>
          <FleetMap />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/alerts">
        <DashboardLayout>
          <FleetAlerts />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/reports">
        <DashboardLayout>
          <FleetReports />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/trips">
        <DashboardLayout>
          <FleetTrips />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/geofences">
        <DashboardLayout>
          <FleetGeofences />
        </DashboardLayout>
      </Route>

      <Route path="/fleet/insights">
        <DashboardLayout>
          <FleetInsights />
        </DashboardLayout>
      </Route>

      {/* Property Module Routes */}
      <Route path="/property">
        <DashboardLayout>
          <PropertyHome />
        </DashboardLayout>
      </Route>

      <Route path="/property/list">
        <DashboardLayout>
          <Properties />
        </DashboardLayout>
      </Route>

      <Route path="/property/contracts">
        <DashboardLayout>
          <Contracts />
        </DashboardLayout>
      </Route>

      <Route path="/property/tenants">
        <DashboardLayout>
          <Tenants />
        </DashboardLayout>
      </Route>

      <Route path="/property/maintenance">
        <DashboardLayout>
          <PropertyMaintenance />
        </DashboardLayout>
      </Route>

      <Route path="/property/leases">
        <DashboardLayout>
          <PropertyDetails />
        </DashboardLayout>
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
        <DashboardLayout>
          <Policies />
        </DashboardLayout>
      </Route>

      <Route path="/governance/risks">
        <DashboardLayout>
          <Risks />
        </DashboardLayout>
      </Route>

      <Route path="/governance/audits">
        <DashboardLayout>
          <Audits />
        </DashboardLayout>
      </Route>

      <Route path="/governance/iam">
        <DashboardLayout>
          <IAM />
        </DashboardLayout>
      </Route>

      <Route path="/governance/compliance">
        <DashboardLayout>
          <Compliance />
        </DashboardLayout>
      </Route>

      <Route path="/governance/iam-advanced">
        <DashboardLayout>
          <IamAdvanced />
        </DashboardLayout>
      </Route>

      <Route path="/governance/role-packs">
        <DashboardLayout>
          <RolePacks />
        </DashboardLayout>
      </Route>

      <Route path="/governance/dual-control">
        <DashboardLayout>
          <DualControl />
        </DashboardLayout>
      </Route>

      <Route path="/governance/anomaly-rules">
        <DashboardLayout>
          <AnomalyRules />
        </DashboardLayout>
      </Route>

      <Route path="/governance/anomaly-detections">
        <DashboardLayout>
          <AnomalyDetections />
        </DashboardLayout>
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
        <DashboardLayout>
          <Dashboards />
        </DashboardLayout>
      </Route>

      <Route path="/bi/kpis">
        <DashboardLayout>
          <KPIs />
        </DashboardLayout>
      </Route>

      <Route path="/bi/reports">
        <DashboardLayout>
          <AnalyticsReports />
        </DashboardLayout>
      </Route>

      <Route path="/bi/decision-engine">
        <DashboardLayout>
          <DecisionEngine />
        </DashboardLayout>
      </Route>

      <Route path="/bi/audit">
        <DashboardLayout>
          <BIAudit />
        </DashboardLayout>
      </Route>

      <Route path="/bi/data-sources">
        <DashboardLayout>
          <BIDataSources />
        </DashboardLayout>
      </Route>

      {/* Requests Module Routes */}
      <Route path="/requests">
        <DashboardLayout>
          <RequestList />
        </DashboardLayout>
      </Route>

      <Route path="/requests/types">
        <DashboardLayout>
          <RequestTypes />
        </DashboardLayout>
      </Route>

      <Route path="/requests/workflows">
        <DashboardLayout>
          <Workflows />
        </DashboardLayout>
      </Route>

      <Route path="/support/tickets">
        <RoleProtectedRoute module="support">
          <DashboardLayout>
            <Tickets />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/support/tickets/:id/comments">
        <DashboardLayout>
          <TicketComments />
        </DashboardLayout>
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
        <DashboardLayout>
          <Folders />
        </DashboardLayout>
      </Route>

      <Route path="/documents/templates">
        <DashboardLayout>
          <Templates />
        </DashboardLayout>
      </Route>

      <Route path="/documents/archive">
        <DashboardLayout>
          <Archive />
        </DashboardLayout>
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
        <DashboardLayout>
          <CustomReports />
        </DashboardLayout>
      </Route>

      <Route path="/reports/scheduled">
        <DashboardLayout>
          <ScheduledReports />
        </DashboardLayout>
      </Route>

      <Route path="/operations">
        <RoleProtectedRoute module="projects">
          <DashboardLayout>
            <Ops />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>

      <Route path="/operations/projects">
        <DashboardLayout>
          <Projects />
        </DashboardLayout>
      </Route>

      <Route path="/projects/tasks">
        <DashboardLayout>
          <ProjectTasks />
        </DashboardLayout>
      </Route>

      <Route path="/projects/members">
        <DashboardLayout>
          <ProjectMembers />
        </DashboardLayout>
      </Route>

      <Route path="/projects/audit">
        <DashboardLayout>
          <ProjectsAudit />
        </DashboardLayout>
      </Route>

      <Route path="/integrations">
        <DashboardLayout>
          <Integrations />
        </DashboardLayout>
      </Route>

      <Route path="/integrations/integrations-hub">
        <DashboardLayout>
          <Integrations />
        </DashboardLayout>
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
        <DashboardLayout>
          <Users />
        </DashboardLayout>
      </Route>

      <Route path="/admin/roles">
        <DashboardLayout>
          <Roles />
        </DashboardLayout>
      </Route>

      <Route path="/workflow/delegations">
        <DashboardLayout>
          <Delegations />
        </DashboardLayout>
      </Route>

      <Route path="/workflow/settings">
        <DashboardLayout>
          <ApprovalSettingsPage />
        </DashboardLayout>
      </Route>

      <Route path="/admin/inbox">
        <DashboardLayout><Suspense fallback={<div>...</div>}><UnifiedInboxPage /></Suspense></DashboardLayout>
      </Route>
      <Route path="/hr/salary-advances">
        <DashboardLayout><Suspense fallback={<div>...</div>}><SalaryAdvancesPage /></Suspense></DashboardLayout>
      </Route>
      <Route path="/hr/custodies">
        <DashboardLayout><Suspense fallback={<div>...</div>}><CustodiesPage /></Suspense></DashboardLayout>
      </Route>
      <Route path="/admin/pending-reserves">
        <DashboardLayout><Suspense fallback={<div>...</div>}><PendingReservesPage /></Suspense></DashboardLayout>
      </Route>
      <Route path="/governance/state-history">
        <DashboardLayout><Suspense fallback={<div>...</div>}><StateHistoryPage /></Suspense></DashboardLayout>
      </Route>
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

      <Route path="/platform/jobs">
        <DashboardLayout>
          <JobsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/platform/scheduler">
        <DashboardLayout>
          <SchedulerDashboard />
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

      <Route path="/governance/audit-log">
        <DashboardLayout>
          <GovernanceAuditLog />
        </DashboardLayout>
      </Route>

      <Route path="/workflow/flows">
        <DashboardLayout>
          <WorkflowsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/governance/exceptions">
        <DashboardLayout>
          <ExceptionsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/subscriptions">
        <DashboardLayout>
          <Subscriptions />
        </DashboardLayout>
      </Route>

      <Route path="/admin/comparison">
        <DashboardLayout>
          <BranchComparison />
        </DashboardLayout>
      </Route>

      <Route path="/admin/companies-overview">
        <DashboardLayout>
          <CompaniesOverview />
        </DashboardLayout>
      </Route>

      <Route path="/governance/decisions">
        <DashboardLayout>
          <DecisionsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/decisions">
        <DashboardLayout>
          <DecisionsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/delegations">
        <DashboardLayout>
          <Delegations />
        </DashboardLayout>
      </Route>

      <Route path="/admin/approval-settings">
        <DashboardLayout>
          <ApprovalSettingsPage />
        </DashboardLayout>
      </Route>

      <Route path="/admin/exceptions">
        <DashboardLayout>
          <ExceptionsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/state-history">
        <DashboardLayout>
          <StateHistoryPage />
        </DashboardLayout>
      </Route>

      <Route path="/admin/workflows">
        <DashboardLayout>
          <WorkflowsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/scheduler">
        <DashboardLayout>
          <SchedulerDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/jobs">
        <DashboardLayout>
          <JobsDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/admin/letterhead">
        <DashboardLayout>
          <LetterheadSettings />
        </DashboardLayout>
      </Route>

      <Route path="/admin/governance-audit">
        <DashboardLayout>
          <GovernanceAuditLog />
        </DashboardLayout>
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
        <DashboardLayout>
          <SecurityDashboard />
        </DashboardLayout>
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
        <DashboardLayout>
          <MessageLogs />
        </DashboardLayout>
      </Route>

      <Route path="/platform/dms">
        <DashboardLayout>
          <DmsAdvanced />
        </DashboardLayout>
      </Route>

      <Route path="/platform/ai-policy">
        <DashboardLayout>
          <AiPolicy />
        </DashboardLayout>
      </Route>

      <Route path="/platform/monitoring">
        <DashboardLayout>
          <PlatformMonitoring />
        </DashboardLayout>
      </Route>

      <Route path="/platform/evidence">
        <DashboardLayout>
          <EvidencePacks />
        </DashboardLayout>
      </Route>

      <Route path="/platform/upgrades">
        <DashboardLayout>
          <UpgradeManager />
        </DashboardLayout>
      </Route>

      <Route path="/platform/alerts">
        <DashboardLayout>
          <Alerts />
        </DashboardLayout>
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
        <DashboardLayout>
          <NotifyRules />
        </DashboardLayout>
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
        <DashboardLayout>
          <Communications />
        </DashboardLayout>
      </Route>

      <Route path="/comms/letters">
        <DashboardLayout>
          <Letters />
        </DashboardLayout>
      </Route>

      <Route path="/comms/official-letters">
        <DashboardLayout>
          <OfficialLetters />
        </DashboardLayout>
      </Route>

      {/* Correspondence Module Routes - نظام الصادر والوارد */}
      <Route path="/correspondence/outgoing">
        <DashboardLayout>
          <OutgoingMail />
        </DashboardLayout>
      </Route>

      <Route path="/correspondence/incoming">
        <DashboardLayout>
          <IncomingMail />
        </DashboardLayout>
      </Route>

      <Route path="/correspondence/transactions">
        <DashboardLayout>
          <Transactions />
        </DashboardLayout>
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
        <DashboardLayout>
          <LegalContracts />
        </DashboardLayout>
      </Route>

      <Route path="/legal/documents">
        <DashboardLayout>
          <LegalDocuments />
        </DashboardLayout>
      </Route>

      <Route path="/legal/audit">
        <DashboardLayout>
          <LegalAudit />
        </DashboardLayout>
      </Route>

      {/* Marketing Module Routes */}
      <Route path="/marketing">
        <DashboardLayout>
          <Marketing />
        </DashboardLayout>
      </Route>

      {/* Store Module Routes */}
      <Route path="/store">
        <DashboardLayout>
          <Store />
        </DashboardLayout>
      </Route>

      <Route path="/store/orders">
        <DashboardLayout>
          <Orders />
        </DashboardLayout>
      </Route>

      {/* Workflow Module Routes */}
      <Route path="/workflow">
        <DashboardLayout>
          <Workflow />
        </DashboardLayout>
      </Route>

      <Route path="/workflow/approvals">
        <DashboardLayout>
          <Approvals />
        </DashboardLayout>
      </Route>

      {/* Public Site Module Routes */}
      <Route path="/public-site">
        <DashboardLayout>
          <PublicSite />
        </DashboardLayout>
      </Route>

      <Route path="/public-site/blog">
        <DashboardLayout>
          <Blog />
        </DashboardLayout>
      </Route>

      {/* ═══ Auto-wired orphan pages ═══ */}
      <Route path="/admin/beneficiary-rules">
        <DashboardLayout>
          <BeneficiaryRules />
        </DashboardLayout>
      </Route>
      <Route path="/finance/budgets">
        <DashboardLayout>
          <Budgets />
        </DashboardLayout>
      </Route>
      <Route path="/legal/cases">
        <DashboardLayout>
          <Cases />
        </DashboardLayout>
      </Route>
      <Route path="/operations/dispatch-dashboard">
        <DashboardLayout>
          <DispatchDashboard />
        </DashboardLayout>
      </Route>
      <Route path="/settings/finance/fiscal-periods">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <FiscalPeriods />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/fleet/fleet-daily-reports">
        <DashboardLayout>
          <FleetDailyReports />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-daily-routes">
        <DashboardLayout>
          <FleetDailyRoutes />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-dispatch-recs">
        <DashboardLayout>
          <FleetDispatchRecs />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-driver-scores">
        <DashboardLayout>
          <FleetDriverScores />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-e-t-a">
        <DashboardLayout>
          <FleetETA />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-exports">
        <DashboardLayout>
          <FleetExports />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-geo-events">
        <DashboardLayout>
          <FleetGeoEvents />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-heatmap">
        <DashboardLayout>
          <FleetHeatmap />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-incident-assist">
        <DashboardLayout>
          <FleetIncidentAssist />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-replay">
        <DashboardLayout>
          <FleetReplay />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-route-targets">
        <DashboardLayout>
          <FleetRouteTargets />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-stops">
        <DashboardLayout>
          <FleetStops />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-trip-risk">
        <DashboardLayout>
          <FleetTripRisk />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fleet-trip-segments">
        <DashboardLayout>
          <FleetTripSegments />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/fuel-logs">
        <DashboardLayout>
          <FuelLogs />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/insurance">
        <DashboardLayout>
          <Insurance />
        </DashboardLayout>
      </Route>
      <Route path="/integrations/:rest*">
        <DashboardLayout>
          <IntegrationsHub />
        </DashboardLayout>
      </Route>
      <Route path="/property/:id">
        <DashboardLayout>
          <Leases />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/leave-types">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <LeaveTypes />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/comms/official-communications">
        <DashboardLayout>
          <OfficialCommunications />
        </DashboardLayout>
      </Route>
      <Route path="/settings/templates">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <PrintTemplates />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/finance/receivables">
        <DashboardLayout>
          <Receivables />
        </DashboardLayout>
      </Route>
      <Route path="/fleet/reservations">
        <DashboardLayout>
          <Reservations />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/work-schedules">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <WorkSchedules />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/marketing/campaigns">
        <DashboardLayout>
          <Campaigns />
        </DashboardLayout>
      </Route>
      <Route path="/hr/enrollments">
        <DashboardLayout>
          <Enrollments />
        </DashboardLayout>
      </Route>
      <Route path="/hr/interviews">
        <DashboardLayout>
          <Interviews />
        </DashboardLayout>
      </Route>
      <Route path="/marketing/leads">
        <DashboardLayout>
          <Leads />
        </DashboardLayout>
      </Route>
      <Route path="/finance/payments">
        <DashboardLayout>
          <Payments />
        </DashboardLayout>
      </Route>
      <Route path="/settings/hr/positions">
        <RoleProtectedRoute module="settings">
          <DashboardLayout>
            <Positions />
          </DashboardLayout>
        </RoleProtectedRoute>
      </Route>
      <Route path="/hr/programs">
        <DashboardLayout>
          <Programs />
        </DashboardLayout>
      </Route>


      {/* v52: Governance Control Routes */}
      <Route path="/governance/permissions">
        <DashboardLayout><PermissionMatrix /></DashboardLayout>
      </Route>
      <Route path="/governance/operation-limits">
        <DashboardLayout><OperationLimits /></DashboardLayout>
      </Route>
      <Route path="/governance/business-rules">
        <DashboardLayout><BusinessRulesPage /></DashboardLayout>
      </Route>
      <Route path="/governance/business-rules-builder">
        <DashboardLayout><BusinessRulesBuilder /></DashboardLayout>
      </Route>
      <Route path="/governance/session-monitor">
        <DashboardLayout><SessionMonitor /></DashboardLayout>
      </Route>
      <Route path="/governance/access-restrictions">
        <DashboardLayout><AccessRestrictions /></DashboardLayout>
      </Route>
      <Route path="/governance/permission-log">
        <DashboardLayout><PermissionChangeLog /></DashboardLayout>
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
