import type { Faq } from './content';

/**
 * Admin-authored overrides for a landing page, read by path.
 *
 * The whole map is fetched once per revalidation window rather than one lookup
 * per page render. Every server render on the web box leaves from a single IP,
 * so a per-render call would eventually meet the API's per-IP throttle and
 * every page would quietly fall back to generated text at once — the same
 * failure mode that truncated the product sitemaps. The API marks the map
 * endpoint `@SkipThrottle` for that reason; fetching it once compounds the
 * protection.
 *
 * Everything here FAILS OPEN. If the API is down, slow, or has not deployed
 * this endpoint yet, `{}` comes back and every page renders exactly the text
 * it renders today. An override that fails to load must never be able to
 * blank a live page.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

/** Overrides are edited by hand and rarely; five minutes is a fair floor. */
const REVALIDATE_PAGE_SEO = 300;

export interface PageSeoOverride {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string[] | null;
  entityDescription?: string | null;
  aiSummary?: string | null;
  h1?: string | null;
  intro?: string | null;
  bodyHtml?: string | null;
  faq?: Faq[] | null;
  structuredData?: Record<string, unknown> | null;
  imageAlts?: Record<string, string> | null;
}

export type PageSeoMap = Record<string, PageSeoOverride>;

/**
 * Mirrors `PageSeoService.normalizePath` on the API side EXACTLY.
 *
 * If the two ever disagree — a trailing slash, a capital letter — a saved
 * override silently does nothing and looks like a bug in the admin panel.
 */
export function normalizePath(input: string): string {
  let p = (input || '').trim();
  if (!p) return '/';
  p = p.split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

export async function fetchPageSeoMap(): Promise<PageSeoMap> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`${API_BASE}/page-seo/map`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      next: { revalidate: REVALIDATE_PAGE_SEO },
    });
    if (!res.ok) return {};
    const body = await res.json();
    const data = body?.data ?? body;
    return data && typeof data === 'object' ? (data as PageSeoMap) : {};
  } catch {
    // Deliberately silent and total: no override is always a valid state.
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

/** The override for one page, or null when the page has never been edited. */
export async function fetchPageOverride(
  path: string,
): Promise<PageSeoOverride | null> {
  const map = await fetchPageSeoMap();
  return map[normalizePath(path)] ?? null;
}

/**
 * Values a stored string may interpolate.
 *
 * Without these, editing an intro would freeze whatever product count was true
 * on the day it was written. `430 products` is wrong the moment the catalogue
 * changes, and nobody would think to go back and re-edit 1,640 pages.
 */
export interface PageTokens {
  product_count?: string | number;
  name?: string;
  min_order_value?: string;
}

/**
 * Replaces `{{token}}` with its value.
 *
 * An unknown token is left in place rather than blanked: a visible
 * `{{prodcut_count}}` is a typo someone fixes, whereas a silent gap in a
 * sentence reads as a broken page and nobody knows why.
 */
export function applyTokens(text: string, tokens: PageTokens): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, key: string) => {
    const value = (tokens as Record<string, unknown>)[key];
    return value === undefined || value === null ? whole : String(value);
  });
}

/**
 * Picks the override when it has content, otherwise the generated value.
 *
 * A stored empty string means the admin cleared the field, which the API turns
 * back into null — so only a non-empty value counts as an override here.
 */
export function preferOverride(
  override: string | null | undefined,
  generated: string,
  tokens: PageTokens,
): string {
  const value = override?.trim();
  return value ? applyTokens(value, tokens) : generated;
}
