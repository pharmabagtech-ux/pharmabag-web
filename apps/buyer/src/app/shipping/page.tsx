import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import {
  Breadcrumbs,
  SeoSection,
  LinkGrid,
  FaqList,
} from '@/components/seo/SeoContent';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import { graph, breadcrumbSchema, webPageSchema, faqSchema } from '@/lib/seo/schema';
import { SITE_NAME, CONTACT, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';

/**
 * Shipping & delivery policy.
 *
 * One of the three policy pages the footer deliberately omitted while they
 * did not exist (see Footer.tsx). Everything stated is how the platform
 * actually works today — supplier-dispatched fulfilment, GST invoicing by
 * the supplying wholesaler, per-line minimums — with no invented delivery
 * promises (no "48-hour delivery" style claims the platform cannot enforce).
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Shipping & Delivery', path: routes.shipping() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Shipping & Delivery Policy',
    description: `How ${SITE_NAME} orders are dispatched and delivered: supplier-shipped wholesale medicine orders across India, GST invoicing, order tracking and delivery expectations for licensed business buyers.`,
    path: routes.shipping(),
    keywords: [
      'PharmaBag shipping policy',
      'wholesale medicine delivery India',
      'B2B pharma order delivery',
    ],
  });
}

export default function ShippingPage() {
  const url = absoluteUrl(routes.shipping());

  const faqs = [
    {
      question: 'Who ships my order?',
      answer: `Orders are dispatched by the supplying wholesaler for each order line. ${SITE_NAME} coordinates the order and keeps the status visible in your account, but the seller of record — named on your GST invoice — is the wholesaler who supplies the goods.`,
    },
    {
      question: 'Where does PharmaBag deliver?',
      answer: `Suppliers dispatch across India, to the buyer's registered business address. Because ordering is online, a buyer is not restricted to wholesalers in their own city or state.`,
    },
    {
      question: 'How long does delivery take?',
      answer: `Delivery time depends on the supplying wholesaler's location and the destination. Dispatch and delivery progress is shown against the order in your ${SITE_NAME} account; for a delay on a specific order, raise a ticket from the order or email ${CONTACT.email} with the order reference.`,
    },
    {
      question: 'Is there a minimum order?',
      answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST, and every listing carries its own minimum order quantity set by the supplying wholesaler.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: `${SITE_NAME} Shipping & Delivery Policy`,
      url,
      description: `How ${SITE_NAME} wholesale medicine orders are dispatched, tracked and delivered across India.`,
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
            Shipping &amp; Delivery Policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} is a B2B marketplace: orders are supplied and dispatched
            by verified pharmaceutical wholesalers to licensed business buyers.
            This page explains how dispatch, delivery and invoicing work.
          </p>
        </header>

        <SeoSection id="dispatch" title="Dispatch and fulfilment">
          <p>
            When an order is confirmed, each order line is fulfilled by the
            wholesaler supplying that product. The wholesaler packs and
            dispatches the goods to the delivery address on the order — the
            buyer&apos;s registered business address. Orders containing products
            from more than one wholesaler may arrive as separate consignments,
            each invoiced by its own supplier.
          </p>
        </SeoSection>

        <SeoSection id="coverage" title="Delivery coverage">
          <p>
            Suppliers on {SITE_NAME} dispatch across India. Delivery time varies
            with the supplying wholesaler&apos;s location, the destination and
            the courier used; the order view in your account shows the current
            status of every order from confirmation through delivery.
          </p>
        </SeoSection>

        <SeoSection id="invoicing" title="Invoicing">
          <p>
            Every order is invoiced with GST by the supplying wholesaler at the
            rate applicable to each product, with IGST applied to interstate
            supply where relevant. The invoice accompanies the consignment and
            is also available against the order in your account.
          </p>
        </SeoSection>

        <SeoSection id="issues" title="Damaged, short or incorrect deliveries">
          <p>
            Check consignments on receipt. If a delivery arrives damaged, short
            or different from what was ordered, raise a ticket from the order in
            your {SITE_NAME} account as soon as possible, or email{' '}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>{' '}
            with the order reference and photos where relevant. Pharmaceutical
            products are regulated goods, so resolution routes depend on the
            issue and the supplying wholesaler&apos;s confirmation.
          </p>
        </SeoSection>

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>

        <SeoSection title="Related pages">
          <LinkGrid
            links={[
              { label: 'Buyer FAQ', href: routes.faq() },
              { label: 'Terms of Use', href: routes.terms() },
              { label: 'Privacy Policy', href: routes.privacy() },
              { label: `Contact ${SITE_NAME}`, href: routes.contact() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
