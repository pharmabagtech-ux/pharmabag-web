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
 * Refund policy.
 *
 * Terms confirmed with the owner 2026-09-01: refunds go back to the original
 * payment method within 7-10 working days of approval, with a credit note
 * offered only as an alternative the buyer can choose.
 *
 * Deliberately states working days rather than calendar days, and says the
 * clock starts at APPROVAL rather than at the request — those are the two
 * things buyers dispute, and a policy that is vague about them creates the
 * argument it was meant to prevent.
 */
export const revalidate = 86400;

const REFUND_DAYS = '7 to 10 working days';

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Refund Policy', path: routes.refunds() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Refund Policy',
    description: `How refunds work on ${SITE_NAME}: approved refunds are returned to the original payment method within ${REFUND_DAYS}, with cancellation, part-supply and failed-payment cases explained.`,
    path: routes.refunds(),
    keywords: [
      'PharmaBag refund policy',
      'wholesale medicine refund',
      'B2B pharma order cancellation',
      'refund timeline India',
    ],
  });
}

export default function RefundsPage() {
  const url = absoluteUrl(routes.refunds());

  const faqs = [
    {
      question: 'How long does a refund take?',
      answer: `Approved refunds are returned to the original payment method within ${REFUND_DAYS}. The clock starts when the refund is approved, not when it is requested — for a return, approval follows inspection of the goods by the supplying wholesaler.`,
    },
    {
      question: 'Where is the money returned to?',
      answer: `To the account or instrument the payment came from. Refunds are not paid to a different account, because the payment trail has to match for both parties' GST records. If you would rather hold the value against future orders, a credit note can be issued instead — but only if you ask for one.`,
    },
    {
      question: 'Can I cancel an order after placing it?',
      answer: `An order can be cancelled without charge at any point before the supplying wholesaler dispatches it, from the order in your ${SITE_NAME} account. Once a consignment has been dispatched it cannot be cancelled, and the return policy applies instead.`,
    },
    {
      question: 'What if only part of my order is supplied?',
      answer: `You are charged for what is supplied. Where a line is short-supplied or unavailable, the difference is refunded to the original payment method on the same ${REFUND_DAYS} basis, and your GST invoice reflects the quantity actually delivered.`,
    },
    {
      question: 'My payment failed but money left my account. What happens?',
      answer: `Failed and duplicate payments are reversed by the payment provider, usually within ${REFUND_DAYS}, and no action is needed from you. If it has not appeared after that, email ${CONTACT.email} with the order reference and the payment reference and it will be traced.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: 'Refund Policy',
      url,
      description: `Refund terms, timelines and cancellation rules for orders placed on ${SITE_NAME}.`,
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
            Refund policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} is a brand of {SITE_LEGAL_NAME}. This policy covers when
            money is returned on a {SITE_NAME} order, how it is returned and how
            long it takes. It applies whether the goods were supplied by{' '}
            {SITE_LEGAL_NAME} or by an independent wholesaler listing on the
            platform.
          </p>
        </header>

        <SeoSection id="when" title="When a refund is due">
          <p>A refund is issued in these situations:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              an approved return, where a replacement is not wanted or not
              available;
            </li>
            <li>
              an order cancelled before the supplying wholesaler dispatched it;
            </li>
            <li>
              a line that could not be supplied, in full or in part, after the
              order was placed;
            </li>
            <li>a duplicate or failed payment;</li>
            <li>
              an order the supplying wholesaler is unable to fulfil for any
              other reason.
            </li>
          </ul>
        </SeoSection>

        <SeoSection id="how" title="How refunds are paid">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Method.</strong> Back to the original payment instrument.
              Refunds are not redirected to a different account — the payment
              trail has to match for both parties&apos; GST records.
            </li>
            <li>
              <strong>Timeline.</strong> Within {REFUND_DAYS} of approval. For a
              return, approval follows inspection of the goods; for a
              cancellation, it is immediate.
            </li>
            <li>
              <strong>Amount.</strong> The value of the goods refunded,
              including the GST charged on them. Where delivery was charged
              separately and the whole order is cancelled before dispatch, the
              delivery charge is refunded too.
            </li>
            <li>
              <strong>Credit note.</strong> Available instead of a refund if you
              prefer to hold the value against future orders — issued only on
              request, never by default.
            </li>
          </ul>
        </SeoSection>

        <SeoSection id="disputes" title="If something goes wrong">
          <p>
            If a refund has not arrived within {REFUND_DAYS} of approval, email{' '}
            {CONTACT.email} or call {CONTACT.telephone} with the order reference
            and the payment reference. Complaints are acknowledged within 48
            hours and worked to resolution; where a bank or payment provider is
            still holding the money, you will be given the reference needed to
            trace it at their end.
          </p>
        </SeoSection>

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>

        <SeoSection title="Related pages">
          <LinkGrid
            links={[
              { label: 'Return Policy', href: routes.returns() },
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
