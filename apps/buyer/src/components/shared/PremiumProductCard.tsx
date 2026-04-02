'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowUpRight, Trash2, Share2, RotateCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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
  const [imageError, setImageError] = useState(false);
  const actionClicked = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce refs to prevent jumping quantity when rapidly clicking
  const isEditingRef = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-sync from server if the user is not actively modifying the quantity
    if (!isEditingRef.current) {
      setCount(cartQuantity ?? 0);
    }
  }, [cartQuantity]);

  const notifyCartChange = (qty: number | null) => {
    isEditingRef.current = true;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Wait until they finish clicking (400ms pause)
    debounceTimer.current = setTimeout(() => {
      onCartChange?.(qty);
      debounceTimer.current = null;

      // Keep the "editing lock" active while API request actually processes (give it 1.5s)
      setTimeout(() => {
        if (!debounceTimer.current) {
          isEditingRef.current = false;
        }
      }, 1500);
    }, 400);
  };

  const cleanName = name?.trim() || 'Product';
  const firstChar = cleanName.charAt(0).toUpperCase();
  const lastChar = cleanName.length > 1 ? cleanName.charAt(cleanName.length - 1).toUpperCase() : '';
  const initials = `${firstChar}${lastChar}`;

  const hasValidImage = image && image !== '/product_placeholder.png' && !imageError;

  const handleCardClick = () => {
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
    notifyCartChange(moq);
  };

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(prev => {
      const next = prev + 1;
      notifyCartChange(next);
      return next;
    });
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(prev => {
      const next = prev - 1;
      notifyCartChange(next >= moq ? next : null);
      return next >= moq ? next : 0;
    });
  };

  const removeFromCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    actionClicked.current = true;
    setCount(0);
    notifyCartChange(null);
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
      className="relative flex flex-col w-full rounded-[18px] sm:rounded-[22px] bg-[#f2fbf5] overflow-visible shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-gray-100/60 p-3 pt-6"
      onClick={handleCardClick}
    >
      {/* Discount Tag - overlapping the top-left corner */}
      {discountTag && (
        <div
          className={`absolute -top-[16px] left-[4px] sm:left-[8px] bg-white border border-gray-400 font-normal text-gray-900 rounded-full z-20 whitespace-nowrap shadow-none w-fit px-2 h-[20px] sm:h-[22px] flex items-center justify-center ${discountTag.length > 12 ? 'text-[8px] xs:text-[9px] sm:text-[9.5px]' : 'text-[9px] xs:text-[10px] sm:text-[11.5px]'
            }`}
        >
          {discountTag}
        </div>
      )}

      {/* Share Button (Top Left) - Slightly lower to match Plus button and avoid tag */}
      <div className="absolute top-[14px] left-[6px] z-10 w-7 h-7 flex items-center justify-center">
        <ShareButton
          productName={name}
          productPrice={Number(price)}
          productImage={image}
          productId={productId || ''}
          className="p-1 opacity-70 hover:opacity-100"
        />
      </div>

      {/* Top Right - Status/Cart - Aligned with Share button */}
      <div
        className="absolute top-[14px] right-2 z-20"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {hasItems ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={removeFromCart}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            >
              <RotateCw className="w-4 h-4 text-gray-800" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-0.5 xs:gap-1 bg-black rounded-[8px] sm:rounded-[10px] pl-0.5 pr-0.5 py-0.5 sm:pl-1 sm:pr-1 sm:py-1 shadow-md animate-in fade-in zoom-in-90 duration-200">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={count === 1 ? removeFromCart : decrement}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                {count === 1 ? (
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" strokeWidth={2.5} />
                ) : (
                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={3} />
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
                      notifyCartChange(parsed);
                    } else if (!isNaN(parsed) && parsed > 0 && parsed < moq) {
                      setCount(moq);
                      notifyCartChange(moq);
                    } else if (parsed === 0 || editValue === '') {
                      setCount(0);
                      notifyCartChange(null);
                    }
                    setIsEditingQty(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-[28px] bg-transparent text-white text-[13px] font-bold text-center tabular-nums outline-none border-b border-white/40 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                  className="text-white text-[11px] sm:text-[13px] font-bold min-w-[20px] sm:min-w-[26px] text-center tabular-nums select-none cursor-text hover:opacity-80 transition-opacity"
                >
                  {count}
                </button>
              )}

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={increment}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <StockBasedButton
            stock={stock}
            moq={moq}
            onAddToCart={handleAddToCart}
            onNotifyStockAlert={() => {
              actionClicked.current = true;
            }}
            disabled={isLoadingCart}
            isLoading={isLoadingCart}
          />
        )}
      </div>

      {/* Image Section */}
      <div className="relative w-full h-[120px] xs:h-[140px] sm:h-[160px] flex items-center justify-center mt-3 group-hover:scale-105 transition-transform duration-500 ease-out z-10">
        <div className="relative w-[70%] h-[90%] drop-shadow-sm mix-blend-multiply flex items-center justify-center">
          {hasValidImage ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] bg-[#dcf3e8] rounded-full flex items-center justify-center shadow-inner border border-teal-200/40">
              <span className="text-2xl sm:text-3xl font-black text-[#1bd1d4] tracking-widest drop-shadow-sm select-none">{initials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature / Bookmark Ribbon Toggle */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggleBookmark}
        className="absolute right-[-1px] top-[38%] -translate-y-1/2 z-20 outline-none w-[26px] sm:w-[34px] h-[26px] sm:h-[30px] flex items-center justify-end hover:scale-105 transition-transform group/ribbon"
      >
        <svg viewBox="0 0 24 36" preserveAspectRatio="none" className="w-[80%] h-[70%] drop-shadow-sm transition-colors" fill={bookmarked ? "#1bd1d4" : "white"} stroke={bookmarked ? "#1bd1d4" : "#cbd5e1"} strokeWidth="1.5">
          <path d="M24 0 H0 L8 18 L0 36 H24 Z" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Info Section */}
      <div className="mt-auto flex flex-col z-10 w-full pb-1">
        {/* Product Name & Arrow Button */}
        <div className="flex items-center justify-between mb-2 pl-1 pr-0">
          <h3 className="font-medium text-gray-900 text-[14px] xs:text-[15px] sm:text-[17px] leading-snug line-clamp-1 truncate tracking-tight flex-1">
            {name}
          </h3>
          <button
            type="button"
            className="w-[22px] h-[22px] bg-black rounded-full flex items-center justify-center ml-2 mr-[-8px] flex-shrink-0 hover:scale-110 transition-transform shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              actionClicked.current = true;
              onQuickView?.();
            }}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-300 mb-2 rounded-full"></div>

        {/* Pricing Grid */}
        <div className="flex flex-col gap-0.5 px-1 w-full relative">

          {/* Top Header Row */}
          <div className="flex justify-between items-center w-full min-w-0 mb-0.5 gap-1">
            <span className="text-[9px] xs:text-[10px] sm:text-[12px] font-medium text-gray-600 uppercase tracking-wide flex-1 text-left">MRP</span>
            <span className="text-[9px] xs:text-[10px] sm:text-[12px] font-medium text-gray-600 uppercase tracking-wide text-center flex-1">MOQ {moq}</span>
            <span className="text-[9px] xs:text-[10px] sm:text-[12px] font-medium text-gray-600 uppercase tracking-wide flex-1 text-right whitespace-nowrap">{rateLabel}</span>
          </div>

          {/* Values Row */}
          <div className="flex justify-between items-center w-full min-w-0 gap-1">
            <span className="text-[11px] xs:text-[12px] sm:text-[14px] font-medium text-gray-800 truncate flex-1 text-left">₹{mrp || price}</span>
            <span className="text-[11px] xs:text-[12px] sm:text-[14px] text-transparent text-center flex-1 select-none pointer-events-none">-</span>
            <span className="text-[11px] xs:text-[12px] sm:text-[14px] font-medium text-gray-800 truncate flex-1 text-right">₹{ptr || price}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
