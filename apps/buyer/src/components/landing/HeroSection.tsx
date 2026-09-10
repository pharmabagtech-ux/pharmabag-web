'use client';

import BrandsStrip from '@/components/landing/BrandsStrip';

/**
 * Homepage hero.
 *
 * The search box that used to sit under the subheading is gone: the header
 * carries the search now, on every page including this one, so the hero one
 * was a second input a few hundred pixels below the first. It was also the
 * weaker of the two — a plain input that only navigated on Enter, with no
 * type-ahead, no product suggestions and no recent searches.
 *
 * All of its state went with it (the debounce, the spinner, the router push),
 * which is why nothing here needs hooks any more.
 */
export default function HeroSection() {
  return (
    <div className="w-[96vw] sm:w-[92vw] mx-auto flex-1 flex flex-col justify-start items-center bg-transparent mt-4 sm:mt-6 lg:mt-8">
      {/* Main Heading — ONE h1 holding the whole phrase. It used to be split
          into an h1 reading just "India's Only Trusted" with the meaningful
          half ("B2B Pharma Platform") in a separate h2, which left the
          homepage's h1 semantically empty for crawlers. The visual layout is
          unchanged: each line keeps its exact classes as a block span. */}
      <h1 className="text-center">
        <span className="block text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-[72px] text-gray-900 mb-0 sm:mb-1 lg:mb-2 tracking-tight font-medium">
          <span className="text-gray-800">India&apos;s Only </span>
          <span className="text-black font-extrabold">Trusted</span>
        </span>
        <span className="block text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-[72px] text-black mb-1 sm:mb-2 lg:mb-4 tracking-tight font-extrabold pb-2">
          B2B Pharma Platform
        </span>
      </h1>

      {/* Subtext */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 mb-4 sm:mb-6 lg:mb-10 font-bold px-2">
        for <span className="text-black">Wholesaler</span> <span className="font-medium px-1">•</span> Buy at{' '}
        <span className="text-black">Bulk Rates</span> ₹
      </p>

      {/*
        The search bar that sat here is now in the header — see the note at the
        top of this file. The spacing it used to occupy moves onto the brand
        strip so the hero does not collapse onto the logos.
      */}

      {/* Brand Icon Bar integrated right under */}
      <div className="mt-4 h-16 w-full sm:mt-6 sm:h-20 lg:mt-8 lg:h-24">
        <BrandsStrip />
      </div>
    </div>
  );
}
