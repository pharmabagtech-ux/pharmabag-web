/**
 * Server-side catalogue reads for SSR pages, sitemaps and metadata.
 *
 * Deliberately separate from the client `@pharmabag/api-client` hooks:
 *  - It calls the API origin directly rather than the `/api/*` Next rewrite,
 *    because a server component fetching its own rewrite would loop back
 *    through the proxy for no reason.
 *  - Every response is cached with `next.revalidate` so that rendering 26,000
 *    product pages does not translate into 26,000 uncached API hits. Without
 *    this, enabling SSR would move the site's load onto the API box.
 *  - Decorative reads never throw: a page that renders without its "related
 *    products" rail is fine. Reads a page cannot render without are `strict`
 *    and DO throw -- see `apiGet` for why turning an API blip into a 404
 *    is far worse than turning it into a 500.
 */
import { unstable_noStore } from 'next/cache';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

/** Product data changes when sellers edit listings — an hour is a fair floor. */
const REVALIDATE_PRODUCT = 3600;
/** Taxonomy is near-static; a day keeps facet pages cheap. */
const REVALIDATE_TAXONOMY = 86400;

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  chemicalComposition?: string | null;
  mrp?: number | null;
  price?: number | null;
  moq?: number | null;
  gstPercent?: number | null;
  discountType?: string | null;
  discountMeta?: Record<string, unknown> | null;
  hasSellers?: boolean;
  sellerCount?: number | null;
  stock?: number | null;
  image?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  subCategory?: { id: string; name: string; slug: string } | null;
  createdAt?: string;
  updatedAt?: string;

  /**
   * Fields returned only by the detail endpoint (`/products/:id`), not by the
   * grid. They are the substance of a product page's crawlable content, so
   * they are optional here and always guarded at the call site.
   */
  description?: string | null;
  therapeuticClass?: string | null;
  packSize?: string | null;
  directionsForUse?: string | null;
  safetyAdvice?: string | null;
  sideEffects?: string | null;
  storageAndHandling?: string | null;
  images?: string[] | null;
  listings?: CatalogListing[] | null;

  /**
   * Admin-set SEO head overrides (null across the catalogue by default).
   * When present they replace the GENERATED title/description/OG image in
   * the page head only — H1, schema and on-page copy stay generated, so the
   * structured data always describes the actual page.
   */
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
}

/** A seller's offer against a catalogue product. */
export interface CatalogListing {
  id: string;
  price?: number | null;
  mrp?: number | null;
  gstPercent?: number | null;
  discountType?: string | null;
  discountMeta?: Record<string, unknown> | null;
  stock?: number | null;
  moq?: number | null;
  expiryDate?: string | null;
  images?: string[] | null;
  seller?: {
    id: string;
    companyName?: string | null;
    rating?: number | null;
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  subCategories?: { id: string; name: string; slug: string; categoryId: string }[];
}

export interface CatalogManufacturer {
  id: string;
  name: string;
  productCount?: number;
}

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  manufacturer?: string;
  page?: number;
  /** The API rejects anything above 100. */
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Raised when a fetch a page cannot render without has failed. */
export class CatalogUnavailableError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Catalogue request failed: ${path}`);
    this.name = 'CatalogUnavailableError';
    this.cause = cause;
  }
}

/**
 * Shared fetch with a timeout, caching, one retry, and a caller-chosen
 * failure mode.
 *
 * The failure mode matters more than it looks. Facet pages resolve a slug by
 * looking it up in this data, so if a transient timeout returned an empty list
 * the page would conclude the brand does not exist and call `notFound()` —
 * turning a two-second API blip into a **404**. Google drops 404s from the
 * index; it retries 500s. Silently degrading to "not found" is therefore the
 * worst possible behaviour here, and it was observed happening in
 * verification before this was added.
 *
 * So: data a page cannot render without is fetched with `strict`, which
 * throws and yields a 500. Decorative data (related products, sibling rails)
 * keeps the tolerant fallback, because losing a rail should never cost the
 * whole page.
 */
async function apiGet<T>(
  path: string,
  revalidate: number,
  fallback: T,
  strict = false,
): Promise<T> {
  let lastError: unknown;

  // Two attempts: most failures here are a cold API box or a brief timeout.
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
        next: { revalidate },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        // 4xx will not improve on retry — EXCEPT 429, which by definition
        // improves once the rate-limit window rolls over. Treating 429 as
        // permanent is how the sitemap builder once read a throttled page as
        // "end of catalogue" and shipped 404 chunk files.
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1_500 * (attempt + 1)));
          continue;
        }
        if (res.status < 500) break;
        continue;
      }
      const body = await res.json();
      // The API wraps every payload as { message, data }.
      return (body?.data ?? body ?? fallback) as T;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (strict) throw new CatalogUnavailableError(path, lastError);
  return fallback;
}

function buildQuery(q: ProductQuery): string {
  const params = new URLSearchParams();
  if (q.search) params.set('search', q.search);
  if (q.categoryId) params.set('categoryId', q.categoryId);
  if (q.subCategoryId) params.set('subCategoryId', q.subCategoryId);
  if (q.manufacturer) params.set('manufacturer', q.manufacturer);
  params.set('page', String(Math.max(1, q.page ?? 1)));
  params.set('limit', String(Math.min(100, Math.max(1, q.limit ?? 24))));
  if (q.sortBy) params.set('sortBy', q.sortBy);
  if (q.sortOrder) params.set('sortOrder', q.sortOrder);
  return params.toString();
}

export interface ProductPage {
  products: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchProducts(
  q: ProductQuery = {},
  opts: { strict?: boolean } = {},
): Promise<ProductPage> {
  const data = await apiGet<{
    products?: CatalogProduct[];
    meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
  }>(`/products?${buildQuery(q)}`, REVALIDATE_PRODUCT, {}, opts.strict);

  const products = Array.isArray(data?.products) ? data.products : [];
  const meta = data?.meta ?? {};
  const total = Number(meta.total ?? products.length) || 0;
  const limit = Number(meta.limit ?? q.limit ?? 24) || 24;

  return {
    products,
    total,
    page: Number(meta.page ?? q.page ?? 1) || 1,
    limit,
    // The API reports totalPages against its own limit; recompute defensively.
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

/** One sitemap entry's worth of product: slug + dates + sellability. */
export interface SitemapProduct {
  slug: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  hasSellers?: boolean;
}

export interface SitemapProductPage {
  products: SitemapProduct[];
  total: number;
  totalPages: number;
}

/**
 * Catalogue enumeration for the XML sitemap chunks, via the API's dedicated
 * throttle-exempt `/products/sitemap` endpoint.
 *
 * The old approach — paging `/products` at its 100-row cap — needed 269
 * sequential calls from this box's single IP, and the API's per-visitor
 * throttle (100 req/60s) killed the run at ~call 100: chunk 1 truncated at
 * 4,900 URLs and chunks 2-5 rendered as 404s, leaving 63% of the catalogue in
 * no sitemap. This endpoint returns 5,000 slim rows per call, so a full
 * rebuild is ~6 requests. `strict` is NOT used: on failure the chunk 404s
 * exactly as it always has, rather than 500ing the sitemap index.
 */
export async function fetchSitemapProducts(q: {
  page?: number;
  limit?: number;
}): Promise<SitemapProductPage> {
  const params = new URLSearchParams();
  params.set('page', String(Math.max(1, q.page ?? 1)));
  params.set('limit', String(Math.min(5000, Math.max(1, q.limit ?? 5000))));

  const data = await apiGet<{
    products?: SitemapProduct[];
    meta?: { total?: number; totalPages?: number };
  }>(`/products/sitemap?${params.toString()}`, REVALIDATE_PRODUCT, {});

  const products = Array.isArray(data?.products) ? data.products : [];
  return {
    products,
    total: Number(data?.meta?.total ?? products.length) || 0,
    totalPages: Number(data?.meta?.totalPages ?? 0) || 0,
  };
}

/**
 * Single product by stored slug (or id).
 *
 * `findOne` on the API resolves an exact slug first, then falls back to the
 * SKU-suffixed and legacy-punctuation forms, so passing the URL segment
 * straight through is correct and covers old shared links.
 *
 * The return contract is deliberately three-way:
 *  - the product          → it exists
 *  - `null`               → the API CONFIRMED it does not exist (404, or a
 *                           200 with no product body) — safe to `notFound()`
 *  - CatalogUnavailableError thrown → the API could not be reached. The old
 *    version returned `null` here too, which served a 200 "Product not found"
 *    shell for every unknown OR unreachable product — a soft-404 that also
 *    meant a two-second API blip could tell Google a live product was gone.
 */
export async function fetchProduct(
  slugOrId: string,
): Promise<CatalogProduct | null> {
  if (!slugOrId) return null;
  const path = `/products/${encodeURIComponent(slugOrId)}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
        next: { revalidate: REVALIDATE_PRODUCT },
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1_500 * (attempt + 1)));
          continue;
        }
        if (res.status < 500) break;
        continue;
      }
      const body = await res.json();
      const data = (body?.data ?? body) as CatalogProduct | null;
      // A 200 whose payload carries no product is the API's other way of
      // saying "not found" — treat it the same as a 404.
      return data && data.id ? data : null;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new CatalogUnavailableError(path, lastError);
}

/**
 * @param strict throw instead of returning [] when the request fails. Use it
 * anywhere an empty list would be misread as "this slug does not exist".
 */
export async function fetchCategories(strict = false): Promise<CatalogCategory[]> {
  const data = await apiGet<CatalogCategory[]>(
    '/products/categories',
    REVALIDATE_TAXONOMY,
    [],
    strict,
  );
  return Array.isArray(data) ? data : [];
}

/** @param strict see {@link fetchCategories}. */
export async function fetchManufacturers(
  strict = false,
): Promise<CatalogManufacturer[]> {
  const data = await apiGet<CatalogManufacturer[]>(
    '/products/manufacturers',
    REVALIDATE_TAXONOMY,
    [],
    strict,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Walks every page of the catalogue.
 *
 * Only for sitemap generation. Capped so that a runaway `total` can never turn
 * a sitemap request into an unbounded crawl of the API.
 */
export async function fetchAllProducts(
  opts: { maxPages?: number; pageSize?: number; query?: ProductQuery } = {},
): Promise<CatalogProduct[]> {
  const pageSize = Math.min(100, opts.pageSize ?? 100);
  const maxPages = opts.maxPages ?? 400; // 400 × 100 = 40,000 URLs ceiling
  const out: CatalogProduct[] = [];

  const first = await fetchProducts({ ...opts.query, page: 1, limit: pageSize });
  out.push(...first.products);
  const pages = Math.min(first.totalPages || 1, maxPages);

  // Sequential on purpose: the API box is a single t3.medium and a 400-way
  // parallel fan-out from a sitemap request would be a self-inflicted outage.
  for (let p = 2; p <= pages; p++) {
    const chunk = await fetchProducts({ ...opts.query, page: p, limit: pageSize });
    if (chunk.products.length === 0) break;
    out.push(...chunk.products);
  }
  return out;
}

/** Escape hatch for any surface that must never serve stale data. */
export function noStore() {
  unstable_noStore();
}
