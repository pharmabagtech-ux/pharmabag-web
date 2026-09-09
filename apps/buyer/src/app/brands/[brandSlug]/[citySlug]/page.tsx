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
  localBusinessSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { brandCityDefaults } from '@/lib/seo/defaults/brand';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';

/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live listing count instead of freezing the number it was written with.
 */
function brandCityTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
}
import { ALL_CITIES, TIER_1_CITIES } from '@/lib/seo/data/locations';

/**
 * Brand x city page — e.g. /brands/cipla/mumbai.
 *
 * This is the ONE cross-product that is generated, and it is deliberately
 * capped: top ~40 brands x 14 tier-1 cities, roughly 560 pages. "<Brand>
 * distributor in <city>" is a genuine, high-intent trade query, and at this
 * scale each page can still carry brand-specific range data and city-specific
 * trade context.
 *
 * The cross-product NOT built is product x city (~1.6M pages). The line is
 * drawn where pages stop being able to say anything distinct — beyond that
 * point programmatic SEO becomes scaled content abuse and endangers the whole
 * domain.
 */
export const revalidate = 86400;

const PAGE_SIZE = 24;
const MAX_BRANDS = 40;

export async function generateStaticParams() {
  const manufacturers = await fetchManufacturers();
  const top = manufacturers
    .filter((m) => m.name?.trim() && (m.productCount ?? 0) >= 50)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, MAX_BRANDS);

  return top.flatMap((m) =>
    TIER_1_CITIES.map((citySlug) => ({
      brandSlug: facetSlug(m.name),
      citySlug,
    })),
  );
}

interface PageProps {
  params: { brandSlug: string; citySlug: string };
}

async function resolve(brandSlug: string, citySlug: string) {
  // strict: an empty list here would be misread as "brand does not exist".
  const manufacturers = await fetchManufacturers(true);
  const matches = manufacturers.filter(
    (m) => m.name?.trim() && facetSlug(m.name) === brandSlug,
  );
  const brand =
    matches.length > 0
      ? matches.reduce((best, m) =>
          (m.productCount ?? 0) > (best.productCount ?? 0) ? m : best,
        )
      : undefined;
  const city = ALL_CITIES.find((c) => c.slug === citySlug);
  return { brand, city };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand, city } = await resolve(params.brandSlug, params.citySlug);
  if (!brand || !city) {
    return buildMetadata({
      title: 'Not found',
      description: 'Browse pharmaceutical brands and wholesale suppliers.',
      path: routes.brandInCity(params.brandSlug, params.citySlug),
      index: false,
    });
  }

  const path = routes.brandInCity(params.brandSlug, params.citySlug);
  const defaults = brandCityDefaults(brand, city, brand.productCount ?? 0);
  const override = await fetchPageOverride(path);
  const tokens = brandCityTokens(brand.name, brand.productCount ?? 0);

  return buildMetadata({
    title: preferOverride(override?.title, defaults.title, tokens),
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    path,
    keywords: defaults.keywords,
  });
}

export default async function BrandCityPage({ params }: PageProps) {
  const { brand, city } = await resolve(params.brandSlug, params.citySlug);
  if (!brand || !city) notFound();

  /**
   * Only tier-1 cities get brand pages. Any other city slug 404s rather than
   * rendering, which keeps the generated surface exactly as large as intended
   * even if something links to an unplanned combination.
   */
  if (!TIER_1_CITIES.includes(city.slug)) notFound();

  const { products, total } = await fetchProducts({
    manufacturer: brand.name,
    page: 1,
    limit: PAGE_SIZE,
  });

  if (total === 0) notFound();

  const path = routes.brandInCity(params.brandSlug, params.citySlug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Brands', path: routes.brands() },
    { name: brand.name, path: routes.brand(params.brandSlug) },
    { name: city.name, path },
  ];

  const defaults = brandCityDefaults(brand, city, total);
  const override = await fetchPageOverride(path);
  const tokens = brandCityTokens(brand.name, total);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

  const description = `${brand.name} pharmaceutical products available at wholesale rates to licensed buyers in ${city.name}, ${city.state.name}.`;

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    localBusinessSchema({
      city: city.name,
      state: city.state.name,
      url,
      description,
    }),
    collectionPageSchema({
      name: `${brand.name} Distributor in ${city.name}`,
      url,
      description,
      totalItems: total,
      items: products.slice(0, 24).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  const otherCities = ALL_CITIES.filter(
    (c) => TIER_1_CITIES.includes(c.slug) && c.slug !== city.slug,
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
        page={1}
        totalPages={1}
        browseHref={`${routes.products()}?manufacturer=${encodeURIComponent(brand.name)}`}
        browseLabel={`Browse all ${brand.name} products`}
        faqs={faqs}
        linkSections={[
          {
            title: `${brand.name} in other cities`,
            links: otherCities.map((c) => ({
              label: `${brand.name} distributor in ${c.name}`,
              href: routes.brandInCity(params.brandSlug, c.slug),
            })),
            columns: 3 as const,
          },
          {
            title: `Wholesale medicine supply in ${city.name}`,
            links: [
              {
                label: `All medicine suppliers in ${city.name}`,
                href: routes.city(city.state.slug, city.slug),
              },
              {
                label: `Suppliers across ${city.state.name}`,
                href: routes.state(city.state.slug),
              },
              { label: `All ${brand.name} products`, href: routes.brand(params.brandSlug) },
              { label: 'All pharmaceutical brands', href: routes.brands() },
            ],
            columns: 2 as const,
          },
        ]}
      />
    </>
  );
}
