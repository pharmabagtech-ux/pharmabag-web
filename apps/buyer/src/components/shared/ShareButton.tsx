'use client';

import { Share2, Copy, MessageCircle, Mail, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { productSlug } from '@pharmabag/utils';

interface ShareButtonProps {
  productName: string;
  productPrice: number;
  productImage?: string;
  productId: string;
  /** The slug the API stored. Shared links outlive the session, so prefer the
   *  exact value over one derived from the name. */
  slug?: string | null;
  discount?: number;
  className?: string;
  iconClassName?: string;
  onOpenChange?: (open: boolean) => void;
}

export function ShareButton({
  productName,
  productPrice,
  productImage,
  productId,
  slug,
  discount,
  className = '',
  iconClassName = 'w-[18px] h-[18px]',
  onOpenChange,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    onOpenChange?.(showMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, onOpenChange]);

  const deepLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${productSlug({ slug, name: productName, id: productId })}`;
  const shareText = `Check out ${productName} at ₹${productPrice}${discount ? ` (${discount}% OFF)` : ''} on PharmaBag`;

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PharmaBag',
          text: shareText,
          url: deepLink,
        });
        setShowMenu(false);
      } catch (err) {
        // User cancelled share or share not available
      }
    } else {
      // Fallback to copy link
      handleCopyLink(e);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    navigator.clipboard.writeText(deepLink).then(() => {
      setCopied(true);
      setShowMenu(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${deepLink}`)}`;
    window.open(whatsappUrl, '_blank');
    setShowMenu(false);
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const emailUrl = `mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`${shareText}\n\n${deepLink}`)}`;
    window.location.href = emailUrl;
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        className={`text-gray-700 hover:text-black transition-colors z-10 ${className}`}
        title="Share product"
      >
        <Share2 className={iconClassName} strokeWidth={2} />
      </motion.button>

      {/* Share Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-1 z-[100] min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded transition-colors text-sm font-medium text-gray-700"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-green-50 rounded transition-colors text-sm font-medium text-gray-700"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp
            </button>

            <button
              onClick={handleEmail}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded transition-colors text-sm font-medium text-gray-700"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              Email
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded transition-colors text-sm font-medium text-gray-700"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
