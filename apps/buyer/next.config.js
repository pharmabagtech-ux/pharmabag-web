/** @type {import('next').NextConfig} */
console.log('[NextConfig] API URL:', process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT FOUND');

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3000/api';

/**
 * Security headers, applied to every response.
 *
 * These are a documented trust signal for quality evaluation of commerce
 * sites, and most are load-bearing for real security rather than only for SEO.
 */
const securityHeaders = [
  {
    // Stops MIME sniffing turning an uploaded file into executable content.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Blocks clickjacking of the ordering flow via a hostile iframe.
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    /**
     * Full URL to same-origin destinations, origin only cross-origin. Keeps
     * referrer analytics useful without leaking order or account paths to
     * third parties.
     */
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Nothing here needs these; denying them shrinks the attack surface.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    /**
     * HSTS. Production is HTTPS-only, so this removes the plaintext first hop.
     * `preload` is deliberately omitted — it is effectively irreversible and
     * should be the domain owner's explicit decision, not a side effect of a
     * config change.
     */
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@pharmabag/ui', '@pharmabag/api-client', '@pharmabag/utils', 'framer-motion'],
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },

  /** Gzip/brotli at the Node layer, for hosts without a compressing proxy. */
  compress: true,

  /** Removes the `X-Powered-By: Next.js` version disclosure. */
  poweredByHeader: false,

  /**
   * Trailing slashes off, enforced. `/products` and `/products/` serving the
   * same content are duplicate URLs; picking one and redirecting the other is
   * what stops canonical signals splitting between them.
   */
  trailingSlash: false,

  images: {
    /**
     * Narrowed from `hostname: '**'`.
     *
     * A wildcard made the image optimiser an open proxy for any host on the
     * internet — a genuine abuse vector, and it also prevented Next from
     * making caching assumptions. These are the origins the catalogue
     * actually serves images from.
     */
    remotePatterns: [
      { protocol: 'https', hostname: 'pharmabag03.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pharmabag.in' },
      { protocol: 'https', hostname: '*.pharmabag.in' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    /**
     * WebP only — AVIF output is deliberately OFF.
     *
     * Catalogue sources are ALREADY 800x800 AVIF, so the optimiser was
     * decoding AVIF only to re-encode AVIF. Measured against the live box
     * (2026-08-31), same source image, per request:
     *
     *   AVIF out @640w  1804 ms / 35.0 KB     AVIF out @256w  554 ms / 7.6 KB
     *   WebP out @640w   508 ms / 43.7 KB     WebP out @256w  337 ms / 8.9 KB
     *
     * AVIF costs 3.5x the CPU to save about 1 KB. A product grid is dozens of
     * those encodes at once on a single box, which is what made photos crawl.
     * Every browser that decodes AVIF decodes WebP, so nothing regresses.
     *
     * Revisit only once the optimiser cache is proven to hit reliably: with a
     * warm cache the encode is paid once and AVIF wins on bytes.
     */
    formats: ['image/webp'],
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    /**
     * Cache optimised variants for a day instead of re-encoding per request.
     *
     * NOTE: as of 2026-08-31 the live server returns `x-nextjs-cache: MISS`
     * on every request including immediate repeats, so this TTL is not
     * currently taking effect (suspected: `output: 'standalone'` runs the
     * server from .next/standalone, where the runtime image cache directory
     * is not persisting). The nginx proxy cache in front of /_next/image is
     * the durable fix; this stays correct for when the app cache works.
     */
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        /**
         * Sitemaps regenerate on a schedule, so a short shared cache with a
         * long stale window keeps crawler traffic off the single API box.
         */
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        /**
         * `/blog` was a REWRITE to `/blogs`, so identical content was served
         * at two URLs — duplicate content, with neither URL consolidating the
         * other's signals. A 301 makes `/blogs` canonical and passes the
         * accumulated equity across.
         */
        source: '/blog',
        destination: '/blogs',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: '/blogs/:path*',
        permanent: true,
      },
    ];
  },

  rewrites: async () => [
    { source: '/api/:path*', destination: `${API_ORIGIN}/:path*` },
  ],
};

module.exports = nextConfig;
