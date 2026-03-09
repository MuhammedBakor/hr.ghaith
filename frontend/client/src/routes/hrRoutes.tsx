// client/src/routes/hrRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const EmployeeList = lazy(() => import("@/pages/hr/EmployeeList"));
const Attendance = lazy(() => import("@/pages/hr/Attendance"));
const Leaves = lazy(() => import("@/pages/hr/Leaves"));
const Payroll = lazy(() => import("@/pages/hr/Payroll"));
const SalaryComponents = lazy(() => import("@/pages/hr/SalaryComponents"));
const ApprovalChains = lazy(() => import("@/pages/hr/ApprovalChains"));
const Performance = lazy(() => import("@/pages/hr/Performance"));
const Training = lazy(() => import("@/pages/hr/Training"));
const Organization = lazy(() => import("@/pages/hr/Organization"));
const ApplicationList = lazy(() => import("@/pages/hr/recruitment/ApplicationList"));
const EmployeeProfile = lazy(() => import("@/pages/hr/EmployeeProfile"));
const AddEmployee = lazy(() => import("@/pages/hr/AddEmployee"));
const AddEmployeeSimple = lazy(() => import("@/pages/hr/AddEmployeeSimple"));
const EmployeeActivation = lazy(() => import("@/pages/hr/EmployeeActivation"));
const EmployeeDocs = lazy(() => import("@/pages/hr/EmployeeDocs"));
const OnboardingReview = lazy(() => import("@/pages/hr/OnboardingReview"));
const LeaveManagement = lazy(() => import("@/pages/hr/LeaveManagement"));
const PerformanceAdvanced = lazy(() => import("@/pages/hr/PerformanceAdvanced"));
const TrainingAdvanced = lazy(() => import("@/pages/hr/TrainingAdvanced"));
const HRAutomation = lazy(() => import("@/pages/hr/HRAutomation"));
const RecruitmentAdvanced = lazy(() => import("@/pages/hr/RecruitmentAdvanced"));
const OrganizationStructure = lazy(() => import("@/pages/hr/OrganizationStructure"));
const ViolationsManagement = lazy(() => import("@/pages/hr/ViolationsManagement"));
const PenaltyEscalation = lazy(() => import("@/pages/hr/PenaltyEscalation"));
const MyViolations = lazy(() => import("@/pages/hr/MyViolations"));
const AttendanceReports = lazy(() => import("@/pages/hr/AttendanceReports"));
const FieldTracking = lazy(() => import("@/pages/hr/FieldTracking"));
const QRScanner = lazy(() => import("@/pages/hr/QRScanner"));
const AttendanceEmailReports = lazy(() => import("@/pages/hr/AttendanceEmailReports"));
const ShiftsManagement = lazy(() => import("@/pages/hr/ShiftsManagement"));
const OfficialLetters = lazy(() => import("@/pages/hr/OfficialLetters"));
const LeaveTypes = lazy(() => import("@/pages/hr/LeaveTypes"));
const LeaveBalances = lazy(() => import("@/pages/hr/LeaveBalances"));
const WorkSchedules = lazy(() => import("@/pages/hr/WorkSchedules"));
const Positions = lazy(() => import("@/pages/hr/Positions"));
const PendingReservesPage = lazy(() => import("@/pages/admin/PendingReserves"));
const Enrollments = lazy(() => import("@/pages/training/Enrollments"));
const SalaryAdvancesPage = lazy(() => import("@/pages/finance/SalaryAdvances"));
const Programs = lazy(() => import("@/pages/training/Programs"));
const CustodiesPage = lazy(() => import("@/pages/finance/Custodies"));
const Interviews = lazy(() => import("@/pages/recruitment/Interviews"));
const OfficialLettersHR = lazy(() => import("@/pages/hr/OfficialLetters"));

export function HrRoutes() {
  return (
    <>
    <Route path="/hr">
    <DashboardLayout>
    <EmployeeList />
    </DashboardLayout>
    </Route>
    <Route path="/hr/attendance">
    <DashboardLayout>
    <Attendance />
    </DashboardLayout>
    </Route>
    <Route path="/hr/attendance-reports">
    <DashboardLayout>
    <AttendanceReports />
    </DashboardLayout>
    </Route>
    <Route path="/hr/field-tracking">
    <DashboardLayout>
    <FieldTracking />
    </DashboardLayout>
    </Route>
    <Route path="/hr/qr-scanner">
    <DashboardLayout>
    <QRScanner />
    </DashboardLayout>
    </Route>
    <Route path="/hr/email-reports">
    <DashboardLayout>
    <AttendanceEmailReports />
    </DashboardLayout>
    </Route>
    <Route path="/hr/shifts">
    <DashboardLayout>
    <ShiftsManagement />
    </DashboardLayout>
    </Route>
    <Route path="/hr/leaves">
    <DashboardLayout>
    <Leaves />
    </DashboardLayout>
    </Route>
    <Route path="/hr/payroll">
    <DashboardLayout>
    <Payroll />
    </DashboardLayout>
    </Route>
    <Route path="/hr/salary-components">
    <DashboardLayout>
    <SalaryComponents />
    </DashboardLayout>
    </Route>
    <Route path="/hr/approval-chains">
    <DashboardLayout>
    <ApprovalChains />
    </DashboardLayout>
    </Route>
    <Route path="/hr/performance">
    <DashboardLayout>
    <Performance />
    </DashboardLayout>
    </Route>
    <Route path="/hr/training">
    <DashboardLayout>
    <Training />
    </DashboardLayout>
    </Route>
    <Route path="/hr/organization">
    <DashboardLayout>
    <Organization />
    </DashboardLayout>
    </Route>
    <Route path="/hr/recruitment">
    <DashboardLayout>
    <ApplicationList />
    </DashboardLayout>
    </Route>
    <Route path="/hr/employees">
    <DashboardLayout>
    <EmployeeList />
    </DashboardLayout>
    </Route>
    <Route path="/hr/employees/add">
    <DashboardLayout>
    <AddEmployeeSimple />
    </DashboardLayout>
    </Route>
    <Route path="/hr/employees/add-full">
    <DashboardLayout>
    <AddEmployee />
    </DashboardLayout>
    </Route>
    <Route path="/hr/employees/:id">
    {(params) => (
    <DashboardLayout>
    <EmployeeProfile id={params.id} />
    </DashboardLayout>
    )}
    </Route>
    <Route path="/hr/activate">
    <EmployeeActivation />
    </Route>
    <Route path="/hr/employee-docs">
    <DashboardLayout>
    <EmployeeDocs />
    </DashboardLayout>
    </Route>
    <Route path="/hr/onboarding-review">
    <DashboardLayout>
    <OnboardingReview />
    </DashboardLayout>
    </Route>
    <Route path="/hr/leave-management" /* MERGED: supervisor tab in /hr/leaves */>
    <DashboardLayout>
    <LeaveManagement />
    </DashboardLayout>
    </Route>
    <Route path="/hr/performance-advanced" /* MERGED: tab in /hr/performance?tab=advanced */>
    <DashboardLayout>
    <PerformanceAdvanced />
    </DashboardLayout>
    </Route>
    <Route path="/hr/training-advanced">
    <DashboardLayout>
    <TrainingAdvanced />
    </DashboardLayout>
    </Route>
    <Route path="/hr/automation">
    <DashboardLayout>
    <HRAutomation />
    </DashboardLayout>
    </Route>
    <Route path="/hr/recruitment-advanced" /* MERGED: tab في /hr/recruitment?tab=advanced */>
    <DashboardLayout>
    <RecruitmentAdvanced />
    </DashboardLayout>
    </Route>
    <Route path="/hr/organization-structure" /* MERGED: chart tab in /hr/organization */>
    <DashboardLayout>
    <OrganizationStructure />
    </DashboardLayout>
    </Route>
    <Route path="/hr/violations">
    <DashboardLayout>
    <ViolationsManagement />
    </DashboardLayout>
    </Route>
    <Route path="/hr/my-violations">
    <DashboardLayout>
    <MyViolations />
    </DashboardLayout>
    </Route>
    <Route path="/hr/penalty-escalation">
    <DashboardLayout>
    <PenaltyEscalation />
    </DashboardLayout>
    </Route>
    <Route path="/hr/salary-advances" element={<DashboardLayout><Suspense fallback={<div>...</div>}><SalaryAdvancesPage /></Suspense></DashboardLayout>} />
    <Route path="/hr/custodies" element={<DashboardLayout><Suspense fallback={<div>...</div>}><CustodiesPage /></Suspense></DashboardLayout>} />
    <Route path="/admin/pending-reserves" element={<DashboardLayout><Suspense fallback={<div>...</div>}><PendingReservesPage /></Suspense></DashboardLayout>} />
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
    <Route path="/hr/programs">
    <DashboardLayout>
    <Programs />
    </DashboardLayout>
    </Route>
        <Route path="/hr/official-letters" element={<DashboardLayout><OfficialLettersHR /></DashboardLayout>} />
    <Route path="/hr/leave-balances">
    <DashboardLayout>
    <LeaveBalances />
    </DashboardLayout>
    </Route>
    </>
  );
}
