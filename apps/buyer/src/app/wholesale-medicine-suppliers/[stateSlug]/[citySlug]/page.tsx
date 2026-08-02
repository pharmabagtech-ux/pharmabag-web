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

  return buildMetadata({
    title: `Wholesale Medicine Suppliers in ${city.name} — Bulk Distributors`,
    description: `Buy medicines in bulk in ${city.name}, ${state.name}. ${total.toLocaleString('en-IN')} products from verified wholesalers on ${SITE_NAME}, with wholesale net rates, GST invoicing and delivery across ${city.name}.`,
    path: routes.city(state.slug, city.slug),
    keywords: [
      `wholesale medicine supplier ${city.name}`,
      `medicine distributor ${city.name}`,
      `pharmaceutical wholesaler ${city.name}`,
      `bulk medicine ${city.name}`,
      `medical distributor ${city.name} ${state.name}`,
    ],
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

  const faqs = [
    {
      question: `Who supplies wholesale medicines in ${city.name}?`,
      answer: `${SITE_NAME} lists verified pharmaceutical wholesalers supplying ${city.name} and the wider ${state.name} market, with ${total.toLocaleString('en-IN')} products available at wholesale net rates. Every supplier holds a valid drug licence and GST registration.`,
    },
    {
      question: `How quickly can medicines be delivered in ${city.name}?`,
      answer: `Dispatch times depend on the supplying wholesaler and the destination. Orders to ${city.name} are shipped to the buyer's registered business address with a GST invoice, and the expected dispatch window is shown at checkout before the order is confirmed.`,
    },
    {
      question: `What licence do I need to buy wholesale medicines in ${city.name}?`,
      answer: `A valid drug licence issued by the ${state.name} drug control authority is required, along with GST registration or a PAN. ${SITE_NAME} verifies these once during onboarding, after which wholesale rates become visible and orders can be placed.`,
    },
    {
      question: `What is the minimum order value for buyers in ${city.name}?`,
      answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST, the same across India. Individual products also carry a minimum order quantity in units set by the supplying wholesaler.`,
    },
  ];

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

  const intro = `${SITE_NAME} connects pharmacies, hospitals, clinics and distributors in ${city.name} with verified pharmaceutical wholesalers across India. ${
    city.note ? `${city.note} ` : ''
  }Licensed buyers in ${city.name} can order from ${total.toLocaleString('en-IN')} products at wholesale net rates, with GST invoicing and delivery to their registered business address in ${state.name}.`;

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`Wholesale medicine suppliers in ${city.name}, ${state.name}`}
        intro={intro}
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
