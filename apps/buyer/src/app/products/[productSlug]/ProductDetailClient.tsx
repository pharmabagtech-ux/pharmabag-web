'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Package, ShoppingBag, Star, Loader2, AlertCircle, Minus, Plus, Check, Send, User, Heart, Trash2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';

import { useProductById } from '@/hooks/useProducts';
import { useCart, useRemoveCartItem } from '@/hooks/useCart';
import { useGuardedAddToCart } from '@/hooks/usePurchaseAccess';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CustomOrderModal } from '@/components/shared/CustomOrderModal';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent, parseProductIdFromSlug, productSlug as toProductSlug } from '@pharmabag/utils';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { formatSchemeTag } from '@pharmabag/utils';
import { effectiveMinQuantity, listingLotSize, stepQuantityByLot, snapQuantityToLot } from '@/lib/pricing';

/**
 * The interactive product page.
 *
 * Behaviour is unchanged — this was moved out of `page.tsx` so that route
 * could become a server component. A `'use client'` module cannot export
 * `generateMetadata`, so while this lived at the route root every one of the
 * 26,000+ products served the same generic title, no canonical and no
 * structured data. `page.tsx` now owns metadata, JSON-LD and the crawlable
 * content block, and renders this for everything a user actually interacts
 * with.
 */
export default function ProductDetailClient({ params }: { params: { productSlug: string } }) {
  const productId = parseProductIdFromSlug(params.productSlug);
  const { data: productRaw, isLoading, isError } = useProductById(productId);
  const product = productRaw as any;
  const addToCart = useGuardedAddToCart();
  const removeCartItem = useRemoveCartItem();
  const { data: cartData } = useCart();
  const { data: wishlistData } = useWishlist();
  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 20000;
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  // Sync quantity with cart only ONCE when product loads
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  useEffect(() => {
    if (!product || initialSyncDone) return;

    // Check if product is already in cart
    const cartItem = cartData?.items?.find(item => item.productId === product.id);

    if (cartItem) {
      setQuantity(cartItem.quantity);
      setInitialSyncDone(true);
    } else {
      setQuantity(product.minimumOrderQuantity || 1);
      setInitialSyncDone(true);
    }
  }, [product?.id, cartData?.items, initialSyncDone]);

  const wishlistItems = wishlistData?.items ?? [];
    const wishlistEntry = wishlistItems.find((w) => w.productId === productId || w.product?.id === productId);
    const isWishlisted = !!wishlistEntry;
  
    const handleToggleWishlist = () => {
      if (isWishlisted && wishlistEntry) {
        removeFromWishlist.mutate(wishlistEntry.productId || productId, {
        onSuccess: () => toast('Removed from wishlist', 'success'),
        onError: () => toast('Failed to update wishlist', 'error'),
      });
    } else {
      addToWishlist.mutate(product, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
        onError: () => toast('Failed to update wishlist', 'error'),
      });
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate quantity before sending
    const min = (product as any).minimumOrderQuantity || 1;
    const stock = product.stock || 0;
    const maxLimit = (product as any).maximumOrderQuantity || stock;
    const max = Math.min(stock, maxLimit);

    let finalQty = parseInt(String(quantity), 10);
    if (isNaN(finalQty)) finalQty = min;
    if (finalQty < min) finalQty = min;
    if (finalQty > max) finalQty = max;

    addToCart.mutate(
      {
        productId: product.id,
        quantity: finalQty,
        replace: true, // IMPORTANT: REPLACE instead of ADD to fix the "Addition" bug
        productName: product.name,
        slug: toProductSlug(product),
        price: sellingPrice,
        mrp: product.mrp,
        gstPercent: product.gstPercent,
        discountType: (product as any).discountType,
        discountMeta: (product as any).discountMeta,
        imageUrl: product.images?.[0]
      },
      {
        onSuccess: () => {
          setQuantity(finalQty);
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        },
        onError: () => toast('Failed to update bag', 'error'),
      }
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="min-h-screen bg-gray-50/50">
        <Navbar showUserActions={true} />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-gray-300" />
          <p className="text-lg font-bold text-gray-400">Product not found</p>
          <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </main>
    );
  }

  function formatImageUrl(url: any): string | undefined {
    if (!url) return undefined;

    // If it's an object with a url property, use that
    const path = typeof url === 'string' ? url : url.url || url.path || (Array.isArray(url) ? url[0] : undefined);

    if (!path || typeof path !== 'string') return undefined;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Try to get base URL from env
    const env = (typeof process !== 'undefined' ? process.env : {}) as any;
    const baseURL = env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || '';

    // Remove /api if present at the end of baseURL for image paths
    const cleanBase = baseURL.replace(/\/api\/?$/, '');

    const separator = path.startsWith('/') ? '' : '/';
    return `${cleanBase}${separator}${path}`;
  }

  // Compute pricing from discount details if available
  const backendTypeMap: Record<string, string> = {
    "PTR_DISCOUNT": "ptr_discount",
    "SAME_PRODUCT_BONUS": "same_product_bonus",
    "PTR_PLUS_SAME_PRODUCT_BONUS": "ptr_discount_and_same_product_bonus",
    "DIFFERENT_PRODUCT_BONUS": "different_product_bonus",
    "PTR_PLUS_DIFFERENT_PRODUCT_BONUS": "ptr_discount_and_different_product_bonus",
    "SPECIAL_PRICE": "special_price",
  };
  const mappedType = (product as any).discountType ? backendTypeMap[(product as any).discountType] : undefined;

  const dd = (product as any).discountDetails || (product as any).discountFormDetails || (mappedType ? {
    type: mappedType,
    ...(product as any).discountMeta
  } : null);

  let sellingPrice = (product as any).sellingPrice || (product as any).ptr || product.price || product.mrp || 0;
  let computedPtr: number | undefined = (product as any).ptr;
  let discountDisplayTag = "";

  // Same wording as the per-seller Marketplace Offers rows below and the
  // seller portal's competition panel — see packages/utils/src/offers.ts
  discountDisplayTag = formatSchemeTag(
    (product as any).discountType,
    (product as any).discountMeta,
  );

  // Fallback to manual tag if still empty
  if (!discountDisplayTag) {
    discountDisplayTag = (product as any).discountTag || (product as any).discountMeta?.tag || '';
  }

  if (dd?.type && product.mrp && (product as any).gstPercent != null) {
    try {
      const pricing = calculatePricing(product.mrp, (product as any).gstPercent, dd);
      sellingPrice = getSellingPrice(pricing);
      computedPtr = pricing.ptr;
      if (!discountDisplayTag && pricing.get > 0) {
        discountDisplayTag = `Buy ${pricing.buy} Get ${pricing.get}`;
      }
    } catch {
      // Fallback
    }
  }

  // If sellingPrice is still 0 or invalid, fall back to MRP (no discount)
  if (!sellingPrice || sellingPrice <= 0) sellingPrice = product.mrp || 0;

  const discount = product.mrp && sellingPrice > 0 ? Math.round(getEffectiveDiscountPercent(product.mrp, sellingPrice)) : 0;
  const uniqueListingsMap = new Map();
  (product.listings || []).forEach((l: any) => {
    // Identify seller by sellerId, or seller.id. If neither exists, fallback to listing id to avoid filtering unrelated items.
    const sellerKey = l.sellerId || l?.seller?.id || l.id;
    if (!uniqueListingsMap.has(sellerKey)) {
      uniqueListingsMap.set(sellerKey, l);
    }
  });
  const listings = Array.from(uniqueListingsMap.values());
  const totalStock = listings.length > 0
    ? listings.reduce((sum: number, l: any) => sum + (l.stock || 0), 0)
    : (product.stock ?? 0);
  const inStock = totalStock > 0;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />

      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 w-full mx-auto px-[4vw]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-[12px] font-[800] text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-gray-800 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            {product.category && (
              <>
                <Link
                  href={`/products?category=${typeof product.category === 'object' ? (product.category as any).name.toLowerCase() : product.category.toLowerCase()}`}
                  className="hover:text-gray-800 transition-colors capitalize"
                >
                  {typeof product.category === 'object' ? (product.category as any).name : product.category}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </>
            )}
            <span className="text-gray-800 truncate max-w-[200px] sm:max-w-md">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-5 lg:gap-4">
            {/* Product Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl overflow-hidden flex items-center justify-center aspect-square lg:col-span-1"
            >
              {(() => {
                const imgs = product.images || (product as any).image_list || (product as any).imageList || (product as any).product_images || [];
                const rawImg = (imgs && imgs.length > 0) ? (typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url) : null;
                const mainImg = formatImageUrl(rawImg);

                if (mainImg) {
                  return (
                    <Image
                      src={mainImg}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  );
                }

                return (
                  <div className="flex items-center justify-center w-full h-full p-8 sm:p-12">
                    <div className="w-full aspect-square bg-[#dcf3e8] rounded-full flex items-center justify-center shadow-inner border border-teal-200/40">
                      <span className="text-6xl sm:text-8xl md:text-9xl font-black text-[#1bd1d4] tracking-widest drop-shadow-sm select-none">
                        {product.name ? (product.name.trim()[0] + product.name.trim()[product.name.trim().length - 1]).toUpperCase() : 'NA'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  {product.category && (
                    <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-3 py-1 rounded-2xl uppercase tracking-widest">
                      {typeof product.category === 'object' ? (product.category as any).name : product.category}
                    </span>
                  )}
                  {/*
                    An h2, not an h1. This heading only exists after the client
                    fetch resolves, so a non-JS crawler never sees it — the
                    server page renders the real <h1> instead. Keeping this as
                    an h1 as well would give the hydrated document two.
                    Styling is unchanged; only the tag differs.
                  */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mt-3 sm:mt-4">{product.name}</h2>
                  {product.manufacturer && (
                    <p className="text-gray-500 font-medium mt-2">by {product.manufacturer}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCustomOrder(true)}
                    className="group flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-md border border-teal-200 rounded-2xl shadow-sm hover:border-teal-500 hover:bg-white transition-all active:scale-95"
                  >
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[13px] font-black text-teal-600 uppercase tracking-widest">Place Custom Order</span>
                  </button>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Don't see the right deal?</p>
                </div>
              </div>

              {/* Unified Product Details Section (Promoted to Top) */}
              <div className="bg-white/40 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] border border-white/60 shadow-xl space-y-8 mb-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h2 className="text-[14px] font-black text-gray-400 uppercase tracking-widest">Product Details</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Live Marketplace Data</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {/* Manufacturer */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manufacturer</p>
                    <p className="text-[16px] font-[900] text-gray-900 leading-tight uppercase">
                      {product.manufacturer || 'Verified Pharma Brand'}
                    </p>
                  </div>

                  {/* Chemical Composition */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chemical Composition</p>
                    <p className="text-[16px] font-[900] text-gray-700 leading-tight italic break-words">
                      {product.chemicalComposition || 'N/A'}
                    </p>
                  </div>

                  {/* Aggregate Marketplace Stock */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Stock</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-[20px] font-black text-emerald-600 tabular-nums">
                        {totalStock.toLocaleString('en-IN')} <span className="text-[12px] uppercase">Units</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price section removed as per Marketplace strategy */}



            </div>
          </div>

          {/* Full Width Marketplace Offers Section */}
          {listings.length > 0 && (
            <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-xl mt-4">
              <div className="flex items-center justify-between border-b border-gray-100/50 pb-3 mb-2">
                <div>
                  <h2 className="text-[14px] font-black text-gray-400 uppercase tracking-widest">Marketplace Offers</h2>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">Competitive quotes from verified sellers</p>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{listings.length} VERIFIED SELLERS</span>
                </div>
              </div>

              <div className="w-full pb-4">
                <div className="w-full">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 lg:grid-cols-12 gap-1 sm:gap-4 px-1 sm:px-4 py-2 text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter sm:tracking-widest mb-2 border-b border-gray-100/50">
                    <div className="text-center lg:col-span-2">Offer</div>
                    <div className="text-center lg:col-span-2">MRP</div>
                    <div className="text-center lg:col-span-2">Net</div>
                    <div className="text-center lg:col-span-2">Exp</div>
                    <div className="text-center lg:col-span-2">Stock</div>
                    <div className="text-right lg:col-span-2">Buy</div>
                  </div>

                  <div className="flex flex-col gap-2 lg:gap-0 lg:divide-y lg:divide-gray-100/30 w-full">
                {listings.map((l: any, idx: number) => {
                  const listingInStock = (l.stock || 0) > 0;
                  const listingCartItem = cartData?.items?.find((item: any) => item.productId === l.id);
                  // MOQ = max(seller's own MOQ, the shared minimum-order rule).
                  // Dividing the floor by the ex-GST price and stopping there
                  // ignored the scheme: a buy-9-get-1 asked for 31 loose units
                  // rather than 36, four whole lots, and disagreed with the
                  // figure the seller was shown when they set the listing up.
                  const minQty = effectiveMinQuantity(l, minOrderAmount);
                  // A 4+1 is bought in fours - the free unit is not billed, so
                  // the step is the buy quantity, not buy + get.
                  const lot = listingLotSize(l);
                  
                  // Calculate or fetch discount for the pill
                  const mrp = l.mrp || product.mrp || l.price || 0;
                  const calculatedDiscount = mrp > l.price ? (((mrp - l.price) / mrp) * 100).toFixed(2) : null;
                  const discountPercent = l.discountMeta?.discountPercent || calculatedDiscount;
                  const discountTag = l.discountTag || (discountPercent ? `${discountPercent}% Off` : null);
                  // This seller's actual scheme (PTR %, buy/get, bonus product).
                  // It was always returned by the API but never shown — only the bare % badge was.
                  const listingScheme = formatSchemeTag(l.discountType, l.discountMeta);

                  return (
                    <div key={l.id} className="relative group w-full">
                      <div className="grid grid-cols-6 lg:grid-cols-12 items-center gap-1 sm:gap-4 py-3 sm:py-6 px-1 sm:px-4 hover:bg-gray-50/50 transition-all rounded-xl sm:rounded-2xl border border-gray-100 sm:border-none">
                      
                      {/* 1. Offer */}
                      <div className="lg:col-span-2 flex flex-col items-center gap-1">
                        <div className="bg-teal-600 text-white px-1 sm:px-3 py-1 rounded-md sm:rounded-full text-[8px] sm:text-[11px] font-black whitespace-nowrap shadow-sm">
                          {discountPercent ? `${Math.round(Number(discountPercent))}%` : '0%'}
                        </div>
                        {listingScheme && (
                          <p className="text-[8px] sm:text-[10px] font-bold text-teal-700 text-center leading-tight px-0.5">
                            {listingScheme}
                          </p>
                        )}
                      </div>

                      {/* 2. MRP */}
                      <div className="lg:col-span-2 flex flex-col items-center">
                        <p className="text-[10px] sm:text-[18px] font-bold text-gray-400 line-through">₹{mrp?.toLocaleString('en-IN')}</p>
                      </div>

                      {/* 3. NET PRICE */}
                      <div className="lg:col-span-2 flex flex-col items-center">
                        <p className="text-[12px] sm:text-[22px] font-black text-gray-900 leading-none">₹{l.price?.toLocaleString('en-IN')}</p>
                      </div>

                      {/* 4. EXPIRY */}
                      <div className="lg:col-span-2 flex flex-col items-center">
                         <p className="text-[10px] sm:text-[16px] font-black text-gray-700">
                            {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : 'N/A'}
                         </p>
                      </div>

                      {/* 5. Stock */}
                      <div className="lg:col-span-2 flex flex-col items-center">
                        <p className={`text-[10px] sm:text-[12px] font-black uppercase ${listingInStock ? 'text-teal-600' : 'text-rose-600'}`}>
                           {l.stock}
                        </p>
                        <p className="text-[7px] sm:text-[14px] font-black text-gray-400 uppercase">
                           MOQ {minQty}
                        </p>
                      </div>

                      {/* 6. Purchase */}
                      <div className="lg:col-span-2 flex items-center justify-end gap-1">
                        {listingInStock ? (
                          <div className="flex items-center justify-end w-full">
                            {(!listingCartItem || listingCartItem.quantity === 0) ? (
                              <button 
                                onClick={() => addToCart.mutate({ productId: l.id, quantity: minQty, productName: product.name, slug: toProductSlug(product), price: l.price, mrp: mrp, gstPercent: l.gstPercent ?? product.gstPercent, imageUrl: product.images?.[0], discountType: l.discountType, discountMeta: l.discountMeta, moq: minQty, stock: l.stock })}
                                className="w-full sm:w-[144px] h-8 sm:h-12 bg-white border border-slate-200 text-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:border-teal-500 transition-all shadow-sm"
                              >
                                <Plus className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={3} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 sm:gap-2 w-full">
                                <div className="flex items-center bg-slate-900 rounded-lg sm:rounded-xl p-0.5 h-8 sm:h-12 shadow-sm w-full">
                                  <button 
                                    onMouseDown={(e) => { e.preventDefault(); const next = stepQuantityByLot(listingCartItem.quantity, -1, lot, minQty, l.stock); if (next > 0) addToCart.mutate({ productId: l.id, quantity: next, replace: true }); else removeCartItem.mutate(listingCartItem.id); }}
                                    className="flex-1 h-full flex items-center justify-center text-white"
                                  >
                                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                                  </button>
                                  
                                  <MarketplaceQtyInput 
                                    initialQuantity={listingCartItem.quantity}
                                    stock={l.stock}
                                    minQty={minQty}
                                    lot={lot}
                                    onUpdate={(nextQty) => addToCart.mutate({ productId: l.id, quantity: nextQty, productName: product.name, slug: toProductSlug(product), price: l.price, mrp: mrp, gstPercent: l.gstPercent ?? product.gstPercent, imageUrl: product.images?.[0], discountType: l.discountType, discountMeta: l.discountMeta, moq: minQty, stock: l.stock, replace: true })}
                                    className="w-4 sm:w-10 text-[10px] sm:text-lg font-black text-white text-center bg-transparent outline-none"
                                  />
                                  
                                  <button 
                                    onMouseDown={(e) => { e.preventDefault(); const next = stepQuantityByLot(listingCartItem.quantity, 1, lot, minQty, l.stock); if (next !== listingCartItem.quantity) addToCart.mutate({ productId: l.id, quantity: next, replace: true }); }}
                                    className="flex-1 h-full flex items-center justify-center text-white"
                                  >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                                  </button>
                                </div>
                                
                                <button 
                                  onMouseDown={(e) => { e.preventDefault(); removeCartItem.mutate(listingCartItem.id); }}
                                  className="hidden sm:flex w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl items-center justify-center"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] text-rose-500 font-bold uppercase">N/A</span>
                        )}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        )}

        {listings.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-[32px] sm:rounded-[40px] bg-white/40 backdrop-blur-md border-2 border-dashed border-gray-200 text-center gap-6 mt-4">
            <Package className="w-12 h-12 text-gray-300" />
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-800">Looking for better deals on {product.name}?</h3>
              <p className="text-[14px] text-gray-500 max-w-[400px] mx-auto leading-relaxed font-medium">We currently don't have active marketplace offers for this item. Our sourcing team can find the best professional sellers for you.</p>
            </div>
            <button 
              onClick={() => setShowCustomOrder(true)}
              className="px-10 py-4 bg-teal-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl active:scale-95"
            >
              Request Custom Quote for {product.name}
            </button>
          </div>
        )}


        {/* DescriptionSection - Below Marketplace */}
        <div className="bg-white/40 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/60 shadow-xl mt-4 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-[14px] font-black text-gray-400 uppercase tracking-widest">Product Description</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Detailed information and specifications</p>
            </div>
          </div>
          {product.description ? (
            <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap text-[15px]">{product.description}</p>
          ) : (
            <p className="text-gray-400 italic text-[14px]">No detailed description available for this product.</p>
          )}
        </div>

          {/* Reviews Section */}
          {/* <ReviewsSection productId={params.productId} /> */}
        </motion.div>
      </div>

      <CustomOrderModal
        isOpen={showCustomOrder}
        onClose={() => setShowCustomOrder(false)}
        productName={product.name}
        productId={product.id}
      />
    </main>
  );
}

/* ─── Reviews Section Component ─────────────────────── */

// function StarRating({ rating, size = 'sm', interactive, onChange }: { rating: number; size?: 'sm' | 'lg'; interactive?: boolean; onChange?: (r: number) => void }) {
//   const starSize = size === 'lg' ? 'w-7 h-7' : 'w-4 h-4';
//   return (
//     <div className="flex items-center gap-1">
//       {[1, 2, 3, 4, 5].map((star) => (
//         <button
//           key={star}
//           type="button"
//           disabled={!interactive}
//           onClick={() => onChange?.(star)}
//           className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
//         >
//           <Star
//             className={`${starSize} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`}
//           />
//         </button>
//       ))}
//     </div>
//   );
// }

// function ReviewsSection({ productId }: { productId: string }) {
//   const { data: reviewsData, isLoading } = useProductReviews(productId);
//   const createReview = useCreateReview();
//   const { toast } = useToast();
//   const [showForm, setShowForm] = useState(false);
//   const [newRating, setNewRating] = useState(5);
//   const [newComment, setNewComment] = useState('');

//   const reviews = reviewsData?.data ?? [];
//   const averageRating = reviewsData?.averageRating ?? 0;
//   const totalReviews = reviewsData?.total ?? reviews.length;

//   const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
//     star,
//     count: reviews.filter((r) => r.rating === star).length,
//     percent: totalReviews > 0 ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100 : 0,
//   }));

//   const handleSubmit = () => {
//     if (!newComment.trim()) return;
//     createReview.mutate(
//       { productId, rating: newRating, comment: newComment },
//       {
//         onSuccess: () => {
//           setShowForm(false);
//           setNewComment('');
//           setNewRating(5);
//           toast('Review submitted successfully!', 'success');
//         },
//         onError: () => toast('Failed to submit review', 'error'),
//       }
//     );
//   };

//   return (
//     <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl">
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
//         <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Reviews</h2>
//         <button
//           onClick={() => setShowForm(!showForm)}
//           className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-black transition-colors shadow-lg w-full sm:w-auto justify-center"
//         >
//           <Star className="w-4 h-4" />
//           Write a Review
//         </button>
//       </div>

//       {/* Rating Summary */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
//         <div className="flex flex-col items-center justify-center bg-lime-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-lime-100">
//           <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
//           <StarRating rating={Math.round(averageRating)} />
//           <p className="text-sm text-gray-500 font-medium mt-2">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
//         </div>
//         <div className="md:col-span-2 flex flex-col justify-center gap-2">
//           {ratingDistribution.map(({ star, count, percent }) => (
//             <div key={star} className="flex items-center gap-3">
//               <span className="text-sm font-bold text-gray-500 w-4">{star}</span>
//               <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
//               <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
//                 <motion.div
//                   initial={{ width: 0 }}
//                   animate={{ width: `${percent}%` }}
//                   transition={{ duration: 0.6, delay: star * 0.1 }}
//                   className="h-full bg-yellow-400 rounded-full"
//                 />
//               </div>
//               <span className="text-xs font-bold text-gray-400 w-8 text-right">{count}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Write Review Form */}
//       <AnimatePresence>
//         {showForm && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             className="overflow-hidden"
//           >
//             <div className="bg-white/60 p-6 rounded-3xl border border-gray-100 mb-8 space-y-4">
//               <div>
//                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Rating</label>
//                 <StarRating rating={newRating} size="lg" interactive onChange={setNewRating} />
//               </div>
//               <div>
//                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Review</label>
//                 <textarea
//                   value={newComment}
//                   onChange={(e) => setNewComment(e.target.value)}
//                   rows={3}
//                   placeholder="Share your experience with this product..."
//                   className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none"
//                 />
//               </div>
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => setShowForm(false)}
//                   className="px-6 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSubmit}
//                   disabled={createReview.isPending || !newComment.trim()}
//                   className="px-6 py-2.5 bg-lime-300 text-gray-900 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-lime-400 shadow-lg shadow-lime-200 transition-all disabled:opacity-50"
//                 >
//                   <Send className="w-4 h-4" />
//                   {createReview.isPending ? 'Submitting...' : 'Submit Review'}
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Review List */}
//       {isLoading ? (
//         <div className="flex items-center justify-center py-12">
//           <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
//         </div>
//       ) : reviews.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-12 gap-3">
//           <Star className="w-10 h-10 text-gray-200" />
//           <p className="text-lg font-bold text-gray-300">No reviews yet</p>
//           <p className="text-sm text-gray-400">Be the first to review this product!</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {reviews.map((review, idx) => (
//             <motion.div
//               key={review.id}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: idx * 0.05 }}
//               className="p-6 bg-white/40 rounded-3xl border border-white/40 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
//                     <User className="w-5 h-5 text-gray-400" />
//                   </div>
//                   <div>
//                     <p className="font-bold text-gray-900">{review.userName ?? 'Anonymous'}</p>
//                     <p className="text-xs text-gray-400 font-medium">
//                       {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//                     </p>
//                   </div>
//                 </div>
//                 <StarRating rating={review.rating} />
//               </div>
//               {review.comment && (
//                 <p className="text-gray-600 font-medium leading-relaxed ml-[52px]">{review.comment}</p>
//               )}
//             </motion.div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

/* ─── Marketplace Quantity Input Component ──────────────── */

function MarketplaceQtyInput({ 
  initialQuantity, 
  stock, 
  minQty, 
  lot = 1,
  onUpdate,
  className
}: { 
  initialQuantity: number; 
  stock: number; 
  minQty: number; 
  lot?: number;
  onUpdate: (qty: number) => void;
  className?: string;
}) {
  const [val, setVal] = useState<string>(String(initialQuantity));

  // Sync from props only when initialQuantity changes externally
  useEffect(() => {
    setVal(String(initialQuantity));
  }, [initialQuantity]);

  const handleBlur = () => {
    let num = parseInt(val, 10);
    
    // If empty or invalid, treat as removal (0)
    if (isNaN(num)) {
      num = 0;
    }

    // Snap to an allowed quantity: at or above the minimum, in whole lots and
    // within stock. Rounds down, so a typed figure never quietly costs more
    // than it asked for.
    const finalQty = snapQuantityToLot(num, lot, minQty, stock);
    
    // If the snapped value is different from what was typed, update display
    setVal(String(finalQty));
    
    // Update cart if the value is different from the server state
    if (finalQty !== initialQuantity) {
      onUpdate(finalQty);
    }
  };

  return (
    <input 
      type="text"
      inputMode="numeric"
      className={className || "flex-1 bg-transparent font-black text-lg text-slate-900 min-w-[40px] text-center outline-none selection:bg-slate-200"}
      value={val}
      onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
      onBlur={handleBlur}
      onKeyDown={(e) => { 
        if(e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}
