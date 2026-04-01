'use client';

import React from 'react';

const BrandsStrip = () => {
  const brands = [
    { id: 1, content: <span className="font-serif tracking-widest text-lg sm:text-xl font-medium">SPAZIO</span> },
    {
      id: 2, content: (
        <div className="flex flex-col items-start leading-[0.7] pt-1">
          <span className="font-serif font-black text-lg sm:text-xl tracking-tight">Gamar</span>
          <span className="font-serif font-black text-[10px] sm:text-[11px] tracking-[0.1em] ml-3">ance</span>
        </div>
      )
    },
    { id: 3, content: <span className="font-sans font-semibold text-sm sm:text-base tracking-tight">Gasparyan<sup className="text-[8px] font-normal">®</sup></span> },
    { id: 4, content: <span className="font-serif text-xl sm:text-2xl font-normal tracking-wide">Ocean</span> },
    { id: 5, content: <span className="font-serif text-base sm:text-lg tracking-[0.15em] font-medium">Eembreeque</span> },
    { id: 6, content: <span className="font-sans font-black text-lg sm:text-xl tracking-tighter">Helveior</span> },
    { id: 7, content: <span className="font-serif text-base sm:text-lg font-light tracking-[0.2em]">RODOND</span> },
  ];

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 flex items-center justify-center bg-transparent mt-0 sm:mt-2 lg:mt-4 overflow-hidden px-4">
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12 lg:gap-[4.5rem]">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="flex items-center justify-center text-gray-800 hover:text-black transition-colors duration-300 cursor-pointer"
          >
            {brand.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandsStrip;
