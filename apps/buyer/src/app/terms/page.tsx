import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid } from '@/components/seo/SeoContent';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import { graph, breadcrumbSchema, webPageSchema } from '@/lib/seo/schema';
import { SITE_NAME, SITE_LEGAL_NAME, CONTACT, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';

/**
 * Terms of use.
 *
 * States the marketplace's real operating rules — licensed-business-only
 * trading, the wholesaler as seller of record, per-line minimums — in plain
 * language. Deliberately avoids fabricated legal specifics (no invented
 * arbitration seats or jurisdiction clauses).
 *
 * ⚠️ Written from the platform's real behaviour; have it reviewed by counsel
 * before treating it as the definitive legal document.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Terms of Use', path: routes.terms() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Terms of Use',
    description: `The terms on which licensed pharmacies, hospitals and distributors buy, and verified wholesalers sell, on ${SITE_NAME} — India's B2B pharmaceutical wholesale marketplace.`,
    path: routes.terms(),
    keywords: ['PharmaBag terms of use'],
  });
}

export default function TermsPage() {
  const url = absoluteUrl(routes.terms());

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: `${SITE_NAME} Terms of Use`,
      url,
      description: `The terms governing use of the ${SITE_NAME} B2B pharmaceutical marketplace.`,
    }),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Terms of Use
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            These terms govern the use of {SITE_NAME}, a B2B pharmaceutical
            wholesale marketplace operated by {SITE_LEGAL_NAME}. Using the
            platform, browsing the catalogue or placing an order means you
            accept them.
          </p>
        </header>

        {/*
          This previously said the seller of record is "not PharmaBag" for
          EVERY order line. That is not accurate: PharmaBag is a brand of
          Jaiswal Pharma, which also supplies stock through the platform, so on
          those lines the operator IS the seller. Disclaiming liability the
          operator actually carries is the one thing on this page worth getting
          exactly right.
        */}
        <SeoSection id="marketplace" title="What the platform is">
          <p>
            {SITE_NAME} is a brand operated by {SITE_LEGAL_NAME}, a sole
            proprietorship registered in Kolkata, West Bengal. The platform
            connects licensed business buyers with verified pharmaceutical
            wholesalers, and provides ordering, invoicing visibility and
            support.
          </p>
          <p className="mt-3">
            Goods are supplied in two ways, and the difference matters:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Supplied by {SITE_LEGAL_NAME}.</strong> On these listings
              the operator of this platform is also the seller of record, and
              carries a seller&apos;s responsibility for the goods.
            </li>
            <li>
              <strong>Supplied by an independent wholesaler.</strong> On these
              listings the seller of record is that wholesaler, who sets the
              price, scheme and stock and is responsible for the goods.{' '}
              {SITE_NAME} provides the platform, not the medicine.
            </li>
          </ul>
          <p className="mt-3">
            The seller of record for an order line is named on the GST invoice
            for that line, and the supplying seller is shown against every
            listing on the product page before you order.
          </p>
        </SeoSection>

        <SeoSection id="eligibility" title="Who may trade">
          <p>
            Purchasing is restricted to businesses holding a valid drug licence
            — retail pharmacies, hospitals, clinics, nursing homes and
            distributors — that have completed verification with GST
            registration or PAN. {SITE_NAME} does not sell to individual
            consumers. Selling is restricted to wholesalers verified with a
            valid drug licence and GST or PAN. An account is either a buyer or
            a seller account, never both.
          </p>
        </SeoSection>

        <SeoSection id="ordering" title="Orders, pricing and invoicing">
          <p>
            Wholesale rates are visible to verified buyers. Each order line must
            reach {inr(MIN_ORDER_VALUE_INR)} including GST, and each listing
            carries a minimum order quantity set by its supplier. Every order is
            invoiced with GST by the supplying wholesaler at the rate applicable
            to each product. Obvious pricing errors on a listing may be
            corrected before dispatch; in that case the buyer may cancel the
            affected line without charge.
          </p>
        </SeoSection>

        <SeoSection id="acceptable" title="Acceptable use">
          <p>
            Accounts must provide accurate business and licence information and
            keep it current. The platform may not be used to purchase medicines
            for personal consumption, to resell outside the terms of the
            buyer&apos;s licence, or in any way that breaches drug-supply
            regulation. {SITE_NAME} may suspend accounts that misrepresent
            their credentials or misuse the platform.
          </p>
        </SeoSection>

        <SeoSection id="content" title="No medical advice">
          <p>
            Product information on {SITE_NAME} describes products for trade
            purposes. Nothing on the platform is medical advice, and the
            catalogue is not a substitute for the professional judgment of the
            licensed practitioners and pharmacists who buy on it.
          </p>
        </SeoSection>

        <SeoSection id="law" title="Governing law and contact">
          <p>
            These terms are governed by the laws of India. Questions about them
            are welcome at{' '}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            .
          </p>
        </SeoSection>

        <SeoSection title="Related pages">
          <LinkGrid
            links={[
              { label: 'Privacy Policy', href: routes.privacy() },
              { label: 'Shipping & Delivery', href: routes.shipping() },
              { label: 'Return Policy', href: routes.returns() },
              { label: 'Refund Policy', href: routes.refunds() },
              { label: 'Buyer FAQ', href: routes.faq() },
              { label: `About ${SITE_NAME}`, href: routes.about() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
