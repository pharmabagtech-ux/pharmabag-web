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
import { brandDefaults } from '@/lib/seo/defaults/brand';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';
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
/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live product count instead of freezing the number it was written with.
 */
function brandTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
}

async function resolveBrand(brandSlug: string) {
  // strict: an empty list here would be misread as "brand does not exist".
  const manufacturers = await fetchManufacturers(true);
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
  /*
    Head-only: the product list is not fetched here, so the dosage-form spread
    the intro uses is unavailable and unnecessary — title and description quote
    the manufacturer's own count.
  */
  const defaults = brandDefaults(brand, brand.productCount ?? 0, []);
  const override = await fetchPageOverride(path);
  const tokens = brandTokens(brand.name, brand.productCount ?? 0);

  return buildMetadata({
    title: `${preferOverride(override?.title, defaults.title, tokens)}${page > 1 ? ` — Page ${page}` : ''}`,
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    path: page > 1 ? `${path}?page=${page}` : path,
    keywords: defaults.keywords,
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
  // Matches the canonical: on page 2+ this node describes THAT page, not
  // page 1. They disagreed before, so the schema claimed every paginated
  // view was the first one.
  const url = absoluteUrl(page > 1 ? `${path}?page=${page}` : path);

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

  const defaults = brandDefaults(brand, total, forms);
  const override = await fetchPageOverride(path);
  const tokens = brandTokens(brand.name, total);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

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
        heading={preferOverride(override?.h1, defaults.h1, tokens)}
        intro={preferOverride(override?.intro, defaults.intro, tokens)}
        body={
          override?.bodyHtml?.trim() ? (
            <div
              className="prose prose-slate max-w-3xl py-4"
              dangerouslySetInnerHTML={{
                __html: applyTokens(override.bodyHtml, tokens),
              }}
            />
          ) : undefined
        }
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
