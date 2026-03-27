import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const BuyerProfileSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  legalName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  drugLicenseNumber: z.string().optional(),
  drugLicenseUrl: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isVerified: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateBuyerProfileSchema = z.object({
  legalName: z.string().min(1),
  gstNumber: z.string().min(1),
  panNumber: z.string().min(1),
  drugLicenseNumber: z.string().min(1),
  drugLicenseUrl: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const UpdateBuyerProfileSchema = CreateBuyerProfileSchema.partial();

// ─── Types ──────────────────────────────────────────

export type BuyerProfile = z.infer<typeof BuyerProfileSchema>;
export type CreateBuyerProfileInput = z.infer<typeof CreateBuyerProfileSchema>;
export type UpdateBuyerProfileInput = z.infer<typeof UpdateBuyerProfileSchema>;

// ─── API Functions ──────────────────────────────────

export async function getBuyerProfile(): Promise<BuyerProfile> {
  const { data } = await api.get('/buyers/profile');
  return data;
}

export async function createBuyerProfile(input: CreateBuyerProfileInput): Promise<BuyerProfile> {
  const { data } = await api.post('/buyers/profile', input);
  return data;
}

export async function updateBuyerProfile(input: UpdateBuyerProfileInput): Promise<BuyerProfile> {
  const { data } = await api.patch('/buyers/profile', input);
  return data;
}

// ─── Extended Buyer APIs ────────────────────────────

export async function verifyPanGst(params: {
  type: 'GST' | 'PAN';
  value: string;
}): Promise<{ status: boolean; legalName: string; address: string; message: string }> {
  const { data } = await api.post('/verification/pangst', params);
  return data;
}

export async function getBuyerCreditDetails(): Promise<{
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  status: string; // normal | emi | credit
  milestones: Array<{
    id: string;
    orderId: string;
    amount: number;
    dueDate: string;
    status: string;
  }>;
}> {
  const { data } = await api.get('/buyers/credit');
  return data;
}

export async function getBuyerInvoices(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Array<{ id: string; orderId: string; amount: number; url: string; createdAt: string }>; total: number }> {
  const { data } = await api.get('/buyers/invoices', { params });
  return data;
}
