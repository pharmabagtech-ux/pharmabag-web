'use client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import BrandStrip from '@/components/landing/BrandStrip';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <main className="w-full">
      <Navbar />
      <HeroSection />
      <ProductCarousel />
      <BrandStrip />
      <TrustSection />
      <Testimonials />
      <Footer />
    </main>
  );
}
