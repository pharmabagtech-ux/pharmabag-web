'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPaymentHistory,
  getPaymentByOrderId,
  createPayment,
  uploadPaymentProof,
  uploadPaymentProofByOrder,
  type CreatePaymentInput,
} from '@pharmabag/api-client';

export function usePaymentHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => getPaymentHistory(params),
  });
}

export function usePaymentByOrderId(orderId: string) {
  return useQuery({
    queryKey: ['payment', orderId],
    queryFn: () => getPaymentByOrderId(orderId),
    enabled: !!orderId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useUploadPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, proofUrl }: { paymentId: string; proofUrl: string }) =>
      uploadPaymentProof(paymentId, proofUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUploadPaymentProofByOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, proofUrl }: { orderId: string; proofUrl: string }) =>
      uploadPaymentProofByOrder(orderId, proofUrl),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });
}
