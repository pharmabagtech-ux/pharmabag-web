'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import CollectionFilterFields from './CollectionFilterFields';
import {
  isFiltered,
  type CollectionFilters as Filters,
} from '@/lib/seo/collection-filters';

/**
 * Navbar plus the mobile filter drawer, for collection pages in shopping mode.
 *
 * On a phone the filter card sat between the intro and the products, so a
 * buyer had to scroll past a sort control they mostly did not want before
 * reaching a single product. The controls move behind the navbar's filter
 * button instead — which already exists and is what the catalogue at
 * /products uses, so the two behave the same way.
 *
 * This owns the drawer's open state, which is why it also renders the Navbar:
 * the button lives in the navbar, the panel lives here, and a server component
 * cannot pass `onFilterClick` across the boundary. The desktop bar above the
 * grid is unchanged and simply hidden below `lg`.
 */
export default function CollectionChrome({
  filters,
  basePath,
  total,
}: {
  filters: Filters;
  basePath: string;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  // Matches the catalogue: the page behind a full-height drawer must not scroll.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <Navbar showUserActions onFilterClick={() => setOpen(true)} />

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="safe-bottom fixed inset-y-0 right-0 z-[130] w-[280px] space-y-5 overflow-y-auto bg-[#f2fcf6] p-4 pt-16 shadow-2xl sm:w-[320px] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="absolute right-4 top-4 rounded-full bg-white/80 p-2 hover:bg-white"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>

              <h2 className="text-lg font-bold text-gray-900">Filters</h2>

              <CollectionFilterFields
                filters={filters}
                basePath={basePath}
                variant="drawer"
              />

              {/*
                The count updates as filters are applied, because each control
                navigates and this component stays mounted across the soft
                navigation. It doubles as the confirm button — nothing is
                pending, so "Show" only has to close the panel.
              */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
                >
                  Show {total.toLocaleString('en-IN')}{' '}
                  {total === 1 ? 'product' : 'products'}
                </button>
                {isFiltered(filters) ? (
                  <Link
                    href={basePath}
                    scroll={false}
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Clear filters
                  </Link>
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
