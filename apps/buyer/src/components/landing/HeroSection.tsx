'use client';

import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  return (
    <div className="h-full pt-12 sm:pt-14 md:pt-16 lg:pt-28 px-[4vw] text-center w-full mx-auto flex flex-col justify-start items-center bg-transparent">
      {/* Main Heading */}
      <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-1 sm:mb-1.5 lg:mb-3 tracking-tight">
        <span className="text-gray-700 font-medium">India&apos;s Only </span>
        <span className="text-gray-900 font-extrabold">Trusted</span>
      </h1>
      <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-2 sm:mb-2.5 lg:mb-4 tracking-tight">
        <span className="font-extrabold">B2B Pharma Platform</span>
      </h2>

      {/* Subtext */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mb-3 sm:mb-3.5 lg:mb-5 font-medium px-2">
        for <span className="text-gray-900 font-bold">Wholesaler</span> • Buy at{' '}
        <span className="text-gray-900 font-bold">Bulk Rates</span> ₹
      </p>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-1 px-2 sm:px-4 w-full md:hidden">
        <div className="relative rounded-full backdrop-blur-3xl bg-white/30 border-2 border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-5 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 hover:bg-white/40 transition-all duration-500 group focus-within:ring-4 focus-within:ring-lime-100 focus-within:border-lime-300">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brands, products..."
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-xs sm:text-sm md:text-base font-medium min-w-0"
          />
          {isSearching ? (
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-lime-500 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-focus-within:text-lime-500 transition-colors flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
