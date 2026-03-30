'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BrandsStrip from '@/components/landing/BrandsStrip';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';

export default function HomePage() {
  return (
    <main className="w-full">
      <Navbar showUserActions={true} />
      <section className="h-screen overflow-hidden flex flex-col bg-transparent">
        <div className="h-[30%] lg:h-[50%] overflow-hidden bg-transparent">
          <HeroSection />
        </div>
        <div className="h-[10%] lg:h-[15%] overflow-hidden bg-transparent">
          <BrandsStrip />
        </div>
        <div className="h-[40%] lg:h-[35%] overflow-hidden bg-transparent">
          <ProductCarousel />
        </div>
      </section>
      <TrustSection />
      <Testimonials />
    </main>
  );
}
