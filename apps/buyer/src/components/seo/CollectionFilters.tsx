'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useManufacturers } from '@/hooks/useProducts';
import {
  SORT_OPTIONS,
  collectionHref,
  isFiltered,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * Sort and filter controls for a collection page.
 *
 * Every control writes to the URL and lets the server re-render, rather than
 * filtering an array in the browser. That costs a navigation, and buys three
 * things worth more than it: the filtered result is server-rendered (so it is
 * real HTML, not an empty grid a crawler would see), the view is shareable and
 * survives a refresh or a back button, and the server stays the single source
 * of truth about which products this page is showing.
 *
 * The page itself marks any filtered view `noindex, follow` — see the category
 * page — so these controls cannot fragment the category's ranking across every
 * sort-and-brand permutation.
 */
export default function CollectionFilters({
  filters,
  basePath,
  total,
}: {
  filters: Filters;
  basePath: string;
  total: number;
}) {
  const router = useRouter();

  /**
   * The manufacturer list is fetched in the BROWSER on purpose.
   *
   * There are ~1,674 of them. Server-rendering that into a <select> would add
   * roughly a hundred kilobytes of options to the HTML of every collection
   * page — pure weight for a crawler, on a page whose job is to be crawled
   * cheaply. Fetched here it is cached across the session by react-query and
   * never reaches the document.
   */
  const { data } = useManufacturers();
  const manufacturers: { id: string; name: string }[] = Array.isArray(data)
    ? data
    : [];

  /** Any change resets to page 1: page 9 of a different filter is meaningless. */
  const apply = (next: Filters) => {
    router.push(collectionHref(basePath, next), { scroll: false });
  };

  const selectClass =
    'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1 sm:max-w-[220px]">
          <label
            htmlFor="collection-sort"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Sort by
          </label>
          <select
            id="collection-sort"
            className={selectClass}
            value={filters.sort}
            onChange={(e) =>
              apply({ ...filters, sort: e.target.value as Filters['sort'] })
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1 sm:max-w-[280px]">
          <label
            htmlFor="collection-manufacturer"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            Manufacturer
          </label>
          <select
            id="collection-manufacturer"
            className={selectClass}
            value={filters.manufacturer ?? ''}
            onChange={(e) =>
              apply({ ...filters, manufacturer: e.target.value || null })
            }
          >
            <option value="">All manufacturers</option>
            {/*
              Before the list loads, the applied value still has to be a real
              option or the select would snap back to "All manufacturers" and
              silently misrepresent what the page is showing.
            */}
            {filters.manufacturer &&
            !manufacturers.some((m) => m.name === filters.manufacturer) ? (
              <option value={filters.manufacturer}>{filters.manufacturer}</option>
            ) : null}
            {manufacturers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2 py-2 sm:pb-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            checked={filters.discountOnly}
            onChange={(e) =>
              apply({ ...filters, discountOnly: e.target.checked })
            }
          />
          <span className="text-sm font-medium text-slate-700">
            Discount offers only
          </span>
        </label>

        <div className="flex items-center gap-3 sm:ml-auto sm:pb-2.5">
          <span className="text-sm text-slate-500">
            {total.toLocaleString('en-IN')}{' '}
            {total === 1 ? 'product' : 'products'}
          </span>
          {isFiltered(filters) ? (
            /*
              A real link, not a button: it is a navigation to the canonical
              URL of this collection, so it should be openable in a new tab and
              visible to a crawler as the way back to the indexable page.
            */
            <Link
              href={basePath}
              scroll={false}
              className="text-sm font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
