// client/src/routes/fleetRoutes.tsx — Auto-generated v82 split
import { Suspense, lazy } from "react";
import { Route } from "wouter";
import DashboardLayout from "../components/layout/DashboardLayout";

const FleetAutomation = lazy(() => import("@/pages/fleet/FleetAutomation"));
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
const Reservations = lazy(() => import("@/pages/fleet/Reservations"));

export function FleetRoutes() {
  return (
    <>
    <Route path="/fleet/automation">
    <DashboardLayout>
    <FleetAutomation />
    </DashboardLayout>
    </Route>
    <Route path="/fleet">
    <DashboardLayout>
    <FleetLive />
    </DashboardLayout>
    </Route>
    <Route path="/fleet/vehicles">
    <DashboardLayout>
    <Vehicles />
    </DashboardLayout>
    </Route>
    <Route path="/fleet/maintenance">
    <DashboardLayout>
    <Maintenance />
    </DashboardLayout>
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
    <Route path="/fleet/reservations">
    <DashboardLayout>
    <Reservations />
    </DashboardLayout>
    </Route>
    </>
  );
}
