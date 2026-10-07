'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PromoBanner } from '@/lib/seo/banners';

/**
 * The admin-managed promo strip that sits directly under the header.
 *
 * This component owns rotation and nothing else — it never fetches. The pages
 * that render it read the banners server-side so the strip is in the HTML
 * rather than appearing a beat after hydration.
 *
 * The artwork IS the content: there are no text fields to render, which is why
 * every slide leans on `altText` for its accessible name. That text is the
 * only textual representation the banner has.
 */

/** Matches the artwork guidance in the admin panel: 1920x180 and 800x240. */
const DESKTOP_ASPECT = '1920 / 180';
const MOBILE_ASPECT = '800 / 240';

interface Props {
  banners: PromoBanner[];
  rotationSeconds: number;
}

export default function PromoBannerStrip({ banners, rotationSeconds }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = banners.length;
  const multiple = count > 1;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Visitors who ask for less motion get a strip that never moves on its own.
  // Controls still work, so no banner becomes unreachable.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // A backgrounded tab must not cycle the whole set unseen, so the timer
  // stops with the tab rather than running against an invisible page.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!multiple || paused || reducedMotion) return;
    const delay = Math.max(2, rotationSeconds) * 1000;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), delay);
    return () => window.clearInterval(timer);
  }, [multiple, paused, reducedMotion, rotationSeconds, count]);

  // Guard AFTER the hooks: bailing earlier would change the hook order between
  // renders when an admin deletes the last banner.
  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative w-[96vw] sm:w-[92vw] mx-auto mb-4 sm:mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null || !multiple) return;
        const delta = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) < 40) return;
        go(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-sm">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            className={i === index ? 'block' : 'hidden'}
          >
            <Slide banner={banner} priority={i === 0} />
          </div>
        ))}
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous promotion"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white sm:block"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next promotion"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow-sm backdrop-blur transition hover:bg-white sm:block"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            role="tablist"
            aria-label="Choose a promotion"
            className="mt-2 flex justify-center gap-1.5"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') go(index - 1);
              if (e.key === 'ArrowRight') go(index + 1);
            }}
          >
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Promotion ${i + 1}`}
                tabIndex={i === index ? 0 : -1}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-gray-800' : 'w-1.5 bg-gray-400 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <span aria-live="polite" className="sr-only">
            {`Promotion ${index + 1} of ${count}`}
          </span>
        </>
      )}
    </section>
  );
}

function Slide({ banner, priority }: { banner: PromoBanner; priority: boolean }) {
  const mobileSrc = banner.mobileImageUrl || banner.imageUrl;

  /*
   * Two <Image> elements toggled by breakpoint rather than one <picture> with
   * <source> children: next/image carries `priority`, the optimiser and the
   * sizing this strip needs to reserve its height, and it does not accept
   * <source> children. The aspect-ratio wrappers are what stop the hero below
   * jumping while the artwork loads.
   */
  const art = (
    <>
      <div className="relative w-full sm:hidden" style={{ aspectRatio: MOBILE_ASPECT }}>
        <Image
          src={mobileSrc}
          alt={banner.altText}
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover"
        />
      </div>
      <div className="relative hidden w-full sm:block" style={{ aspectRatio: DESKTOP_ASPECT }}>
        <Image
          src={banner.imageUrl}
          alt={banner.altText}
          fill
          sizes="92vw"
          priority={priority}
          className="object-cover"
        />
      </div>
    </>
  );

  if (!banner.linkUrl) return art;

  return (
    <Link href={banner.linkUrl} aria-label={banner.altText} className="block">
      {art}
    </Link>
  );
}
