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
      // Always favor local cart for the UI to satisfy "no backend until checkout"
      const local = localCart.get();
      if (local.items.length > 0) return local;

      // If local is empty and user is logged in, maybe fetch from backend as fallback?
      // Or just keep it local. The user said "only backend ... when checkout button clicked".
      if (isAuthenticated) {
        try {
          const backendCart = await getCart();
          if (backendCart.items.length > 0) {
            // Optional: sync backend to local if local is empty? 
            // For now let's just return it.
            return backendCart;
          }
        } catch (e) {
          console.error("Failed to fetch backend cart", e);
        }
      }
      return local;
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
        quantity: quantity || 1,
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

export function useSyncCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) return null;
      const local = localCart.get();
      if (local.items.length === 0) return null;

      // 1. Fetch current backend cart to see what's already there
      const backendCart = await getCart();
      const backendItems = backendCart.items || [];
      const errors: string[] = [];

      // 2. Sync local items to backend
      for (const item of local.items) {
        if (!item.productId) continue;

        try {
          // Check if this product is already in the backend cart
          const existingBackendItem = backendItems.find(
            (bi: any) => bi.productId === item.productId || bi.product?.id === item.productId
          );

          if (existingBackendItem) {
            // If it exists, update it (PATCH)
            // Note: We use the ID of the cart item specifically
            await updateCartItem(existingBackendItem.id, item.quantity);
          } else {
            // If it doesn't exist, add it (POST)
            await addToCart(item.productId, item.quantity);
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || e.message;
          const productName = item.productName || item.name || item.product?.name || 'Product';
          errors.push(`${productName}: ${msg}`);
          console.error(`Failed to sync item ${item.productId}`, e);
        }
      }

      if (errors.length > 0) {
        const uniqueErrors = Array.from(new Set(errors));
        throw new Error(uniqueErrors.join('; '));
      }
      
      return getCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
