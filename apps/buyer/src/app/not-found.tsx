import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

/**
 * Root 404 page — and the site's 404 LOGGER.
 *
 * Every real 404 (unknown routes, dead product/blog slugs via notFound())
 * renders through here. The path arrives in the `x-pathname` header stamped
 * by the middleware, because a not-found boundary cannot read the URL any
 * other way. Logging is strictly fire-and-forget: a failed or slow log call
 * must never delay or break the 404 render — hence the 1.5s abort and the
 * blanket catch.
 *
 * This is what feeds the admin panel's 404 log, and unlike client-side
 * analytics it sees CRAWLER 404s — the ones that actually matter for SEO.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

async function log404(path: string, referrer: string | null): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1_500);
    await fetch(`${API_BASE}/redirects/track-404`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path, referrer: referrer ?? undefined }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
  } catch {
    // Never let logging affect the page.
  }
}

export default async function NotFound() {
  const h = headers();
  const path = h.get('x-pathname');
  const referrer = h.get('referer');

  if (path) {
    await log404(path, referrer);
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f2fcf6] px-4 text-center">
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
