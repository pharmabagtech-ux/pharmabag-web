import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

/**
 * Redirect middleware + request-path stamping.
 *
 * Serves the admin-managed 301s (products renamed by bulk uploads, dead
 * marketing links, old blog slugs) from an in-memory copy of the API's
 * redirect map, refreshed at most once a minute. Design constraints, in
 * order:
 *
 *  1. NEVER break a request. Any failure — API down, timeout, bad payload —
 *     falls through to normal routing with whatever map was last known.
 *  2. Near-zero overhead on the hot path: one Map.get per request; the
 *     refresh fetch is capped at 2s and only the first request after expiry
 *     pays it.
 *  3. `x-pathname` is stamped on every request so the root not-found page
 *     can log WHICH path 404'd (a not-found boundary cannot see the URL).
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

let redirectMap: Map<string, { to: string; status: number }> | null = null;
let fetchedAt = 0;
const TTL_MS = 60_000;

async function refreshMap(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    const res = await fetch(`${API_BASE}/redirects/map`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return; // keep whatever we had
    const body = await res.json();
    const rows: { from: string; to: string; status?: number }[] =
      body?.data ?? [];
    if (Array.isArray(rows)) {
      redirectMap = new Map(
        rows
          .filter((r) => r?.from && r?.to)
          .map((r) => [r.from, { to: r.to, status: r.status ?? 301 }]),
      );
    }
  } catch {
    // Redirects are an enhancement, never a blocker.
  } finally {
    // Failed refreshes also reset the clock — a dead API must not be
    // re-polled on every single request.
    fetchedAt = Date.now();
  }
}

/**
 * Category id -> slug, for retiring the old `/products?categoryId=<uuid>` URLs.
 *
 * Separate from the redirect map above because it is only ever consulted when
 * such a URL is actually requested — normal traffic pays nothing for it. Four
 * rows, refreshed at most hourly.
 */
let categoryMap: Map<string, { slug: string; subs: Map<string, string> }> | null =
  null;
let categoriesFetchedAt = 0;
const CATEGORY_TTL_MS = 3_600_000;

async function refreshCategories(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    const res = await fetch(`${API_BASE}/products/categories`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return; // keep whatever we had
    const body = await res.json();
    const rows: {
      id: string;
      slug?: string;
      subCategories?: { id: string; slug?: string }[];
    }[] = body?.data ?? [];
    if (Array.isArray(rows)) {
      categoryMap = new Map(
        rows
          .filter((c) => c?.id && c?.slug)
          .map((c) => [
            c.id,
            {
              slug: c.slug as string,
              subs: new Map(
                (c.subCategories ?? [])
                  .filter((s) => s?.id && s?.slug)
                  .map((s) => [s.id, s.slug as string]),
              ),
            },
          ]),
      );
    }
  } catch {
    // Fall through to the query URL, which still renders.
  } finally {
    categoriesFetchedAt = Date.now();
  }
}

/**
 * The old category URL, permanently moved to the category page.
 *
 * `/products?categoryId=<uuid>` was where every category link in the
 * navigation used to point. It is not a page in its own right — it
 * canonicalises to bare `/products` — so anything that ever linked to it was
 * pointing at a URL that could not rank. A 308 moves that history onto
 * `/categories/<slug>` and, more importantly, stops the two URLs competing to
 * be the site's answer for "ayurvedic medicines wholesale".
 *
 * Returns null (i.e. render normally) whenever the mapping is not certain: an
 * unknown id, a category with no slug, or an API that could not be reached.
 * A redirect that guesses is worse than an ugly URL.
 */
async function categoryRedirect(url: URL): Promise<string | null> {
  if (url.pathname.replace(/\/+$/, '') !== '/products') return null;

  const categoryId = url.searchParams.get('categoryId');
  if (!categoryId) return null;

  /**
   * A search inside a category is a genuine catalogue query, not a category
   * landing page, and the destination has no free-text search. Redirecting it
   * would silently throw away what the visitor typed.
   */
  if (url.searchParams.get('search')) return null;

  if (Date.now() - categoriesFetchedAt > CATEGORY_TTL_MS) {
    await refreshCategories();
  }

  const category = categoryMap?.get(categoryId);
  if (!category) return null;

  const subId = url.searchParams.get('subCategoryId');
  const subSlug = subId ? category.subs.get(subId) : undefined;
  if (subId && !subSlug) return `/categories/${category.slug}`;

  return subSlug
    ? `/categories/${category.slug}/${subSlug}`
    : `/categories/${category.slug}`;
}

/** Mirror of the API's normalizePath, reduced to what a live URL needs. */
function normalize(pathname: string): string {
  let p = pathname.toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname);

  if (Date.now() - fetchedAt > TTL_MS) {
    await refreshMap();
  }

  const from = normalize(request.nextUrl.pathname);
  const hit = redirectMap?.get(from);
  if (hit) {
    // Count the hit without holding the redirect back.
    event.waitUntil(
      fetch(`${API_BASE}/redirects/hit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from }),
      }).catch(() => {}),
    );
    const target = hit.to.startsWith('http')
      ? hit.to
      : new URL(hit.to, request.url);
    return NextResponse.redirect(target, hit.status);
  }

  /**
   * Checked after the admin map so a hand-written redirect always wins, and
   * only for URLs that actually carry `categoryId` — everything else returns
   * from `categoryRedirect` without a fetch or a map lookup.
   */
  const toCategory = await categoryRedirect(request.nextUrl);
  if (toCategory) {
    // 301, matching the admin map's default, so every permanent move on this
    // site reports as the same thing in Search Console and in audit tools.
    return NextResponse.redirect(new URL(toCategory, request.url), 301);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  /**
   * Assets and API proxy calls never need redirect lookups. Everything
   * page-shaped flows through (sitemap/robots end in .xml/.txt and are
   * excluded too — no redirects wanted on machine endpoints).
   */
  matcher: [
    '/((?!_next/|api/|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|css|js|txt|xml|json|map|woff2?)$).*)',
  ],
};
