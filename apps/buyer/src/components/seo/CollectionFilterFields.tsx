'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
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
 * Extracted because a collection page shows them in two places — the desktop
 * bar above the grid, and the drawer behind the navbar's filter button on
 * mobile — and two copies of a control that writes to the URL is how the two
 * come to disagree about what "no sort" means.
 *
 * Only the styling differs between the two, so `variant` picks the class names
 * and everything else is shared.
 */
export default function CollectionFilterFields({
  filters,
  basePath,
  variant,
  onApply,
}: {
  filters: Filters;
  basePath: string;
  variant: 'bar' | 'drawer';
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
   * the prop, a tap on the checkbox visibly does nothing until the round-trip
   * finishes — it reads as a broken control, and on a phone that round-trip is
   * the slowest.
   *
   * So the control follows a local draft immediately and the server's answer
   * overwrites it when it lands. `isPending` dims the group meanwhile, so a
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

  const drawer = variant === 'drawer';

  const label = drawer
    ? 'text-[11px] font-bold uppercase tracking-widest text-gray-800'
    : 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

  const select = drawer
    ? 'w-full cursor-pointer appearance-none rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-emerald-400'
    : 'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600';

  /** Dims the group while the server is producing the filtered page. */
  const busy = isPending ? 'opacity-60 transition-opacity' : 'transition-opacity';

  const card = drawer
    ? 'rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl'
    : 'min-w-0 flex-1 sm:max-w-[220px]';

  return (
    <>
      <div className={`${card} ${busy}`} aria-busy={isPending}>
        <label htmlFor={`sort-${variant}`} className={label}>
          Sort by
        </label>
        <div className={drawer ? 'relative mt-3' : 'relative'}>
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
          {drawer ? (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`${drawer ? card : 'min-w-0 flex-1 sm:max-w-[280px]'} ${busy}`}
        aria-busy={isPending}
      >
        <label htmlFor={`manufacturer-${variant}`} className={label}>
          Manufacturer
        </label>
        <select
          id={`manufacturer-${variant}`}
          className={drawer ? `${select} mt-3` : select}
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
              {m.name.length > 40 ? `${m.name.slice(0, 40)}…` : m.name}
            </option>
          ))}
        </select>
      </div>

      <label
        className={
          drawer
            ? `${card} ${busy} flex cursor-pointer select-none items-center gap-3`
            : `${busy} flex cursor-pointer select-none items-center gap-2 py-2 sm:pb-2.5`
        }
      >
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          checked={draft.discountOnly}
          onChange={(e) => apply({ ...draft, discountOnly: e.target.checked })}
        />
        <span
          className={
            drawer
              ? 'text-sm font-bold text-gray-800'
              : 'text-sm font-medium text-slate-700'
          }
        >
          Discount offers only
        </span>
      </label>
    </>
  );
}
