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
import { SITE_NAME, SITE_LEGAL_NAME, CONTACT } from '@/lib/seo/config';

/**
 * Return policy.
 *
 * Deliberately narrow, and the reason is regulatory rather than commercial:
 * under the Drugs and Cosmetics Rules a medicine that has left the licensed
 * supply chain cannot be put back into it, so a returned pack cannot lawfully
 * be resold. A generous no-fault return window would therefore be a promise
 * to destroy stock, not a customer-service feature.
 *
 * Scope confirmed with the owner 2026-09-01: damaged, wrong, short-supplied
 * or expiry-compromised goods only, reported within 48 hours of delivery.
 * Nothing here promises a timeline the platform cannot control — collection is
 * arranged by the supplying wholesaler.
 */
export const revalidate = 86400;

/** Hours a buyer has to report a return-worthy problem after delivery. */
const REPORT_WINDOW_HOURS = 48;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Return Policy', path: routes.returns() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Return Policy',
    description: `How returns work on ${SITE_NAME}: damaged, wrong, short-supplied or expiry-compromised wholesale medicine orders can be reported within ${REPORT_WINDOW_HOURS} hours of delivery. Read the conditions and the process.`,
    path: routes.returns(),
    keywords: [
      'PharmaBag return policy',
      'wholesale medicine return',
      'damaged pharma consignment',
      'B2B medicine returns India',
    ],
  });
}

export default function ReturnsPage() {
  const url = absoluteUrl(routes.returns());

  const faqs = [
    {
      question: 'Can I return medicines I simply no longer need?',
      answer: `No. Once a consignment has been dispatched it has left the licensed supply chain, and under the Drugs and Cosmetics Rules it cannot lawfully be returned to saleable stock. Returns on ${SITE_NAME} are limited to goods that arrive damaged, wrong, short-supplied or with an unacceptable expiry date.`,
    },
    {
      question: 'How long do I have to report a problem?',
      answer: `${REPORT_WINDOW_HOURS} hours from delivery. Check every consignment against the invoice on arrival and raise a ticket from the order in your ${SITE_NAME} account, or email ${CONTACT.email} with the order reference. Reports made after ${REPORT_WINDOW_HOURS} hours cannot be verified against the condition in which the goods were delivered.`,
    },
    {
      question: 'What do I need to provide?',
      answer: `The order reference, a description of the problem, and photographs of the outer packaging, the product packs and the batch and expiry details. For a short supply, a photograph of the opened carton as received. Claims without evidence cannot be assessed, because the supplying wholesaler has to be shown what arrived.`,
    },
    {
      question: 'Who collects the goods, and who pays?',
      answer: `Collection is arranged by the supplying wholesaler named on your invoice. Where the fault is the supplier's — damage in transit, a wrong or short supply, or an unacceptable expiry — the buyer bears no return cost. Where goods are returned for any other agreed reason, return freight is the buyer's.`,
    },
    {
      question: 'What happens after a return is approved?',
      answer: `You are issued either a replacement or a refund. Refunds follow the ${SITE_NAME} refund policy: the original payment method, within 7 to 10 working days of approval.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: 'Return Policy',
      url,
      description: `Return conditions and process for wholesale medicine orders placed on ${SITE_NAME}.`,
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
            Return policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} is a brand of {SITE_LEGAL_NAME}. This policy applies to
            every wholesale order placed on {SITE_NAME}, whether the goods are
            supplied by {SITE_LEGAL_NAME} or by an independent wholesaler
            listing on the platform. The seller of record for your order is
            named on your GST invoice.
          </p>
        </header>

        <SeoSection id="when" title="When goods can be returned">
          <p>
            Medicines are returnable only where something is wrong with what was
            delivered. A return may be raised when the goods arrive:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>damaged, leaking, or with the primary packaging compromised;</li>
            <li>
              different from what was ordered — a different product, strength,
              pack size or manufacturer;
            </li>
            <li>short-supplied against the quantity on the invoice;</li>
            <li>
              expired, or with so little shelf life remaining that the stock
              cannot reasonably be sold on;
            </li>
            <li>
              subject to a manufacturer or regulatory recall affecting the batch
              supplied.
            </li>
          </ul>
        </SeoSection>

        <SeoSection id="not-returnable" title="What cannot be returned">
          <p>
            Once a consignment has been dispatched it has left the licensed
            supply chain, and a medicine that has been out of that chain cannot
            lawfully be returned to saleable stock. That is a legal constraint
            on every party in the trade, not a commercial preference, so the
            following are not returnable:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              goods ordered in error, over-ordered, or no longer required;
            </li>
            <li>
              goods whose packaging has been opened, marked, relabelled or
              defaced after delivery;
            </li>
            <li>
              cold-chain items once they have left the delivery vehicle, where
              storage conditions can no longer be established;
            </li>
            <li>
              goods reported more than {REPORT_WINDOW_HOURS} hours after
              delivery.
            </li>
          </ul>
        </SeoSection>

        <SeoSection id="how" title="How to raise a return">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Check the consignment against the invoice on arrival, before
              putting stock away.
            </li>
            <li>
              Within {REPORT_WINDOW_HOURS} hours, raise a ticket from the order
              in your {SITE_NAME} account, or email {CONTACT.email} quoting the
              order reference.
            </li>
            <li>
              Attach photographs of the outer packaging, the affected packs, and
              the batch and expiry details.
            </li>
            <li>
              Keep the goods in the condition they arrived in until the return
              is assessed. Do not return anything before it has been approved —
              unapproved returns cannot be traced to an order.
            </li>
            <li>
              Once approved, the supplying wholesaler arranges collection and
              you receive a replacement or a refund.
            </li>
          </ol>
        </SeoSection>

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>

        <SeoSection title="Related pages">
          <LinkGrid
            links={[
              { label: 'Refund Policy', href: routes.refunds() },
              { label: 'Shipping & Delivery Policy', href: routes.shipping() },
              { label: 'Terms & Conditions', href: routes.terms() },
              { label: 'Contact Us', href: routes.contact() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
