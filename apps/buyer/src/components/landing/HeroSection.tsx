'use client';

import { Search } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="pt-32 pb-6 px-4 text-center">
      {/* Main Heading */}
      <h1 className="text-5xl md:text-7xl text-gray-900 mb-6">
        <span className="text-gray-700">India&apos;s Only </span>
        <span className="text-gray-900 font-bold">Trusted</span>
      </h1>
      <h2 className="text-5xl md:text-7xl text-gray-900 mb-6"><span className="font-bold">B2B Pharma Platform</span></h2>

      {/* Subtext */}
      <p className="text-lg md:text-xl text-gray-700 mb-12">
        for <span className="font-semibold">Wholesaler</span> • Buy at{' '}
        <span className="font-semibold">Bulk Rates</span> ₹
      </p>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-2">
        <div className="relative rounded-full backdrop-blur-2xl bg-white/20 border border-white/30 shadow-2xl px-6 py-4 flex items-center gap-3 hover:bg-white/30 transition-all duration-300">
          <input
            type="text"
            placeholder="Search for Brands, Products or manufacturers"
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-base"
          />
          <Search className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </div>
  );
}
