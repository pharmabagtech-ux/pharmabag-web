import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const TicketMessageSchema = z.object({
  id: z.string(),
  message: z.string(),
  sender: z.enum(['user', 'admin']),
  createdAt: z.string(),
});

export const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  description: z.string(),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  messages: z.array(TicketMessageSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const TicketListResponseSchema = z.object({
  data: z.array(TicketSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateTicketSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
});

// ─── Types ──────────────────────────────────────────

export type TicketMessage = z.infer<typeof TicketMessageSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketListResponse = z.infer<typeof TicketListResponseSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

// ─── API Functions ──────────────────────────────────

export async function getTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<TicketListResponse> {
  const { data } = await api.get('/tickets', { params });
  return data;
}

export async function getTicketById(id: string): Promise<Ticket> {
  const { data } = await api.get(`/tickets/${id}`);
  return data.data?.ticket ?? data.ticket ?? data.data ?? data;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data } = await api.post('/tickets', input);
  return data.data?.ticket ?? data.ticket ?? data.data ?? data;
}

export async function addTicketMessage(ticketId: string, message: string): Promise<TicketMessage> {
  const { data } = await api.post(`/tickets/${ticketId}/messages`, { message });
  return data.data?.ticket ?? data.ticket ?? data.data ?? data;
}

export async function closeTicket(ticketId: string): Promise<Ticket> {
  const { data } = await api.patch(`/tickets/${ticketId}/close`);
  return data.data?.ticket ?? data.ticket ?? data.data ?? data;
}
