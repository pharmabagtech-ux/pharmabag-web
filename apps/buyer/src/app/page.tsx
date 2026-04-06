'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BrandsStrip from '@/components/landing/BrandsStrip';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';

export default function HomePage() {
  return (
    <main className="w-full bg-gradient-to-br from-[#8deaffe] via-[#e0ffc7e6] to-[#f4ffede6] min-h-screen relative">
      <Navbar showUserActions={true} />
      <section className="flex-1 overflow-hidden flex flex-col bg-transparent pt-16 lg:pt-24">
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
