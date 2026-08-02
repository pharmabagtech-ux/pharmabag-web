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
     * AVIF first, WebP second. Product imagery is the heaviest payload on a
     * listing page, so format negotiation is the single largest LCP lever
     * available without touching any component.
     */
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    /** Cache optimised variants for a day instead of re-encoding per request. */
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
