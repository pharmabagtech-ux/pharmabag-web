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
import { MIN_ORDER_VALUE_INR } from '@/lib/seo/config';
import { inr } from '@/lib/seo/content';
import { SeoSection } from '@/components/seo/SeoContent';
import { dosageFormDefaults } from '@/lib/seo/defaults/dosage-form';
import {
  applyTokens,
  fetchPageOverride,
  preferOverride,
  type PageTokens,
} from '@/lib/seo/page-seo';
import {
  parseFilters,
  filterQuery,
  isFiltered,
  collectionHref,
  type CollectionSearchParams,
} from '@/lib/seo/collection-filters';

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
  searchParams: CollectionSearchParams;
}

async function resolve(categorySlug: string, formSlug: string) {
  // strict: an empty tree here would be misread as "category does not exist".
  const categories = await fetchCategories(true);
  const category = categories.find((c) => c.slug === categorySlug);
  const form = category?.subCategories?.find((s) => s.slug === formSlug);
  return { category, form };
}

/**
 * Values an admin-written string may interpolate, so an edited sentence keeps
 * the live listing count instead of freezing the number it was written with.
 */
function formTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
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
  const filters = parseFilters(searchParams);
  const { total } = await fetchProducts({
    categoryId: category.id,
    subCategoryId: form.id,
    page: 1,
    limit: 1,
  });

  const path = routes.dosageForm(category.slug, form.slug);
  const defaults = dosageFormDefaults(category, form, total);
  const override = await fetchPageOverride(path);
  const tokens = formTokens(form.name, total);

  return buildMetadata({
    title: `${preferOverride(override?.title, defaults.title, tokens)}${page > 1 ? ` — Page ${page}` : ''}`,
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    /** Paginated views self-canonicalise; filtered views also go `noindex`. */
    path: collectionHref(path, filters, page),
    index: !isFiltered(filters),
    keywords: defaults.keywords,
  });
}

export default async function DosageFormPage({ params, searchParams }: PageProps) {
  const { category, form } = await resolve(params.categorySlug, params.formSlug);
  if (!category || !form) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const filters = parseFilters(searchParams);
  const { products, total, totalPages } = await fetchProducts({
    categoryId: category.id,
    subCategoryId: form.id,
    page,
    limit: PAGE_SIZE,
    ...filterQuery(filters),
  });

  /**
   * A dosage form with nothing in it is a thin page. Rather than publish it,
   * 404 — this is the guard that keeps the generated surface honest.
   *
   * Only the UNFILTERED page can 404 on an empty result. A manufacturer filter
   * that happens to match nothing is a visitor's dead end, not a missing page,
   * and 404ing it would tell Google a live URL had disappeared.
   */
  if (total === 0 && !isFiltered(filters)) notFound();

  const path = routes.dosageForm(category.slug, form.slug);
  // Matches the canonical: on page 2+ this node describes THAT page, not
  // page 1. They disagreed before, so the schema claimed every paginated
  // view was the first one.
  const url = absoluteUrl(collectionHref(path, filters, page));

  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Categories', path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
    { name: form.name, path },
  ];

  /**
   * Counted unfiltered: the copy is about this dosage form, not about the
   * subset a visitor has narrowed to. See the note on the category page.
   */
  const formTotal = isFiltered(filters)
    ? (
        await fetchProducts({
          categoryId: category.id,
          subCategoryId: form.id,
          page: 1,
          limit: 1,
        })
      ).total
    : total;

  const defaults = dosageFormDefaults(category, form, formTotal);
  const override = await fetchPageOverride(path);
  const tokens = formTokens(form.name, formTotal);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

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
        heading={preferOverride(override?.h1, defaults.h1, tokens)}
        intro={preferOverride(override?.intro, defaults.intro, tokens)}
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={path}
        page={page}
        totalPages={totalPages}
        /* Reached from the mega menu, so it has to be able to take an order. */
        shopping
        filters={filters}
        browseHref={`${routes.products()}?category=${encodeURIComponent(category.name)}&subCategory=${encodeURIComponent(form.name)}`}
        browseLabel="More filters in the full catalogue"
        faqs={faqs}
        body={
          /*
            An admin-written body replaces the hand-written procurement
            guidance entirely; with no override the guidance renders exactly
            as before. That guidance is what makes 31 form pages genuinely
            distinct rather than one template with a swapped noun.
          */
          override?.bodyHtml?.trim() ? (
            <div
              className="prose prose-slate max-w-3xl py-4"
              dangerouslySetInnerHTML={{
                __html: applyTokens(override.bodyHtml, tokens),
              }}
            />
          ) : defaults.body ? (
            <SeoSection id="buying-guide" title={defaults.body.title}>
              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                {defaults.body.paragraphs.map((para) => (
                  <p key={para.slice(0, 32)}>{para}</p>
                ))}
              </div>
            </SeoSection>
          ) : undefined
        }
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
