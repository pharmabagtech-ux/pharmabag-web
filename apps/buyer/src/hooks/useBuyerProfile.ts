'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerProfile,
  createBuyerProfile,
  updateBuyerProfile,
  verifyPanGst,
  getBuyerCreditDetails,
  getBuyerInvoices,
  type CreateBuyerProfileInput,
  type UpdateBuyerProfileInput,
} from '@pharmabag/api-client';

export function useBuyerProfile() {
  return useQuery({
    queryKey: ['buyerProfile'],
    queryFn: getBuyerProfile,
    staleTime: 5 * 60 * 1000, // 5 min — profile changes rarely during a session
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

export function useVerifyPanGst() {
  return useMutation({
    mutationFn: (params: { type: 'GST' | 'PAN'; value: string }) => verifyPanGst(params),
  });
}

export function useBuyerCreditDetails() {
  return useQuery({
    queryKey: ['buyerCredit'],
    queryFn: getBuyerCreditDetails,
  });
}

export function useBuyerInvoices(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['buyerInvoices', params],
    queryFn: () => getBuyerInvoices(params),
  });
}
