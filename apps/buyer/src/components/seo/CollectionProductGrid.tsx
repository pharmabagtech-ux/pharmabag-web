'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { formatSchemeTag } from '@pharmabag/utils';
import {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from '@/hooks/useCart';
import { listingNetRate, effectiveMinQuantity } from '@/lib/pricing';
import { useToast } from '@/components/shared/Toast';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';
import { routes } from '@/lib/seo/url';
import type { CatalogProduct } from '@/lib/seo/catalog';

/**
 * The catalogue's shopping grid, rendered on a server-rendered landing page.
 *
 * Collection pages used to rank and then fail to sell: they listed products as
 * plain text, with no image, no price and no way to add to a bag, so everyone
 * arriving from a search result landed on a page that could not take their
 * order.
 *
 * The products arrive as PROPS from the server page, and that is the whole
 * trick. Because nothing is fetched in the browser, Next renders these cards
 * into the HTML — a crawler sees real product markup and real links — and then
 * hydrates them, so the cart works. One page serves both audiences instead of
 * one page for each.
 *
 * Cart behaviour is deliberately a mirror of `ProductsPageClient`: same card,
 * same quantity target, same toasts. A second, subtly different add-to-cart
 * path is how two surfaces end up disagreeing about what is in the bag.
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const slug = product.slug?.trim();
        if (!slug) return null;

        const image =
          product.image || product.images?.[0] || '/products/pharma_bottle.png';

        // The stored MOQ is stale on almost every listing; the shared helper
        // is what the catalogue uses to keep a card from adding a quantity
        // that lands under the minimum order value.
        const moq = effectiveMinQuantity(product as never, minOrderAmount);
        const price = listingNetRate(product as never);

        const lineFor = (id: string) =>
          cartData?.items?.find(
            (i: { productId?: string; id: string }) => i.productId === id,
          );

        /** What the card displays. Keyed by product id, as the catalogue is. */
        const cartLine = lineFor(product.id);

        const handleCartChange = (quantity: number | null, activeId?: string) => {
          /**
           * `activeId` comes from the card, which resolves it as
           * `bestListingId || productId` — the id the cart's lines are keyed
           * by. Hardcoding `product.id` here would be right today and wrong
           * the moment a product gains a second seller.
           */
          const targetId = activeId || product.id;
          const line = lineFor(targetId);

          if (quantity === null || quantity <= 0) {
            if (line) {
              removeCartItem.mutate(line.id, {
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

          const fail = (err: {
            response?: { data?: { message?: string } };
            message?: string;
          }) => {
            toast(
              err?.response?.data?.message ||
                err?.message ||
                'Failed to update bag',
              'error',
            );
            cleanup();
          };

          if (line) {
            updateCartItem.mutate(
              { itemId: line.id, quantity },
              { onSuccess: cleanup, onError: fail },
            );
            return;
          }

          // The same fields the catalogue stores, so the bag can show a full
          // price breakup for anything added from a collection page.
          addToCart.mutate(
            {
              productId: targetId,
              quantity,
              productName: product.name,
              slug,
              price,
              mrp: product.mrp,
              gstPercent: product.gstPercent,
              discountType: product.discountType,
              discountMeta: product.discountMeta,
              imageUrl: image,
              stock: product.stock,
              moq,
            } as never,
            { onSuccess: cleanup, onError: fail },
          );
        };

        return (
          /*
           * The card navigates with `onClick` and contains no anchor, so on its
           * own it gives a crawler no product link and a keyboard user no way
           * in. The screen-reader-only link restores both: a real href to the
           * same destination the click goes to, focusable, and sr-only rather
           * than a stretched overlay so it never swallows a tap meant for the
           * quantity controls.
           */
          <div key={product.id} className="relative">
            <PremiumProductCard
              name={product.name}
              price={price}
              mrp={product.mrp ?? undefined}
              image={image}
              moq={moq}
              stock={product.hasSellers ? (product.stock ?? 999) : 0}
              discountTag={formatSchemeTag(
                product.discountType,
                product.discountMeta as never,
              )}
              cartQuantity={cartLine?.quantity ?? null}
              productId={product.id}
              product={product}
              isLoadingCart={pending.has(product.id)}
              onCartChange={handleCartChange}
              onClick={() => router.push(routes.product(slug))}
            />
            {/*
              The composition and the manufacturer are named here because the
              text card this grid replaced showed them, and dropping them would
              have quietly cost the page ~1,900 characters of the most relevant
              text it has — "Ashwagandha 50mg, Shatavari 50mg" on the Ayurvedic
              page is exactly what makes it about Ayurvedic medicine rather
              than about 48 product names.

              It is also the better accessible name: the card itself is not
              reachable by keyboard, so this link is a screen-reader user's
              only way to a product, and "O2 H Tablet, Ashwagandha 50mg ..., by
              Medley Pharmaceuticals" tells them what they are opening.
            */}
            <Link href={routes.product(slug)} className="sr-only">
              {[
                product.name,
                product.chemicalComposition,
                product.manufacturer ? `by ${product.manufacturer}` : null,
              ]
                .filter(Boolean)
                .join(', ')}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
