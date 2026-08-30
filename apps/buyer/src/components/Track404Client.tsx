'use client';
import { useEffect } from 'react';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

/**
 * Browser-side 404 reporter rendered by the (fully static) not-found page.
 *
 * It reads the path from `window.location` instead of the server reading
 * `headers()` — the server-side variant forced the entire app dynamic (see
 * lib/track-404.ts). Catalogue 404s are additionally reported server-side at
 * their notFound() call sites, so bots are covered where it matters; this
 * component covers human traffic on arbitrary dead paths.
 */
export default function Track404Client() {
  useEffect(() => {
    try {
      const path = window.location.pathname;
      if (!path || path === '/') return;
      // Direct to the API origin — its CORS allow-list includes this site,
      // and a same-origin proxy route would be one more moving part.
      void fetch(`${API_BASE}/redirects/track-404`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path, referrer: document.referrer || undefined }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* reporting must never break the page */
    }
  }, []);

  return null;
}
