import { notFound } from 'next/navigation';
import {
  renderUrlSet,
  xmlResponse,
  PRODUCTS_PER_SITEMAP,
  type SitemapUrl,
} from '@/lib/seo/sitemap';
import {
  fetchProducts,
  fetchCategories,
  fetchManufacturers,
} from '@/lib/seo/catalog';
import { routes, facetSlug } from '@/lib/seo/url';
import { MOLECULES } from '@/lib/seo/data/molecules';
import { STATES, ALL_CITIES, TIER_1_CITIES } from '@/lib/seo/data/locations';

/**
 * All child sitemaps, served from one dynamic route.
 *
 * A single handler keyed on the filename beats eight near-identical route
 * files: the chunking maths, cache headers and escaping stay in one place, and
 * adding a new facet sitemap is a single `case`.
 *
 * `products-<n>.xml` chunks are paged straight out of the API. Everything else
 * is derived from taxonomy or static data and is therefore very cheap.
 */
export const revalidate = 3600;

/** Only brands with real catalogue depth get a page, so none are thin. */
const MIN_PRODUCTS_FOR_BRAND_PAGE = 5;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const name = params.slug.replace(/\.xml$/i, '');

  if (name.startsWith('products-')) {
    return handleProducts(Number(name.slice('products-'.length)));
  }

  switch (name) {
    case 'static':
      return handleStatic();
    case 'categories':
      return handleCategories();
    case 'brands':
      return handleBrands();
    case 'generics':
      return handleGenerics();
    case 'locations':
      return handleLocations();
    case 'blogs':
      return handleBlogs();
    default:
      notFound();
  }
}

async function handleProducts(chunk: number) {
  if (!Number.isInteger(chunk) || chunk < 0 || chunk > 100) notFound();

  // The API caps `limit` at 100, so a 5,000-URL chunk is 50 sequential pages.
  const perApiPage = 100;
  const pagesPerChunk = PRODUCTS_PER_SITEMAP / perApiPage;
  const firstApiPage = chunk * pagesPerChunk + 1;

  const urls: SitemapUrl[] = [];
  for (let i = 0; i < pagesPerChunk; i++) {
    const { products } = await fetchProducts({
      page: firstApiPage + i,
      limit: perApiPage,
    });
    if (products.length === 0) break;
    for (const p of products) {
      const slug = p.slug?.trim();
      if (!slug) continue;
      urls.push({
        path: routes.product(slug),
        lastModified: p.updatedAt ?? p.createdAt,
        changeFrequency: 'weekly',
        // Products with a live seller are the ones that can convert.
        priority: p.hasSellers ? 0.8 : 0.5,
      });
    }
  }

  if (urls.length === 0) notFound();
  return xmlResponse(renderUrlSet(urls));
}

async function handleStatic() {
  const now = new Date();
  const urls: SitemapUrl[] = [
    { path: routes.home(), changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { path: routes.products(), changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { path: routes.categories(), changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { path: routes.brands(), changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { path: routes.generics(), changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { path: routes.locations(), changeFrequency: 'weekly', priority: 0.8, lastModified: now },
    { path: routes.blogs(), changeFrequency: 'daily', priority: 0.7, lastModified: now },
    { path: routes.about(), changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { path: routes.contact(), changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { path: routes.faq(), changeFrequency: 'monthly', priority: 0.6, lastModified: now },
  ];
  return xmlResponse(renderUrlSet(urls));
}

async function handleCategories() {
  const categories = await fetchCategories();
  const urls: SitemapUrl[] = [];
  for (const c of categories) {
    urls.push({
      path: routes.category(c.slug),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
    for (const sub of c.subCategories ?? []) {
      urls.push({
        path: routes.dosageForm(c.slug, sub.slug),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }
  if (urls.length === 0) notFound();
  return xmlResponse(renderUrlSet(urls));
}

async function handleBrands() {
  const manufacturers = await fetchManufacturers();
  const eligible = manufacturers.filter(
    (m) => (m.productCount ?? 0) >= MIN_PRODUCTS_FOR_BRAND_PAGE && m.name?.trim(),
  );

  const urls: SitemapUrl[] = eligible.map((m) => ({
    path: routes.brand(facetSlug(m.name)),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  /**
   * Brand x city pages, restricted to the largest brands and tier-1 cities.
   *
   * The full cross-product would be thousands of pages saying nearly the same
   * thing. Capping it keeps every generated page defensibly distinct.
   */
  const topBrands = [...eligible]
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 40);

  for (const brand of topBrands) {
    for (const citySlug of TIER_1_CITIES) {
      urls.push({
        path: routes.brandInCity(facetSlug(brand.name), citySlug),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }
  }

  if (urls.length === 0) notFound();
  return xmlResponse(renderUrlSet(urls));
}

async function handleGenerics() {
  const urls: SitemapUrl[] = MOLECULES.map((m) => ({
    path: routes.generic(m.slug),
    changeFrequency: 'weekly',
    priority: m.approxProducts >= 100 ? 0.8 : 0.6,
  }));
  return xmlResponse(renderUrlSet(urls));
}

async function handleLocations() {
  const urls: SitemapUrl[] = [];
  for (const state of STATES) {
    urls.push({
      path: routes.state(state.slug),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }
  for (const city of ALL_CITIES) {
    urls.push({
      path: routes.city(city.state.slug, city.slug),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }
  return xmlResponse(renderUrlSet(urls));
}

/**
 * Blog sitemap.
 *
 * Reads the public blog list directly; if the endpoint is unavailable the
 * sitemap degrades to just the index page rather than failing the response,
 * because a 500 here would invalidate the parent sitemap index too.
 */
async function handleBlogs() {
  const urls: SitemapUrl[] = [
    { path: routes.blogs(), changeFrequency: 'daily', priority: 0.7 },
  ];

  const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.pharmabag.in/api'
  ).replace(/\/+$/, '');

  try {
    // NOTE the path is `/blog/posts`, not `/blogs` — the public route and the
    // API resource are named differently, and guessing costs the whole sitemap.
    const res = await fetch(
      `${API_BASE}/blog/posts?page=1&limit=100&status=PUBLISHED`,
      {
        headers: { accept: 'application/json' },
        next: { revalidate: 3600 },
      },
    );
    if (res.ok) {
      const body = await res.json();
      // This endpoint returns a bare array, unlike the { message, data } wrapper
      // every other endpoint uses. Both shapes are handled.
      const list = Array.isArray(body) ? body : body?.data?.data ?? body?.data ?? [];
      if (Array.isArray(list)) {
        for (const b of list) {
          if (!b?.slug) continue;
          urls.push({
            path: routes.blog(b.slug),
            lastModified: b.updatedAt ?? b.publishedAt ?? b.createdAt,
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Degrade to the index entry only.
  }

  return xmlResponse(renderUrlSet(urls));
}
