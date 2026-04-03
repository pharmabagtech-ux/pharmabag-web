'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Loader2, Bookmark, Truck, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { StockBasedButton } from '@/components/shared/StockBasedButton';
import { ShareButton } from '@/components/shared/ShareButton';
import { PriceSection } from '@/components/shared/PriceSection';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent } from '@pharmabag/utils';
import type { Product } from '@pharmabag/utils';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const { data: cartData } = useCart();
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [orderQty, setOrderQty] = useState(product?.minimumOrderQuantity || 1);

  // Sync quantity with cart when product changes
  useEffect(() => {
    if (!product) return;
    
    // Check if product is already in cart
    const cartItem = cartData?.items?.find(item => item.productId === product.id);
    
    if (cartItem) {
      // Product is in cart, use current cart quantity
      setOrderQty(cartItem.quantity);
    } else {
      // Product not in cart, use MOQ
      setOrderQty(product.minimumOrderQuantity || 1);
    }
  }, [product?.id, cartData?.items]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart.mutate(
      { 
        productId: product.id, 
        quantity: orderQty,
        productName: product.name,
        price: sellingPrice,
        mrp: product.mrp,
        imageUrl: typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.url
      },
      {
        onSuccess: () => {
          toast(`${product.name} added to bag!`, 'success');
          // Don't close modal - let user continue shopping
        },
        onError: (err: any) => {
          const status = err?.response?.status || err?.status;
          const message = err?.response?.data?.message || err?.message || '';
          let errorMsg = 'Failed to add to bag';
          
          if (status === 401 || status === 403) {
            errorMsg = 'Please log in to add items to bag';
          } else if (status === 400 && message.includes('already in cart')) {
            errorMsg = 'Product quantity has been updated in cart';
          } else if (status === 400 && message.includes('Minimum order quantity')) {
            const match = message.match(/(\d+)/);
            const requiredQty = match ? match[1] : '1';
            errorMsg = `Minimum order quantity is ${requiredQty}. Please add at least ${requiredQty} items.`;
          } else if (message) {
            errorMsg = message;
          }
          
          toast(errorMsg, 'error');
        },
      }
    );
  };

  const handleViewProduct = () => {
    if (!product) return;
    onClose();
    router.push(`/products/${product.id}`);
  };

  if (!product) return null;

  // Calculate pricing
  const dd = (product as any).discountDetails || (product as any).discountFormDetails;
  let sellingPrice = (product as any).sellingPrice || (product as any).ptr || product.price || product.mrp || 0;
  let computedPtr: number | undefined;
  let buyGetTag = '';

  if (dd?.type && product.mrp && (product as any).gstPercent != null) {
    try {
      const pricing = calculatePricing(product.mrp, (product as any).gstPercent, dd);
      sellingPrice = getSellingPrice(pricing);
      computedPtr = pricing.ptr;
      if (pricing.get > 0) {
        buyGetTag = `Buy ${pricing.buy} Get ${pricing.get}`;
      }
    } catch {
      // Fallback
    }
  }

  // If sellingPrice is still 0 or invalid, fall back to MRP (no discount)
  if (!sellingPrice || sellingPrice <= 0) sellingPrice = product.mrp || 0;

  const discount = product.mrp && sellingPrice > 0 ? Math.round(getEffectiveDiscountPercent(product.mrp, sellingPrice)) : 0;
  const inStock = (product.stock ?? 0) > 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="quick-view-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Apple Frosted Glass Backdrop */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl backdrop-saturate-[1.8]" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[760px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm rounded-[24px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/40 overflow-hidden"
            >
              {/* Header: Title Left, Actions Right */}
              <div className="flex items-center justify-between px-8 pt-8 pb-2 relative">
                {/* Product Title */}
                <h2 className="text-[22px] md:text-[26px] font-[800] text-gray-800 tracking-tight leading-tight w-[80%] pr-4">
                  {product.name}
                </h2>

                {/* Actions Area */}
                <div className="flex items-center gap-5 mr-[68px]">
                  <ShareButton
                    productName={product.name}
                    productPrice={sellingPrice}
                    productImage={typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.url || '/products/pharma_bottle.png'}
                    productId={product.id}
                    discount={discount}
                    className="p-1 transition-all hover:scale-105 rounded-full"
                    iconClassName="w-[26px] h-[26px] text-gray-900"
                  />
                </div>

                {/* Flush Right Ribbon Bookmark */}
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="absolute right-0 top-8 transition-all hover:opacity-80"
                  title="Bookmark"
                >
                  <svg width="64" height="46" viewBox="0 0 64 46" fill={isBookmarked ? "#e5e7eb" : "white"} stroke="#d1d5db" strokeWidth="2.5" strokeLinejoin="miter">
                    {/* Tag pointing right with left cutoff.
                        Start top-left(0,0), straight right to (64,0), straight down to (64,46), 
                        straight left to (0,46), diagonal in to (18,23), diagonal out to (0,0) */}
                    <path d="M 0 0 L 64 0 L 64 46 L 0 46 L 20 23 Z" />
                  </svg>
                </button>
              </div>

              {/* Dynamic Info Grid & Image vs Actions */}
              <div className="px-8 pb-8 pt-1 grid grid-cols-1 md:grid-cols-[62%_38%] gap-4 md:gap-7">
                
                {/* ── LEFT COLUMN: Grid + Image ── */}
                <div className="flex flex-col">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[14px]">
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Expiry:</span> <span className="text-gray-700 font-medium">{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-CA', {year: 'numeric', month: '2-digit'}).replace('/', '-') : 'N/A'}</span></div>
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Discount:</span> <span className="text-gray-700 font-medium">{discount}%</span></div>
                    
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Stock:</span> <span className="text-gray-700 font-medium">{product.stock || 0}</span></div>
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Buy:</span> <span className="text-gray-700 font-medium">{(product as any).discountDetails?.buy || ''}</span></div>
                    
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Min qty:</span> <span className="text-gray-700 font-medium">{product.minimumOrderQuantity || 1}</span></div>
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Get:</span> <span className="text-gray-700 font-medium">{(product as any).discountDetails?.get || ''}</span></div>
                    
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Max qty:</span> <span className="text-gray-700 font-medium">{(product as any).maximumOrderQuantity || product.stock || 'N/A'}</span></div>
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">GST:</span> <span className="text-gray-700 font-medium">{(product as any).gstPercent ? `${(product as any).gstPercent}.00%` : '0%'}</span></div>
                    
                    <div className="truncate"><span className="font-[800] text-gray-800 mr-1">Medicine Type:</span> <span className="text-gray-700 font-medium">{(product as any).medicineType || 'Miscellaneous'}</span></div>
                    <div className="truncate text-gray-700 font-medium tracking-wide uppercase">{product.manufacturer || 'PHARMABAG'}</div>
                  </div>

                  {/* Product Image */}
                  <div className="relative w-full aspect-[4/3.5] min-h-[440px] mt-6 flex items-center justify-center">
                    <Image
                      src={(typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.url) || '/products/pharma_bottle.png'}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="300px"
                    />
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Pricing + Cart ── */}
                <div className="flex flex-col pt-1">
                  
                  {/* Pricing Matrix */}
                  <div className="flex flex-col gap-y-2 text-[15px] mb-6 mt-1 pr-6">
                    <div className="flex items-center justify-between"><span className="font-[900] text-black tracking-wide">MRP:</span> <span className="text-[#3b82f6] font-bold">₹{product.mrp?.toFixed(2) || '0.00'}</span></div>
                    <div className="flex items-center justify-between"><span className="font-[900] text-black tracking-wide">PTR:</span> <span className="text-[#3b82f6] font-bold">₹{computedPtr?.toFixed(2) || '0.00'}</span></div>
                    <div className="flex items-center justify-between mb-0.5"><span className="font-[900] text-black tracking-wide">Net rate:</span> <span className="text-[#3b82f6] font-[900] text-[16px]">₹{sellingPrice.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span className="font-[900] text-black tracking-wide">Country:</span> <span className="text-gray-700 font-medium whitespace-nowrap">{(product as any).country || 'India'}</span></div>
                  </div>

                  {/* Add to Bag Custom GUI */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* Qty Controller */}
                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden h-[42px] bg-[#f9fafb]">
                      <button 
                        onClick={() => setOrderQty(q => Math.max(product.minimumOrderQuantity || 1, q - 1))}
                        className="w-[42px] h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 font-medium text-lg transition-colors border-r border-gray-200"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={orderQty}
                        onChange={(e) => setOrderQty(Math.max(product.minimumOrderQuantity || 1, Number(e.target.value)))}
                        className="w-[48px] h-full text-center font-bold text-gray-900 bg-transparent focus:outline-none"
                      />
                      <button 
                        onClick={() => setOrderQty(q => Math.min((product as any).maximumOrderQuantity || product.stock || 999, q + 1))}
                        className="w-[42px] h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 font-medium text-lg transition-colors border-l border-gray-200"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Arrow Cart Button */}
                    <button 
                      onClick={handleAddToCart}
                      disabled={addToCart.isPending || !inStock}
                      className="w-[44px] h-[44px] flex items-center justify-center rounded-full border border-gray-300 text-gray-800 hover:border-gray-900 hover:text-black transition-all active:scale-95 disabled:opacity-50"
                    >
                      {addToCart.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>}
                    </button>
                  </div>

                  {/* Delivery Info */}
                  <div className="text-[17px] font-[800] text-black tracking-tight mb-5 mt-2">
                    Delivery in 4-8 days
                  </div>

                  {/* Additional Offers Section */}
                  <div className="relative w-full mb-4">
                    {/* Dotted border separator */}
                    <div className="w-full border-t border-dashed border-gray-300 mb-4" />
                    
                    <div className="border border-dashed border-gray-300 rounded-lg p-2.5 pb-2.5 pt-4 bg-gradient-to-br from-white to-gray-50/50 relative mt-[-10px]">
                      {/* Flag overlaps the top border */}
                      <div className="absolute -top-[11px] left-[-1px] bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-[10px] font-[800] uppercase tracking-wider px-2.5 py-1 rounded-r-md z-10 shadow-sm">
                        Additional offers
                      </div>

                      {((product as any).offers && (product as any).offers.length > 0) ? (
                        <div className="flex items-start gap-2.5 pl-1.5 mt-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981" className="flex-shrink-0 mt-0.5 transform -rotate-45 relative top-0.5">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                          </svg>
                          <div className="mt-[-2px]">
                            <p className="text-[12.5px] font-[800] text-gray-900 leading-tight">{(product as any).offers[0].title}</p>
                            <p className="text-[11px] text-gray-500 font-medium">{(product as any).offers[0].description}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-1.5 mt-1">
                          <p className="text-[12px] text-gray-400 font-medium italic">No offers available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Order Link */}
                  <div className="text-[14px] text-gray-800 mb-5">
                    Have a <a href="#" className="font-[800] underline decoration-2 underline-offset-4 cursor-pointer hover:text-black">Custom Order ?</a>
                  </div>

                  {/* Badges - Custom Replica */}
                  <div className="flex items-center gap-2 mb-6">
                    {/* Free Shipping Circle Badge */}
                    <div className="w-[46px] h-[46px] rounded-full border border-black flex flex-col items-center justify-center bg-white flex-shrink-0 overflow-hidden shrink-0">
                      <span className="text-[7.5px] font-[900] uppercase leading-none tracking-tighter mb-[1px]">Free</span>
                      <Truck className="w-[15px] h-[15px] text-black mb-[1px]" strokeWidth={2.5} />
                      <span className="text-[6px] font-[900] uppercase leading-none tracking-tighter">Shipping</span>
                    </div>

                    {/* Certified Badge - Shield with Ribbon */}
                    <div className="relative flex items-center ml-1 h-[36px]">
                      {/* Shield SVG Background */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-[44px] h-[44px] flex items-center justify-center z-20">
                        <svg viewBox="0 0 100 100" className="w-[42px] h-[42px] drop-shadow-sm">
                          {/* Inner Shield */}
                          <path d="M50 8 L85 22 V50 C85 70 50 92 50 92 C50 92 15 70 15 50 V22 Z" fill="#15b759" />
                          <path d="M50 14 L78 26 V50 C78 65 50 82 50 82 C50 82 22 65 22 50 V26 Z" fill="white" />
                          {/* White Checkmark */}
                          <path d="M38 52 L46 60 L62 42" stroke="#15b759" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                      <div className="bg-[#107335] text-white pl-[40px] pr-2 h-full flex flex-col items-start justify-center rounded-r border-t border-b border-r border-[#0d5f2c] min-w-[95px] rounded-l-[20px] shadow-sm z-10 relative">
                        <span className="text-[7px] font-bold uppercase tracking-[0.05em] opacity-90 leading-tight">Pharma Bag</span>
                        <span className="text-[13px] font-black uppercase tracking-wide leading-tight">Certified</span>
                      </div>
                    </div>
                  </div>

                  {/* View Product Page Link */}
                  <Link href={`/products/${product.id}`} onClick={onClose} className="flex items-center gap-4 mt-auto cursor-pointer group w-max">
                    <span className="text-[15px] text-gray-900 font-[800]">View Product Page</span>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-all group-hover:border-gray-900 group-hover:text-black shadow-sm pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </Link>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Alert Modal */}
      <NotifyStockAlertModal
        isOpen={showStockAlert}
        productName={product.name}
        productId={product.id}
        onClose={() => setShowStockAlert(false)}
      />
    </>
  );
}
