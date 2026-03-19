'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTickets,
  getTicketById,
  createTicket,
  addTicketMessage,
  closeTicket,
  type CreateTicketInput,
} from '@pharmabag/api-client';

export function useTickets(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => getTickets(params),
  });
}

export function useTicketById(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicketById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addTicketMessage(ticketId, message),
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => closeTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
