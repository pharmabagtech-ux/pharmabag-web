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
