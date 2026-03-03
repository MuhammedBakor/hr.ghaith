// client/src/routes/propertyRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const PropertyAutomation = lazy(() => import("@/pages/property/PropertyAutomation"));
const PropertyHome = lazy(() => import("@/pages/property/PropertyHome"));
const PropertyDetails = lazy(() => import("@/pages/property/PropertyDetails"));
const Properties = lazy(() => import("@/pages/property/Properties"));
const Contracts = lazy(() => import("@/pages/property/Contracts"));
const Tenants = lazy(() => import("@/pages/property/Tenants"));
const PropertyMaintenance = lazy(() => import("@/pages/property/PropertyMaintenance"));
const Leases = lazy(() => import("@/pages/property/Leases"));

export function PropertyRoutes() {
  return (
    <>
    <Route path="/property/automation">
    <DashboardLayout>
    <PropertyAutomation />
    </DashboardLayout>
    </Route>
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
    <Route path="/property/:id">
    <DashboardLayout>
    <Leases />
    </DashboardLayout>
    </Route>
    </>
  );
}
