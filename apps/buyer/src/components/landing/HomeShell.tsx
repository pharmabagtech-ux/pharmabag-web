'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';
import PromoBannerStrip from '@/components/promo/PromoBannerStrip';
import type { PromoBannerPayload } from '@/lib/seo/banners';

/**
 * The homepage body, unchanged from when it was `app/page.tsx` itself.
 *
 * It moved here so the page above it can be a server component and fetch the
 * promo banners during render. Fetched client-side instead, the one element
 * whose job is to be seen first would be the last thing to appear.
 *
 * (The unused `BrandsStrip` import the old file carried is gone — HeroSection
 * renders that strip itself.)
 */
export default function HomeShell({ banners }: { banners: PromoBannerPayload }) {
  const handleLoginClick = () => {
    window.dispatchEvent(new CustomEvent('open-login'));
  };

  return (
    <main className="w-full bg-gradient-to-br from-[#8deaffe] via-[#e0ffc7e6] to-[#f4ffede6] min-h-screen relative">
      <Navbar showUserActions={true} onLoginClick={handleLoginClick} />
      <section className="flex-1 overflow-hidden flex flex-col bg-transparent pt-16 lg:pt-24">
        {/*
          Inside the padded section rather than directly under <Navbar>: the
          navbar is `fixed lg:top-4`, so a strip above this `lg:pt-24` offset
          would render underneath it on desktop.
        */}
        {banners.banners.length > 0 && (
          <PromoBannerStrip
            banners={banners.banners}
            rotationSeconds={banners.rotationSeconds}
          />
        )}
        <div className="w-full flex-shrink-0 lg:pt-10 bg-transparent flex flex-col mb-10 lg:mb-8">
          <HeroSection />
        </div>
        <div className="flex-1 lg:pt-10 min-h-[300px] overflow-hidden bg-transparent">
          <ProductCarousel />
        </div>
      </section>

      <TrustSection />
      <Testimonials />
    </main>
  );
}
