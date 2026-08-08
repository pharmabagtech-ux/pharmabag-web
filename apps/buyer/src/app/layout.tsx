import type { Metadata, Viewport } from 'next';
import { Open_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import Footer from '@/components/landing/Footer';
import SiteLinkHub from '@/components/seo/SiteLinkHub';
import JsonLd from '@/components/seo/JsonLd';
import { graph, organizationSchema, websiteSchema } from '@/lib/seo/schema';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_LANG,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo/config';

/**
 * `display: 'swap'` keeps text painted in a fallback face while Open Sans
 * loads, which removes the invisible-text period that was inflating LCP and
 * hurting Core Web Vitals. `preload` warms the font on first paint.
 */
const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  /**
   * `metadataBase` is what turns every relative OG/canonical URL in the app
   * into an absolute one. Without it Next emits relative social image paths,
   * which every social and AI crawler fails to resolve.
   */
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    /**
     * Child pages supply only their own title; the brand is appended here so
     * no page has to remember to do it, and so the brand never appears twice.
     */
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  keywords: [
    'wholesale medicines',
    'bulk medicine supplier',
    'pharmaceutical wholesaler India',
    'medicine distributor',
    'generic medicines wholesale',
    'pharmacy supplier',
    'hospital medicine supplier',
    'B2B pharma marketplace',
    'PCD pharma',
    'medicine exporter India',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Pharmaceuticals',
  formatDetection: { telephone: true, address: true, email: true },
  alternates: {
    canonical: SITE_URL,
    languages: { 'en-IN': SITE_URL, 'x-default': SITE_URL },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Allows full snippets and large previews, which is what makes the site
      // eligible for AI Overview citation rather than a truncated mention.
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: SITE_LOCALE,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  icons: {
    icon: '/pharmabag_logo.png',
    apple: '/pharmabag_logo.png',
  },
};

/**
 * Split out of `metadata` because Next 14 warns when viewport keys live there.
 * `themeColor` also drives the browser chrome colour on mobile.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f766e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * Organization + WebSite are emitted once, site-wide, with stable `@id`s.
   * Every page-level node then references those ids instead of redefining the
   * company, which is how Google consolidates them into a single entity.
   */
  const siteGraph = graph(organizationSchema(), websiteSchema());

  return (
    <html
      lang={SITE_LANG}
      className={openSans.variable}
      style={{
        backgroundImage: "url('/Pharma_ui.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <head>
        {/*
          Warms the connection to the API origin before the first data request.
          Every page fetches from it, so shaving the DNS + TLS handshake off
          the critical path is a direct LCP win on mobile.
        */}
        <link rel="preconnect" href="https://api.pharmabag.in" />
        <link rel="dns-prefetch" href="https://api.pharmabag.in" />
        <JsonLd json={siteGraph} />
      </head>
      <body className={openSans.className}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/*
              `<main>` gives assistive tech and crawlers an unambiguous content
              landmark. Pages render their own <h1> inside it.
            */}
            <div style={{ flex: 1 }}>{children}</div>
            {/*
              Server-rendered link directory. Gives every page crawlable paths
              into the category, brand, molecule and location hierarchies, so
              authority reaches deep pages instead of pooling on the homepage.
            */}
            <SiteLinkHub />
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
