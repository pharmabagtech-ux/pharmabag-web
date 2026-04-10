'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/shared/Toast';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';

export default function WishlistDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const items = wishlist?.items ?? [];

  const handleAddToCart = (item: any) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('open-login'));
      return;
    }
    const cartItem = {
      productId: item.productId || item.product?.id || item.id,
      quantity: 1,
    };
    addToCart.mutate(cartItem, {
      onSuccess: () => {
        toast('Added to bag', 'success');
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] md:w-[400px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Wishlist</h2>
                {items.length > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">Loading wishlist...</p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm font-medium text-red-400">Failed to load wishlist</p>
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Wishlist is empty"
                  description="Add items to your wishlist to save them for later."
                  actionLabel="Browse Products"
                  actionHref="/products"
                />
              ) : (
                items.map((item: any) => {
                  const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                  const itemPrice = item.product?.price ?? item.price ?? 0;
                  const itemImage = item.product?.images?.[0] || item.imageUrl || item.image || '/product_placeholder.png';

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="flex gap-4"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={itemImage} 
                          alt={itemName} 
                          className="w-full h-full object-contain p-2" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between gap-2">
                          <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{itemName}</h3>
                          <button
                            onClick={() => removeFromWishlist.mutate(item.productId || item.product?.id || item.id, {
                              onSuccess: () => toast('Removed from wishlist', 'info'),
                            })}
                            disabled={removeFromWishlist.isPending}
                            className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 tracking-tight">₹{itemPrice.toLocaleString('en-IN')}</p>
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={addToCart.isPending}
                            className="p-2 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
