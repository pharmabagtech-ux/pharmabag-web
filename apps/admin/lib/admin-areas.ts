/**
 * The admin console's view of the permission model.
 *
 * This MIRRORS `src/common/admin-access/` in the API. The API is what actually
 * enforces; this exists so the sidebar and route guard can show an admin the
 * same answer the server would give, without a round trip per navigation.
 *
 * If you add an area, add it in both places — and add the API route rule too,
 * or the screen will render and every request behind it will 403.
 */

export const ADMIN_AREAS = [
  'dashboard',
  'users',
  'products',
  'csv-upload',
  'categories',
  'product-requests',
  'orders',
  'payments',
  'marketing',
  'blogs',
  'seo',
  'settlements',
  'tickets',
  'admins',
  'notifications',
  'referrals',
  'custom-orders',
  'suggestions',
  'analytics',
  'settings',
  'migration',
] as const;

export type AdminArea = (typeof ADMIN_AREAS)[number];
export type GrantLevel = 'read' | 'full';
export type AreaGrant = GrantLevel | 'none';

/** Holding any of these is equivalent to holding everything. Super only. */
export const SUPER_ONLY_AREAS: AdminArea[] = ['admins', 'migration', 'csv-upload'];

export const AREA_LABELS: Record<AdminArea, string> = {
  dashboard: 'Dashboard',
  users: 'Users, buyers & sellers',
  products: 'Products',
  'csv-upload': 'CSV upload & bulk catalogue',
  categories: 'Categories',
  'product-requests': 'Product requests',
  orders: 'Orders',
  payments: 'Payments',
  marketing: 'Marketing & banners',
  blogs: 'Blogs',
  seo: 'SEO & redirects',
  settlements: 'Settlements',
  tickets: 'Support tickets',
  admins: 'Admin accounts',
  notifications: 'Notifications',
  referrals: 'Referrals',
  'custom-orders': 'Custom orders',
  suggestions: 'Search suggestions',
  analytics: 'Analytics',
  settings: 'Site settings',
  migration: 'Data migration',
};

/** Why an area is restricted, shown next to it in the grant editor. */
export const SUPER_ONLY_REASONS: Partial<Record<AdminArea, string>> = {
  admins: 'Anyone who can add an admin can add a super admin.',
  migration: 'Includes rolling back imported data.',
  'csv-upload': 'A bulk delete can empty the entire catalogue.',
};

/** Admin app routes, mapped to the area that controls them. */
export const ROUTE_AREAS: { prefix: string; area: AdminArea }[] = [
  // The root only redirects to /dashboard, but the guard runs before the
  // redirect does — leaving it unmapped would deny every admin, super
  // included, at the front door.
  { prefix: '/', area: 'dashboard' },
  { prefix: '/dashboard', area: 'dashboard' },
  { prefix: '/users', area: 'users' },
  { prefix: '/buyers', area: 'users' },
  { prefix: '/csv-upload', area: 'csv-upload' },
  { prefix: '/product-requests', area: 'product-requests' },
  { prefix: '/products', area: 'products' },
  { prefix: '/categories', area: 'categories' },
  { prefix: '/orders', area: 'orders' },
  { prefix: '/custom-orders', area: 'custom-orders' },
  { prefix: '/payments', area: 'payments' },
  { prefix: '/settlements', area: 'settlements' },
  { prefix: '/marketing', area: 'marketing' },
  { prefix: '/banners', area: 'marketing' },
  { prefix: '/blogs', area: 'blogs' },
  { prefix: '/seo', area: 'seo' },
  { prefix: '/tickets', area: 'tickets' },
  { prefix: '/admins', area: 'admins' },
  { prefix: '/notifications', area: 'notifications' },
  { prefix: '/referrals', area: 'referrals' },
  { prefix: '/suggestions', area: 'suggestions' },
  { prefix: '/analytics', area: 'analytics' },
  { prefix: '/settings', area: 'settings' },
];

export function areaForPath(pathname: string): AdminArea | null {
  const match = ROUTE_AREAS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.area ?? null;
}

// ───────────────────────────────────────────────────────────────────────────
// Reading the stored permission string. Mirrors the API's parser exactly.
// ───────────────────────────────────────────────────────────────────────────

export const V2_PREFIX = 'v2:';

export interface AdminCapabilities {
  isSuper: boolean;
  format: 'super' | 'v2' | 'legacy' | 'invalid';
  areas: Record<string, AreaGrant>;
}

/**
 * The character codes the admin app has written since it was built.
 *
 * Taken from what the old route guard ACTUALLY enforced, not from the labels
 * the grant form displayed — the two disagreed. The form offered "View CSV
 * Upload" for `d`, while the guard read `d` as Suggestions, and it offered a
 * "Manage X" code beside every "View X" that the guard never looked at. So a
 * box labelled "Manage Orders" granted nothing at all.
 */
const LEGACY_CODE_AREAS: Record<string, AdminArea[]> = {
  '1': ['users'],
  '3': ['products', 'categories'],
  '5': ['orders'],
  '7': ['payments'],
  '9': ['settlements'],
  b: ['tickets'],
  d: ['suggestions'],
  f: ['product-requests'],
  h: ['marketing'],
  j: ['notifications'],
  l: ['referrals'],
  n: ['custom-orders'],
  p: ['analytics'],
  r: ['settings'],
  v: ['marketing'],
};

/** Areas the old guard never named, and therefore let every admin reach. */
const LEGACY_GRANDFATHERED: AdminArea[] = ['dashboard', 'blogs', 'seo'];

function blankAreas(): Record<string, AreaGrant> {
  const areas: Record<string, AreaGrant> = {};
  for (const area of ADMIN_AREAS) areas[area] = 'none';
  return areas;
}

function allAreas(): Record<string, AreaGrant> {
  const areas: Record<string, AreaGrant> = {};
  for (const area of ADMIN_AREAS) areas[area] = 'full';
  return areas;
}

export function parseAdminPermissions(raw: string | null | undefined): AdminCapabilities {
  const value = (raw ?? '').trim();

  if (value.startsWith(V2_PREFIX)) {
    const body = value.slice(V2_PREFIX.length).trim();
    if (body === 'super') return { isSuper: true, format: 'super', areas: allAreas() };

    let parsed: any;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Fail closed, exactly as the API does.
      return { isSuper: false, format: 'invalid', areas: blankAreas() };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { isSuper: false, format: 'invalid', areas: blankAreas() };
    }

    const areas = blankAreas();
    for (const [key, level] of Object.entries(parsed)) {
      if (!(ADMIN_AREAS as readonly string[]).includes(key)) continue;
      if (SUPER_ONLY_AREAS.includes(key as AdminArea)) continue;
      if (level === 'full' || level === 'write' || level === true) areas[key] = 'full';
      else if (level === 'read') areas[key] = 'read';
    }
    return { isSuper: false, format: 'v2', areas };
  }

  if (value.includes('x')) return { isSuper: true, format: 'super', areas: allAreas() };

  const areas = blankAreas();
  for (const area of LEGACY_GRANDFATHERED) areas[area] = 'full';
  for (const char of value) {
    for (const area of LEGACY_CODE_AREAS[char] ?? []) areas[area] = 'full';
  }
  return { isSuper: false, format: 'legacy', areas };
}

/**
 * Where to send an admin who has landed somewhere they cannot see.
 *
 * Returns the first route they DO hold, so a "Go to Dashboard" button does not
 * simply bounce an admin without a dashboard grant back to another wall.
 * Null means they hold nothing at all, which is worth saying plainly rather
 * than looping them.
 */
export function firstAllowedPath(
  capabilities: AdminCapabilities | null | undefined,
): string | null {
  for (const { prefix, area } of ROUTE_AREAS) {
    if (prefix === '/') continue;
    if (canAccessArea(capabilities, area)) return prefix;
  }
  return null;
}

export function canAccessArea(
  capabilities: AdminCapabilities | null | undefined,
  area: AdminArea,
  level: 'read' | 'write' = 'read',
): boolean {
  if (!capabilities) return false;
  if (SUPER_ONLY_AREAS.includes(area)) return capabilities.isSuper;
  if (capabilities.isSuper) return true;

  const granted = capabilities.areas[area];
  if (!granted || granted === 'none') return false;
  return level === 'read' ? true : granted === 'full';
}

/** Builds the string stored in AdminProfile.permissions. */
export function buildPermissionString(
  isSuper: boolean,
  areas: Record<string, AreaGrant>,
): string {
  if (isSuper) return `${V2_PREFIX}super`;

  const granted: Record<string, GrantLevel> = {};
  for (const area of ADMIN_AREAS) {
    if (SUPER_ONLY_AREAS.includes(area)) continue;
    const level = areas[area];
    if (level === 'full' || level === 'read') granted[area] = level;
  }

  return `${V2_PREFIX}${JSON.stringify(granted)}`;
}
