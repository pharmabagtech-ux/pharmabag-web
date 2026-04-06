import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
  status: z.string(),
  method: z.string().optional(),
  referenceNumber: z.string().optional(),
  transactionId: z.string().optional(),
  proofUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CreatePaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  method: z.string(),
  referenceNumber: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ─── API Functions ──────────────────────────────────

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const response = await api.post('/payments', input);
  return response.data.data ?? response.data;
}

export async function uploadPaymentProof(paymentId: string, proofUrl: string): Promise<Payment> {
  const response = await api.post(`/payments/${paymentId}/proof`, { proofUrl });
  return response.data.data ?? response.data;
}

export async function uploadPaymentProofByOrder(orderId: string, proofUrl: string): Promise<Payment> {
  const response = await api.post(`/payments/order/${orderId}/proof`, { proofUrl });
  return response.data.data ?? response.data;
}

export async function getPaymentByOrderId(orderId: string): Promise<Payment> {
  const response = await api.get(`/payments/order/${orderId}`);
  return response.data.data ?? response.data;
}

export async function getPaymentHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Payment[]; total: number }> {
  const response = await api.get('/payments', { params });
  return response.data.data ?? response.data;
}
