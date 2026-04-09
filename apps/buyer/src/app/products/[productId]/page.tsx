'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Package, ShoppingBag, Star, Loader2, AlertCircle, Minus, Plus, Check, Send, User, Heart } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';

import { useProductById } from '@/hooks/useProducts';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent } from '@pharmabag/utils';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { data: product, isLoading, isError } = useProductById(params.productId);
  const addToCart = useAddToCart();
  const { data: cartData } = useCart();
  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
  const wishlistEntry = wishlistItems.find((w) => w.productId === params.productId || w.product?.id === params.productId);
  const isWishlisted = !!wishlistEntry;

  const handleToggleWishlist = () => {
    if (isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.productId || params.productId, {
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
        price: sellingPrice,
        mrp: product.mrp,
        imageUrl: product.images?.[0]
      },
      {
        onSuccess: () => {
          setQuantity(finalQty);
          setAdded(true);
          toast(`${product.name} updated in bag!`, 'success');
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

  // Rebuild exactly matching the required UI format (Matches the Card)
  if ((product as any).discountType) {
    const d = (product as any).discountMeta;
    const type = (product as any).discountType;
    if (type === "PTR_DISCOUNT" && (d?.discountPercent ?? 0) > 0) {
      discountDisplayTag = `${d?.discountPercent}% Off`;
    } else if (type === "SAME_PRODUCT_BONUS" && (d?.get ?? 0) > 0) {
      discountDisplayTag = `(${d?.buy ?? 0}+${d?.get ?? 0}) Free`;
    } else if (type === "PTR_PLUS_SAME_PRODUCT_BONUS") {
      if ((d?.discountPercent ?? 0) > 0 && (d?.get ?? 0) > 0) {
        discountDisplayTag = `${d?.discountPercent}% Off (${d?.buy ?? 0}+${d?.get ?? 0})`;
      } else if ((d?.discountPercent ?? 0) > 0) {
        discountDisplayTag = `${d?.discountPercent}% Off`;
      } else if ((d?.get ?? 0) > 0) {
        discountDisplayTag = `(${d?.buy ?? 0}+${d?.get ?? 0}) Free`;
      }
    } else if (type === "DIFFERENT_PRODUCT_BONUS" && (d?.get ?? 0) > 0) {
      discountDisplayTag = `(${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''}) Free`;
    } else if (type === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
      if ((d?.discountPercent ?? 0) > 0 && (d?.get ?? 0) > 0) {
        discountDisplayTag = `${d?.discountPercent}% Off (${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''})`;
      } else if ((d?.discountPercent ?? 0) > 0) {
        discountDisplayTag = `${d?.discountPercent}% Off`;
      } else if ((d?.get ?? 0) > 0) {
        discountDisplayTag = `(${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''}) Free`;
      }
    } else if (type === "SPECIAL_PRICE") {
      discountDisplayTag = `Special Price`;
    }
  }

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
  const inStock = (product.stock ?? 0) > 0;

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
                  <div className="flex flex-col items-center gap-4 text-gray-300">
                    <Package className="w-20 h-20" />
                    <p className="text-sm font-bold">No image available</p>
                  </div>
                );
              })()}
            </motion.div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:col-span-2">
              <div>
                {product.category && (
                  <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-3 py-1 rounded-2xl uppercase tracking-widest">
                    {typeof product.category === 'object' ? (product.category as any).name : product.category}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mt-3 sm:mt-4">{product.name}</h1>
                {product.manufacturer && (
                  <p className="text-gray-500 font-medium mt-2">by {product.manufacturer}</p>
                )}
              </div>

              {/* Price */}
              <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/40 shadow-lg">
                <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">₹{sellingPrice.toLocaleString('en-IN')}</span>
                  {product.mrp && product.mrp > sellingPrice && (
                    <>
                      <span className="text-base sm:text-lg md:text-xl text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                      {discountDisplayTag && (
                        <span className="text-[15px] font-normal text-green-800 bg-green-50 border border-green-300 px-10 py-0.5 rounded-full whitespace-nowrap">
                          {discountDisplayTag}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {computedPtr && (
                  <p className="text-sm text-gray-500 mt-1 font-medium">PTR: ₹{computedPtr.toLocaleString('en-IN')}</p>
                )}
                {/* Fallback to computed discount if no structured tag exists */}
                {!discountDisplayTag && discount > 0 && (
                  <span className="inline-block text-[14px] font-normal text-green-800 bg-green-50 border border-green-300 px-8 py-0.5 rounded-full mt-2">
                    {discount}% OFF
                  </span>
                )}
                <p className="text-xs text-gray-400 mt-2 font-medium">Inclusive of all taxes</p>
              </div>

              {/* Stock Status + Wishlist */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleToggleWishlist}
                  disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                  className="p-3 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm hover:bg-white transition-all shadow-sm disabled:opacity-50"
                  title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} />
                </motion.button>
              </div>

              {/* Quantity + Add to Bag */}
              {inStock && (
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center bg-white/60 rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const min = (product as any).minimumOrderQuantity || 1;
                        setQuantity((q) => Math.max(min, Number(q) - 1));
                      }}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val === '') {
                          setQuantity('' as any);
                          return;
                        }
                        const parsed = parseInt(val, 10);
                        const stock = product.stock || 0;
                        const maxLimit = (product as any).maximumOrderQuantity || stock;
                        const max = Math.min(stock, maxLimit);
                        
                        if (parsed > max) {
                            setQuantity(max);
                            toast(`Only ${max} units available in stock`, 'error');
                        } else {
                            setQuantity(parsed);
                        }
                      }}
                      onBlur={() => {
                        const min = (product as any).minimumOrderQuantity || 1;
                        const stock = product.stock || 0;
                        const maxLimit = (product as any).maximumOrderQuantity || stock;
                        const max = Math.min(stock, maxLimit);
                        
                        let val = parseInt(String(quantity), 10);
                        if (isNaN(val) || val < min) {
                           setQuantity(min);
                        } else if (val > max) {
                           setQuantity(max);
                        }
                      }}
                      className="w-16 px-2 py-3 font-bold text-gray-900 tabular-nums text-center bg-transparent outline-none border-x border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const stock = product.stock || 0;
                        const maxLimit = (product as any).maximumOrderQuantity || stock;
                        const max = Math.min(stock, maxLimit);
                        setQuantity((q) => Math.min(max, Number(q) + 1));
                      }}
                      disabled={Number(quantity) >= Math.min(product.stock || 0, (product as any).maximumOrderQuantity || (product.stock || 0))}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending || added}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-70 ${added
                      ? 'bg-green-500 text-white shadow-green-200'
                      : 'bg-gray-900 text-white hover:bg-black shadow-black/20'
                      }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Bag
                      </>
                    ) : addToCart.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Add to Bag
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Product Details Grid */}
              <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-lg">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Product Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* MRP */}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">MRP</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.mrp?.toLocaleString('en-IN') || 'N/A'}</span>
                  </div>

                  {/* PTR */}
                  {computedPtr && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">PTR</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">₹{computedPtr.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Net Rate */}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Net Rate</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">₹{sellingPrice.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Discount */}
                  {discount > 0 && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Discount</span>
                      <span className="text-sm sm:text-base font-bold text-green-600">{discount}%</span>
                    </div>
                  )}

                  {/* GST */}
                  {((product as any).gstPercent || (product as any).gst) && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">GST</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).gstPercent || (product as any).gst}%</span>
                    </div>
                  )}

                  {/* Stock */}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Stock</span>
                    <span className={`text-sm sm:text-base font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock ?? 'N/A'} {inStock ? 'units' : ''}
                    </span>
                  </div>

                  {/* Min Qty */}
                  {(product as any).minimumOrderQuantity && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Min Qty</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).minimumOrderQuantity}</span>
                    </div>
                  )}

                  {/* Max Qty */}
                  {(product as any).maximumOrderQuantity && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Max Qty</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).maximumOrderQuantity}</span>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {(product as any).expiryDate && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Expiry</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">
                        {new Date((product as any).expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Generic Name (from extraFields) */}
                  {(product as any).genericName && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Generic</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).genericName}</span>
                    </div>
                  )}

                  {/* Manufacturer */}
                  {(product as any).manufacturer && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Manufacturer</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).manufacturer}</span>
                    </div>
                  )}

                  {/* Chemical Composition */}
                  {(product as any).chemicalComposition && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Chemical</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{(product as any).chemicalComposition}</span>
                    </div>
                  )}

                  {/* Discount Display Tag */}
                  {discountDisplayTag && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Offer</span>
                      <span className="text-sm sm:text-base font-normal text-green-800 bg-green-50/50 border border-green-300 px-6 py-0.5 rounded-full w-fit">
                        {discountDisplayTag}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/40 shadow-lg">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Description</h2>
                  <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          {/* <ReviewsSection productId={params.productId} /> */}
        </motion.div>
      </div>

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
