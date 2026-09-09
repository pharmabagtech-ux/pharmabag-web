import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { fetchProducts, fetchCategories, fetchManufacturers } from '@/lib/seo/catalog';
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
import { ALL_CITIES, findCity } from '@/lib/seo/data/locations';
import { MOLECULES } from '@/lib/seo/data/molecules';
import { cityDefaults } from '@/lib/seo/defaults/city';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';

/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live catalogue count instead of freezing the number it was written with.
 */
function cityTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
}

/**
 * City supplier page — e.g.
 * /wholesale-medicine-suppliers/west-bengal/kolkata.
 *
 * ~90 city pages, each with its own trade note, its own sibling-city links and
 * its own category/brand cross-links. This is the deepest the location
 * hierarchy goes on purpose: crossing cities with 26,815 individual products
 * would produce roughly 1.6 million pages differing by one noun, which is
 * scaled content abuse under Google's spam policy and risks the whole domain
 * rather than just the generated pages.
 */
export const revalidate = 86400;

const PAGE_SIZE = 24;

export async function generateStaticParams() {
  return ALL_CITIES.map((c) => ({
    stateSlug: c.state.slug,
    citySlug: c.slug,
  }));
}

interface PageProps {
  params: { stateSlug: string; citySlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = findCity(params.stateSlug, params.citySlug);
  if (!found) {
    return buildMetadata({
      title: 'Location not found',
      description: 'Browse wholesale medicine suppliers across India.',
      path: routes.city(params.stateSlug, params.citySlug),
      index: false,
    });
  }
  const { state, city } = found;
  const { total } = await fetchProducts({ page: 1, limit: 1 });

  const defaults = cityDefaults(city, state, total);
  const override = await fetchPageOverride(routes.city(state.slug, city.slug));
  const tokens = cityTokens(city.name, total);

  return buildMetadata({
    title: preferOverride(override?.title, defaults.title, tokens),
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    path: routes.city(state.slug, city.slug),
    keywords: defaults.keywords,
  });
}

export default async function CityPage({ params }: PageProps) {
  const found = findCity(params.stateSlug, params.citySlug);
  if (!found) notFound();
  const { state, city } = found;

  const [{ products, total }, categories, manufacturers] = await Promise.all([
    fetchProducts({ page: 1, limit: PAGE_SIZE }),
    fetchCategories(),
    fetchManufacturers(),
  ]);

  const path = routes.city(state.slug, city.slug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Wholesale Medicine Suppliers', path: routes.locations() },
    { name: state.name, path: routes.state(state.slug) },
    { name: city.name, path },
  ];

  const defaults = cityDefaults(city, state, total);
  const override = await fetchPageOverride(path);
  const tokens = cityTokens(city.name, total);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

  const description = `Verified wholesale medicine suppliers serving ${city.name}, ${state.name}, with ${total.toLocaleString('en-IN')} pharmaceutical products for bulk purchase.`;

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    localBusinessSchema({ city: city.name, state: state.name, url, description }),
    collectionPageSchema({
      name: `Wholesale Medicine Suppliers in ${city.name}`,
      url,
      description,
      totalItems: products.length,
      items: products.slice(0, 24).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  const siblingCities = state.cities.filter((c) => c.slug !== city.slug);

  const topBrands = manufacturers
    .filter((m) => m.name?.trim() && (m.productCount ?? 0) >= 50)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 12);

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
        browseHref={routes.products()}
        browseLabel="Browse the full catalogue"
        faqs={faqs}
        linkSections={[
          ...(siblingCities.length
            ? [
                {
                  title: `Other cities in ${state.name}`,
                  links: siblingCities.map((c) => ({
                    label: `Medicine suppliers in ${c.name}`,
                    href: routes.city(state.slug, c.slug),
                  })),
                  columns: 3 as const,
                },
              ]
            : []),
          {
            title: `Medicine categories supplied in ${city.name}`,
            links: categories.map((c) => ({
              label: `${c.name} medicines wholesale`,
              href: routes.category(c.slug),
            })),
          },
          {
            title: `Brand distributors serving ${city.name}`,
            links: topBrands.map((m) => ({
              label: `${m.name} distributor in ${city.name}`,
              href: routes.brandInCity(facetSlug(m.name), city.slug),
            })),
            columns: 3 as const,
          },
          {
            title: 'Popular generic molecules',
            links: MOLECULES.slice()
              .sort((a, b) => b.approxProducts - a.approxProducts)
              .slice(0, 12)
              .map((m) => ({
                label: `${m.name} suppliers`,
                href: routes.generic(m.slug),
              })),
            columns: 4 as const,
          },
        ]}
      />
    </>
  );
}
