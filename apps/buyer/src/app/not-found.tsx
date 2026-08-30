import Link from 'next/link';
import type { Metadata } from 'next';
import Track404Client from '@/components/Track404Client';

/**
 * Root 404 page — deliberately STATIC.
 *
 * An earlier version read `headers()` here to log the dead path server-side.
 * That single dynamic API forced EVERY route in the app to per-request
 * rendering, because Next prerenders the not-found shell as part of each
 * page. The logging now happens in two safer places instead:
 *
 *  - server-side at the notFound() call sites that know their path from
 *    params (product + blog shells) — covers crawler hits on renamed URLs,
 *    which is the traffic that matters for SEO;
 *  - client-side here via <Track404Client/> for arbitrary dead paths.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f2fcf6] px-4 text-center">
      <Track404Client />
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">404</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved. It may
        have been renamed in a catalogue update.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-600"
        >
          Browse medicines
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
