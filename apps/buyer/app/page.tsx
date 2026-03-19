'use client';

import { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductCarousel from '@/components/landing/ProductCarousel';
import TrustSection from '@/components/landing/TrustSection';
import Testimonials from '@/components/landing/Testimonials';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/landing/LoginModal';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />

      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products */}
      <ProductCarousel />

      {/* Trust Section */}
      <TrustSection />

      {/* Testimonials */}
      <Testimonials />

      {/* Footer */}
      <Footer />

      {/* Login Overlay */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </main>
  );
}
