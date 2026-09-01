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
import { STATES } from '@/lib/seo/data/locations';

/**
 * Category landing page — e.g. /categories/generic.
 *
 * Built as an authoritative page rather than a bare product list: it carries
 * its own definition of the category, a dosage-form breakdown, real product
 * links, FAQs and onward links. That is what separates a page that ranks for
 * "generic medicines wholesale" from one that only ever ranks for its own
 * brand name.
 */

const PAGE_SIZE = 48;

/**
 * Rendered on demand, NOT pre-built.
 *
 * This page reads `searchParams` for pagination, which opts it into dynamic
 * rendering. Combining that with `generateStaticParams` is not merely
 * redundant — in Next 14 the route is then dropped from the prerender
 * manifest altogether, leaving no static file *and* no dynamic entry, so every
 * URL 404s. That was caught in build verification here; the fix is to let the
 * route be honestly dynamic.
 *
 * There is no SEO cost: the `fetch` calls are cached for a day
 * (`lib/seo/catalog.ts`), so responses stay fast and the API sees one request
 * per revalidation window rather than one per crawl.
 *
 * No page-level `revalidate` export: `dynamic = 'force-dynamic'` below
 * overrides it anyway. Freshness is handled at the fetch layer instead --
 * `lib/seo/catalog.ts` caches catalogue reads for a day, so the API is not
 * re-queried on every crawl.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { categorySlug: string };
  searchParams: { page?: string };
}

async function resolve(categorySlug: string) {
  // strict: an empty tree here would be misread as "category does not exist".
  const categories = await fetchCategories(true);
  const category = categories.find((c) => c.slug === categorySlug);
  return { categories, category };
}

/** Short, honest description of what each trade category means. */
function categoryBlurb(name: string): string {
  const key = name.toLowerCase();
  if (key.includes('ethical')) {
    return 'Ethical products are branded prescription medicines promoted to doctors and dispensed against a prescription.';
  }
  if (key.includes('generic')) {
    return 'Generic products are medicines sold under their salt name or as branded generics, typically at a lower price point than the originator brand.';
  }
  if (key.includes('nutraceutical')) {
    return 'Nutraceuticals cover food-supplement products such as vitamins, minerals, protein supplements and health tonics.';
  }
  if (key.includes('ayurvedic')) {
    return 'Ayurvedic products are traditional medicine formulations licensed under the AYUSH framework.';
  }
  return `${name} products supplied at wholesale rates.`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category } = await resolve(params.categorySlug);
  if (!category) {
    return buildMetadata({
      title: 'Category not found',
      description: 'Browse the full wholesale medicine catalogue instead.',
      path: routes.category(params.categorySlug),
      index: false,
    });
  }

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { total } = await fetchProducts({
    categoryId: category.id,
    page: 1,
    limit: 1,
  });

  const pageSuffix = page > 1 ? ` — Page ${page}` : '';

  return buildMetadata({
    title: `${category.name} Medicines Wholesale Supplier${pageSuffix}`,
    description: `Buy ${category.name.toLowerCase()} medicines in bulk from verified Indian wholesalers on ${SITE_NAME}. ${total.toLocaleString('en-IN')} products with wholesale net rates, GST invoicing and pan-India delivery.`,
    /**
     * Paginated pages canonicalise to THEMSELVES, not back to page 1.
     * Pointing every page at page 1 is the classic error that removes the rest
     * of a catalogue from the index.
     */
    path: page > 1 ? `${routes.category(category.slug)}?page=${page}` : routes.category(category.slug),
    keywords: [
      `${category.name} medicines wholesale`,
      `${category.name} medicine distributor`,
      `bulk ${category.name.toLowerCase()} medicine supplier India`,
      'pharmaceutical wholesaler',
    ],
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categories, category } = await resolve(params.categorySlug);
  if (!category) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { products, total, totalPages } = await fetchProducts({
    categoryId: category.id,
    page,
    limit: PAGE_SIZE,
  });

  const basePath = routes.category(category.slug);
  // Matches the canonical: on page 2+ this node describes THAT page, not
  // page 1. They disagreed before, so the schema claimed every paginated
  // view was the first one.
  const url = absoluteUrl(page > 1 ? `${basePath}?page=${page}` : basePath);
  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Categories', path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
  ];

  const subs = category.subCategories ?? [];

  const faqs = [
    {
      question: `How many ${category.name.toLowerCase()} medicines are available on ${SITE_NAME}?`,
      answer: `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} products from verified wholesale suppliers across India, spanning ${subs.length} dosage forms including ${subs.slice(0, 5).map((s) => s.name.toLowerCase()).join(', ')}.`,
    },
    {
      question: `What is the minimum order for ${category.name.toLowerCase()} medicines?`,
      answer: `Each order line must reach ${inr(MIN_ORDER_VALUE_INR)} including GST. The per-unit minimum order quantity is set by the supplying wholesaler and is shown on every product page.`,
    },
    {
      question: `Who can buy ${category.name.toLowerCase()} medicines in bulk on ${SITE_NAME}?`,
      answer: `${SITE_NAME} sells only to businesses: retail pharmacies, hospitals, clinics, nursing homes and distributors. Buyers complete a one-time verification with a valid drug licence and GST or PAN details before they can place an order.`,
    },
    {
      question: `Is GST included in the wholesale rates shown?`,
      answer: `No. Wholesale net rates on ${SITE_NAME} are shown exclusive of GST. GST is applied at the rate applicable to each product and appears on the invoice issued by the supplying wholesaler.`,
    },
  ];

  const jsonLd = graph(
    breadcrumbSchema(crumbs),
    collectionPageSchema({
      name: `${category.name} Medicines — Wholesale`,
      url,
      description: `${category.name} medicines available for bulk purchase on ${SITE_NAME}.`,
      totalItems: total,
      items: products.slice(0, 40).map((p) => ({
        name: p.name,
        url: absoluteUrl(routes.product(p.slug ?? '')),
      })),
    }),
    faqSchema(faqs),
  );

  const intro = `${SITE_NAME} lists ${total.toLocaleString('en-IN')} ${category.name.toLowerCase()} medicines for wholesale and bulk purchase across India. ${categoryBlurb(category.name)} Every listing is placed by a verified supplier and shows the wholesale net rate, minimum order quantity and applicable GST.`;

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={`${category.name} medicines — wholesale suppliers in India`}
        intro={intro}
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={routes.category(category.slug)}
        page={page}
        totalPages={totalPages}
        browseHref={`${routes.products()}?category=${encodeURIComponent(category.name)}`}
        browseLabel={`Browse ${category.name} in the catalogue`}
        faqs={faqs}
        linkSections={[
          ...(subs.length
            ? [
                {
                  title: `${category.name} by dosage form`,
                  links: subs.map((sub) => ({
                    label: `${category.name} ${sub.name}`,
                    href: routes.dosageForm(category.slug, sub.slug),
                  })),
                },
              ]
            : []),
          {
            title: 'Other medicine categories',
            links: categories
              .filter((c) => c.id !== category.id)
              .map((c) => ({
                label: `${c.name} medicines`,
                href: routes.category(c.slug),
              })),
          },
          {
            title: `${category.name} medicine suppliers by state`,
            links: STATES.slice(0, 16).map((s) => ({
              label: `${category.name} suppliers in ${s.name}`,
              href: routes.state(s.slug),
            })),
            columns: 3 as const,
          },
        ]}
      />
    </>
  );
}
