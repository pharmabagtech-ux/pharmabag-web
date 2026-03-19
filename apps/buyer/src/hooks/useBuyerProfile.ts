'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  type CreateBuyerProfileInput,
  type UpdateBuyerProfileInput,
} from '@pharmabag/api-client';

export function useBuyerProfile() {
  return useQuery({
    queryKey: ['buyerProfile'],
    queryFn: getBuyerProfile,
  });
}

export function useCreateBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBuyerProfileInput) => createBuyerProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
    },
  });
}

export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBuyerProfileInput) => updateBuyerProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
    },
  });
}
