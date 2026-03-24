'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, addToWishlist, removeFromWishlist } from '@pharmabag/api-client';

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
