import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import {
  Breadcrumbs,
  SeoSection,
  SpecTable,
  LinkGrid,
  FaqList,
} from '@/components/seo/SeoContent';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  webPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, CONTACT } from '@/lib/seo/config';

/**
 * Contact page.
 *
 * A YMYL commerce site without reachable, specific contact details is treated
 * as low-trust by both quality raters and answer engines. Real contact data
 * here also feeds the Organization `contactPoint` node, which is what lets an
 * assistant answer "how do I contact PharmaBag" with something accurate.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'Contact', path: routes.contact() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `Contact ${SITE_NAME} — Wholesale Enquiries & Support`,
    /**
     * The phone number is only mentioned when one is actually configured —
     * see the note on CONTACT in lib/seo/config.ts. Interpolating an empty
     * value would ship a meta description ending "or call ." to every SERP.
     */
    description: `Contact ${SITE_NAME} for wholesale medicine enquiries, supplier onboarding and buyer support. Email ${CONTACT.email}${
      CONTACT.telephone ? ` or call ${CONTACT.telephone}` : ''
    }.`,
    path: routes.contact(),
    keywords: [
      'contact PharmaBag',
      'wholesale medicine enquiry',
      'pharmaceutical supplier support India',
    ],
  });
}

export default async function ContactPage() {
  const url = absoluteUrl(routes.contact());

  const faqs = [
    {
      question: `How do I register as a buyer on ${SITE_NAME}?`,
      answer: `Create an account with your business mobile number and complete onboarding with your drug licence and GST registration or PAN. Verification is a one-time step, after which wholesale rates become visible and orders can be placed.`,
    },
    {
      question: `How do I list my products as a wholesaler on ${SITE_NAME}?`,
      answer: `Register as a seller and complete verification with a valid drug licence and GST or PAN details. Once approved you can list products individually or upload your catalogue in bulk via CSV, setting MRP and the scheme for each item.`,
    },
    {
      question: 'Who do I contact about an existing order?',
      answer: `Order-specific queries are raised through the support section of your ${SITE_NAME} account, which routes the ticket to the supplying wholesaler and the platform team together. For anything urgent, email ${CONTACT.email} with your order reference.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    webPageSchema({
      name: `Contact ${SITE_NAME}`,
      url,
      description: `Contact details and enquiry routes for ${SITE_NAME}.`,
      type: 'ContactPage',
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-16 pt-20 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Contact {SITE_NAME}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} supports licensed pharmacies, hospitals, clinics and
            distributors buying wholesale medicines, and the wholesalers
            supplying them. Use the details below for enquiries about buyer
            registration, supplier onboarding, pricing or an existing order.
          </p>
        </header>

        <SeoSection id="details" title="Contact details">
          <SpecTable
            rows={[
              { label: 'Email', value: CONTACT.email },
              { label: 'Phone', value: CONTACT.telephone },
              {
                label: 'Based in',
                value: `${CONTACT.addressLocality}, ${CONTACT.addressRegion}, India`,
              },
              {
                label: 'Buyer eligibility',
                value: 'Businesses holding a valid drug licence only',
              },
            ]}
          />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {SITE_NAME} is a B2B platform and does not sell medicines to
            individual consumers or provide medical advice. For health concerns,
            consult a qualified medical practitioner.
          </p>
        </SeoSection>

        <SeoSection id="faq" title="Frequently asked questions">
          <FaqList faqs={faqs} />
        </SeoSection>

        <SeoSection title="Useful links">
          <LinkGrid
            links={[
              { label: `About ${SITE_NAME}`, href: routes.about() },
              { label: 'Buyer FAQ', href: routes.faq() },
              { label: 'Browse the catalogue', href: routes.products() },
              { label: 'Suppliers by state and city', href: routes.locations() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
