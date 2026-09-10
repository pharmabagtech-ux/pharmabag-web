'use client';

import Link from 'next/link';
import CollectionFilterFields from './CollectionFilterFields';
import {
  isFiltered,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * The desktop filter bar above the grid.
 *
 * Hidden below `lg`, where the same controls live in the drawer behind the
 * navbar's filter button instead — on a phone this card pushed the first
 * product most of a screen further down for a control most buyers never touch.
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
  return (
    <div className="mx-auto hidden w-full max-w-6xl px-4 sm:px-6 lg:block">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-4">
        <CollectionFilterFields
          filters={filters}
          basePath={basePath}
          variant="bar"
        />

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
