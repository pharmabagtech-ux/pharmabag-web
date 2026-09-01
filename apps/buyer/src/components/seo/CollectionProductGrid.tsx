'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { formatSchemeTag, productSlug } from '@pharmabag/utils';
import {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from '@/hooks/useCart';
import { listingNetRate, effectiveMinQuantity } from '@/lib/pricing';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import type { CatalogProduct } from '@/lib/seo/catalog';

/**
 * The real shopping grid, on a server-rendered collection page.
 *
 * Category pages used to render a plain text list — no images, no prices, no
 * add-to-cart — because the shopping grid was a client component that fetched
 * its own data, and a server page could not use it. Buyers arriving from
 * search got a page that could not sell, and so did anyone who followed a
 * category from the nav.
 *
 * The products here arrive as PROPS from the server page, which is what makes
 * this work for both audiences at once: because nothing is fetched in the
 * browser, Next renders these cards into the HTML, so crawlers see real
 * product markup and real links; then it hydrates and the cart works. One
 * page, no trade-off.
 */
export default function CollectionProductGrid({
  products,
}: {
  products: CatalogProduct[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { data: config } = usePlatformConfig();
  const minOrderAmount = config?.min_order_amount ?? 20000;

  const { data: cartData } = useCart();
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  if (!products.length) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const slug = product.slug?.trim();
          if (!slug) return null;

          const image = product.image || '/products/pharma_bottle.png';
          const moq = effectiveMinQuantity(product as never, minOrderAmount);
          const price = listingNetRate(product as never);
          const targetId = product.id;
          const cartItemObj = cartData?.items?.find(
            (i: { productId?: string; id: string }) => i.productId === targetId,
          );

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
                  onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
                    toast(
                      err?.response?.data?.message || err?.message || 'Failed to update quantity',
                      'error',
                    );
                    cleanup();
                  },
                },
              );
              return;
            }

            // The same fields the catalogue grid stores, so the bag can show a
            // full price breakup for anything added from a category page.
            addToCart.mutate(
              {
                productId: targetId,
                quantity,
                productName: product.name,
                slug: productSlug(product as never),
                price,
                mrp: product.mrp,
                gstPercent: product.gstPercent,
                discountType: product.discountType,
                discountMeta: product.discountMeta,
                imageUrl: image,
                stock: product.stock,
                moq,
              } as never,
              {
                onSuccess: cleanup,
                onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
                  toast(
                    err?.response?.data?.message || err?.message || 'Failed to add to bag',
                    'error',
                  );
                  cleanup();
                },
              },
            );
          };

          return (
            /*
             * The card navigates with onClick and contains no anchor, so on its
             * own it gives a crawler no product link and a keyboard user no way
             * in. The screen-reader-only link beside it restores both: it is a
             * real href to the same destination the card click goes to, it is
             * focusable, and being sr-only rather than an overlay it never
             * intercepts a pointer event meant for the cart controls.
             */
            <div key={product.id} className="relative">
            <PremiumProductCard
              name={product.name}
              price={price}
              mrp={product.mrp ?? undefined}
              image={image}
              moq={moq}
              stock={product.hasSellers ? (product.stock ?? 999) : 0}
              discountTag={formatSchemeTag(product as never) || ''}
              cartQuantity={cartItemObj?.quantity ?? null}
              productId={product.id}
              product={product}
              isLoadingCart={pending.has(targetId)}
              onCartChange={handleCartChange}
              onClick={() => router.push(`/products/${slug}`)}
            />
              <Link href={`/products/${slug}`} className="sr-only">
                {product.name}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
