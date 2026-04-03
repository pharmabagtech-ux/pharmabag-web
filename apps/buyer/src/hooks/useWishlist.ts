'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist as backendAddToWishlist, removeFromWishlist as backendRemoveFromWishlist, useAuth } from '@pharmabag/api-client';
import { localWishlist } from '@/lib/local-wishlist';
import { useEffect } from 'react';

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: ['wishlist', isAuthenticated],
    queryFn: async () => {
      const local = localWishlist.get();
      if (local.items.length > 0) return local;

      if (isAuthenticated) {
        try {
          const backend = await getWishlist();
          if (backend.items.length > 0) {
            return backend;
          }
        } catch (e) {
          console.error("Failed to fetch backend wishlist", e);
        }
      }
      return local;
    },
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData: any) => {
      return localWishlist.addItem(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      return localWishlist.removeItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
