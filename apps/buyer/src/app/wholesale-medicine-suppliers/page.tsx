import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid, FaqList } from '@/components/seo/SeoContent';
import { fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME } from '@/lib/seo/config';
import { STATES, ALL_CITIES } from '@/lib/seo/data/locations';

/**
 * Location hub for state and city supplier pages.
 *
 * The URL is `/wholesale-medicine-suppliers` rather than `/locations` on
 * purpose: the path itself is a ranking signal for the head term, and it
 * reads as a promise the page actually keeps.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Wholesale Medicine Suppliers', path: routes.locations() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Wholesale Medicine Suppliers in India',
    description: `Find verified wholesale medicine suppliers and pharmaceutical distributors across ${STATES.length} Indian states and ${ALL_CITIES.length} cities on ${SITE_NAME}. Bulk rates, GST invoicing and pan-India delivery.`,
    path: routes.locations(),
    keywords: [
      'wholesale medicine suppliers India',
      'pharmaceutical distributors India',
      'medicine wholesaler near me',
      'bulk medicine supplier state wise',
      'pharma distributor city wise',
    ],
  });
}

export default async function LocationsPage() {
  const { total } = await fetchProducts({ page: 1, limit: 1 });
  const url = absoluteUrl(routes.locations());

  const faqs = [
    {
      question: `Which states does ${SITE_NAME} deliver wholesale medicines to?`,
      answer: `${SITE_NAME} supplies wholesale medicines across all Indian states and union territories. Dedicated supplier pages are available for ${STATES.length} states and ${ALL_CITIES.length} major pharmaceutical trading cities, covering the full catalogue of ${total.toLocaleString('en-IN')} products.`,
    },
    {
      question: 'Do I need a local supplier in my city to order?',
      answer: `No. ${SITE_NAME} is an online B2B marketplace, so a pharmacy or hospital anywhere in India can order from any verified supplier on the platform. Orders are dispatched to the buyer's registered address with a GST invoice, regardless of which state the supplier operates from.`,
    },
    {
      question: 'How are suppliers verified?',
      answer: `Every supplier on ${SITE_NAME} completes verification with a valid drug licence and either GST registration or PAN before being permitted to list products. Verification is checked against government records through an authorised verification provider.`,
    },
    {
      question: 'Is interstate supply of medicines allowed?',
      answer:
        'Yes. Licensed wholesalers in India may supply across state borders provided the buyer holds a valid drug licence and the transaction is invoiced with the applicable IGST. PharmaBag records both parties’ licence details on every order.',
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    collectionPageSchema({
      name: 'Wholesale Medicine Suppliers in India',
      url,
      description: `State and city coverage for wholesale medicine supply on ${SITE_NAME}.`,
      totalItems: STATES.length,
      items: STATES.map((s) => ({
        name: `Wholesale medicine suppliers in ${s.name}`,
        url: absoluteUrl(routes.state(s.slug)),
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
            Wholesale medicine suppliers in India
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} connects retail pharmacies, hospitals, clinics and
            distributors with verified pharmaceutical wholesalers across India.
            The catalogue of {total.toLocaleString('en-IN')} products is
            available to licensed buyers in every state, with GST invoicing and
            pan-India dispatch. Select a state or city below for local supply
            details.
          </p>
        </header>

        <SeoSection title="Wholesale medicine suppliers by state">
          <LinkGrid
            links={STATES.map((s) => ({
              label: s.name,
              href: routes.state(s.slug),
              meta: `${s.cities.length} cities`,
            }))}
          />
        </SeoSection>

        <SeoSection title="Major pharmaceutical trading cities">
          <LinkGrid
            links={ALL_CITIES.map((c) => ({
              label: `${c.name}, ${c.state.name}`,
              href: routes.city(c.state.slug, c.slug),
            }))}
            columns={3}
          />
        </SeoSection>

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>
      </main>
    </>
  );
}
