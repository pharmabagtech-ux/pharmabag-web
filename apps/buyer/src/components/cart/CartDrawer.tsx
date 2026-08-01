'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useCart, useUpdateCartItem, useRemoveCartItem, useSyncCart } from '@/hooks/useCart';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { usePurchaseAccess } from '@/hooks/usePurchaseAccess';
import { priceCart, explainLine, listingLotSize, stepQuantityByLot, snapQuantityToLot, effectiveMinQuantity } from '@/lib/pricing';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@pharmabag/api-client';
import { productSlug } from '@pharmabag/utils';
import Link from 'next/link';
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

function BreakupRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={tone ?? 'text-gray-700'}>{value}</span>
    </div>
  );
}

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: cart, isLoading, isError } = useCart();
  const { data: config } = usePlatformConfig();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const syncCart = useSyncCart();
  const { toast } = useToast();
  const { canPurchase, reason } = usePurchaseAccess();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const items = cart?.items ?? [];

  // Priced exactly as the server will at checkout — the bag used to omit GST
  // entirely, so it quoted a lower total than the order the buyer received.
  const pricing = priceCart(items, config);
  const { shipping, total } = pricing;
  const lineFor = (index: number) => pricing.lines[index];

  // Recomputed rather than read off the item, so a bag filled before the
  // minimum-order rule reached this surface corrects itself instead of keeping
  // whatever was captured at add time. Bag items carry mrp, GST and the scheme,
  // so the figure matches the one the offer row shows.
  const minQtyFor = (item: any) =>
    effectiveMinQuantity(item, config?.min_order_amount ?? 20000);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transitionEnd: { display: "none" } }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        />
      )}
      {isOpen && (
        <motion.div
          key="cart-drawer-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%', transitionEnd: { display: "none" } }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] md:w-[400px] bg-white shadow-2xl z-[101] flex flex-col"
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
                items.map((item: any, index: number) => {
                  const itemName = item.product?.name ?? item.productName ?? item.name ?? 'Product';
                  const line = lineFor(index);
                  const itemImage = item.product?.images?.[0] || item.imageUrl || item.image || '/products/pharma_bottle.png';
                  // The bag showed the product but offered no way back to it.
                  // Items added since the slug fix carry the API's own slug;
                  // older ones fall back to deriving it from the name.
                  const itemHref = `/products/${productSlug({
                    slug: item.slug ?? item.product?.slug,
                    name: itemName,
                    id: item.productId,
                  })}`;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="flex gap-4"
                    >
                      <Link
                        href={itemHref}
                        onClick={onClose}
                        className="w-20 h-20 bg-[#f1f6ea] rounded-2xl flex-shrink-0 relative overflow-hidden block"
                      >
                        <img 
                          src={itemImage} 
                          alt={itemName} 
                          className="w-full h-full object-contain p-2" 
                        />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <Link
                            href={itemHref}
                            onClick={onClose}
                            className="font-bold text-gray-900 leading-tight hover:text-lime-700 transition-colors"
                          >
                            <h3>{itemName}</h3>
                          </Link>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              // No success toast — the row disappears from the
                              // bag, which is confirmation enough.
                              removeItem.mutate(item.id);
                            }}
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
                                const moq = minQtyFor(item);
                                // Whole lots here too, so the bag cannot walk a
                                // quantity off the boundary the offer row set.
                                const lot = listingLotSize(item);
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const next = stepQuantityByLot(item.quantity, -1, lot, moq, stock);
                                updateItem.mutate({ itemId: item.id, quantity: next > 0 ? next : moq });
                              }}
                              disabled={updateItem.isPending || item.quantity <= minQtyFor(item) || syncCart.isPending}
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
                              min={minQtyFor(item)}
                              onUpdate={(qty) => {
                                const moq = minQtyFor(item);
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const snapped = snapQuantityToLot(qty, listingLotSize(item), moq, stock);
                                updateItem.mutate({ itemId: item.id, quantity: snapped > 0 ? snapped : moq });
                              }}
                              disabled={updateItem.isPending || syncCart.isPending}
                            />
                            <button
                              onClick={() => {
                                const stock = item.stock ?? item.product?.stock ?? 9999;
                                const maxLimit = (item.maximumOrderQuantity || item.product?.maximumOrderQuantity) || stock;
                                const max = Math.min(stock, maxLimit);
                                const moq = minQtyFor(item);
                                const next = stepQuantityByLot(item.quantity, 1, listingLotSize(item), moq, max);
                                if (next !== item.quantity) {
                                  updateItem.mutate({ itemId: item.id, quantity: next });
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
                          <p className="font-bold text-gray-900 tracking-tight">₹{line.lineTotal.toLocaleString('en-IN')}</p>
                        </div>
                        {/* How the price was reached - the same figures the
                            seller sees in their pricing preview. Each row only
                            appears when the value behind it exists. */}
                        {(() => {
                          const x = explainLine(item, line);
                          const money = (n: number) =>
                            `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          const saving = x.mrp && x.mrp > x.netRate
                            ? Math.round((x.mrp - x.netRate) * x.quantity)
                            : 0;
                          return (
                            <div className="mt-2 rounded-lg bg-gray-50 px-2.5 py-2 text-[11px] space-y-1">
                              {x.mrp !== null && <BreakupRow label="MRP" value={money(x.mrp)} />}
                              {x.ptr !== null && <BreakupRow label="PTR" value={money(x.ptr)} />}
                              {x.discountPercent > 0 && (
                                <BreakupRow
                                  label={`Discount (${x.discountPercent}%)`}
                                  value={`-${money(x.discountValue)}`}
                                  tone="text-emerald-600 font-semibold"
                                />
                              )}
                              {x.finalPtr !== null && x.discountPercent > 0 && (
                                <BreakupRow label="Final PTR" value={money(x.finalPtr)} />
                              )}
                              {x.scheme && (
                                <BreakupRow label="Scheme" value={x.scheme} tone="text-teal-700 font-semibold" />
                              )}
                              <BreakupRow label="Net Rate / unit" value={money(x.netRate)} tone="text-gray-900 font-semibold" />
                              <BreakupRow label={`${x.quantity} × ${money(x.netRate)}`} value={money(x.lineSubtotal)} />
                              <BreakupRow label={`GST (${x.gstPercent}%)`} value={money(x.gstAmount)} />
                              <div className="flex justify-between gap-3 border-t border-gray-200 pt-1 mt-1">
                                <span className="font-semibold text-gray-800">Buyer Pays</span>
                                <span className="font-bold text-gray-900">{money(x.lineTotal)}</span>
                              </div>
                              {saving > 0 && (
                                <p className="text-[10px] font-bold text-emerald-600 pt-0.5 text-right">
                                  You save ₹{saving.toLocaleString('en-IN')} vs MRP
                                </p>
                              )}
                            </div>
                          );
                        })()}
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
                  {shipping > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-500">
                      <span>Shipping</span>
                      <span>₹{shipping.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {!canPurchase && (
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                    {reason}
                  </p>
                )}
                <button
                  onClick={async () => {
                    if (!canPurchase) return;
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
                  disabled={syncCart.isPending || !canPurchase}
                  title={!canPurchase ? reason : undefined}
                  className="w-full py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl font-bold shadow-lg shadow-lime-200 transition-all block text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-lime-300"
                >
                  {syncCart.isPending ? 'Processing...' : 'Checkout Now'}
                </button>
              </div>
            )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
