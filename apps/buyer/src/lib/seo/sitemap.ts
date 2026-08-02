/**
 * XML sitemap serialisation.
 *
 * Written by hand rather than through Next's `MetadataRoute.Sitemap` helper
 * because this site needs a sitemap *index* over chunked children (26,815
 * products, plus facets), and needs per-response cache headers so a crawler
 * hitting the product chunks cannot hammer the single API box.
 *
 * Protocol limits being respected: 50,000 URLs and 50 MB uncompressed per
 * sitemap. Chunks are held to 5,000 — far below the ceiling — because smaller
 * sitemaps get re-crawled more readily and make it much easier to see in
 * Search Console *which* slice of the catalogue has an indexing problem.
 */
import { absoluteUrl } from './url';

export interface SitemapUrl {
  path: string;
  lastModified?: string | Date | null;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  /**
   * Relative importance within THIS site only. Google largely ignores it, but
   * Bing and several AI crawlers still use it to order their fetch queue,
   * which is worth having on a catalogue this size.
   */
  priority?: number;
}

/** XML-escapes a URL. Ampersands in query strings break sitemaps otherwise. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toW3CDate(value?: string | Date | null): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function renderUrlSet(urls: SitemapUrl[]): string {
  const entries = urls
    .map((u) => {
      const loc = xmlEscape(absoluteUrl(u.path));
      const lastmod = toW3CDate(u.lastModified);
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        u.changeFrequency
          ? `    <changefreq>${u.changeFrequency}</changefreq>`
          : null,
        typeof u.priority === 'number'
          ? `    <priority>${u.priority.toFixed(1)}</priority>`
          : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export function renderSitemapIndex(
  sitemaps: { path: string; lastModified?: string | Date | null }[],
): string {
  const entries = sitemaps
    .map((s) => {
      const loc = xmlEscape(absoluteUrl(s.path));
      const lastmod = toW3CDate(s.lastModified ?? new Date());
      return [
        '  <sitemap>',
        `    <loc>${loc}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        '  </sitemap>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

/** URLs per product chunk. Well under the 50,000 protocol limit, on purpose. */
export const PRODUCTS_PER_SITEMAP = 5000;

/**
 * Standard response for any sitemap route.
 *
 * `s-maxage` lets the CDN/proxy absorb crawler traffic;
 * `stale-while-revalidate` means a crawler never waits on a cold regeneration
 * of a 5,000-URL document.
 */
export function xmlResponse(body: string, maxAge = 3600): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}
