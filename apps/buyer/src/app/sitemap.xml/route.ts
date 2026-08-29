import { renderSitemapIndex, xmlResponse, PRODUCTS_PER_SITEMAP } from '@/lib/seo/sitemap';
import { fetchSitemapProducts, fetchManufacturers } from '@/lib/seo/catalog';

/**
 * The sitemap index — previously a 404, so nothing on this site was ever
 * submitted for discovery. Google was left to find 26,815 product pages by
 * crawling links alone, which on a JS-rendered listing meant most were never
 * found at all.
 *
 * Regenerated hourly. The index itself is cheap: it only needs the product
 * COUNT to size the chunk list, not the products themselves.
 */
export const revalidate = 3600;

export async function GET() {
  // One 1-item request purely to read `meta.total` and size the chunk list.
  // Uses the throttle-exempt sitemap endpoint so index generation can never
  // be rate-limited into under-advertising the catalogue.
  const [{ total }, manufacturers] = await Promise.all([
    fetchSitemapProducts({ page: 1, limit: 1 }),
    fetchManufacturers(),
  ]);

  const productChunks = Math.max(
    1,
    Math.ceil((total || 0) / PRODUCTS_PER_SITEMAP),
  );

  /**
   * No lastmod on the children: it used to be stamped `now()` on every fetch,
   * which claims "everything changed every hour" and teaches crawlers to
   * ignore this site's lastmod. The child sitemaps carry real per-URL dates
   * where they genuinely exist (the product chunks).
   */
  const sitemaps: { path: string; lastModified?: Date }[] = [
    { path: '/sitemaps/static.xml' },
    { path: '/sitemaps/categories.xml' },
    { path: '/sitemaps/generics.xml' },
    { path: '/sitemaps/locations.xml' },
    { path: '/sitemaps/blogs.xml' },
  ];

  if (manufacturers.length > 0) {
    sitemaps.push({ path: '/sitemaps/brands.xml' });
  }

  for (let i = 0; i < productChunks; i++) {
    sitemaps.push({ path: `/sitemaps/products-${i}.xml` });
  }

  return xmlResponse(renderSitemapIndex(sitemaps));
}
