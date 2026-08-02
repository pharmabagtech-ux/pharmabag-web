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
 *  - It never throws. A page that renders without its "related products" rail
 *    is fine; a page that 500s loses the URL from the index.
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

/** Shared fetch with a timeout, caching and total failure tolerance. */
async function apiGet<T>(
  path: string,
  revalidate: number,
  fallback: T,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return fallback;
    const body = await res.json();
    // The API wraps every payload as { message, data }.
    return (body?.data ?? body ?? fallback) as T;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
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

export async function fetchProducts(q: ProductQuery = {}): Promise<ProductPage> {
  const data = await apiGet<{
    products?: CatalogProduct[];
    meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
  }>(`/products?${buildQuery(q)}`, REVALIDATE_PRODUCT, {});

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

/**
 * Single product by stored slug (or id).
 *
 * `findOne` on the API resolves an exact slug first, then falls back to the
 * SKU-suffixed and legacy-punctuation forms, so passing the URL segment
 * straight through is correct and covers old shared links.
 */
export async function fetchProduct(
  slugOrId: string,
): Promise<CatalogProduct | null> {
  if (!slugOrId) return null;
  const data = await apiGet<CatalogProduct | null>(
    `/products/${encodeURIComponent(slugOrId)}`,
    REVALIDATE_PRODUCT,
    null,
  );
  return data && (data as CatalogProduct).id ? data : null;
}

export async function fetchCategories(): Promise<CatalogCategory[]> {
  const data = await apiGet<CatalogCategory[]>(
    '/products/categories',
    REVALIDATE_TAXONOMY,
    [],
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchManufacturers(): Promise<CatalogManufacturer[]> {
  const data = await apiGet<CatalogManufacturer[]>(
    '/products/manufacturers',
    REVALIDATE_TAXONOMY,
    [],
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
