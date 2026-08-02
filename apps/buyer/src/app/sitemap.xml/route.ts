import { renderSitemapIndex, xmlResponse, PRODUCTS_PER_SITEMAP } from '@/lib/seo/sitemap';
import { fetchProducts, fetchManufacturers } from '@/lib/seo/catalog';

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
  const now = new Date();

  // One 1-item request purely to read `meta.total` and size the chunk list.
  const [{ total }, manufacturers] = await Promise.all([
    fetchProducts({ page: 1, limit: 1 }),
    fetchManufacturers(),
  ]);

  const productChunks = Math.max(
    1,
    Math.ceil((total || 0) / PRODUCTS_PER_SITEMAP),
  );

  const sitemaps: { path: string; lastModified?: Date }[] = [
    { path: '/sitemaps/static.xml', lastModified: now },
    { path: '/sitemaps/categories.xml', lastModified: now },
    { path: '/sitemaps/generics.xml', lastModified: now },
    { path: '/sitemaps/locations.xml', lastModified: now },
    { path: '/sitemaps/blogs.xml', lastModified: now },
  ];

  if (manufacturers.length > 0) {
    sitemaps.push({ path: '/sitemaps/brands.xml', lastModified: now });
  }

  for (let i = 0; i < productChunks; i++) {
    sitemaps.push({ path: `/sitemaps/products-${i}.xml`, lastModified: now });
  }

  return xmlResponse(renderSitemapIndex(sitemaps));
}
