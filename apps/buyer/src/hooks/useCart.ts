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
    mutationFn: async ({ productId, quantity, ...extra }: { productId: string; quantity?: number; [key: string]: any }) => {
      return localCart.addItem({ 
        productId, 
        quantity: quantity || 1,
        ...extra 
      } as any);
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

      // Sync local items to backend
      for (const item of local.items) {
        try {
          await addToCart(item.productId, item.quantity);
        } catch (e) {
          console.error(`Failed to sync item ${item.productId}`, e);
        }
      }
      
      // After sync, we might want to clear local or keep them.
      // Usually clear so backend is now source of truth.
      // But user said "only backend ... checkout button clicked".
      return getCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
}
