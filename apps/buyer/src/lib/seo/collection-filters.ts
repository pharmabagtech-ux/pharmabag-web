/**
 * Filter and sort state for collection pages, parsed from the URL.
 *
 * One module owns this because three things must agree about what counts as a
 * filter and they are written in three different places:
 *
 *  1. the server fetch (which products to ask the API for),
 *  2. the `robots` directive (a filtered view must not be indexed, or the
 *     category's authority fragments across every sort/brand permutation),
 *  3. every link on the page (pagination has to carry the active filters, or
 *     page 2 silently drops them).
 *
 * State lives in the URL rather than in React state on purpose: the grid is
 * server-rendered, so a filter that only existed in the browser would leave the
 * server sending one set of products and the client showing another.
 */
import type { ProductQuery } from './catalog';

/**
 * Sort options are limited to the ones the API actually honours.
 *
 * Verified against the live API before this shipped: `sortBy=name` and
 * `sortBy=newest`/`createdAt` change the ordering, while `sortBy=price` and
 * `sortBy=mrp` return byte-identical results for `asc` and `desc` — the
 * parameter is accepted and ignored. Offering "Price: Low to High" here would
 * therefore be a control that visibly does nothing, so it is deliberately
 * absent until the API supports it. (The catalogue at /products still offers
 * it, and it is equally dead there — a pre-existing API bug, not this page's.)
 */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const DEFAULT_SORT: SortValue = 'newest';

export interface CollectionFilters {
  sort: SortValue;
  /** Exact manufacturer name; the API matches on the stored spelling. */
  manufacturer: string | null;
  discountOnly: boolean;
}

/** The unfiltered, canonical view of a collection. */
export const NO_FILTERS: CollectionFilters = {
  sort: DEFAULT_SORT,
  manufacturer: null,
  discountOnly: false,
};

export type CollectionSearchParams = {
  page?: string;
  sort?: string;
  manufacturer?: string;
  discount?: string;
};

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export function parseFilters(
  searchParams: CollectionSearchParams | undefined,
): CollectionFilters {
  const rawSort = searchParams?.sort;
  return {
    sort: rawSort && SORT_VALUES.has(rawSort) ? (rawSort as SortValue) : DEFAULT_SORT,
    manufacturer: searchParams?.manufacturer?.trim() || null,
    discountOnly: searchParams?.discount === '1',
  };
}

/**
 * Whether the visitor has narrowed the page away from its canonical form.
 *
 * Pagination is NOT a filter. Page 2 is a genuinely distinct page that must
 * stay indexable and self-canonical — treating it as a filtered view is the
 * classic mistake that hides most of a catalogue from search.
 */
export function isFiltered(filters: CollectionFilters): boolean {
  return (
    filters.sort !== DEFAULT_SORT ||
    filters.manufacturer !== null ||
    filters.discountOnly
  );
}

/**
 * Filter state translated into the API's query vocabulary.
 *
 * The default sort deliberately sends NO sort parameter. The API's own default
 * ordering is already newest-first (verified against live), so omitting it
 * means the canonical, indexable view of a collection issues byte-identical
 * requests to the ones it issued before filters existed — same cache key, same
 * rows, same order. A filter UI must not be able to change what the indexed
 * page shows.
 */
export function filterQuery(filters: CollectionFilters): Partial<ProductQuery> {
  const sort: Partial<ProductQuery> =
    filters.sort === 'name-asc'
      ? { sortBy: 'name', sortOrder: 'asc' }
      : filters.sort === 'name-desc'
        ? { sortBy: 'name', sortOrder: 'desc' }
        : {};

  return {
    ...sort,
    manufacturer: filters.manufacturer ?? undefined,
    isDiscounted: filters.discountOnly || undefined,
  };
}

/**
 * The active filters as a query string, without `page`.
 *
 * Callers add pagination themselves so that one function cannot produce
 * `?page=2` on a link that meant page 3. Returns '' when nothing is applied,
 * which keeps the canonical URL clean.
 */
export function filterQueryString(filters: CollectionFilters): string {
  const params = new URLSearchParams();
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.manufacturer) params.set('manufacturer', filters.manufacturer);
  if (filters.discountOnly) params.set('discount', '1');
  return params.toString();
}

/**
 * Path for this exact view, used for both hrefs and the canonical.
 *
 * Page 1 of an unfiltered collection returns the bare path — anything else
 * would canonicalise the category page to a URL nobody links to.
 */
export function collectionHref(
  basePath: string,
  filters: CollectionFilters,
  page = 1,
): string {
  const params = new URLSearchParams(filterQueryString(filters));
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
