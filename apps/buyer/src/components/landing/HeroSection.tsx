'use client';

import { Search, Loader2, ZoomIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import BrandsStrip from '@/components/landing/BrandsStrip';

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!searchTerm) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-start items-center bg-transparent mt-4 sm:mt-6 lg:mt-8">
      {/* Main Heading */}
      <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[72px] text-gray-900 mb-0 sm:mb-1 lg:mb-2 tracking-tight font-medium">
        <span className="text-gray-800">India&apos;s Only </span>
        <span className="text-black font-extrabold">Trusted</span>
      </h1>
      <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[72px] text-black mb-1 sm:mb-2 lg:mb-4 tracking-tight font-extrabold pb-2">
        B2B Pharma Platform
      </h2>

      {/* Subtext */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 mb-4 sm:mb-6 lg:mb-10 font-bold px-2">
        for <span className="text-black">Wholesaler</span> <span className="font-medium px-1">•</span> Buy at{' '}
        <span className="text-black">Bulk Rates</span> ₹
      </p>

      {/* Search Bar */}
      <div className="max-w-[850px] mx-auto px-4 sm:px-6 w-full mb-4 sm:mb-6 lg:mb-8">
        <div className="relative rounded-full bg-[#f8fcf8]/60 backdrop-blur-md border border-[#ffffff]/80 px-6 py-4 sm:py-4 flex items-center gap-3 hover:bg-[#ffffff]/70 transition-all duration-300">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search for Brands , Products or manufacturers"
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium text-[14px] sm:text-[15px] min-w-0"
          />
          <button
            onClick={handleSearchClick}
            className="flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors cursor-pointer ml-2"
          >
            {isSearching ? (
              <Loader2 className="w-6 h-6 animate-spin flex-shrink-0" />
            ) : (
              <ZoomIn strokeWidth={1} className="w-[26px] h-[26px] flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Brand Icon Bar integrated right under */}
      <div className="w-full  h-16 sm:h-20 lg:h-24">
        <BrandsStrip />
      </div>
    </div>
  );
}
