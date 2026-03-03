export default {
  key: 'rules',
  nameAr: 'القواعد',
  nameEn: 'Rules',
  orderIndex: 50,
  featureFlagKey: 'feature.rules.enabled',
  routes: ['/api/modules/rules'],
  nav: [{ key: 'rules', path: '/modules/rules', nameAr: 'القواعد', nameEn: 'Rules', icon: 'Gavel' }],
  permissions: ['rules:read', 'rules:write'],
  eventsPublished: [],
  eventsSubscribed: [],
  settingsSchema: {}
};
