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
    <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-4 sm:pb-6 px-4 text-center">
      {/* Main Heading */}
      <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-3 sm:mb-4 md:mb-6 tracking-tight">
        <span className="text-gray-700 font-medium">India&apos;s Only </span>
        <span className="text-gray-900 font-extrabold">Trusted</span>
      </h1>
      <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-3 sm:mb-4 md:mb-6 tracking-tight">
        <span className="font-extrabold">B2B Pharma Platform</span>
      </h2>

      {/* Subtext */}
      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-12 font-medium px-2">
        for <span className="text-gray-900 font-bold">Wholesaler</span> • Buy at{' '}
        <span className="text-gray-900 font-bold">Bulk Rates</span> ₹
      </p>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-2 px-2 sm:px-4">
        <div className="relative rounded-full backdrop-blur-3xl bg-white/30 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center gap-3 sm:gap-4 hover:bg-white/40 transition-all duration-500 group focus-within:ring-4 focus-within:ring-lime-100 focus-within:border-lime-300">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brands, products..."
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm sm:text-base md:text-lg font-medium min-w-0"
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
