'use client';

import Script from 'next/script';
import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Meta (Facebook) Pixel — visitor tracking only.
 *
 * Fires `PageView` and nothing else. No ViewContent, no AddToCart, no
 * Purchase, and deliberately NO product payload: PharmaBag is a pharmacy
 * marketplace, and a medicine name attached to an identifiable visitor is
 * exactly the health data Meta's Business Tools Terms prohibit. Keeping the
 * pixel to bare page views means no product, price or order data ever
 * reaches Meta, so that question cannot arise.
 *
 * Rendered only when an admin has saved a pixel id (SEO → Settings), so this
 * ships inert. `afterInteractive` keeps it off the critical path.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * The storefront is an SPA: client-side navigation never reloads the page, so
 * the base snippet's one-time PageView would be the ONLY event of a session.
 * A pharmacy browsing fifteen products would register as a single visit.
 * This fires a PageView on each subsequent route change.
 *
 * Must stay behind <Suspense> — a bare useSearchParams() that isn't suspended
 * opts the entire buyer app out of static rendering.
 */
function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    if (!fullPath) return;

    // The base snippet already counted the entry page. Recording it here too
    // would double-count every session's first view.
    if (previousPath.current === null) {
      previousPath.current = fullPath;
      return;
    }
    if (previousPath.current === fullPath) return;

    previousPath.current = fullPath;
    window.fbq?.('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`(function(){
var n=navigator;
if(n.doNotTrack==='1'||n.msDoNotTrack==='1'||window.doNotTrack==='1')return;
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');
})();`}
      </Script>
      {/*
        No-JS fallback. It cannot honour Do Not Track — but a browser with no
        JavaScript has no way to express DNT to the page in the first place,
        so no signal is being ignored here. Mostly this serves crawlers.
      */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelRouteTracker />
      </Suspense>
    </>
  );
}
