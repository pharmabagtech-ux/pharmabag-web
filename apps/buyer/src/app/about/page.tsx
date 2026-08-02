import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import {
  Breadcrumbs,
  SeoSection,
  SpecTable,
  LinkGrid,
} from '@/components/seo/SeoContent';
import { fetchProducts, fetchManufacturers } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  webPageSchema,
  organizationSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, CONTACT, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';

/**
 * About page — the primary EEAT surface.
 *
 * Google's quality guidelines treat pharmaceutical commerce as YMYL ("your
 * money or your life"), where trust signals carry unusual weight. A site
 * selling medicines with no About page, no stated verification process and no
 * contact details is structurally capped on how far it can rank, regardless
 * of how good its product pages are.
 *
 * Everything stated here is verifiable from how the platform actually works.
 * Inventing certifications would be worse than having none.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'About', path: routes.about() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `About ${SITE_NAME} — B2B Pharmaceutical Wholesale Marketplace`,
    description: `${SITE_NAME} is an Indian B2B pharmaceutical wholesale marketplace connecting licensed pharmacies, hospitals and distributors with verified medicine suppliers. Learn how supplier verification, pricing and GST invoicing work.`,
    path: routes.about(),
    keywords: [
      'about PharmaBag',
      'B2B pharmaceutical marketplace India',
      'verified medicine suppliers',
      'pharmaceutical wholesale platform',
    ],
  });
}

export default async function AboutPage() {
  const [{ total }, manufacturers] = await Promise.all([
    fetchProducts({ page: 1, limit: 1 }),
    fetchManufacturers(),
  ]);

  const url = absoluteUrl(routes.about());

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    organizationSchema(),
    webPageSchema({
      name: `About ${SITE_NAME}`,
      url,
      description: `${SITE_NAME} is an Indian B2B pharmaceutical wholesale marketplace connecting licensed buyers with verified suppliers.`,
      type: 'AboutPage',
    }),
  );

  const facts = [
    { label: 'Platform type', value: 'B2B pharmaceutical wholesale marketplace' },
    { label: 'Country of operation', value: 'India' },
    { label: 'Products listed', value: `${total.toLocaleString('en-IN')}` },
    { label: 'Brands and manufacturers', value: `${manufacturers.length}` },
    { label: 'Who can buy', value: 'Retail pharmacies, hospitals, clinics, nursing homes and distributors' },
    { label: 'Buyer verification', value: 'Drug licence plus GST registration or PAN' },
    { label: 'Minimum order value', value: `${inr(MIN_ORDER_VALUE_INR)} per order line, including GST` },
    { label: 'Invoicing', value: 'GST invoice issued by the supplying wholesaler' },
    { label: 'Delivery', value: 'Pan-India, to the buyer’s registered business address' },
  ];

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            About {SITE_NAME}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {SITE_NAME} is a business-to-business pharmaceutical wholesale
            marketplace operating in India. It connects licensed retail
            pharmacies, hospitals, clinics and distributors with verified
            medicine wholesalers, so buyers can compare wholesale rates across
            suppliers and order in bulk online rather than through individual
            phone-and-invoice relationships.
          </p>
        </header>

        <SeoSection id="at-a-glance" title={`${SITE_NAME} at a glance`}>
          <SpecTable rows={facts} />
        </SeoSection>

        <SeoSection id="how-it-works" title="How the marketplace works">
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                1. Suppliers are verified before they can list
              </h3>
              <p className="mt-1">
                Every wholesaler completes verification with a valid drug
                licence and either GST registration or PAN. Registration
                details are checked against government records through an
                authorised verification provider before a supplier is permitted
                to list products.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                2. Buyers are verified as businesses
              </h3>
              <p className="mt-1">
                {SITE_NAME} does not sell to consumers. Buyers complete a
                one-time onboarding with a drug licence and GST or PAN details.
                Wholesale rates become visible only after verification, which
                is both a regulatory requirement and the reason pricing is not
                public-facing in the way a retail pharmacy&apos;s would be.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                3. Pricing is transparent and derived, not negotiated privately
              </h3>
              <p className="mt-1">
                Suppliers enter the MRP and the scheme they are offering.{' '}
                {SITE_NAME} derives the price to retailer and the net rate from
                those inputs, so the buyer sees the full derivation — MRP, PTR,
                discount, scheme and final net rate — rather than an opaque
                figure. Rates are shown exclusive of GST, which is added at the
                rate applicable to each product.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                4. Orders are invoiced and delivered by the supplier
              </h3>
              <p className="mt-1">
                Each order is fulfilled and invoiced with GST by the supplying
                wholesaler and delivered to the buyer&apos;s registered business
                address. Every order line must reach{' '}
                {inr(MIN_ORDER_VALUE_INR)} including GST, which reflects the
                economics of wholesale rather than retail supply.
              </p>
            </div>
          </div>
        </SeoSection>

        <SeoSection id="compliance" title="Compliance and responsible supply">
          <div className="space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              Pharmaceutical wholesale in India is regulated under the Drugs and
              Cosmetics Act, 1940 and the rules made under it. Both parties to
              a transaction on {SITE_NAME} must hold a valid drug licence, and
              licence details are recorded against every order.
            </p>
            <p>
              {SITE_NAME} does not dispense medicines to the public, does not
              provide medical advice, and does not substitute for the approved
              prescribing information supplied with a product. Product
              information shown on the platform is for trade and procurement
              reference. Buyers are responsible for verifying the pack, batch
              and expiry of goods on receipt, and for dispensing only against a
              valid prescription where the product requires one.
            </p>
          </div>
        </SeoSection>

        <SeoSection id="contact" title="Contact and business details">
          <SpecTable
            rows={[
              { label: 'Email', value: CONTACT.email },
              { label: 'Phone', value: CONTACT.telephone },
              {
                // "Based in", not "Registered office" -- the city is known,
                // the registered address is not, and claiming one we cannot
                // evidence is exactly the kind of unverifiable detail that
                // costs trust on a YMYL page.
                label: 'Based in',
                value: `${CONTACT.addressLocality}, ${CONTACT.addressRegion}, India`,
              },
            ]}
          />
          <p className="mt-3 text-sm">
            <Link
              href={routes.contact()}
              className="font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              Full contact details and enquiry options →
            </Link>
          </p>
        </SeoSection>

        <SeoSection title="Explore the catalogue">
          <LinkGrid
            links={[
              { label: 'All medicines', href: routes.products() },
              { label: 'Browse by category', href: routes.categories() },
              { label: 'Browse by brand', href: routes.brands() },
              { label: 'Browse by generic molecule', href: routes.generics() },
              { label: 'Suppliers by state and city', href: routes.locations() },
              { label: 'Frequently asked questions', href: routes.faq() },
              { label: 'Industry articles', href: routes.blogs() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
