'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  User,
  Clock,
  Plus,
  X
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';

import { useProductById } from '@/hooks/useProducts';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import Link from 'next/link';

export default function ProductReviewsPage() {
  const { productId } = useParams() as { productId: string };
  const { data: product, isLoading: isProductLoading } = useProductById(productId);
  const { data: reviewsData, isLoading: isReviewsLoading } = useProductReviews(productId);
  const createReview = useCreateReview();

  const [isAddingReview, setIsAddingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const reviews = reviewsData?.data ?? [];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || createReview.isPending) return;

    createReview.mutate({
      productId,
      rating,
      comment: comment.trim(),
    }, {
      onSuccess: () => {
        setIsAddingReview(false);
        setComment('');
        setRating(5);
      }
    });
  };

  if (isProductLoading || isReviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbfa]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-lime-300 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fbfa]">
      <Navbar showUserActions={true} />

      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-20 px-[4vw] w-full mx-auto">
        <Link
          href={`/products/${productId}`}
          className="inline-flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition-colors mb-6 sm:mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Product</span>
        </Link>

        {/* Product Summary Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 lg:p-10 mb-8 sm:mb-12 shadow-xl flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-[#f1f6ea] rounded-2xl sm:rounded-3xl flex-shrink-0 relative overflow-hidden flex items-center justify-center">
            <img
              src={product?.images?.[0] || '/product_placeholder.png'}
              alt={product?.name}
              className="object-contain p-6"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight mb-3 sm:mb-4">
              {product?.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 bg-lime-100 px-4 py-2 rounded-2xl">
                <Star className="w-5 h-5 text-lime-600 fill-lime-600" />
                <span className="text-xl font-black text-gray-900">{averageRating}</span>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                {reviews.length} Reviews
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingReview(true)}
            className="px-5 sm:px-8 h-12 sm:h-14 md:h-16 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-lime-300/20 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 text-sm sm:text-base flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Write a Review</span>
          </button>
        </motion.div>

        {/* Reviews List */}
        <div className="space-y-6">
          <AnimatePresence>
            {reviews.map((review: any, idx: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{review.userName || 'Anonymous Buyer'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? 'text-lime-500 fill-lime-500' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed text-lg">
                  {review.comment}
                </p>
                <div className="mt-8 pt-6 border-t border-gray-100/50 flex items-center gap-6">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-lime-500 transition-colors font-bold text-xs uppercase tracking-widest">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful?</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-sky-500 transition-colors font-bold text-xs uppercase tracking-widest">
                    <MessageSquare className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {reviews.length === 0 && (
            <div className="text-center py-24 opacity-30">
              <MessageSquare className="w-20 h-20 mx-auto mb-6" />
              <p className="text-2xl font-black uppercase tracking-widest">No reviews yet</p>
              <p className="font-medium mt-2">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Review Sidebar/Modal */}
      <AnimatePresence>
        {isAddingReview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingReview(false)}
              className="fixed inset-0 bg-black/5 backdrop-blur-xl z-[150]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[160] p-5 sm:p-8 md:p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Review Product</h2>
                <button
                  onClick={() => setIsAddingReview(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="flex-1 flex flex-col">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Rating</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star className={`w-10 h-10 ${star <= rating ? 'text-lime-400 fill-lime-400' : 'text-gray-100'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Experience</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What do you think about the product?"
                      rows={6}
                      className="w-full bg-gray-50/50 rounded-3xl p-6 border border-gray-100 focus:ring-4 focus:ring-lime-100 focus:border-lime-200 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    type="submit"
                    disabled={createReview.isPending || !comment.trim()}
                    className="w-full h-16 bg-lime-300 hover:bg-lime-400 disabled:opacity-50 text-gray-900 rounded-2xl text-xl font-black shadow-xl shadow-lime-300/20 active:scale-95 transition-all"
                  >
                    {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
