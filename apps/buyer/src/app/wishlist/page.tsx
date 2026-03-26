'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, Package, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAddToCart } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@pharmabag/utils';

export default function WishlistPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  const items = wishlist?.items ?? [];

  const handleRemove = (productId: string) => {
    removeFromWishlist.mutate(productId, {
      onSuccess: () => toast('Removed from wishlist', 'success'),
      onError: () => toast('Failed to remove item', 'error'),
    });
  };

  const handleAddToCart = (productId: string) => {
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => toast('Added to cart', 'success'),
      onError: () => toast('Failed to add to cart', 'error'),
    });
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-pink-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-3 sm:px-4 md:px-8 max-w-[1200px] mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={Heart}
              title="Unable to load wishlist"
              description="Please try again later"
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save products you love and come back to them later"
              actionLabel="Browse Products"
              actionHref="/products"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const product = item.product;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden group"
                    >
                      {/* Product Image */}
                      <Link href={`/products/${item.productId}`} className="block relative h-48 bg-gray-50 overflow-hidden">
                        {product?.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="p-5 space-y-3">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-emerald-600 transition-colors">
                            {product?.name ?? 'Product'}
                          </h3>
                        </Link>

                        {product?.manufacturer && (
                          <p className="text-xs text-gray-500">{product.manufacturer}</p>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(product?.price ?? 0)}
                          </span>
                          {product?.mrp && product.mrp > (product.price ?? 0) && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(product.mrp)}
                            </span>
                          )}
                        </div>

                        {product?.stock !== undefined && product.stock <= 0 && (
                          <p className="text-xs text-red-500 font-medium">Out of stock</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleAddToCart(item.productId)}
                            disabled={addToCart.isPending || (product?.stock !== undefined && product.stock <= 0)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            disabled={removeFromWishlist.isPending}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Footer />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
