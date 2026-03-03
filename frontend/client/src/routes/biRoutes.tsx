// client/src/routes/biRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const BI = lazy(() => import("@/pages/bi/BI"));
const Dashboards = lazy(() => import("@/pages/bi/Dashboards"));
const KPIs = lazy(() => import("@/pages/bi/KPIs"));
const AnalyticsReports = lazy(() => import("@/pages/bi/AnalyticsReports"));
const DecisionEngine = lazy(() => import("@/pages/bi/DecisionEngine"));
const BIAudit = lazy(() => import("@/pages/bi/BIAudit"));
const BIDataSources = lazy(() => import("@/pages/bi/BIDataSources"));

export function BiRoutes() {
  return (
    <>
    <Route path="/bi">
    <DashboardLayout>
    <BI />
    </DashboardLayout>
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
    </>
  );
}
