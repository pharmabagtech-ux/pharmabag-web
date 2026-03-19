'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, ShoppingCart, Star, Loader2, AlertCircle, Minus, Plus, Check, Send, User } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useProductById } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { useToast } from '@/components/shared/Toast';
import Link from 'next/link';
import { useState } from 'react';

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const { data: product, isLoading, isError } = useProductById(params.productId);
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
        <Navbar />
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
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-gray-300" />
          <p className="text-lg font-bold text-gray-400">Product not found</p>
          <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">Back to Home</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const inStock = (product.stock ?? 0) > 0;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar />

      <div className="pt-32 pb-20 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold w-fit">
            <ChevronLeft className="w-5 h-5" />
            Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/40 shadow-xl overflow-hidden flex items-center justify-center aspect-square"
            >
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <Package className="w-20 h-20" />
                  <p className="text-sm font-bold">No image available</p>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                {product.category && (
                  <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-3 py-1 rounded-full uppercase tracking-widest">
                    {product.category}
                  </span>
                )}
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight mt-4">{product.name}</h1>
                {product.manufacturer && (
                  <p className="text-gray-500 font-medium mt-2">by {product.manufacturer}</p>
                )}
              </div>

              {/* Price */}
              <div className="bg-white/40 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-lg">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.mrp && product.mrp > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">Inclusive of all taxes</p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity + Add to Cart */}
              {inStock && (
                <div className="flex items-center gap-6">
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
                    className={`flex-1 py-4 rounded-full font-bold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-70 ${
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
                <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/40 shadow-lg">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
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
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reviews</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center bg-lime-50/50 rounded-3xl p-6 border border-lime-100">
          <p className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
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
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-full font-bold text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createReview.isPending || !newComment.trim()}
                  className="px-6 py-2.5 bg-lime-300 text-gray-900 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-lime-400 shadow-lg shadow-lime-200 transition-all disabled:opacity-50"
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
