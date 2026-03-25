'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, Minus, ArrowUpRight, Trash2, Heart } from 'lucide-react';
import { useState, useRef } from 'react';

interface PremiumProductCardProps {
  name: string;
  price: number | string;
  mrp?: number | string;
  image: string;
  moq?: number;
  ptr?: number | string;
  discountTag?: string;
  isBookmarked?: boolean;
  cartQuantity?: number | null;
  plusColor?: string;
  rateLabel?: string;
  infoIcon?: boolean; 
  onBookmark?: (bookmarked: boolean) => void;
  onCartChange?: (quantity: number | null) => void;
  onQuickView?: () => void;
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
  cartQuantity = null,
  rateLabel = 'N. RATE',
  infoIcon = false,
  onBookmark,
  onCartChange,
  onQuickView,
  onClick 
}: PremiumProductCardProps) {
  const [count, setCount] = useState<number>(cartQuantity ?? 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  // Track whether an action button was clicked so we can suppress card navigation
  const actionClicked = useRef(false);

  const handleCardClick = () => {
    // Only navigate if no action button was clicked
    if (actionClicked.current) {
      actionClicked.current = false;
      return;
    }
    if (onQuickView) {
      onQuickView();
    } else {
      onClick?.();
    }
  };

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(1);
    onCartChange?.(1);
  };

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(prev => {
      const next = prev + 1;
      onCartChange?.(next);
      return next;
    });
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(prev => {
      const next = prev - 1;
      onCartChange?.(next > 0 ? next : null);
      return next;
    });
  };

  const removeFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(0);
    onCartChange?.(null);
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setBookmarked(prev => {
      onBookmark?.(!prev);
      return !prev;
    });
  };

  const hasItems = count > 0;

  return (
    <div
      className="relative flex flex-col w-full rounded-[22px] overflow-hidden bg-gradient-to-b from-[#f4fdf7] to-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group border border-gray-100/80"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative w-full h-[180px] flex items-center justify-center p-4 pt-10 bg-gradient-to-b from-[#eef9f2]/60 to-transparent">
        
        {/* Discount Tag */}
        {discountTag && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-[9px] font-black text-white rounded-br-xl z-10 shadow-md tracking-wide truncate max-w-[80%]">
            {discountTag}
          </div>
        )}
        
        {/* Share Icon */}
        <button 
          className="absolute top-11 left-3 p-1.5 text-gray-400 hover:text-gray-700 hover:scale-110 active:scale-95 transition-all z-10 rounded-full hover:bg-white/60"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); actionClicked.current = true; }}
        >
          <Share2 className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Bookmark Heart */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleBookmark}
          className={`absolute top-[72px] left-3 p-1.5 z-10 rounded-full transition-all duration-300 active:scale-90 ${
            bookmarked 
              ? 'text-red-500 bg-red-50 shadow-sm' 
              : 'text-gray-400 hover:text-red-400 hover:bg-white/60'
          }`}
        >
          <Heart 
            className={`w-4 h-4 transition-all duration-300 ${bookmarked ? 'fill-red-500 text-red-500' : ''}`} 
            strokeWidth={2} 
          />
        </button>
        
        {/* Top Right - Cart Actions */}
        <div
          className="absolute top-3 right-3 z-20"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {hasItems ? (
            <div className="flex items-center gap-0.5 bg-black/90 backdrop-blur-sm rounded-full pl-1 pr-1 py-1 shadow-lg animate-in fade-in zoom-in-90 duration-200">
              {/* When count is 1: show delete icon. Otherwise: show minus */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={count === 1 ? removeFromCart : decrement}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                {count === 1 ? (
                  <Trash2 className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />
                ) : (
                  <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                )}
              </button>

              <span className="text-white text-[13px] font-black min-w-[28px] text-center tabular-nums select-none">
                {count}
              </span>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={increment}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={addToCart}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 hover:scale-110 active:scale-95 transition-all duration-150"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Product Image */}
        <div className="relative w-[80%] h-[80%] mt-1">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain group-hover:scale-110 transition-transform duration-500 ease-out mix-blend-multiply drop-shadow-sm"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 px-3.5 bg-white flex flex-col flex-grow rounded-t-3xl -mt-3 relative z-10 overflow-hidden">
        {/* Name + Arrow */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <h3 className="font-extrabold text-gray-900 text-[13px] leading-snug line-clamp-1 min-w-0 truncate tracking-tight">
            {name}
          </h3>
          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            {infoIcon ? (
              <span className="text-white font-bold text-[9px] font-serif italic">i</span>
            ) : (
              <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-2"></div>

        {/* Pricing Row */}
        <div className="grid grid-cols-3 gap-0.5 items-start w-full min-w-0">
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">MRP</span>
            <span className="text-[12px] font-extrabold text-gray-900 truncate">₹{mrp || price}</span>
          </div>
          
          <div className="flex flex-col items-center min-w-0">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">MOQ</span>
            <span className="text-[12px] font-extrabold text-gray-900">{moq}</span>
          </div>

          <div className="flex flex-col items-end min-w-0 overflow-hidden">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 whitespace-nowrap">{rateLabel}</span>
            <span className="text-[12px] font-extrabold text-gray-900 truncate max-w-full">₹{ptr || price}</span>
          </div>
        </div>

        {/* Cart indicator bar */}
        <AnimatePresence>
          {hasItems && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">In Cart</span>
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {count} {count === 1 ? 'unit' : 'units'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
