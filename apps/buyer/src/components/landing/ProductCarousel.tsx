'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { getFeaturedProducts } from '@pharmabag/api-client';
import { calculatePricing, formatSchemeTag, VALID_GST_PERCENTAGES } from '@pharmabag/utils';
import { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';

interface ProductCarouselProps {
  reverse?: boolean;
  slot?: 'HOMEPAGE_CAROUSEL' | 'LOGIN_CAROUSEL';
}

const BACKEND_TO_FORM_TYPE: Record<string, string> = {
  PTR_DISCOUNT: 'ptr_discount',
  SAME_PRODUCT_BONUS: 'same_product_bonus',
  PTR_PLUS_SAME_PRODUCT_BONUS: 'ptr_discount_and_same_product_bonus',
  DIFFERENT_PRODUCT_BONUS: 'different_product_bonus',
  PTR_PLUS_DIFFERENT_PRODUCT_BONUS: 'ptr_discount_and_different_product_bonus',
  SPECIAL_PRICE: 'special_price',
};

/**
 * The net rate the card shows, GST-exclusive, matching what the API charges:
 * PTR, less the discount, less the share of the order that arrives free.
 *
 * The featured endpoint returns the raw listing and no computed price, unlike
 * the storefront grid, so it is worked out here. Falls back to the MRP when it
 * cannot be computed, which is what every other surface does.
 */
function netRate(product: any): number {
  const mrp = Number(product?.mrp) || 0;
  const gst = Number(product?.gstPercent);
  if (!mrp) return 0;
  if (!VALID_GST_PERCENTAGES.includes(gst as any)) return mrp;

  try {
    const meta = product?.discountMeta ?? {};
    const p = calculatePricing(mrp, gst as any, {
      type: (BACKEND_TO_FORM_TYPE[product?.discountType ?? ''] ?? 'ptr_discount') as any,
      discountPercent: meta?.discountPercent,
      buy: meta?.buy,
      get: meta?.get,
      bonusProductName: meta?.bonusProductName,
      specialPrice: meta?.specialPrice,
    });
    const buy = Number(meta?.buy) || 0;
    const get = Number(meta?.get) || 0;
    const bonusFraction = buy > 0 && get > 0 ? get / (buy + get) : 0;
    return Math.round(p.finalPtr * (1 - bonusFraction) * 100) / 100;
  } catch {
    return mrp;
  }
}

export default function ProductCarousel({ reverse = false, slot = 'HOMEPAGE_CAROUSEL' }: ProductCarouselProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  const { data: cartData } = useCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedProducts(slot);
        if (data && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slot]);

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;
  if (!products.length) return null;

  // Duplicating for infinite scroll effect (need at least a few items for it to look good)
  const scrollProducts = products.length >= 4
    ? [...products, ...products, ...products]
    : [...products, ...products, ...products, ...products, ...products];

  return (
    <div className="w-full h-full mb-4 sm:mb-6 lg:mb-8 overflow-hidden bg-transparent mx-auto pl-[4vw] lg:pl-4 pr-[4vw] flex flex-col justify-center items-center pt-0 lg:pt-2">
      <div className="relative w-full flex items-center bg-transparent group/track">
        {/* Paused while the pointer is over the strip: the cards carry share,
            add-to-bag and bookmark controls, and none of them can be hit on a
            moving target. */}
        <div
          className={`flex w-max gap-4 sm:gap-6 py-5 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover/track:[animation-play-state:paused] motion-reduce:animate-none`}
        >
          {scrollProducts.map((product, index) => {
            const image = product.images?.[0]?.url || product.image || '/products/pharma_bottle.png';
            const moq = product.moq || product.minimumOrderQuantity || 1;
            const price = netRate(product);
            const targetId = product.id;
            const cartItemObj = cartData?.items?.find((i: any) => i.productId === targetId);

            const handleCartChange = (quantity: number | null) => {
              if (quantity === null || quantity <= 0) {
                if (cartItemObj) {
                  removeCartItem.mutate(cartItemObj.id, {
                    onError: () => toast('Failed to remove item', 'error'),
                  });
                }
                return;
              }

              if (pending.has(targetId)) return;
              setPending((prev) => new Set(prev).add(targetId));
              const cleanup = () =>
                setPending((prev) => {
                  const next = new Set(prev);
                  next.delete(targetId);
                  return next;
                });

              if (cartItemObj) {
                updateCartItem.mutate(
                  { itemId: cartItemObj.id, quantity },
                  {
                    onSuccess: cleanup,
                    onError: (err: any) => {
                      toast(err?.response?.data?.message || err?.message || 'Failed to update quantity', 'error');
                      cleanup();
                    },
                  },
                );
              } else {
                // The same fields the storefront grid stores, so the bag can
                // show the full price breakup for anything added from here.
                addToCart.mutate(
                  {
                    productId: targetId,
                    quantity,
                    productName: product.name,
                    price,
                    mrp: product.mrp,
                    gstPercent: product.gstPercent,
                    discountType: product.discountType,
                    discountMeta: product.discountMeta,
                    imageUrl: image,
                    stock: product.stock,
                    moq,
                  },
                  {
                    onSuccess: cleanup,
                    onError: (err: any) => {
                      toast(err?.response?.data?.message || err?.message || 'Failed to add to bag', 'error');
                      cleanup();
                    },
                  },
                );
              }
            };

            const openProduct = () => router.push(`/products/${product.slug}`);

            return (
              <div
                key={`${product.id}-${index}`}
                className="flex-shrink-0 w-[190px] sm:w-[215px] md:w-[240px]"
              >
                <PremiumProductCard
                  name={product.name}
                  price={price}
                  mrp={product.mrp}
                  image={image}
                  moq={moq}
                  stock={product.stock ?? 999}
                  discountTag={formatSchemeTag(product.discountType, product.discountMeta)}
                  cartQuantity={cartItemObj?.quantity ?? null}
                  productId={targetId}
                  // A featured row IS one seller's listing, so it always has a
                  // seller. Without this the card renders N/A for every figure
                  // and hides the add button.
                  product={{ ...product, sellerCount: 1, bestListingId: targetId }}
                  isLoadingCart={pending.has(targetId)}
                  onCartChange={handleCartChange}
                  onQuickView={openProduct}
                  onClick={openProduct}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
