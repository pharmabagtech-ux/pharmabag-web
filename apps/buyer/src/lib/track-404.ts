/**
 * Server-side 404 reporting, called from the route shells that KNOW which
 * path is about to 404 (they have it in params) right before `notFound()`.
 *
 * Why not in `not-found.tsx`? Reading the path there requires `headers()`,
 * and a dynamic API in the root not-found boundary forces EVERY route in the
 * app to per-request rendering — Next prerenders the not-found shell as part
 * of each page, so its dynamism poisons them all. That exact regression
 * shipped once (2026-08-30) and flipped the whole site from static to
 * dynamic; this module is the corrected design.
 *
 * Coverage: catalogue paths (products, blog posts) — the URLs bulk renames
 * orphan and crawlers keep hitting — are logged HERE, server-side, bots
 * included. Arbitrary junk paths are logged by the client component on the
 * 404 page instead (browsers only), which is acceptable: that traffic is
 * mostly scanner noise the API filters anyway.
 *
 * Fire-and-forget by contract: 1.5s cap, every failure swallowed. Reporting
 * must never delay or break a 404 response.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

export async function report404(path: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1_500);
    await fetch(`${API_BASE}/redirects/track-404`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
  } catch {
    // Never let logging affect the response.
  }
}
