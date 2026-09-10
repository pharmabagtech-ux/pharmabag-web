import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import CollectionShell from '@/components/seo/CollectionShell';
import { SeoSection } from '@/components/seo/SeoContent';
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
import { categoryDefaults } from '@/lib/seo/defaults/category';
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
  searchParams: CollectionSearchParams;
}

/**
 * Values an admin-written string may interpolate, so an edited sentence can
 * still carry the live product count instead of freezing the number that
 * happened to be true the day it was written.
 */
function categoryTokens(name: string, total: number): PageTokens {
  return {
    product_count: total.toLocaleString('en-IN'),
    name,
    min_order_value: inr(MIN_ORDER_VALUE_INR),
  };
}

async function resolve(categorySlug: string) {
  // strict: an empty tree here would be misread as "category does not exist".
  const categories = await fetchCategories(true);
  const category = categories.find((c) => c.slug === categorySlug);
  return { categories, category };
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
  const filters = parseFilters(searchParams);
  const { total } = await fetchProducts({
    categoryId: category.id,
    page: 1,
    limit: 1,
  });

  const pageSuffix = page > 1 ? ` — Page ${page}` : '';
  const defaults = categoryDefaults(category, total);
  const override = await fetchPageOverride(routes.category(category.slug));
  const tokens = categoryTokens(category.name, total);
  const basePath = routes.category(category.slug);

  return buildMetadata({
    title: `${preferOverride(override?.title, defaults.title, tokens)}${pageSuffix}`,
    description: preferOverride(
      override?.description,
      defaults.description,
      tokens,
    ),
    /**
     * Paginated pages canonicalise to THEMSELVES, not back to page 1.
     * Pointing every page at page 1 is the classic error that removes the rest
     * of a catalogue from the index.
     *
     * A *filtered* view is different in kind from a paginated one: sort x
     * manufacturer x discount is a combinatorial space over the same products,
     * so each one self-canonicalises AND carries `noindex, follow` below.
     * Canonicalising them onto the clean URL instead would be the wrong tool —
     * a canonical is a statement that two URLs are the same page, and
     * "Ayurvedic, Cipla only" is not the same page as "Ayurvedic".
     */
    path: collectionHref(basePath, filters, page),
    index: !isFiltered(filters),
    keywords: defaults.keywords,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categories, category } = await resolve(params.categorySlug);
  if (!category) notFound();

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const filters = parseFilters(searchParams);
  const { products, total, totalPages } = await fetchProducts({
    categoryId: category.id,
    page,
    limit: PAGE_SIZE,
    ...filterQuery(filters),
  });

  const basePath = routes.category(category.slug);
  // Matches the canonical: on page 2+ this node describes THAT page, not
  // page 1. They disagreed before, so the schema claimed every paginated
  // view was the first one.
  const url = absoluteUrl(collectionHref(basePath, filters, page));
  const crumbs = [
    { name: 'Home', path: routes.home() },
    { name: 'Categories', path: routes.categories() },
    { name: category.name, path: routes.category(category.slug) },
  ];

  const subs = category.subCategories ?? [];

  /**
   * The prose describes the CATEGORY, so it counts the category — not whatever
   * the visitor has filtered down to. Without this, ticking "discount offers
   * only" rewrote the opening line to "PharmaBag lists 2 ayurvedic medicines",
   * which is both wrong and the kind of sentence that ends up quoted in a
   * search result. The filtered count belongs in the filter bar, and that is
   * where `totalProducts` puts it.
   */
  const categoryTotal = isFiltered(filters)
    ? (await fetchProducts({ categoryId: category.id, page: 1, limit: 1 })).total
    : total;
  const defaults = categoryDefaults(category, categoryTotal);

  /**
   * Admin overrides, applied field by field. Anything an admin has not written
   * stays generated, so an edited H1 never costs the page its FAQs and a
   * missing override never blanks anything.
   */
  const override = await fetchPageOverride(basePath);
  // Admin copy interpolates `{{product_count}}`; same reasoning as `defaults`
  // above — it is a sentence about the category, not about the active filter.
  const tokens = categoryTokens(category.name, categoryTotal);
  const faqs = override?.faq?.length ? override.faq : defaults.faqs;

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

  return (
    <>
      <JsonLd json={jsonLd} />
      <CollectionShell
        heading={preferOverride(override?.h1, defaults.h1, tokens)}
        intro={preferOverride(override?.intro, defaults.intro, tokens)}
        body={
          /*
            An admin-written body replaces the generated one; with neither, the
            page shows no prose at all — which is what it did before this, while
            every sub-category page beneath it had one.
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
              {/* A measure for the prose: the page is full width now, and a
                  paragraph running the whole way across is hard to read. */}
              <div className="max-w-3xl space-y-3">
                {defaults.body.paragraphs.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>
            </SeoSection>
          ) : undefined
        }
        crumbs={crumbs}
        products={products}
        totalProducts={total}
        basePath={basePath}
        page={page}
        totalPages={totalPages}
        /*
          This page is where the navigation now sends a buyer, so it has to be
          able to take an order, not just describe the category.
        */
        shopping
        filters={filters}
        browseHref={`${routes.products()}?category=${encodeURIComponent(category.name)}`}
        browseLabel="More filters in the full catalogue"
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
