// client/src/routes/legalRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const LegalAutomation = lazy(() => import("@/pages/legal/LegalAutomation"));
const LegalDocuments = lazy(() => import("@/pages/legal/LegalDocuments"));
const LegalAudit = lazy(() => import("@/pages/legal/LegalAudit"));
const Legal = lazy(() => import("@/pages/legal/Legal"));
const LegalContracts = lazy(() => import("@/pages/legal/Contracts"));
const Cases = lazy(() => import("@/pages/legal/Cases"));

export function LegalRoutes() {
  return (
    <>
    <Route path="/legal/automation">
    <DashboardLayout>
    <LegalAutomation />
    </DashboardLayout>
    </Route>
    <Route path="/legal">
    <DashboardLayout>
    <Legal />
    </DashboardLayout>
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
    <Route path="/legal/cases">
    <DashboardLayout>
    <Cases />
    </DashboardLayout>
    </Route>
    </>
  );
}
