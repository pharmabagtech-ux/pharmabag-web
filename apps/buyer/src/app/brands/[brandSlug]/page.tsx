import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { fetchManufacturers, fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl, facetSlug } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  prune,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { STATES, TIER_1_CITIES, ALL_CITIES } from '@/lib/seo/data/locations';

/**
 * Brand landing page — e.g. /brands/cipla.
 *
 * Resolves the slug back to the manufacturer's own spelling from the API
 * rather than guessing at capitalisation, so the page can address the brand
 * exactly as the trade writes it. This matters for entity matching: "Sun
 * Pharmaceutical Ltd." and "sun-pharma" must resolve to one page, not two.
 */

const PAGE_SIZE = 48;
const MIN_PRODUCTS = 5;

/**
 * Dynamic, not pre-built — this page reads `searchParams` for pagination.
 * See the note in `categories/[categorySlug]/page.tsx`: pairing
 * `generateStaticParams` with `searchParams` drops the route from the
 * prerender manifest and makes every brand URL 404.
 *
 * No page-level `revalidate` export: `dynamic = 'force-dynamic'` below
 * overrides it anyway. Freshness is handled at the fetch layer instead --
 * `lib/seo/catalog.ts` caches catalogue reads for a day, so the API is not
 * re-queried on every crawl.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { brandSlug: string };
  searchParams: { page?: string };
}

/**
 * Slug -> manufacturer.
 *
 * The catalogue holds several spellings of the same company (a known data
 * issue in this DB — "Cadila" vs "Cadila Healthcare Ltd"). Matching on the
 * slug and preferring the entry with the most products keeps one canonical
 * page per brand instead of splitting authority across near-duplicates.
 */
async function resolveBrand(brandSlug: string) {
  const manufacturers = await fetchManufacturers();
  const matches = manufacturers.filter(
    (m) => m.name?.trim() && facetSlug(m.name) === brandSlug,
  );
  if (matches.length === 0) return { manufacturers, brand: undefined };
  const brand = matches.reduce((best, m) =>
    (m.productCount ?? 0) > (best.productCount ?? 0) ? m : best,
  );
  return { manufacturers, brand };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { brand } = await resolveBrand(params.brandSlug);
  if (!brand) {
    return buildMetadata({
      title: 'Brand not found',
      description: 'Browse all pharmaceutical brands supplied at wholesale.',
      path: routes.brand(params.brandSlug),
      index: false,
    });
  }

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const path = routes.brand(params.brandSlug);

  return buildMetadata({
    title: `${brand.name} Products — Wholesale Price List & Distributor${page > 1 ? ` — Page ${page}` : ''}`,
    description: `Buy ${brand.name} medicines at wholesale rates on ${SITE_NAME}. ${(brand.productCount ?? 0).toLocaleString('en-IN')} products from verified distributors, with net rates, MOQ, GST invoicing and pan-India delivery.`,
    path: page > 1 ? `${path}?page=${page}` : path,
    keywords: [
      `${brand.name} wholesale`,
      `${brand.name} distributor`,
      `${brand.name} price list`,
      `${brand.name} bulk supplier India`,
      `${brand.name} products`,
    ],
  });
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { manufacturers, brand } = await resolveBrand(params.brandSlug);
  if (!brand) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { products, total, totalPages } = await fetchProducts({
    manufacturer: brand.name,
    page,
    limit: PAGE_SIZE,
  });

  if (total === 0) notFound();

  const path = routes.brand(params.brandSlug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Brands', path: routes.brands() },
    { name: brand.name, path },
  ];

  /** Dosage-form spread, used to describe the range factually. */
  const formCounts = new Map<string, number>();
  for (const p of products) {
    const f = p.subCategory?.name;
    if (f) formCounts.set(f, (formCounts.get(f) ?? 0) + 1);
  }
  const forms = Array.from(formCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const faqs = [
    {
      question: `How many ${brand.name} products are available at wholesale on ${SITE_NAME}?`,
      answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${brand.name} products from verified wholesale suppliers${
        forms.length ? `, covering dosage forms such as ${forms.slice(0, 4).join(', ').toLowerCase()}` : ''
      }. Each listing shows the supplier's wholesale net rate and minimum order quantity.`,
    },
    {
      question: `How do I become a ${brand.name} distributor or buy in bulk?`,
      answer: `${SITE_NAME} is a B2B marketplace, so ${brand.name} products are bought from verified wholesale suppliers rather than through a direct distributorship. Register as a buyer with a valid drug licence and GST or PAN details to see wholesale rates and place bulk orders.`,
    },
    {
      question: `What is the minimum order value for ${brand.name} products?`,
      answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Individual ${brand.name} listings also carry their own minimum order quantity in units, shown on the product page.`,
    },
    {
      question: `Are ${brand.name} products genuine and licence-verified?`,
      answer: `Every supplier listing ${brand.name} products on ${SITE_NAME} is verified with a valid drug licence and GST registration before being permitted to sell. Orders are invoiced with GST by the supplying wholesaler.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    /**
     * A Brand node so the page is understood as being *about* the company,
     * not merely a list that happens to mention it.
     */
    prune({
      '@type': 'Brand',
      '@id': `${url}#brand`,
      name: brand.name,
      url,
      description: `${brand.name} pharmaceutical products available at wholesale rates on ${SITE_NAME}.`,
    }),
    collectionPageSchema({
      name: `${brand.name} — Wholesale Product Range`,
      url,
      description: `${brand.name} products available for bulk purchase on ${SITE_NAME}.`,
      totalItems: total,
      items: products.slice(0, 40).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  const otherBrands = manufacturers
    .filter(
      (m) =>
        m.name?.trim() &&
        facetSlug(m.name) !== params.brandSlug &&
        (m.productCount ?? 0) >= MIN_PRODUCTS,
    )
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 16);

  const cityLinks = ALL_CITIES.filter((c) => TIER_1_CITIES.includes(c.slug)).map(
    (c) => ({
      label: `${brand.name} distributor in ${c.name}`,
      href: routes.brandInCity(params.brandSlug, c.slug),
    }),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`${brand.name} — wholesale price list and bulk supply`}
        intro={`${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${brand.name} products available for wholesale and bulk purchase across India${
          forms.length
            ? `, spanning ${forms.slice(0, 4).join(', ').toLowerCase()} and other dosage forms`
            : ''
        }. Rates are set by verified wholesale suppliers holding valid drug licences, shown as net rates exclusive of GST, with the minimum order quantity stated on every listing.`}
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={path}
        page={page}
        totalPages={totalPages}
        browseHref={`${routes.products()}?manufacturer=${encodeURIComponent(brand.name)}`}
        browseLabel={`Browse ${brand.name} in the catalogue`}
        faqs={faqs}
        linkSections={[
          {
            title: `${brand.name} suppliers by city`,
            links: cityLinks,
            columns: 3 as const,
          },
          {
            title: 'Other pharmaceutical brands',
            links: otherBrands.map((m) => ({
              label: m.name,
              href: routes.brand(facetSlug(m.name)),
              meta: m.productCount ? `${m.productCount}` : undefined,
            })),
          },
          {
            title: 'Browse suppliers by state',
            links: STATES.slice(0, 12).map((s) => ({
              label: `Medicine suppliers in ${s.name}`,
              href: routes.state(s.slug),
            })),
            columns: 3 as const,
          },
        ]}
      />
    </>
  );
}
