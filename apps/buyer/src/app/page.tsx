'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BrandsStrip from '@/components/landing/BrandsStrip';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main className="w-full">
      <Navbar showUserActions={true} />
      <section className="h-screen overflow-hidden flex flex-col bg-transparent">
        <div className="h-[50%] overflow-hidden bg-transparent">
          <HeroSection />
        </div>
        <div className="h-[15%] overflow-hidden bg-transparent">
          <BrandsStrip />
        </div>
        <div className="h-[35%] overflow-hidden bg-transparent">
          <ProductCarousel />
        </div>
      </section>
      <TrustSection />
      <Testimonials />
      <Footer />
    </main>
  );
}
