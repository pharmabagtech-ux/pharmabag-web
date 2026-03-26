'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowUpRight, Trash2, Bookmark } from 'lucide-react';
import { useState, useRef } from 'react';
import { ShareButton } from './ShareButton';
import { StockBasedButton } from './StockBasedButton';

interface PremiumProductCardProps {
  name: string;
  price: number | string;
  mrp?: number | string;
  image: string;
  moq?: number;
  ptr?: number | string;
  discountTag?: string;
  stock?: number;
  isBookmarked?: boolean;
  cartQuantity?: number | null;
  plusColor?: string;
  rateLabel?: string;
  infoIcon?: boolean;
  productId?: string;
  isLoadingCart?: boolean;
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
  stock = 999,
  isBookmarked = false,
  cartQuantity = null,
  rateLabel = 'N. RATE',
  infoIcon = false,
  productId,
  isLoadingCart = false,
  onBookmark,
  onCartChange,
  onQuickView,
  onClick 
}: PremiumProductCardProps) {
  const [count, setCount] = useState<number>(cartQuantity ?? 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [editValue, setEditValue] = useState('');
  // Track whether an action button was clicked so we can suppress card navigation
  const actionClicked = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleAddToCart = () => {
    actionClicked.current = true;
    setCount(moq);
    onCartChange?.(moq);
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
      // If quantity goes below MOQ, remove from cart entirely
      onCartChange?.(next >= moq ? next : null);
      return next >= moq ? next : 0;
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
      className="relative flex flex-col w-full rounded-2xl sm:rounded-[22px] overflow-visible bg-gradient-to-b from-[#f4fdf7] to-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group border border-gray-100/80"
      onClick={handleCardClick}
    >
      {/* Bookmark Icon - Positioned at card center */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggleBookmark}
        className={`absolute top-1/2 -right-2 -translate-y-1/2 p-2.5 z-20 rounded-full transition-all duration-300 active:scale-90 ${
          bookmarked 
            ? 'text-blue-500 bg-blue-50 shadow-md' 
            : 'text-gray-400 hover:text-blue-400 hover:bg-white/60'
        }`}
      >
        <Bookmark 
          className={`w-8 h-8 rotate-90 transition-all duration-300 ${bookmarked ? 'fill-blue-500 text-blue-500' : ''}`} 
          strokeWidth={2} 
        />
      </button>
      {/* Image Section */}
      <div className="relative w-full h-[140px] xs:h-[160px] sm:h-[180px] flex items-center justify-center p-3 sm:p-4 pt-8 sm:pt-10 bg-gradient-to-b from-[#eef9f2]/60 to-transparent">
        
        {/* Discount Tag */}
        {discountTag && (
          <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black text-white rounded-br-xl z-10 shadow-md tracking-wide truncate max-w-[80%]">
            {discountTag}
          </div>
        )}
        
        {/* Top Left: Share Icon */}
        <div className="absolute top-3 left-2 z-10">
          <ShareButton
            productName={name}
            productPrice={Number(price)}
            productImage={image}
            productId={productId || ''}
            className="p-2.5"
          />
        </div>


        
        {/* Top Right - Stock-Based Button or Cart Controls */}
        <div
          className="absolute top-3 right-3 z-20"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {hasItems ? (
            <div className="flex items-center gap-0.5 bg-black/90 backdrop-blur-sm rounded-full pl-1 pr-1 py-1 shadow-lg animate-in fade-in zoom-in-90 duration-200">
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

              {isEditingQty ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(editValue, 10);
                    if (!isNaN(parsed) && parsed >= moq) {
                      setCount(parsed);
                      onCartChange?.(parsed);
                    } else if (!isNaN(parsed) && parsed > 0 && parsed < moq) {
                      setCount(moq);
                      onCartChange?.(moq);
                    } else if (parsed === 0 || editValue === '') {
                      setCount(0);
                      onCartChange?.(null);
                    }
                    setIsEditingQty(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-[36px] bg-transparent text-white text-[13px] font-black text-center tabular-nums outline-none border-b border-white/40 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    actionClicked.current = true;
                    setEditValue(String(count));
                    setIsEditingQty(true);
                    setTimeout(() => inputRef.current?.select(), 0);
                  }}
                  className="text-white text-[13px] font-black min-w-[28px] text-center tabular-nums select-none cursor-text hover:opacity-80 transition-opacity"
                >
                  {count}
                </button>
              )}

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
            <StockBasedButton
              stock={stock}
              moq={moq}
              onAddToCart={handleAddToCart}
              onNotifyStockAlert={() => {
                actionClicked.current = true;
                // This would open a modal - for now just show a message
              }}
              disabled={isLoadingCart}
              isLoading={isLoadingCart}
            />
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
      <div className="p-2.5 px-3 sm:p-3 sm:px-3.5 bg-white flex flex-col flex-grow rounded-t-3xl -mt-3 relative z-10 overflow-hidden">
        {/* Name + Arrow */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <h3 className="font-extrabold text-gray-900 text-[11px] sm:text-[13px] leading-snug line-clamp-1 min-w-0 truncate tracking-tight">
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
        <div className="space-y-1.5 w-full min-w-0">
          {/* Labels Row */}
          <div className="grid grid-cols-3 gap-1 items-center w-full min-w-0">
            <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wider">MRP</span>
            <div className="flex justify-center">
              <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wider">MOQ</span>
            </div>
            <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">{rateLabel}</span>
          </div>

          {/* Values Row */}
          <div className="grid grid-cols-3 gap-1 items-center w-full min-w-0">
            <span className="text-[11px] sm:text-[12px] font-extrabold text-gray-900 truncate">₹{mrp || price}</span>
            <div className="flex justify-center">
              <span className="inline-block bg-gray-900 text-white px-2.5 py-1 rounded-md text-[13px] sm:text-[14px] font-black whitespace-nowrap">{moq}</span>
            </div>
            <span className="text-[11px] sm:text-[12px] font-extrabold text-gray-900 truncate text-right max-w-full">₹{ptr || price}</span>
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
