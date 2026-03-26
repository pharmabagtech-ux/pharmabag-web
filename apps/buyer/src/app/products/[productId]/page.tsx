'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, ShoppingCart, Star, Loader2, AlertCircle, Minus, Plus, Check, Send, User, Heart } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useProductById } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent } from '@pharmabag/utils';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { data: product, isLoading, isError } = useProductById(params.productId);
  const addToCart = useAddToCart();
  const { data: wishlistData } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const wishlistItems = wishlistData?.items ?? [];
  const wishlistEntry = wishlistItems.find((w) => w.productId === params.productId || w.product?.id === params.productId);
  const isWishlisted = !!wishlistEntry;

  const handleToggleWishlist = () => {
    if (isWishlisted && wishlistEntry) {
      removeFromWishlist.mutate(wishlistEntry.id, {
        onSuccess: () => toast('Removed from wishlist', 'success'),
        onError: () => toast('Failed to update wishlist', 'error'),
      });
    } else {
      addToWishlist.mutate(params.productId, {
        onSuccess: () => toast('Added to wishlist!', 'success'),
        onError: () => toast('Failed to update wishlist', 'error'),
      });
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setAdded(true);
          toast(`${product.name} added to cart!`, 'success');
          setTimeout(() => setAdded(false), 2000);
        },
        onError: () => toast('Failed to add to cart', 'error'),
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
        <Footer />
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
        <Footer />
      </main>
    );
  }

  // Compute pricing from discount details if available
  const dd = (product as any).discountDetails || (product as any).discountFormDetails;
  let sellingPrice = product.price ?? 0;
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
      // Fallback to raw product values
    }
  }

  const discount = product.mrp ? Math.round(getEffectiveDiscountPercent(product.mrp, sellingPrice)) : 0;
  const inStock = (product.stock ?? 0) > 0;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar showUserActions={true} />

      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold w-fit">
            <ChevronLeft className="w-5 h-5" />
            Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {/* Product Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl overflow-hidden flex items-center justify-center aspect-square max-h-[400px] sm:max-h-[500px] lg:max-h-none"
            >
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <Package className="w-20 h-20" />
                  <p className="text-sm font-bold">No image available</p>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
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
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-2xl">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {computedPtr && (
                  <p className="text-sm text-gray-500 mt-1 font-medium">PTR: ₹{computedPtr.toLocaleString('en-IN')}</p>
                )}
                {buyGetTag && (
                  <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-2xl mt-2">
                    {buyGetTag}
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

              {/* Quantity + Add to Cart */}
              {inStock && (
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-center bg-white/60 rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-6 py-3 font-bold text-gray-900 tabular-nums min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending || added}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-70 ${
                      added
                        ? 'bg-green-500 text-white shadow-green-200'
                        : 'bg-gray-900 text-white hover:bg-black shadow-black/20'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Cart
                      </>
                    ) : addToCart.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                </div>
              )}

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
          <ReviewsSection productId={params.productId} />
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}

/* ─── Reviews Section Component ─────────────────────── */

function StarRating({ rating, size = 'sm', interactive, onChange }: { rating: number; size?: 'sm' | 'lg'; interactive?: boolean; onChange?: (r: number) => void }) {
  const starSize = size === 'lg' ? 'w-7 h-7' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            className={`${starSize} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const { data: reviewsData, isLoading } = useProductReviews(productId);
  const createReview = useCreateReview();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const reviews = reviewsData?.data ?? [];
  const averageRating = reviewsData?.averageRating ?? 0;
  const totalReviews = reviewsData?.total ?? reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: totalReviews > 0 ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createReview.mutate(
      { productId, rating: newRating, comment: newComment },
      {
        onSuccess: () => {
          setShowForm(false);
          setNewComment('');
          setNewRating(5);
          toast('Review submitted successfully!', 'success');
        },
        onError: () => toast('Failed to submit review', 'error'),
      }
    );
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-white/40 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Reviews</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-black transition-colors shadow-lg w-full sm:w-auto justify-center"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
        <div className="flex flex-col items-center justify-center bg-lime-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-lime-100">
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(averageRating)} />
          <p className="text-sm text-gray-500 font-medium mt-2">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
        </div>
        <div className="md:col-span-2 flex flex-col justify-center gap-2">
          {ratingDistribution.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 w-4">{star}</span>
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, delay: star * 0.1 }}
                  className="h-full bg-yellow-400 rounded-full"
                />
              </div>
              <span className="text-xs font-bold text-gray-400 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/60 p-6 rounded-3xl border border-gray-100 mb-8 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Rating</label>
                <StarRating rating={newRating} size="lg" interactive onChange={setNewRating} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Review</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this product..."
                  className="w-full px-5 py-3 bg-white/60 rounded-2xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-lime-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createReview.isPending || !newComment.trim()}
                  className="px-6 py-2.5 bg-lime-300 text-gray-900 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-lime-400 shadow-lg shadow-lime-200 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Star className="w-10 h-10 text-gray-200" />
          <p className="text-lg font-bold text-gray-300">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 bg-white/40 rounded-3xl border border-white/40 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{review.userName ?? 'Anonymous'}</p>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && (
                <p className="text-gray-600 font-medium leading-relaxed ml-[52px]">{review.comment}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
