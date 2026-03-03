// client/src/routes/platformRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

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
const JobsDashboard = lazy(() => import("@/pages/admin/JobsDashboard"));
const SchedulerDashboard = lazy(() => import("@/pages/admin/SchedulerDashboard"));
const WorkflowsPage = lazy(() => import("@/pages/requests/Workflows"));
const ProjectsMain = lazy(() => import("@/pages/operations/Projects"));
const PropertiesPage = lazy(() => import("@/pages/property/Properties"));

export function PlatformRoutes() {
  return (
    <>
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
        <Route path="/admin/workflows" element={<DashboardLayout><WorkflowsPage /></DashboardLayout>} />
        <Route path="/projects" element={<DashboardLayout><ProjectsMain /></DashboardLayout>} />
        <Route path="/property/properties" element={<DashboardLayout><PropertiesPage /></DashboardLayout>} />
    </>
  );
}
