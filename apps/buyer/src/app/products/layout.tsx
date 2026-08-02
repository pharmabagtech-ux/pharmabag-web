import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes } from '@/lib/seo/url';
import { SITE_NAME, CATALOGUE_SIZE_APPROX } from '@/lib/seo/config';

/**
 * Catalogue listing metadata.
 *
 * The listing page is a client component driven by search params
 * (`?search=`, `?category=`, `?sort=`), so it cannot export metadata itself.
 *
 * The canonical here deliberately points at the bare `/products` URL for every
 * filtered variant. Those variants are effectively infinite — each
 * search/sort/filter permutation is a distinct URL over the same 26,000 rows —
 * and letting them self-canonicalise would flood the index with
 * near-duplicates and drain crawl budget away from the product pages.
 *
 * Filtered *content* is not lost as a result: the crawlable equivalents live
 * at /categories/*, /brands/* and /generics/*, which are real pages with their
 * own copy rather than a query string over a grid. `robots.ts` also disallows
 * the `sort=` and `view=` parameter patterns for the same reason.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Wholesale Medicines Online — Bulk Price List & Suppliers',
  description: `Browse ${CATALOGUE_SIZE_APPROX.toLocaleString('en-IN')}+ medicines available at wholesale rates on ${SITE_NAME}. Compare bulk prices from verified Indian suppliers, check MOQ and GST, and order online with pan-India delivery.`,
  path: routes.products(),
  keywords: [
    'wholesale medicines online',
    'bulk medicine price list',
    'medicine wholesale rate',
    'pharmaceutical wholesaler India',
    'buy medicines in bulk',
  ],
});

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
