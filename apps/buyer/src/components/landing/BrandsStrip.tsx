'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BrandsStrip = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const brands = [
    { id: 13, src: '/logos/13.png', alt: 'Brand 13' },
    { id: 14, src: '/logos/14.png', alt: 'Brand 14' },
    { id: 15, src: '/logos/15.png', alt: 'Brand 15' },
    { id: 16, src: '/logos/16.png', alt: 'Brand 16' },
    { id: 17, src: '/logos/17.png', alt: 'Brand 17' },
    { id: 18, src: '/logos/18.png', alt: 'Brand 18' },
    { id: 19, src: '/logos/19.png', alt: 'Brand 19' },
    { id: 20, src: '/logos/20.png', alt: 'Brand 20' },
    { id: 21, src: '/logos/21.png', alt: 'Brand 21' },
  ];

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 flex items-center justify-center bg-transparent mt-0 sm:mt-2 lg:mt-4 overflow-hidden px-4 relative group">
      
      {/* Left Button */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 sm:left-4 z-10 p-2 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-black hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center border border-gray-100"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex items-center gap-8 sm:gap-12 md:gap-16 overflow-x-auto w-full px-8 py-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="flex-shrink-0 snap-center flex items-center justify-center transition-opacity hover:opacity-80 duration-300 cursor-pointer h-10 sm:h-12 w-auto grayscale opacity-70 hover:grayscale-0 hover:opacity-100 mix-blend-multiply"
          >
            <Image
              src={brand.src}
              alt={brand.alt}
              width={140}
              height={60}
              className="object-contain h-full w-auto"
            />
          </div>
        ))}
      </div>

      {/* Right Button */}
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 sm:right-4 z-10 p-2 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-black hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center border border-gray-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

    </div>
  );
};

export default BrandsStrip;
