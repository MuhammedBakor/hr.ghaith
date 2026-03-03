// client/src/routes/index.ts — Route modules barrel export (v82)
//
// هذه الملفات تحتوي على routes مقسمة من App.tsx (1,617 سطر)
// يمكن استخدامها تدريجياً لتقليل حجم App.tsx
//
// الاستخدام:
//   import { HrRoutes } from './routes';
//   <Switch>
//     <HrRoutes />
//     <FleetRoutes />
//     ...
//   </Switch>

export { HrRoutes } from './hrRoutes';
export { FleetRoutes } from './fleetRoutes';
export { SettingsRoutes } from './settingsRoutes';
export { GovernanceRoutes } from './governanceRoutes';
export { FinanceRoutes } from './financeRoutes';
export { AdminRoutes } from './adminRoutes';
export { PlatformRoutes } from './platformRoutes';
export { PropertyRoutes } from './propertyRoutes';
export { BiRoutes } from './biRoutes';
export { LegalRoutes } from './legalRoutes';
