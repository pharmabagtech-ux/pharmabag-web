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
import { SITE_NAME } from '@/lib/seo/config';
import { STATES } from '@/lib/seo/data/locations';
import { categoryDefaults } from '@/lib/seo/defaults/category';

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
  const defaults = categoryDefaults(category, total);

  return buildMetadata({
    title: `${defaults.title}${pageSuffix}`,
    description: defaults.description,
    /**
     * Paginated pages canonicalise to THEMSELVES, not back to page 1.
     * Pointing every page at page 1 is the classic error that removes the rest
     * of a catalogue from the index.
     */
    path: page > 1 ? `${routes.category(category.slug)}?page=${page}` : routes.category(category.slug),
    keywords: defaults.keywords,
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
  const defaults = categoryDefaults(category, total);
  const faqs = defaults.faqs;

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
        heading={defaults.h1}
        intro={defaults.intro}
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
