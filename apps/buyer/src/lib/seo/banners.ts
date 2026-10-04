/**
 * Server-side promo banner reads.
 *
 * Sixty seconds, not the one-day window `catalog.ts` uses for taxonomy: an
 * admin who switches a banner off expects it gone promptly, and a day-long
 * cache would make the admin panel look broken.
 *
 * Caching here is a CORRECTNESS requirement, not an optimisation. The API's
 * global ThrottlerGuard allows 100 requests per 60 seconds keyed on req.ip,
 * and every server-side fetch arrives from the single Next.js server address.
 * An uncached per-render read would spend that shared budget and start
 * 429-ing unrelated catalogue reads on other pages.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

const REVALIDATE_BANNERS = 60;
const DEFAULT_ROTATION_SECONDS = 5;

export interface PromoBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  altText: string;
  linkUrl: string | null;
}

export interface PromoBannerPayload {
  banners: PromoBanner[];
  rotationSeconds: number;
}

const EMPTY: PromoBannerPayload = {
  banners: [],
  rotationSeconds: DEFAULT_ROTATION_SECONDS,
};

/**
 * Never throws.
 *
 * A banner strip is decoration: a page that renders without one is fine, a
 * category page that 500s because the banner endpoint blipped is not. This is
 * also what makes it safe for the storefront to go out before the API does —
 * a 404 simply reads as "no banners".
 */
export async function fetchBanners(
  scope: 'homepage' | 'category',
  categorySlug?: string,
): Promise<PromoBannerPayload> {
  if (scope === 'category' && !categorySlug) return EMPTY;

  const query =
    scope === 'category'
      ? `?scope=category&categorySlug=${encodeURIComponent(categorySlug as string)}`
      : '?scope=homepage';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const res = await fetch(`${API_BASE}/banners${query}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      next: { revalidate: REVALIDATE_BANNERS },
    });
    if (!res.ok) return EMPTY;

    const body = await res.json();
    const data = body?.data;
    if (!data || !Array.isArray(data.banners)) return EMPTY;

    return {
      banners: data.banners as PromoBanner[],
      rotationSeconds:
        typeof data.rotationSeconds === 'number'
          ? data.rotationSeconds
          : DEFAULT_ROTATION_SECONDS,
    };
  } catch {
    return EMPTY;
  } finally {
    clearTimeout(timeout);
  }
}
