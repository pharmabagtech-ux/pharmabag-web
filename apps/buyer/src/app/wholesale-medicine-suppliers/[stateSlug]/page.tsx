import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { fetchProducts, fetchCategories } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  localBusinessSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { STATES, findState } from '@/lib/seo/data/locations';
import { MOLECULES } from '@/lib/seo/data/molecules';

/**
 * State supplier page — e.g. /wholesale-medicine-suppliers/maharashtra.
 *
 * Differentiation strategy: each state page carries its own trade note, its
 * own city list and its own onward links. Without those, 24 state pages would
 * be one template with a noun swapped — which is precisely the thin-content
 * pattern that gets programmatic SEO penalised rather than rewarded.
 */
export const revalidate = 86400;

const PAGE_SIZE = 24;

export async function generateStaticParams() {
  return STATES.map((s) => ({ stateSlug: s.slug }));
}

interface PageProps {
  params: { stateSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = findState(params.stateSlug);
  if (!state) {
    return buildMetadata({
      title: 'Location not found',
      description: 'Browse wholesale medicine suppliers across India.',
      path: routes.state(params.stateSlug),
      index: false,
    });
  }

  const { total } = await fetchProducts({ page: 1, limit: 1 });

  return buildMetadata({
    title: `Wholesale Medicine Suppliers in ${state.name} — Bulk Distributors`,
    description: `Buy wholesale medicines in ${state.name} from verified suppliers on ${SITE_NAME}. ${total.toLocaleString('en-IN')} products at bulk rates, serving ${state.cities.map((c) => c.name).slice(0, 4).join(', ')} and across the state with GST invoicing.`,
    path: routes.state(state.slug),
    keywords: [
      `wholesale medicine supplier ${state.name}`,
      `pharmaceutical distributor ${state.name}`,
      `bulk medicine ${state.name}`,
      `medicine wholesaler ${state.name}`,
      ...(state.aka ? [`medicine supplier ${state.aka}`] : []),
    ],
  });
}

export default async function StatePage({ params }: PageProps) {
  const state = findState(params.stateSlug);
  if (!state) notFound();

  const [{ products, total }, categories] = await Promise.all([
    fetchProducts({ page: 1, limit: PAGE_SIZE }),
    fetchCategories(),
  ]);

  const path = routes.state(state.slug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Wholesale Medicine Suppliers', path: routes.locations() },
    { name: state.name, path },
  ];

  const faqs = [
    {
      question: `How do I buy wholesale medicines in ${state.name}?`,
      answer: `Pharmacies, hospitals and distributors in ${state.name} register on ${SITE_NAME} with a valid drug licence and GST or PAN details. Once verified, they can order from ${total.toLocaleString('en-IN')} listed products at wholesale net rates, with delivery across ${state.name} and a GST invoice on every order.`,
    },
    {
      question: `What is the minimum order for wholesale medicines in ${state.name}?`,
      answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Individual products also carry their own minimum order quantity set by the supplying wholesaler, shown on every listing.`,
    },
    {
      question: `Which cities in ${state.name} does ${SITE_NAME} serve?`,
      answer: `${SITE_NAME} delivers throughout ${state.name}, including ${state.cities.map((c) => c.name).join(', ')}. Because orders are dispatched to the buyer's registered address, any licensed buyer in the state can order regardless of city.`,
    },
    {
      question: `Do suppliers in ${state.name} provide a GST invoice?`,
      answer: `Yes. Every order placed on ${SITE_NAME} is invoiced with GST by the supplying wholesaler at the rate applicable to each product. Interstate supply is invoiced with IGST where relevant.`,
    },
  ];

  const description = `Verified wholesale medicine suppliers serving ${state.name}, with ${total.toLocaleString('en-IN')} pharmaceutical products available for bulk purchase.`;

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    localBusinessSchema({ state: state.name, url, description }),
    collectionPageSchema({
      name: `Wholesale Medicine Suppliers in ${state.name}`,
      url,
      description,
      totalItems: state.cities.length,
      items: state.cities.map((c) => ({
        name: `Wholesale medicine suppliers in ${c.name}`,
        url: absoluteUrl(routes.city(state.slug, c.slug)),
      })),
    }),
    faqSchema(faqs),
  );

  const intro = `${SITE_NAME} connects licensed pharmacies, hospitals, clinics and distributors in ${state.name} with verified pharmaceutical wholesalers across India. ${
    state.note ? `${state.note} ` : ''
  }${total.toLocaleString('en-IN')} products are available at wholesale net rates, with GST invoicing and delivery to ${state.cities
    .map((c) => c.name)
    .slice(0, 4)
    .join(', ')} and the rest of the state.`;

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`Wholesale medicine suppliers in ${state.name}`}
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
          {
            title: `Cities we serve in ${state.name}`,
            links: state.cities.map((c) => ({
              label: `Medicine suppliers in ${c.name}`,
              href: routes.city(state.slug, c.slug),
            })),
            columns: 3 as const,
          },
          {
            title: `Medicine categories supplied in ${state.name}`,
            links: categories.map((c) => ({
              label: `${c.name} medicines wholesale`,
              href: routes.category(c.slug),
            })),
          },
          {
            title: 'Popular generic molecules',
            links: MOLECULES.slice()
              .sort((a, b) => b.approxProducts - a.approxProducts)
              .slice(0, 16)
              .map((m) => ({
                label: `${m.name} suppliers`,
                href: routes.generic(m.slug),
              })),
            columns: 4 as const,
          },
          {
            title: 'Other states',
            links: STATES.filter((s) => s.slug !== state.slug)
              .slice(0, 16)
              .map((s) => ({
                label: `Suppliers in ${s.name}`,
                href: routes.state(s.slug),
              })),
            columns: 3 as const,
          },
        ]}
      />
    </>
  );
}
