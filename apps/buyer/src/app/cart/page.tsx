'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, AlertTriangle, ArrowRight, Package, ShoppingBag, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import AuthGuard from '@/components/shared/AuthGuard';
import EmptyState from '@/components/shared/EmptyState';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@pharmabag/utils';

export default function CartPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { data: cart, isLoading, isError } = useCart();
  const { data: config } = usePlatformConfig();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const { toast } = useToast();

  const gstRate = (config?.gst_rate ?? 12) / 100;
  const minOrderAmount = config?.min_order_amount ?? 20000;

  const items = cart?.items ?? [];
  const subtotal = items.reduce((acc, item: any) => {
    const price = item.product?.price ?? item.price;
    return acc + (price || 0) * item.quantity;
  }, 0);
  const gst = Math.round(subtotal * gstRate);
  const total = subtotal + gst;
  const isAboveMinimum = subtotal >= minOrderAmount;
  const remaining = minOrderAmount - subtotal;

  const handleClearCart = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => toast('Bag cleared', 'info'),
      onError: () => toast('Failed to clear bag', 'error'),
    });
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-30 pointer-events-none" />

        <Navbar showUserActions onLoginClick={() => setIsLoginOpen(true)} />

        <div className="pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-20 px-[4vw] w-full mx-auto relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Shopping Bag</h1>
              <p className="text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                disabled={clearCart.isPending}
                className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={ShoppingBag}
              title="Unable to load bag"
              description="Please try again later"
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is empty"
              description="Browse products and add items to get started"
              actionLabel="Browse Products"
              actionHref="/products"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Minimum Order Warning */}
                {!isAboveMinimum && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Minimum order value is {formatCurrency(minOrderAmount)}</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Add {formatCurrency(remaining)} more to proceed to checkout
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (subtotal / minOrderAmount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                  {items.map((item: any) => {
                    const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                    const itemPrice = item.product?.price ?? item.price;
                    const itemMrp = item.product?.mrp;
                    const itemImage = item.product?.images?.[0] ?? item.imageUrl ?? item.image;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5"
                      >
                        <div className="flex gap-3 sm:gap-4">
                          {/* Image */}
                          <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl overflow-hidden">
                              {itemImage ? (
                                <Image src={itemImage} alt={itemName} fill className="object-cover" sizes="96px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <Link href={`/products/${item.productId}`}>
                                <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-emerald-600 transition-colors">
                                  {itemName}
                                </h3>
                              </Link>
                              <button
                                onClick={() => removeItem.mutate(item.id, {
                                  onSuccess: () => toast('Item removed', 'info'),
                                })}
                                disabled={removeItem.isPending}
                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {item.product?.manufacturer && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.product.manufacturer}</p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-1.5">
                                <button
                                  onClick={() => updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                                  disabled={updateItem.isPending || item.quantity <= 1}
                                  className="text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-sm font-bold text-gray-900 min-w-[24px] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                  disabled={updateItem.isPending}
                                  className="text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency((itemPrice || 0) * item.quantity)}</p>
                                {itemMrp && itemMrp > itemPrice && (
                                  <p className="text-xs text-gray-400 line-through">{formatCurrency(itemMrp * item.quantity)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 sticky top-28 space-y-5">
                  <h2 className="font-bold text-gray-900 text-lg">Order Summary</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>GST ({config?.gst_rate ?? 12}%)</span>
                      <span className="font-medium">{formatCurrency(gst)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery</span>
                      <span className="font-medium text-emerald-600">Free</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Savings */}
                  {items.some((i: any) => i.product?.mrp && i.product.mrp > (i.product?.price ?? i.price)) && (
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-sm font-semibold text-emerald-700">
                        You save {formatCurrency(
                          items.reduce((acc, i: any) => {
                            const mrp = i.product?.mrp ?? i.price;
                            const price = i.product?.price ?? i.price;
                            return acc + ((mrp || 0) - (price || 0)) * i.quantity;
                          }, 0)
                        )}
                      </p>
                    </div>
                  )}

                  <Link
                    href={isAboveMinimum ? '/checkout' : '#'}
                    onClick={(e) => {
                      if (!isAboveMinimum) {
                        e.preventDefault();
                        toast(`Minimum order value is ${formatCurrency(minOrderAmount)}. Add ${formatCurrency(remaining)} more.`, 'error');
                      }
                    }}
                    className={`w-full py-4 rounded-2xl font-bold text-center block transition-all ${
                      isAboveMinimum
                        ? 'bg-lime-300 hover:bg-lime-400 text-gray-900 shadow-lg shadow-lime-200'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isAboveMinimum ? 'Proceed to Checkout' : `Add ${formatCurrency(remaining)} more`}
                  </Link>

                  <Link
                    href="/products"
                    className="w-full py-3 text-center text-sm font-medium text-emerald-600 hover:text-emerald-700 block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </main>
    </AuthGuard>
  );
}
