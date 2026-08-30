/**
 * Runtime site-SEO settings, edited in the admin panel (SEO Settings page).
 *
 * Tolerant by contract: ANY failure returns {} and the storefront falls back
 * to env vars / code defaults — settings must never be able to take the site
 * down, and `next build` must succeed with no API reachable.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

export interface SiteSettings {
  gscVerification?: string;
  bingVerification?: string;
  ga4MeasurementId?: string;
  socialProfiles?: string[];
  supportEmail?: string;
  addressLocality?: string;
  addressRegion?: string;
  defaultOgImage?: string;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/site-settings/public`, {
      headers: { accept: 'application/json' },
      // 5 minutes is the advertised propagation delay for panel edits.
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const body = await res.json();
    const data = body?.data ?? body;
    return data && typeof data === 'object' ? (data as SiteSettings) : {};
  } catch {
    return {};
  }
}
