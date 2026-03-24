'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, ArrowUpRight, RotateCcw, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface PremiumProductCardProps {
  name: string;
  price: number | string;
  mrp?: number | string;
  image: string;
  moq?: number;
  ptr?: number | string;
  discountTag?: string; // e.g., "15% Off (9+0)"
  isBookmarked?: boolean;
  onBookmark?: (bookmarked: boolean) => void;
  onClick?: () => void;
}

export default function PremiumProductCard({ 
  name, 
  price, 
  mrp,
  image, 
  moq = 1,
  ptr,
  discountTag,
  isBookmarked = false,
  onBookmark,
  onClick 
}: PremiumProductCardProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(isBookmarked);

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    // Simulate count start
    setTimeout(() => {
      setCount(1);
      setIsLoading(false);
    }, 600);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !localBookmarked;
    setLocalBookmarked(newState);
    onBookmark?.(newState);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex flex-col w-full max-w-[280px] rounded-[32px] overflow-hidden bg-[#f2fcf6] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-white/20"
      onClick={onClick}
    >
      {/* Top Section */}
      <div className="relative w-full h-[180px] flex items-center justify-center p-4 pt-10">
        {/* Top Left Discount Tag - Pill shape attached to top-left */}
        {discountTag && (
          <div className="absolute top-0 left-0 bg-white px-3 py-1.5 text-[10px] font-black text-gray-800 rounded-br-2xl border-b border-r border-gray-100 z-10 shadow-sm">
            {discountTag}
          </div>
        )}
        
        {/* Share Icon */}
        <button 
          className="absolute top-10 left-3 p-1.5 text-gray-800 hover:scale-110 transition-transform z-10"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Share2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
        
        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 z-20">
          <AnimatePresence mode="wait">
            {count !== null || isLoading ? (
              <motion.div 
                key="pill"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <div className={`${isLoading ? 'animate-spin' : ''}`}>
                  <RotateCcw className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
                </div>
                <div className="bg-black text-white text-[11px] font-black px-3 py-1 rounded-lg min-w-[36px] text-center shadow-lg">
                  {count || 100}
                </div>
              </motion.div>
            ) : (
              <motion.button 
                key="plus"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={handlePlusClick}
                className="text-gray-900"
              >
                <Plus className="w-8 h-8" strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Product Image */}
        <div className="relative w-[85%] h-[85%] mt-2">
          <Image
            src={image === '/product_placeholder.png' ? '/product_placeholder.png' : image}
            alt={name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          />
        </div>

        {/* Right Bookmark Ribbon - Clickable */}
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmarkClick}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-7 h-9 flex items-center justify-center z-10 transition-colors duration-300 ${localBookmarked ? 'bg-[#00818a]' : 'bg-[#33d4e0]'}`}
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 40% 50%)', 
            transform: 'scaleX(-1) translateY(-50%)' 
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>
            <Bookmark className={`w-3 h-3 ${localBookmarked ? 'fill-white text-white' : 'text-white/80'}`} strokeWidth={3} />
          </div>
        </motion.button>
      </div>

      {/* Bottom Section */}
      <div className="p-4 px-5 bg-white/40 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-gray-900 text-[18px] leading-tight line-clamp-1 w-full truncate tracking-tight">
            {name}
          </h3>
          <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
            <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200/60 mb-4"></div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-3 gap-2 items-start w-full">
          {/* MRP */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-900 uppercase mb-1">MRP</span>
            <span className="text-[16px] font-black text-gray-900 truncate">₹{mrp || price}</span>
          </div>
          
          {/* MOQ */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-gray-900 uppercase mb-1 whitespace-nowrap">MOQ {moq}</span>
            {/* Value is inline for MOQ */}
          </div>

          {/* N. RATE */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-900 uppercase mb-1 whitespace-nowrap">N. RATE</span>
            <span className="text-[16px] font-black text-gray-900 truncate">₹{ptr || price}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
