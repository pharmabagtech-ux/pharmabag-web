/**
 * URL and slug helpers for SEO surfaces.
 *
 * Canonical correctness is the whole point of this file: a canonical that
 * disagrees with the URL Google crawled causes the page to be dropped from
 * the index entirely, so every absolute URL on the site is built here rather
 * than string-concatenated at each call site.
 */
import { SITE_URL } from './config';

/** Absolute URL from a site-root-relative path. Idempotent on absolute input. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean === '/' ? '' : clean}`;
}

/**
 * Slugifies a facet value (brand, molecule, category, city) for use in a path.
 *
 * NOTE this is deliberately NOT the product slugifier in `@pharmabag/utils`.
 * That one mirrors the API's stored product slugs, where punctuation is
 * DELETED so "0.5mg" becomes "05mg". Facet slugs have no stored counterpart to
 * match, so here punctuation becomes a hyphen, which reads better and keeps
 * "Dr. Reddy's" and "Dr Reddys" from colliding into an unreadable token.
 */
/** Combining diacritical marks, built from escapes so no raw combining
 *  character ever sits in this source file (editors silently mangle them). */
const COMBINING_MARKS = new RegExp('[\u0300-\u036f]', 'g');

export function facetSlug(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Best-effort inverse of `facetSlug` for display before data loads.
 *
 * Only ever used as a fallback label — real pages resolve the true cased name
 * from the API so "sun-pharma" renders as the brand's own spelling.
 */
export function unslugLabel(slug: string): string {
  return String(slug ?? '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Canonical path builders. Centralised so a route rename cannot half-land. */
export const routes = {
  home: () => '/',
  products: () => '/products',
  product: (slug: string) => `/products/${slug}`,
  categories: () => '/categories',
  category: (slug: string) => `/categories/${slug}`,
  dosageForm: (categorySlug: string, formSlug: string) =>
    `/categories/${categorySlug}/${formSlug}`,
  brands: () => '/brands',
  brand: (slug: string) => `/brands/${slug}`,
  generics: () => '/generics',
  generic: (slug: string) => `/generics/${slug}`,
  locations: () => '/wholesale-medicine-suppliers',
  state: (stateSlug: string) => `/wholesale-medicine-suppliers/${stateSlug}`,
  city: (stateSlug: string, citySlug: string) =>
    `/wholesale-medicine-suppliers/${stateSlug}/${citySlug}`,
  brandInCity: (brandSlug: string, citySlug: string) =>
    `/brands/${brandSlug}/${citySlug}`,
  blogs: () => '/blogs',
  blog: (slug: string) => `/blogs/${slug}`,
  about: () => '/about',
  contact: () => '/contact',
  faq: () => '/faq',
  privacy: () => '/privacy',
  terms: () => '/terms',
  shipping: () => '/shipping',
} as const;

/**
 * Strips tracking and view-state params from a URL before it is used as a
 * canonical, so `?page=2&sort=price&utm_source=x` does not fragment one page's
 * authority across dozens of near-duplicate URLs.
 *
 * `page` is preserved because paginated pages are genuinely distinct and must
 * self-canonicalise (canonicalising page 2 to page 1 hides page 2's products
 * from the index — a common and costly mistake).
 */
export function canonicalWithParams(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const url = new URL(absoluteUrl(path));
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'page' && Number(value) <= 1) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}
