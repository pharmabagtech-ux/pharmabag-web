'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useCart, useUpdateCartItem, useRemoveCartItem, useSyncCart } from '@/hooks/useCart';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@pharmabag/api-client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

function QuantityInput({ value, max, min, onUpdate, disabled }: { value: number; max: number; min: number; onUpdate: (val: number) => void; disabled?: boolean }) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (!isNaN(parsed)) {
      const final = Math.max(min, Math.min(parsed, max));
      setLocalValue(String(final));
      if (final !== value) {
        onUpdate(final);
      }
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as any).blur()}
      className="w-12 bg-white border border-gray-100 rounded-lg text-sm font-black text-gray-900 text-center outline-none hover:border-gray-300 focus:border-lime-500 focus:ring-1 focus:ring-lime-100 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
    />
  );
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: cart, isLoading, isError } = useCart();
  const { data: config } = usePlatformConfig();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const syncCart = useSyncCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const gstRate = (config?.gst_rate ?? 12) / 100;
  const items = cart?.items ?? [];
  const subtotal = items.reduce((acc, item: any) => {
    const price = item.product?.price ?? item.price ?? 0;
    return acc + price * item.quantity;
  }, 0);
  const gst = Math.round(subtotal * gstRate);
  const total = subtotal + gst;

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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 md:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Bag</h2>
                {items.length > 0 && (
                  <span className="text-xs font-bold bg-lime-300 text-gray-900 px-2 py-0.5 rounded-full">
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
              {isLoading || syncCart.isPending ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  <p className="text-sm font-medium text-gray-400">
                    {syncCart.isPending ? 'Syncing with backend...' : 'Loading bag...'}
                  </p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-sm font-medium text-red-400">Failed to load bag</p>
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Your bag is empty"
                  description="Browse products and add items to get started."
                  actionLabel="Browse Products"
                  actionHref="/"
                />
              ) : (
                items.map((item: any) => {
                  const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                  const itemPrice = item.product?.price ?? item.price ?? 0;
                  const itemImage = item.product?.images?.[0] || item.imageUrl || item.image || '/products/pharma_bottle.png';
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="flex gap-4"
                    >
                      <div className="w-20 h-20 bg-[#f1f6ea] rounded-2xl flex-shrink-0 relative overflow-hidden">
                        <img 
                          src={itemImage} 
                          alt={itemName} 
                          className="w-full h-full object-contain p-2" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-gray-900 leading-tight">{itemName}</h3>
                          <button
                            onClick={() => removeItem.mutate(item.id, {
                              onSuccess: () => toast('Item removed from bag', 'info'),
                            })}
                            disabled={removeItem.isPending || syncCart.isPending}
                            className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-3 py-1">
                            <button
                              onClick={() => {
                                const moq = item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1;
                                updateItem.mutate({ itemId: item.id, quantity: Math.max(moq, item.quantity - 1) });
                              }}
                              disabled={updateItem.isPending || item.quantity <= (item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1) || syncCart.isPending}
                              className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <QuantityInput 
                              value={item.quantity} 
                              max={Math.min(
                                item.stock ?? item.product?.stock ?? 9999,
                                (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || (item.stock ?? item.product?.stock ?? 9999)
                              )}
                              min={item.moq || item.product?.moq || item.product?.minimumOrderQuantity || 1}
                              onUpdate={(qty) => updateItem.mutate({ itemId: item.id, quantity: qty })}
                              disabled={updateItem.isPending || syncCart.isPending}
                            />
                            <button
                              onClick={() => {
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const maxLimit = (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || stock;
                                const max = Math.min(stock, maxLimit);
                                if (item.quantity < max) {
                                  updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 });
                                } else {
                                  toast(`Only ${max} units available in stock`, 'error');
                                }
                              }}
                              disabled={updateItem.isPending || syncCart.isPending || item.quantity >= Math.min(item.stock ?? item.product?.stock ?? 9999, (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || (item.stock ?? item.product?.stock ?? 9999))}
                              className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900 tracking-tight">₹{(itemPrice * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>GST ({config?.gst_rate ?? 12}%)</span>
                    <span>₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (isAuthenticated) {
                      try {
                        await syncCart.mutateAsync();
                        onClose();
                        router.push('/checkout');
                      } catch (e: any) {
                        toast(e.message || 'Failed to sync bag with backend', 'error');
                      }
                    } else {
                      window.dispatchEvent(new CustomEvent('open-login'));
                    }
                  }}
                  disabled={syncCart.isPending}
                  className="w-full py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl font-bold shadow-lg shadow-lime-200 transition-all block text-center disabled:opacity-50"
                >
                  {syncCart.isPending ? 'Processing...' : 'Checkout Now'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
