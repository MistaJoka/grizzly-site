// Shared route manifest. Deliberately a plain module, not a .spec file:
// importing one spec from another registers its tests twice.
export const ROUTES = [
  '/',
  '/services',
  '/services/lawn-maintenance',
  '/services/bush-hedge-trimming',
  '/services/mulching-planting-beds',
  '/services/tree-plant-installation',
  '/services/pressure-washing',
  '/commercial',
  '/work',
  '/work/forty-tree-installation',
  '/areas/miami',
  '/areas/miami-beach',
  '/areas/hialeah',
  '/areas/coral-gables',
  '/areas/doral',
  '/areas/kendall',
  '/about',
  '/contact',
  '/preview',
  '/404',
] as const;
