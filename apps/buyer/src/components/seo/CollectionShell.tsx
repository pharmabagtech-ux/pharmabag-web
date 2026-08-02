import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import { Breadcrumbs, SeoSection, FaqList, LinkGrid, type SeoLink } from './SeoContent';
import type { Faq } from '@/lib/seo/content';
import type { CatalogProduct } from '@/lib/seo/catalog';
import { routes } from '@/lib/seo/url';
import { inr, bestListing } from '@/lib/seo/content';

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
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  const windowed: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
    windowed.push(p);
  }

  return (
    <nav
      aria-label="Pagination"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
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
}: CollectionShellProps) {
  return (
    <>
      <Navbar showUserActions />
      <main className="w-full pb-16 pt-20 lg:pt-28">
        <Breadcrumbs crumbs={crumbs} />

        <header className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
          {/* Exactly one H1 per page — the primary topical signal. */}
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {intro}
          </p>
          {totalProducts > 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              {totalProducts.toLocaleString('en-IN')} products listed
              {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
            </p>
          ) : null}
          {browseHref ? (
            <p className="mt-4">
              <Link
                href={browseHref}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {browseLabel} →
              </Link>
            </p>
          ) : null}
        </header>

        {products.length > 0 ? (
          <SeoSection id="products" title="Products available at wholesale rates">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ul>
          </SeoSection>
        ) : null}

        <Pagination basePath={basePath} page={page} totalPages={totalPages} />

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
