'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrderById, createOrder, cancelOrder, getOrderMilestones, confirmMilestonePayment, getOrderInvoice, type CreateOrderInput } from '@pharmabag/api-client';

export function useOrders(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => getOrders(params),
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useOrderMilestones(orderId: string) {
  return useQuery({
    queryKey: ['order-milestones', orderId],
    queryFn: () => getOrderMilestones(orderId),
    enabled: !!orderId,
  });
}

export function useConfirmMilestonePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, method, referenceNumber }: { milestoneId: string; method: string; referenceNumber?: string }) =>
      confirmMilestonePayment(milestoneId, { method, referenceNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderInvoice(orderId: string) {
  return useQuery({
    queryKey: ['order-invoice', orderId],
    queryFn: () => getOrderInvoice(orderId),
    enabled: !!orderId,
  });
}
