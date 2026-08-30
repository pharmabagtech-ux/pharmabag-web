import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import { Breadcrumbs, SeoSection, FaqList, LinkGrid } from '@/components/seo/SeoContent';
import { fetchProducts, fetchManufacturers } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import { graph, breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';

/**
 * Site-wide FAQ.
 *
 * The single most reusable asset for answer engines on the site: a dense set
 * of self-contained question/answer pairs about how wholesale medicine buying
 * actually works in India. Each answer is written to stand alone, because a
 * model quoting one will not carry any of the surrounding page with it.
 *
 * Grouped into sections so a reader can navigate it, but the schema exposes
 * one flat FAQPage, which is what Google and Bing expect.
 */
export const revalidate = 86400;

const CRUMBS = [
  { name: 'Home', path: routes.home() },
  { name: 'FAQ', path: routes.faq() },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Wholesale Medicine Buying FAQ — Licences & GST',
    description: `Answers to common questions about buying wholesale medicines in India on ${SITE_NAME}: drug licence requirements, minimum order value, PTR and net rate pricing, GST invoicing, schemes and pan-India delivery.`,
    path: routes.faq(),
    keywords: [
      'wholesale medicine FAQ',
      'how to buy medicines in bulk India',
      'drug licence for wholesale purchase',
      'PTR net rate meaning',
      'medicine wholesale minimum order',
    ],
  });
}

export default async function FaqPage() {
  const [{ total }, manufacturers] = await Promise.all([
    fetchProducts({ page: 1, limit: 1 }),
    fetchManufacturers(),
  ]);

  const url = absoluteUrl(routes.faq());

  const groups: { title: string; faqs: { question: string; answer: string }[] }[] = [
    {
      title: 'Buying and eligibility',
      faqs: [
        {
          question: `Who can buy medicines wholesale on ${SITE_NAME}?`,
          answer: `${SITE_NAME} sells only to businesses — retail pharmacies, hospitals, clinics, nursing homes and distributors. Buyers must hold a valid drug licence and complete a one-time verification with GST registration or PAN. Individual consumers cannot purchase on the platform.`,
        },
        {
          question: 'What licence do I need to buy medicines in bulk in India?',
          answer:
            'A valid drug licence issued by the state drug control authority is required to purchase medicines for resale or institutional use in India. Retail pharmacies typically hold a Form 20/21 retail licence, while wholesalers hold Form 20B/21B. PharmaBag records licence details against every order.',
        },
        {
          question: `How many products does ${SITE_NAME} list?`,
          answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} pharmaceutical products from ${manufacturers.length} brands and manufacturers, spanning ethical and generic medicines, nutraceuticals and ayurvedic products across all major dosage forms.`,
        },
        {
          question: 'Can I buy without registering?',
          answer: `The catalogue and product information can be browsed without an account, but wholesale rates and ordering require a verified business account. This is a regulatory requirement for pharmaceutical supply, not a marketing gate.`,
        },
      ],
    },
    {
      title: 'Pricing and payment',
      faqs: [
        {
          question: 'What is PTR and how does it differ from MRP?',
          answer:
            'MRP is the maximum retail price printed on the pack. PTR, or price to retailer, is the rate at which a wholesaler supplies a retail pharmacy, calculated by deducting the retailer margin from the MRP. On PharmaBag the margin follows the product’s GST slab, and the full derivation from MRP to PTR to final net rate is shown on every listing.',
        },
        {
          question: 'What is the net rate on a listing?',
          answer:
            'The net rate is the effective per-unit price a buyer pays after the supplier’s discount and any bonus scheme have been applied to the PTR, shown exclusive of GST. Where a scheme offers free units, the benefit is passed on as a lower per-unit rate rather than as extra stock, so the net rate already reflects it.',
        },
        {
          question: `What is the minimum order value on ${SITE_NAME}?`,
          answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. The minimum applies per product line rather than per basket, so an order containing several products has an independent minimum for each. Every listing also carries its own minimum order quantity in units, set by the supplying wholesaler.`,
        },
        {
          question: 'Are the prices shown inclusive of GST?',
          answer:
            'No. Wholesale net rates on PharmaBag are shown exclusive of GST. GST is applied at the rate applicable to each product — commonly 5% or 12% for pharmaceuticals in India — and appears on the invoice issued by the supplying wholesaler.',
        },
        {
          question: 'What does a scheme like "10+2" mean?',
          answer:
            'A scheme such as 10+2 means the buyer is billed for 10 units and receives 12. On PharmaBag the value of the free units is converted into a lower effective per-unit rate, and order quantities step in multiples of the billed quantity — 10 in this example — because that is the quantity actually charged for.',
        },
      ],
    },
    {
      title: 'Orders, invoicing and delivery',
      faqs: [
        {
          question: 'Do I get a GST invoice?',
          answer: `Yes. Every order on ${SITE_NAME} is invoiced with GST by the supplying wholesaler at the rate applicable to each product. Interstate supply is invoiced with IGST where relevant.`,
        },
        {
          question: 'Where does PharmaBag deliver?',
          answer: `${SITE_NAME} suppliers dispatch across India, to the buyer's registered business address. Because ordering is online, a buyer is not restricted to wholesalers in their own city or state.`,
        },
        {
          question: 'Can I compare several suppliers for the same product?',
          answer:
            'Yes. Where more than one verified supplier lists the same product, each supplier’s net rate, minimum order quantity, available stock and expiry are shown on the product page so the offers can be compared directly before ordering.',
        },
        {
          question: 'How is product expiry handled?',
          answer:
            'Suppliers record the expiry of the batch they are offering, and it is shown on the listing where available. Buyers should verify pack, batch and expiry on receipt, as they would with any wholesale consignment.',
        },
      ],
    },
    {
      title: 'Selling on the platform',
      faqs: [
        {
          question: `How do I list my products as a wholesaler on ${SITE_NAME}?`,
          answer: `Register as a seller and complete verification with a valid drug licence and GST or PAN details. Once approved, products can be listed individually or uploaded in bulk by CSV. Sellers enter the MRP and their scheme, and the platform derives the PTR and net rate shown to buyers.`,
        },
        {
          question: 'Can one account both buy and sell?',
          answer: `No. A ${SITE_NAME} account is either a buyer or a seller account. A business that both distributes and purchases needs separate accounts, because ordering endpoints are restricted to buyer accounts.`,
        },
      ],
    },
  ];

  const allFaqs = groups.flatMap((g) => g.faqs);

  const jsonLd = graph(
    breadcrumbSchema(CRUMBS),
    /**
     * Plain WebPage on purpose: faqSchema() below already emits the FAQPage
     * node with mainEntity. Typing this node FAQPage too put two FAQPage
     * nodes in the graph — one without mainEntity — and Google may read the
     * empty one.
     */
    webPageSchema({
      name: 'Wholesale Medicine Buying FAQ',
      url,
      description: `Common questions about buying wholesale medicines in India on ${SITE_NAME}.`,
    }),
    faqSchema(allFaqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <Navbar showUserActions />
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={CRUMBS} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Wholesale medicine buying — frequently asked questions
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            How buying pharmaceuticals in bulk works in India on {SITE_NAME} —
            licence requirements, how wholesale pricing is derived from MRP,
            minimum order rules, GST invoicing and delivery.
          </p>
        </header>

        {groups.map((group) => (
          <SeoSection key={group.title} title={group.title}>
            <FaqList faqs={group.faqs} />
          </SeoSection>
        ))}

        <SeoSection title="Continue browsing">
          <LinkGrid
            links={[
              { label: 'All medicines', href: routes.products() },
              { label: 'Browse by category', href: routes.categories() },
              { label: 'Browse by brand', href: routes.brands() },
              { label: 'Browse by generic molecule', href: routes.generics() },
              { label: 'Suppliers by state and city', href: routes.locations() },
              { label: `About ${SITE_NAME}`, href: routes.about() },
              { label: 'Contact us', href: routes.contact() },
              { label: 'Industry articles', href: routes.blogs() },
            ]}
          />
        </SeoSection>
      </main>
    </>
  );
}
