import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const BuyerProfileSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string(),
  gstNumber: z.string().optional(),
  drugLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  isVerified: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateBuyerProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  gstNumber: z.string().optional(),
  drugLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
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
