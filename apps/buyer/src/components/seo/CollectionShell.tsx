import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import {
  Breadcrumbs,
  SeoSection,
  FaqList,
  LinkGrid,
  CONTENT_WIDTH,
  type SeoLink,
} from './SeoContent';
import CollectionChrome from './CollectionChrome';
import CollectionFilters from './CollectionFilters';
import CollectionProductGrid from './CollectionProductGrid';
import type { Faq } from '@/lib/seo/content';
import type { CatalogProduct } from '@/lib/seo/catalog';
import { routes } from '@/lib/seo/url';
import { inr, bestListing } from '@/lib/seo/content';
import {
  collectionHref,
  isFiltered,
  NO_FILTERS,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * Shared layout for every facet landing page (category, dosage form, brand,
 * generic molecule, state, city).
 *
 * One shell rather than eleven near-identical pages, for the same reason the
 * `effectiveMinQuantity` helper exists in this codebase: hand-written copies
 * of the same structure drift, and here a drift means a page silently loses
 * its H1, its breadcrumb or its crawlable product links.
 *
 * Everything below is server-rendered. `Navbar` is the one client component,
 * and it is imported rather than duplicated so these pages keep the site's
 * real navigation, cart and login behaviour.
 */

export interface CollectionShellProps {
  /** The single H1. Exactly one per page. */
  heading: string;
  /** Self-contained opening paragraph, written to survive being quoted. */
  intro: string;
  crumbs: { name: string; path: string }[];
  products: CatalogProduct[];
  totalProducts: number;
  /** Rendered under the product grid; explains the facet in more depth. */
  body?: React.ReactNode;
  faqs?: Faq[];
  /** Groups of internal links rendered at the foot of the page. */
  linkSections?: { title: string; links: SeoLink[]; columns?: 2 | 3 | 4 }[];
  /** Canonical path of this collection, used to build pagination links. */
  basePath: string;
  page?: number;
  totalPages?: number;
  /** Deep link into the interactive catalogue with this facet pre-applied. */
  browseHref?: string;
  browseLabel?: string;
  /**
   * Render the real shopping grid (images, prices, add-to-cart) with filters
   * above it, instead of the crawl-only text list.
   *
   * Opt-in rather than automatic: it is switched on for the collections the
   * navigation points at, where a visitor arrives intending to buy. The
   * remaining facet pages (state, city, brand-in-city) keep the text list
   * until each is looked at on its own terms — a shared shell makes it one
   * line to change, and that is exactly why it should not change silently.
   */
  shopping?: boolean;
  /** Active filter state. Required when `shopping`; drives every page link. */
  filters?: Filters;
}

/**
 * A crawlable product card.
 *
 * Plain `<a>` + server-rendered text. The interactive catalogue's cards are
 * drawn client-side, so before this existed a crawler following a category
 * link found no product links at all — which is why almost none of the 26,815
 * products were discoverable.
 */
function ProductCard({ product }: { product: CatalogProduct }) {
  const listing = bestListing(product);
  const price = listing?.price ?? product.price ?? null;
  const mrp = listing?.mrp ?? product.mrp ?? null;
  const slug = product.slug?.trim();
  if (!slug) return null;

  return (
    <li>
      <Link
        href={routes.product(slug)}
        className="flex h-full flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 p-4 transition hover:border-teal-400 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <div>
          <h3 className="text-sm font-semibold leading-snug text-slate-900">
            {product.name}
          </h3>
          {product.chemicalComposition ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {product.chemicalComposition}
            </p>
          ) : null}
        </div>
        <div className="mt-2 text-xs text-slate-600">
          {product.manufacturer ? (
            <p className="truncate font-medium text-slate-700">
              {product.manufacturer}
            </p>
          ) : null}
          {price ? (
            <p className="mt-1">
              <span className="font-bold text-teal-700">{inr(price)}</span>
              <span className="text-slate-400"> /unit</span>
              {mrp && mrp > price ? (
                <span className="ml-1 text-slate-400 line-through">{inr(mrp)}</span>
              ) : null}
            </p>
          ) : (
            <p className="mt-1 text-slate-400">Request wholesale quote</p>
          )}
        </div>
      </Link>
    </li>
  );
}

/**
 * Pagination.
 *
 * Real `<a href>` links, not buttons, so crawlers can walk deep pages. Page 1
 * self-canonicalises and pages 2+ canonicalise to themselves — canonicalising
 * every page back to page 1 is a common mistake that hides most of a
 * catalogue from the index.
 */
function Pagination({
  basePath,
  page,
  totalPages,
  filters,
  align = 'page',
}: {
  basePath: string;
  page: number;
  totalPages: number;
  filters?: Filters;
  /**
   * `page` centres it in its own full-width container. `left` drops that
   * container because the caller already sits inside one — nesting the two
   * would indent the page links away from the grid they belong to.
   */
  align?: 'page' | 'left';
}) {
  if (totalPages <= 1) return null;
  /**
   * Page links carry the active filters. Without this, paging out of a
   * filtered view silently drops the filter and shows the visitor a different
   * set of products than the one they were looking through.
   */
  const href = (p: number) =>
    filters
      ? collectionHref(basePath, filters, p)
      : p <= 1
        ? basePath
        : `${basePath}?page=${p}`;

  const windowed: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
    windowed.push(p);
  }

  return (
    <nav
      aria-label="Pagination"
      className={
        align === 'left'
          ? 'w-full pt-8'
          : 'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6'
      }
    >
      <ul className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {page > 1 ? (
          <li>
            <Link
              href={href(page - 1)}
              rel="prev"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-teal-400"
            >
              ← Previous
            </Link>
          </li>
        ) : null}

        {windowed[0] > 1 ? (
          <li>
            <Link href={href(1)} className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-teal-700">
              1
            </Link>
          </li>
        ) : null}

        {windowed.map((p) => (
          <li key={p}>
            <Link
              href={href(p)}
              aria-current={p === page ? 'page' : undefined}
              className={
                p === page
                  ? 'rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white'
                  : 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-teal-400'
              }
            >
              {p}
            </Link>
          </li>
        ))}

        {windowed[windowed.length - 1] < totalPages ? (
          <li>
            <Link
              href={href(totalPages)}
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-teal-700"
            >
              {totalPages}
            </Link>
          </li>
        ) : null}

        {page < totalPages ? (
          <li>
            <Link
              href={href(page + 1)}
              rel="next"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-teal-400"
            >
              Next →
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

export default function CollectionShell({
  heading,
  intro,
  crumbs,
  products,
  totalProducts,
  body,
  faqs = [],
  linkSections = [],
  basePath,
  page = 1,
  totalPages = 1,
  browseHref,
  browseLabel = 'Open in catalogue',
  shopping = false,
  filters,
}: CollectionShellProps) {
  /**
   * Shopping mode still leads with the H1 and the intro.
   *
   * Pushing every word below the grid is the reflex, and it is wrong twice
   * over: a page whose first text is 48 product names reads as a bare list to
   * a crawler, and a buyer landing from a search result gets no confirmation
   * they are in the right place. Two or three sentences cost nothing and
   * answer both. Everything longer — the buying guide, FAQs, link hubs — does
   * move below the products.
   */
  /**
   * Only the PRODUCT AREA goes full width.
   *
   * Capping a product grid at 1152px left a wide monitor showing four cards
   * with several hundred empty pixels down each side. Everything else — the
   * breadcrumb, the H1 and intro, the buying guide, the FAQs and the link hubs
   * — stays on the 1152px measure, because it is prose and reads better on a
   * measure, and because that is how these pages already looked.
   *
   * So this is deliberately a mixed-width page: a full-bleed grid under a
   * centred header. Asked for explicitly, having seen both.
   */
  const productWidth = shopping ? 'wide' : 'default';

  return (
    <>
      {/*
        Shopping mode swaps the bare navbar for one that also carries the
        mobile filter button and owns the drawer behind it. Facet pages that
        are not in shopping mode have nothing to filter, so they keep the
        plain navbar and never ship the drawer's JavaScript.
      */}
      {shopping ? (
        <CollectionChrome
          filters={filters ?? NO_FILTERS}
          basePath={basePath}
          total={totalProducts}
        />
      ) : (
        <Navbar showUserActions />
      )}
      <main className="w-full pb-28 pt-6 lg:pb-16 lg:pt-28">
        <Breadcrumbs crumbs={crumbs} width={productWidth} />

        <header className={`${CONTENT_WIDTH[productWidth]} pt-4`}>
          {/*
            Shopping pages put the heading and intro in a left column and
            leave the right half empty — deliberately, as the slot a banner
            will go into. Until that exists it is genuinely blank rather than
            a placeholder box, because an empty bordered rectangle reads as
            something failing to load.

            The copy is left-aligned with the grid below it rather than
            centred in a 1152px column, so the two share one left edge and the
            page does not jog sideways as you scroll into the products.

            One column on phones and tablets: there is no room to hold a
            banner beside the text, so the text simply uses the full width.
          */}
          <div className={shopping ? 'lg:grid lg:grid-cols-12 lg:gap-8' : undefined}>
            <div className={shopping ? 'lg:col-span-7 xl:col-span-6' : undefined}>
              {/* Exactly one H1 per page — the primary topical signal. */}
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {heading}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
                {intro}
              </p>
              {shopping ? (
                <p className="mt-2 text-sm text-slate-500">
              {/*
                On desktop the count lives in the filter bar, beside the
                controls that change it. On mobile those controls are behind
                the navbar's filter button, so the count — and, critically,
                whether a filter is narrowing the list at all — has to be
                stated here. Without it a filtered phone view is just a
                shorter page with no explanation.
              */}
              <span className="lg:hidden">
                {totalProducts.toLocaleString('en-IN')}{' '}
                {totalProducts === 1 ? 'product' : 'products'}
                {totalPages > 1 ? ' · ' : ''}
              </span>
                  {totalPages > 1 ? `Page ${page} of ${totalPages}` : ''}
                  {filters && isFiltered(filters) ? (
                    <span className="lg:hidden">
                      {' · '}
                      <span className="font-semibold text-teal-700">filtered</span>
                      {' · '}
                      <Link
                        href={basePath}
                        scroll={false}
                        className="font-semibold text-teal-700 underline underline-offset-2"
                      >
                        clear
                      </Link>
                    </span>
                  ) : null}
                </p>
              ) : totalProducts > 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {totalProducts.toLocaleString('en-IN')} products listed
                  {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
                </p>
              ) : null}
              {browseHref && !shopping ? (
                <p className="mt-4">
                  <Link
                    href={browseHref}
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    {browseLabel} →
                  </Link>
                </p>
              ) : null}
            </div>

            {/*
              Reserved for a banner. Empty on purpose — see the note above.
              `aria-hidden` because there is nothing here to announce yet, and
              a screen reader should not be told about an empty region.
            */}
            {shopping ? (
              <div
                aria-hidden="true"
                className="hidden lg:col-span-5 lg:block xl:col-span-6"
              />
            ) : null}
          </div>
        </header>

        {shopping ? (
          /*
            Two columns on desktop: the sticky filter sidebar and the products.
            The sidebar sticks INSIDE this row, so it follows the scroll for
            exactly as long as there are products beside it and then stops —
            rather than hanging over the buying guide and FAQs below.

            Written out rather than reusing `SeoSection` because the container
            here has to wrap BOTH columns. The heading markup and ids are the same, so the
            document structure is unchanged.
          */
          <section
            id="products"
            aria-labelledby="products-heading"
            className={`${CONTENT_WIDTH[productWidth]} py-8`}
          >
            <div className="flex gap-6 xl:gap-8">
              <CollectionFilters
                filters={filters ?? NO_FILTERS}
                basePath={basePath}
                total={totalProducts}
              />

              {/* `min-w-0`, or the grid's contents refuse to shrink and push
                  the whole row wider than the viewport. */}
              <div className="min-w-0 flex-1">
                <h2
                  id="products-heading"
                  className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  Products available at wholesale rates
                </h2>

                {products.length > 0 ? (
                  <CollectionProductGrid products={products} />
                ) : (
                  /*
                    A filter combination with no matches is a dead end unless
                    the page says so and offers the way out. Silently rendering
                    an empty grid reads as a broken page.
                  */
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No products match these filters.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Not every manufacturer stocks this category.
                    </p>
                    <Link
                      href={basePath}
                      className="mt-4 inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Clear filters
                    </Link>
                  </div>
                )}

                {/* Inside the column, so the sidebar stays pinned alongside
                    the page links rather than stopping above them. */}
                <Pagination
                  basePath={basePath}
                  page={page}
                  totalPages={totalPages}
                  filters={filters}
                  align="left"
                />
              </div>
            </div>
          </section>
        ) : (
          <>
            {products.length > 0 ? (
              <SeoSection
                id="products"
                title="Products available at wholesale rates"
              >
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </ul>
              </SeoSection>
            ) : null}

            <Pagination
              basePath={basePath}
              page={page}
              totalPages={totalPages}
              filters={filters}
            />
          </>
        )}

        {/*
          In shopping mode this page IS the catalogue, so the deep link stops
          being the point of the page and becomes a footnote for the filters
          this page does not carry (price band, city, free-text search).
        */}
        {browseHref && shopping ? (
          <div className="mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6">
            <Link
              href={browseHref}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
            >
              {browseLabel} →
            </Link>
          </div>
        ) : null}

        {body ? (
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{body}</div>
        ) : null}

        {faqs.length > 0 ? (
          <SeoSection id="faq" title="Frequently asked questions">
            <FaqList faqs={faqs} />
          </SeoSection>
        ) : null}

        {linkSections.map((section) => (
          <SeoSection key={section.title} title={section.title} headingLevel={2}>
            <LinkGrid links={section.links} columns={section.columns ?? 4} />
          </SeoSection>
        ))}
      </main>
    </>
  );
}
