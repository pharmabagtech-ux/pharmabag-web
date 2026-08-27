import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, LinkGrid } from '@/components/seo/SeoContent';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import { graph, breadcrumbSchema, webPageSchema } from '@/lib/seo/schema';
import { SITE_NAME, SITE_LEGAL_NAME, CONTACT } from '@/lib/seo/config';

/**
 * Privacy policy.
 *
 * Describes what the platform ACTUALLY collects and does — business
 * verification documents, order data, supplier sharing for fulfilment — not
 * boilerplate about ad networks the site does not run. A disclosure that
 * does not match the implementation is itself a compliance problem.
 *
 * ⚠️ Written from the platform's real behaviour; have it reviewed by counsel
 * before treating it as the definitive legal document.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Privacy Policy', path: routes.privacy() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Privacy Policy',
    description: `How ${SITE_NAME} collects, uses and protects business information: verification documents, order data, who it is shared with for fulfilment, and how to reach us about your data.`,
    path: routes.privacy(),
    keywords: ['PharmaBag privacy policy'],
  });
}

export default function PrivacyPage() {
  const url = absoluteUrl(routes.privacy());

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: `${SITE_NAME} Privacy Policy`,
      url,
      description: `How ${SITE_NAME} collects, uses and protects the business information of buyers and sellers on the platform.`,
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
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} is a B2B pharmaceutical marketplace operated by{' '}
            {SITE_LEGAL_NAME}. This policy explains what information the
            platform collects from business buyers and sellers, why it is
            collected, and who it is shared with.
          </p>
        </header>

        <SeoSection id="collect" title="What we collect">
          <p>
            Accounts on {SITE_NAME} are business accounts. To register and
            verify an account we collect the business&apos;s name and contact
            details (mobile number and email), and the verification documents
            pharmaceutical trade requires: drug licence details and GST
            registration or PAN. Once trading, the platform holds your order
            history, delivery addresses, invoices and support conversations.
          </p>
        </SeoSection>

        <SeoSection id="use" title="How it is used">
          <p>
            This information is used to operate the marketplace: verifying that
            buyers and sellers are licensed businesses, processing and
            delivering orders, generating GST invoices, providing support, and
            keeping the records pharmaceutical supply requires. Aggregate,
            non-identifying usage information may be used to understand how the
            platform performs and to improve it.
          </p>
        </SeoSection>

        <SeoSection id="share" title="Who it is shared with">
          <p>
            Order details and the delivery address are shared with the
            wholesaler supplying each order line — they are the seller of
            record and need them to fulfil and invoice the order — and with
            logistics providers to the extent needed for delivery. Verification
            documents are used for onboarding checks. {SITE_NAME} does not sell
            personal or business data to third parties, and does not run
            third-party advertising trackers on the site.
          </p>
        </SeoSection>

        <SeoSection id="storage" title="Storage and sessions">
          <p>
            Account sessions use browser storage to keep you signed in on your
            device. Data is stored on infrastructure located in India and
            protected by access controls; payment processing, where used, is
            handled by the payment provider and card details are not stored by{' '}
            {SITE_NAME}.
          </p>
        </SeoSection>

        <SeoSection id="rights" title="Your choices">
          <p>
            To access, correct or delete the information held about your
            business, or to close an account, email{' '}
            <a className="underline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            . Some records — invoices and order history in particular — must be
            retained for the periods tax and drug-supply regulation require,
            even after an account closes.
          </p>
        </SeoSection>

        <SeoSection title="Related pages">
          <LinkGrid
            links={[
              { label: 'Terms of Use', href: routes.terms() },
              { label: 'Shipping & Delivery', href: routes.shipping() },
              { label: `Contact ${SITE_NAME}`, href: routes.contact() },
              { label: `About ${SITE_NAME}`, href: routes.about() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
