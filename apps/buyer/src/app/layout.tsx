import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
import { fetchSiteSettings } from '@/lib/seo/site-settings';

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

/**
 * The root head is built per-request (with a 5-minute-cached settings fetch)
 * instead of being a static export, so that verification tokens, GA4 and the
 * default share image can be edited in the admin panel and go live without a
 * redeploy. Env vars remain the fallback for every runtime value, so an
 * unreachable API or empty settings row reproduces the old behaviour exactly.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();

  const ogImage = settings.defaultOgImage
    ? { url: settings.defaultOgImage, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }
    : DEFAULT_OG_IMAGE;

  return {
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
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [ogImage.url],
  },
  icons: {
    icon: '/pharmabag_logo.png',
    apple: '/pharmabag_logo.png',
  },
  /**
   * Search-engine ownership verification. The primary source is now the
   * admin panel's SEO Settings page (live within ~5 minutes of saving); the
   * env vars remain as a fallback so an already-configured deployment keeps
   * working. Both tags render only when a real token exists somewhere.
   */
  verification: {
    ...((settings.gscVerification || process.env.NEXT_PUBLIC_GSC_VERIFICATION)
      ? { google: settings.gscVerification || process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : {}),
    ...((settings.bingVerification || process.env.NEXT_PUBLIC_BING_VERIFICATION)
      ? {
          other: {
            'msvalidate.01':
              (settings.bingVerification || process.env.NEXT_PUBLIC_BING_VERIFICATION) as string,
          },
        }
      : {}),
  },
  };
}

/**
 * Split out of `metadata` because Next 14 warns when viewport keys live there.
 * `themeColor` also drives the browser chrome colour on mobile.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f766e',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * Same cached fetch as generateMetadata — Next dedupes identical fetches
   * within a request, so this costs nothing extra. Tolerant: {} on failure.
   */
  const settings = await fetchSiteSettings();

  /**
   * Organization + WebSite are emitted once, site-wide, with stable `@id`s.
   * Every page-level node then references those ids instead of redefining the
   * company, which is how Google consolidates them into a single entity.
   * Admin-panel settings (sameAs profiles, contact info) override the code
   * defaults when present.
   */
  const siteGraph = graph(
    organizationSchema({
      sameAs: settings.socialProfiles,
      email: settings.supportEmail,
      addressLocality: settings.addressLocality,
      addressRegion: settings.addressRegion,
    }),
    websiteSchema(),
  );

  /** GA4: panel-configured id first, env var as the legacy fallback. */
  const ga4Id = settings.ga4MeasurementId || process.env.NEXT_PUBLIC_GA4_ID;

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
        {/*
          GA4, gated on a real measurement id from the admin panel (primary)
          or the NEXT_PUBLIC_GA4_ID env var (fallback) — nothing loads until
          one exists, so this ships inert with zero Core Web Vitals cost.
          afterInteractive keeps it off the critical path once enabled.
        */}
        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4Id}');`}
            </Script>
          </>
        )}
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
