import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { fetchCategories, fetchProducts } from '@/lib/seo/catalog';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import {
  graph,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
} from '@/lib/seo/schema';
import { SITE_NAME, MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';

/**
 * Dosage-form landing page — e.g. /categories/generic/syrup.
 *
 * "Generic syrups wholesale" and "tablet distributor" are real commercial
 * queries that a single flat product list can never satisfy. Because the
 * category x dosage-form grid is only ~80 pages, each one can carry genuinely
 * specific content — which is exactly the discipline that does NOT survive at
 * product x city scale, and why that cross-product was deliberately not built.
 */

const PAGE_SIZE = 48;

/**
 * Dynamic, not pre-built — this page reads `searchParams` for pagination.
 * See the note in `categories/[categorySlug]/page.tsx`: pairing
 * `generateStaticParams` with `searchParams` drops the route from the
 * prerender manifest and makes every URL 404.
 *
 * No page-level `revalidate` export: `dynamic = 'force-dynamic'` below
 * overrides it anyway. Freshness is handled at the fetch layer instead --
 * `lib/seo/catalog.ts` caches catalogue reads for a day, so the API is not
 * re-queried on every crawl.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { categorySlug: string; formSlug: string };
  searchParams: { page?: string };
}

async function resolve(categorySlug: string, formSlug: string) {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  const form = category?.subCategories?.find((s) => s.slug === formSlug);
  return { category, form };
}

/** Factual note on what each dosage form is, used to differentiate the copy. */
function formBlurb(form: string): string {
  const key = form.toLowerCase();
  const map: Record<string, string> = {
    tablet: 'Tablets are solid oral dosage forms and the highest-volume category in Indian wholesale pharmacy, with long shelf life and simple storage.',
    capsule: 'Capsules enclose powder or liquid fill in a gelatin or vegetarian shell, and are commonly used where taste masking or delayed release is needed.',
    syrup: 'Syrups are liquid oral preparations, widely dispensed in paediatrics, and require attention to expiry dating and storage conditions in transit.',
    injection: 'Injections are sterile parenteral preparations supplied to hospitals and clinics, and many require cold-chain handling.',
    vials: 'Vials are sealed sterile containers for injectable preparations, typically ordered by hospitals and nursing homes.',
    drops: 'Drops cover ophthalmic, otic and paediatric oral preparations dispensed in small measured volumes.',
    cream: 'Creams are semi-solid topical preparations used across dermatology and general practice.',
    ointment: 'Ointments are occlusive semi-solid topical preparations with an oil base.',
    gel: 'Gels are semi-solid topical preparations with rapid absorption, common in pain management and dermatology.',
    lotion: 'Lotions are low-viscosity topical preparations for application over larger skin areas.',
    powder: 'Powders include oral rehydration salts, protein supplements and reconstitutable preparations.',
    inhaler: 'Inhalers deliver metered doses to the respiratory tract and are central to asthma and COPD management.',
    insulin: 'Insulin products require strict cold-chain storage and are supplied to pharmacies and hospitals under controlled conditions.',
    soap: 'Medicated soaps and bathing bars are dermatological products dispensed through pharmacy channels.',
    lozenges: 'Lozenges are slow-dissolving oral preparations used mainly for throat and cough indications.',
    suppository: 'Suppositories are solid dosage forms for rectal or vaginal administration.',
    paste: 'Pastes are stiff semi-solid preparations, commonly dental or dermatological.',
    pfs: 'Pre-filled syringes are ready-to-administer sterile injectables that reduce preparation error.',
    shampoo: 'Medicated shampoos are dermatological preparations for scalp conditions.',
  };
  return map[key] ?? `${form} preparations supplied at wholesale rates.`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category, form } = await resolve(params.categorySlug, params.formSlug);
  if (!category || !form) {
    return buildMetadata({
      title: 'Not found',
      description: 'Browse the full wholesale medicine catalogue instead.',
      path: routes.dosageForm(params.categorySlug, params.formSlug),
      index: false,
    });
  }

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { total } = await fetchProducts({
    categoryId: category.id,
    subCategoryId: form.id,
    page: 1,
    limit: 1,
  });

  const path = routes.dosageForm(category.slug, form.slug);

  return buildMetadata({
    title: `${category.name} ${form.name} — Wholesale Price & Bulk Supply${page > 1 ? ` — Page ${page}` : ''}`,
    description: `Buy ${category.name.toLowerCase()} ${form.name.toLowerCase()} products in bulk on ${SITE_NAME}. ${total.toLocaleString('en-IN')} listings from verified Indian wholesalers with net rates, MOQ and GST invoicing.`,
    path: page > 1 ? `${path}?page=${page}` : path,
    keywords: [
      `${form.name.toLowerCase()} wholesale`,
      `${category.name} ${form.name} supplier`,
      `bulk ${form.name.toLowerCase()} distributor India`,
    ],
  });
}

export default async function DosageFormPage({ params, searchParams }: PageProps) {
  const { category, form } = await resolve(params.categorySlug, params.formSlug);
  if (!category || !form) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { products, total, totalPages } = await fetchProducts({
    categoryId: category.id,
    subCategoryId: form.id,
    page,
    limit: PAGE_SIZE,
  });

  /**
   * A dosage form with nothing in it is a thin page. Rather than publish it,
   * 404 — this is the guard that keeps the generated surface honest.
   */
  if (total === 0) notFound();

  const path = routes.dosageForm(category.slug, form.slug);
  const url = absoluteUrl(path);

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Categories', path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
    { name: form.name, path },
  ];

  const faqs = [
    {
      question: `How many ${category.name.toLowerCase()} ${form.name.toLowerCase()} products are listed?`,
      answer: `${SITE_NAME} currently lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products in ${form.name.toLowerCase()} form from verified wholesale suppliers across India.`,
    },
    {
      question: `What is the minimum order for ${form.name.toLowerCase()} products?`,
      answer: `Every order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. Each listing also carries its own minimum order quantity in units, set by the supplying wholesaler and shown on the product page.`,
    },
    {
      question: `Are ${form.name.toLowerCase()} orders delivered across India?`,
      answer: `Yes. ${SITE_NAME} suppliers dispatch ${form.name.toLowerCase()} products to pharmacies, hospitals and distributors across all Indian states, with GST invoicing on every order.`,
    },
  ];

  const siblings = (category.subCategories ?? []).filter((s) => s.id !== form.id);

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    collectionPageSchema({
      name: `${category.name} ${form.name} — Wholesale`,
      url,
      description: `${category.name} products in ${form.name} form, available for bulk purchase.`,
      totalItems: total,
      items: products.slice(0, 40).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`${category.name} ${form.name} — wholesale suppliers in India`}
        intro={`${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products supplied in ${form.name.toLowerCase()} form. ${formBlurb(form.name)} Each listing shows the wholesale net rate, minimum order quantity and applicable GST, and is placed by a licensed supplier.`}
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={path}
        page={page}
        totalPages={totalPages}
        browseHref={`${routes.products()}?category=${encodeURIComponent(category.name)}&subCategory=${encodeURIComponent(form.name)}`}
        browseLabel="Open in catalogue"
        faqs={faqs}
        linkSections={[
          ...(siblings.length
            ? [
                {
                  title: `Other ${category.name} dosage forms`,
                  links: siblings.map((s) => ({
                    label: `${category.name} ${s.name}`,
                    href: routes.dosageForm(category.slug, s.slug),
                  })),
                },
              ]
            : []),
          {
            title: 'Related categories',
            links: [
              { label: `All ${category.name} medicines`, href: routes.category(category.slug) },
              { label: 'All categories', href: routes.categories() },
              { label: 'Browse by generic molecule', href: routes.generics() },
              { label: 'Browse by brand', href: routes.brands() },
            ],
          },
        ]}
      />
    </>
  );
}
