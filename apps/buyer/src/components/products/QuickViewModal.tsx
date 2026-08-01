'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Loader2, Bookmark, Truck, CheckCircle, Plus, Star, Bell, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { ShareButton } from '@/components/shared/ShareButton';
import { NotifyStockAlertModal } from '@/components/shared/NotifyStockAlertModal';
import { CustomOrderModal } from '@/components/shared/CustomOrderModal';
import { useCart } from '@/hooks/useCart';
import { useGuardedAddToCart } from '@/hooks/usePurchaseAccess';
import { useProductById } from '@/hooks/useProducts';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent, generateProductSlug } from '@pharmabag/utils';
import type { Product } from '@pharmabag/utils';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { effectiveMinQuantity, listingLotSize, stepQuantityByLot } from '@/lib/pricing';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const router = useRouter();
  const { data: fullProductRaw, isLoading: isLoadingDetails } = useProductById(product?.id || '', {
    enabled: !!product?.id && isOpen
  });

  const fullProduct = fullProductRaw as any;
  const displayProduct = fullProduct || (product as any);
  const listings = displayProduct?.listings || [];
  const { toast } = useToast();
  const addToCart = useGuardedAddToCart();
  const { data: cartData } = useCart();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 20000;
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!displayProduct) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Ambient Backdrop */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl backdrop-saturate-[1.8]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[840px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm rounded-[32px] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/40 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Bookmark & Share */}
              <div className="flex items-center justify-between px-8 pt-8 pb-4 relative">
                <div className="max-w-[80%]">
                  <h2 className="text-[24px] md:text-[28px] font-[900] text-gray-900 tracking-tight leading-tight">
                    {displayProduct.name}
                  </h2>
                  <p className="text-[13px] font-bold text-teal-600 uppercase tracking-widest mt-1">
                    {displayProduct.category?.name || 'Pharmaceuticals'}
                  </p>
                </div>

                <div className="flex items-center gap-4 mr-16 relative z-30">
                   <ShareButton 
                      productName={displayProduct.name}
                      productId={displayProduct.id}
                      productPrice={displayProduct.mrp}
                      className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                   />
                </div>

                {/* Ribbon Bookmark */}
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="absolute right-0 top-8 transition-all hover:opacity-80"
                >
                  <svg width="60" height="42" viewBox="0 0 60 42">
                    <path 
                      d="M 0 0 L 60 0 L 60 42 L 0 42 L 18 21 Z" 
                      fill={isBookmarked ? "#10b981" : "#f3f4f6"} 
                      stroke={isBookmarked ? "#059669" : "#e5e7eb"}
                      strokeWidth="2"
                    />
                  </svg>
                </button>
                
                <button
                  onClick={onClose}
                  className="absolute -top-2 -right-2 md:top-8 md:right-8 p-2 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 transition-colors z-20"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="px-8 pb-8 pt-2">
                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 mb-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Manufacturer</p>
                        <p className="text-[14px] font-[700] text-gray-700">{displayProduct.manufacturer || 'General Pharma'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Composition</p>
                        <p className="text-[14px] font-[700] text-gray-700 break-words">{displayProduct.chemicalComposition || 'N/A'}</p>
                      </div>

                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 italic text-[13px] text-gray-500 leading-relaxed border-l-4 border-l-teal-500">
                      {displayProduct.description || "The product information provided is for informational purposes only. Please consult a qualified healthcare professional before use."}
                    </div>
                  </div>

                  <div className="relative aspect-square bg-[#f8fcf9] rounded-3xl border border-gray-100 flex items-center justify-center p-6 shadow-sm overflow-hidden group">
                     <Image
                        src={displayProduct.images?.[0] || displayProduct.image || '/products/pharma_bottle.png'}
                        alt={displayProduct.name}
                        fill
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                        priority
                      />
                  </div>
                </div>

                {/* Marketplace Comparison section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-[900] text-gray-900 uppercase tracking-tight flex items-center gap-3">
                      Compare Seller Offers
                      <span className="bg-teal-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                        {listings.length} Available
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {listings.map((listing: any) => {
                      const inStock = (listing.stock || 0) > 0;
                      const cartItem = cartData?.items?.find((item: any) => item.productId === listing.id);
                      const sellerMoq = listing.moq || listing.minimumOrderQuantity || 1;
                      const minQty = listing.price > 0
                        ? effectiveMinQuantity(listing, minOrderAmount)
                        : sellerMoq;
                      
                      return (
                        <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-teal-200 transition-all gap-4">
                          <div className="flex items-center gap-5">
                            {/* Price & Seller */}
                            <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl font-black text-[11px] min-w-[75px] text-center border border-purple-100">
                               {listing.discountMeta?.discountPercent ? `${listing.discountMeta.discountPercent}% OFF` : 'FLAT'}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-[18px] font-black text-gray-900 leading-none">₹{listing.price?.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Stock Indicator */}
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                               <Package className="w-3.5 h-3.5 text-gray-400" />
                               <span className={`text-[11px] font-black ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {inStock ? `${listing.stock} Units In Stock` : 'Out of Stock'}
                               </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                             {/* Rating */}
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100">
                                <span className="text-amber-700 font-black text-[12px]">{listing.seller?.rating || '4.5'}</span>
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                             </div>

                             {/* Actions */}
                             <div className="flex items-center gap-2">
                               {inStock ? (
                                 cartItem ? (
                                   <div className="flex items-center bg-gray-900 rounded-xl overflow-hidden h-10 text-white shadow-lg">
                                     <button 
                                       className="w-10 h-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                                       onClick={() => addToCart.mutate({ productId: listing.id, quantity: Math.max(0, stepQuantityByLot(cartItem.quantity, -1, listingLotSize(listing), minQty, listing.stock ?? 9999)), replace: true })}
                                     >
                                       -
                                     </button>
                                     <span className="px-3 font-black text-sm">{cartItem.quantity}</span>
                                     <button 
                                       className="w-10 h-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                                       onClick={() => addToCart.mutate({ productId: listing.id, quantity: stepQuantityByLot(cartItem.quantity, 1, listingLotSize(listing), minQty, listing.stock ?? 9999), replace: true })}
                                     >
                                       +
                                     </button>
                                   </div>
                                 ) : (
                                   <button 
                                     onClick={() => addToCart.mutate({ 
                                       productId: listing.id, 
                                       quantity: minQty,
                                       productName: displayProduct.name,
                                       price: listing.price,
                                       // This adds one seller's listing, so the
                                       // slab, MRP and scheme must all be that
                                       // listing's. The master carries no GST
                                       // slab at all across the catalogue.
                                       mrp: listing.mrp ?? displayProduct.mrp,
                                       gstPercent: listing.gstPercent ?? displayProduct.gstPercent,
                                       discountType: listing.discountType,
                                       discountMeta: listing.discountMeta,
                                       stock: listing.stock,
                                       moq: minQty,
                                     })}
                                     className="px-6 h-10 rounded-xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg active:scale-95"
                                   >
                                     Add To Bag
                                   </button>
                                 )
                               ) : (
                                 <button 
                                   onClick={() => setShowStockAlert(true)}
                                   className="h-10 px-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 font-bold text-xs uppercase flex items-center gap-2"
                                 >
                                   <Bell className="w-4 h-4" />
                                   Notify
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      );
                    })}

                    {listings.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 px-6 rounded-[32px] bg-gray-50/50 border-2 border-dashed border-gray-200 text-center gap-4">
                        <Package className="w-10 h-10 text-gray-300" />
                        <div>
                          <p className="text-lg font-black text-gray-800">No Professional Sellers Found</p>
                          <p className="text-[13px] text-gray-500 max-w-[320px] mx-auto mt-1">We couldn't locate active listings in our network. Would you like us to source this for you?</p>
                        </div>
                        <button 
                          onClick={() => setShowCustomOrder(true)}
                          className="px-8 py-3 bg-white border border-gray-200 rounded-2xl text-[12px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-50 transition-all shadow-sm"
                        >
                          Request Personalized Source
                        </button>
                      </div>
                    )}
                  </div>

                  {listings.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setShowCustomOrder(true)}
                        className="group flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-teal-600 transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        Didn't find your preferred deal? 
                        <span className="underline underline-offset-4 decoration-teal-200 decoration-2 group-hover:decoration-teal-500">
                          Request Custom Order
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Badges */}
                <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-center gap-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                         <Truck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase text-gray-800">Swift Logistics</p>
                         <p className="text-[10px] text-gray-400 font-bold">Priority Delivery</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                         <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase text-gray-800">Quality Verified</p>
                         <p className="text-[10px] text-gray-400 font-bold">100% Assurance</p>
                      </div>
                   </div>
                   <Link 
                      href={`/products/${generateProductSlug(displayProduct.name, displayProduct.id)}`}
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all ml-auto"
                   >
                     View Profile
                   </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotifyStockAlertModal
        isOpen={showStockAlert}
        productName={displayProduct.name}
        productId={displayProduct.id}
        onClose={() => setShowStockAlert(false)}
      />

      <CustomOrderModal
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        productName={displayProduct.name}
        productId={displayProduct.id}
      />
    </>
  );
}
