import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid, FaqList } from '@/components/seo/SeoContent';
import { fetchManufacturers, fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl, facetSlug } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME } from '@/lib/seo/config';

/**
 * Brand / manufacturer hub.
 *
 * "<Brand> distributor" and "<Brand> wholesale price" are among the highest
 * commercial-intent queries in pharma trade. None of them could be served
 * before, because manufacturers existed only as a client-side filter with no
 * URL of their own.
 */
export const revalidate = 86400;

/** Below this, a brand page would be too thin to justify indexing. */
const MIN_PRODUCTS = 5;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Brands', path: routes.brands() },
];

export async function generateMetadata(): Promise<Metadata> {
  const manufacturers = await fetchManufacturers();
  const count = manufacturers.filter(
    (m) => (m.productCount ?? 0) >= MIN_PRODUCTS,
  ).length;

  return buildMetadata({
    title: 'Pharmaceutical Brands & Manufacturers — Wholesale Suppliers',
    description: `Browse ${count}+ pharmaceutical brands and manufacturers supplied at wholesale on ${SITE_NAME}, including Cipla, Sun Pharma, Mankind, Lupin, Abbott, Torrent and Intas. Compare bulk rates and order with GST invoicing.`,
    path: routes.brands(),
    keywords: [
      'pharmaceutical brands India',
      'medicine manufacturers wholesale',
      'pharma company distributor',
      'Cipla wholesale',
      'Sun Pharma distributor',
      'Mankind wholesale supplier',
    ],
  });
}

export default async function BrandsPage() {
  const [manufacturers, { total }] = await Promise.all([
    fetchManufacturers(),
    fetchProducts({ page: 1, limit: 1 }),
  ]);

  const eligible = manufacturers
    .filter((m) => (m.productCount ?? 0) >= MIN_PRODUCTS && m.name?.trim())
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));

  const top = eligible.slice(0, 60);
  const rest = eligible.slice(60);

  const url = absoluteUrl(routes.brands());

  const faqs = [
    {
      question: `Which pharmaceutical brands are available on ${SITE_NAME}?`,
      answer: `${SITE_NAME} lists products from ${eligible.length} pharmaceutical manufacturers and marketers, including ${top
        .slice(0, 8)
        .map((m) => m.name)
        .join(', ')}, across a catalogue of ${total.toLocaleString('en-IN')} products.`,
    },
    {
      question: 'Are these products sourced directly from the manufacturer?',
      answer: `Products on ${SITE_NAME} are supplied by licensed wholesale distributors and stockists rather than sold directly by the manufacturers. Every supplier is verified with a valid drug licence and GST registration before being allowed to list.`,
    },
    {
      question: 'Can I compare prices for the same brand across suppliers?',
      answer: `Yes. Where more than one verified supplier lists the same product, ${SITE_NAME} shows each seller's wholesale net rate, minimum order quantity and available stock on the product page so buyers can compare before ordering.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    collectionPageSchema({
      name: 'Pharmaceutical Brands & Manufacturers',
      url,
      description: `Pharmaceutical brands supplied at wholesale on ${SITE_NAME}.`,
      totalItems: eligible.length,
      items: top.map((m) => ({
        name: m.name,
        url: absoluteUrl(routes.brand(facetSlug(m.name))),
      })),
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Pharmaceutical brands and manufacturers
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} carries products from {eligible.length} pharmaceutical
            companies across a catalogue of {total.toLocaleString('en-IN')}{' '}
            items. Select a brand to see its full range, current wholesale net
            rates and the verified suppliers stocking it.
          </p>
        </header>

        <SeoSection title="Leading pharmaceutical brands">
          <LinkGrid
            links={top.map((m) => ({
              label: m.name,
              href: routes.brand(facetSlug(m.name)),
              meta: m.productCount ? `${m.productCount}` : undefined,
            }))}
          />
        </SeoSection>

        {rest.length > 0 ? (
          <SeoSection title="All other brands">
            <LinkGrid
              links={rest.map((m) => ({
                label: m.name,
                href: routes.brand(facetSlug(m.name)),
                meta: m.productCount ? `${m.productCount}` : undefined,
              }))}
            />
          </SeoSection>
        ) : null}

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>
      </main>
    </>
  );
}
