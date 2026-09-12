'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart, useAuth } from '@pharmabag/api-client';
import { localCart } from '@/lib/local-cart';
import { useEffect, useState } from 'react';

export function useCart() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: ['cart', isAuthenticated],
    queryFn: async () => {
      // Local cart is the strict source of truth for the UI until Checkout.
      // This prevents "ghost items" from the backend magically reappearing after a local deletion.
      return localCart.get();
    },
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, replace = false, ...extra }: { productId: string; quantity?: number; replace?: boolean; [key: string]: any }) => {
      return localCart.addItem({ 
        productId, 
        quantity: quantity !== undefined ? quantity : 1,
        ...extra 
      } as any, replace);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return localCart.updateItem(itemId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      return localCart.removeItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return localCart.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Keeps API plumbing out of a buyer's face. Anything that names an HTTP verb,
 * a route or a status code is a message written for us, not for a pharmacy
 * owner who is trying to place an order; everything else the API says
 * (minimum order value, stock, unverified seller) is genuinely useful and is
 * passed through untouched.
 */
function humaniseCartError(message: unknown): string {
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text) return 'Could not be added to your bag. Please try again.';

  const leaksInternals =
    /\b(PATCH|POST|GET|DELETE)\b/.test(text) ||
    text.includes('/api/') ||
    /\b[45]\d\d\b/.test(text);

  return leaksInternals
    ? 'Could not be added to your bag. Please try again.'
    : text;
}

export function useSyncCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) return null;
      const local = localCart.get();

      // 1. Fetch current backend cart to see what's already there
      const backendCart = await getCart();
      const backendItems = backendCart.items || [];
      const errors: string[] = [];

      // If local is completely empty, clear backend
      if (local.items.length === 0) {
        if (backendItems.length > 0) {
          await clearCart();
        }
        return await getCart();
      }

      // 2. Find items in backend that are NOT in local, and delete them
      for (const bItem of backendItems) {
        const existsLocally = local.items.find((lItem) => lItem.productId === bItem.productId || lItem.productId === bItem.product?.id);
        if (!existsLocally) {
          try {
            await removeCartItem(bItem.id);
          } catch (e: any) {
            console.error(`Failed to remove item ${bItem.id}`, e);
          }
        }
      }

      // 3. Sync local items to backend
      for (const item of local.items) {
        if (!item.productId) continue;

        try {
          // Check if this product is already in the backend cart
          const existingBackendItem = backendItems.find(
            (bi: any) => bi.productId === item.productId || bi.product?.id === item.productId
          );

          if (existingBackendItem) {
            // If it exists, update it (PATCH)
            await updateCartItem(existingBackendItem.id, item.quantity);
          } else {
            // If it doesn't exist, add it (POST)
            await addToCart(item.productId, item.quantity);
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || e.message;

          /**
           * Two local lines can resolve to the SAME backend listing: storefront
           * grids used to key a line by the master product id while the product
           * page keyed it by the listing id, and the API quietly resolves a
           * master to its first listing. The second add then comes back as
           *   "Product already in cart. Use PATCH /api/cart/item/:id ..."
           * which is a message written for a developer and was being shown
           * verbatim to a pharmacy owner — with checkout blocked behind it.
           *
           * The product IS in the cart, which is all this step wanted. Skip it.
           * onSuccess replaces the local cart with the backend's, so the
           * duplicate line disappears from the bag at the same time and carts
           * already carrying one heal on the next sync.
           */
          if (typeof msg === 'string' && msg.toLowerCase().includes('already in cart')) {
            console.info(`Cart sync: ${item.productId} resolved to a line already present; skipping.`);
            continue;
          }

          const productName = item.productName || item.name || item.product?.name || 'Product';
          errors.push(`${productName}: ${humaniseCartError(msg)}`);
          console.error(`Failed to sync item ${item.productId}`, e);
        }
      }

      if (errors.length > 0) {
        const uniqueErrors = Array.from(new Set(errors));
        throw new Error(uniqueErrors.join('; '));
      }
      
      return getCart();
    },
    onSuccess: (data) => {
      if (data) {
        localCart.set(data);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
