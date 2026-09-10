'use client';

import Link from 'next/link';
import CollectionFilterFields from './CollectionFilterFields';
import {
  isFiltered,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * The desktop filter sidebar, pinned beside the product grid.
 *
 * `sticky` rather than `fixed`, and that is the whole behaviour: the sidebar
 * follows the scroll while the products are on screen and then stops at the
 * bottom of its column, so it does not hang over the buying guide, FAQs and
 * link sections underneath. A fixed panel would sit there over the prose for
 * the rest of the page. The column it sticks inside is the one wrapping the
 * grid and its pagination — see `CollectionShell`.
 *
 * Hidden below `lg`, where the same controls live in the drawer behind the
 * navbar's filter button instead.
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
    <aside
      aria-label="Filters"
      className="hidden w-[248px] shrink-0 lg:block xl:w-[268px]"
    >
      {/*
        `top-28` clears the floating desktop navbar, which sits at `top-4` and
        is roughly 88px tall. `max-h`/`overflow-y-auto` matter once a filter
        stack grows taller than the viewport — without them the bottom card
        would be unreachable, because a sticky element taller than the screen
        simply never scrolls to its own end.
      */}
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pb-2">
        <CollectionFilterFields
          filters={filters}
          basePath={basePath}
          variant="sidebar"
        />

        <p className="mt-4 px-1 text-xs text-slate-500">
          {total.toLocaleString('en-IN')} {total === 1 ? 'product' : 'products'}
          {isFiltered(filters) ? (
            <>
              {' · '}
              {/*
                A real link, not a button: it navigates to the canonical URL of
                this collection, so it should be openable in a new tab and
                visible to a crawler as the way back to the indexable page.
              */}
              <Link
                href={basePath}
                scroll={false}
                className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
              >
                clear filters
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </aside>
  );
}
