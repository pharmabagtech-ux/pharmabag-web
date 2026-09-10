'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { useManufacturers } from '@/hooks/useProducts';
import {
  SORT_OPTIONS,
  collectionHref,
  filterQueryString,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * The sort / manufacturer / discount controls themselves.
 *
 * Extracted because a collection page shows them in two places — the sticky
 * sidebar on desktop and the drawer behind the navbar's filter button on
 * mobile — and two copies of a control that writes to the URL is how the two
 * come to disagree about what "no sort" means.
 *
 * Both variants render the same stack of cards, deliberately matching the
 * catalogue's sidebar at /products so the two pages do not teach a buyer two
 * different filter UIs. Only the container around them differs.
 */
export default function CollectionFilterFields({
  filters,
  basePath,
  variant,
  onApply,
}: {
  filters: Filters;
  basePath: string;
  variant: 'sidebar' | 'drawer';
  /** Fired after a control writes to the URL. The drawer uses it to close. */
  onApply?: () => void;
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
  const manufacturers: { id: string; name: string; productCount?: number }[] =
    Array.isArray(data) ? data : [];

  /**
   * These controls are driven by the URL, which means the checked/selected
   * state only becomes true once the server has re-rendered. Bound directly to
   * the prop, a tap visibly does nothing until the round-trip finishes — it
   * reads as a broken control, and on a phone that round-trip is the slowest.
   *
   * So the control follows a local draft immediately and the server's answer
   * overwrites it when it lands. `isPending` dims the stack meanwhile, so a
   * slow response looks like waiting rather than like nothing happening.
   */
  const [draft, setDraft] = useState<Filters>(filters);
  const applied = filterQueryString(filters);
  useEffect(() => {
    setDraft(filters);
    // Keyed on the serialised filters: `filters` is a fresh object every
    // render, so depending on it directly would reset the draft constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const [isPending, startTransition] = useTransition();

  /** Any change resets to page 1: page 9 of a different filter is meaningless. */
  const apply = (next: Filters) => {
    setDraft(next);
    startTransition(() => {
      router.push(collectionHref(basePath, next), { scroll: false });
    });
    onApply?.();
  };

  const card =
    'rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl';
  const heading =
    'mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-800';
  const select =
    'w-full cursor-pointer appearance-none rounded-lg border border-gray-100 bg-gray-50/50 p-3 pr-9 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-emerald-400';

  /** Drawn rather than native, to match the catalogue's sidebar. */
  const Radio = ({
    checked,
    label,
    onChange,
  }: {
    checked: boolean;
    label: string;
    onChange: () => void;
  }) => (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5">
      <input
        type="radio"
        name={`discount-${variant}`}
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
          checked
            ? 'border-lime-500'
            : 'border-gray-300 group-hover:border-lime-500'
        }`}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-lime-500" /> : null}
      </span>
      <span
        className={`text-sm font-medium transition-colors ${
          checked ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
        }`}
      >
        {label}
      </span>
    </label>
  );

  return (
    <div
      className={`space-y-4 transition-opacity ${isPending ? 'opacity-60' : ''}`}
      aria-busy={isPending}
    >
      <div className={card}>
        <h3 className={heading}>
          <label htmlFor={`sort-${variant}`}>Sort by</label>
        </h3>
        <div className="relative">
          <select
            id={`sort-${variant}`}
            className={select}
            value={draft.sort}
            onChange={(e) =>
              apply({ ...draft, sort: e.target.value as Filters['sort'] })
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className={heading}>
          <label htmlFor={`manufacturer-${variant}`}>Manufacturer</label>
        </h3>
        <div className="relative">
          <select
            id={`manufacturer-${variant}`}
            className={select}
            value={draft.manufacturer ?? ''}
            onChange={(e) =>
              apply({ ...draft, manufacturer: e.target.value || null })
            }
          >
            <option value="">All manufacturers</option>
            {/*
              Before the list loads, the applied value still has to be a real
              option or the select would snap back to "All manufacturers" and
              silently misrepresent what the page is showing.
            */}
            {draft.manufacturer &&
            !manufacturers.some((m) => m.name === draft.manufacturer) ? (
              <option value={draft.manufacturer}>{draft.manufacturer}</option>
            ) : null}
            {manufacturers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name.length > 34 ? `${m.name.slice(0, 34)}…` : m.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className={card}>
        {/*
          Worded "Discount offers only", not the catalogue's "Discount PTR
          Only": this filter is applied by the API through `isDiscounted`,
          which covers every scheme type, not only the three PTR ones. The
          catalogue filters its already-loaded page client-side, so its
          narrower label is accurate there and would be a lie here.
        */}
        <h3 className={heading}>Discount type</h3>
        <Radio
          checked={!draft.discountOnly}
          label="All"
          onChange={() => apply({ ...draft, discountOnly: false })}
        />
        <Radio
          checked={draft.discountOnly}
          label="Discount offers only"
          onChange={() => apply({ ...draft, discountOnly: true })}
        />
      </div>
    </div>
  );
}
