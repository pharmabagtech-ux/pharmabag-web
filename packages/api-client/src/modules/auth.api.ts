import { z } from 'zod';
import { api, setAccessToken } from '../api';

// ─── Schemas ────────────────────────────────────────

export const SendOtpRequestSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export const SendOtpResponseSchema = z.object({
  message: z.string(),
});

export const VerifyOtpRequestSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const VerifyOtpResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    phone: z.string(),
    role: z.string(),
    email: z.string().nullable().optional(),
  }),
  isNewUser: z.boolean().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  role: z.string(),
  email: z.string().nullable().optional(),
  status: z.string().optional(),
  verificationStatus: z.string().optional(),
  creditTier: z.string().optional(),
  gstPanResponse: z.any().optional(),
  buyerProfile: z.any().optional(),
});

// ─── Types ──────────────────────────────────────────

export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;
export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;
export type User = z.infer<typeof UserSchema>;

// ─── API Functions ──────────────────────────────────

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const body = SendOtpRequestSchema.parse({ phone });
  const { data } = await api.post('/auth/send-otp', body);
  return SendOtpResponseSchema.parse(data);
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const body = VerifyOtpRequestSchema.parse({ phone, otp });
  const { data } = await api.post('/auth/verify-otp', body);
  const parsed = VerifyOtpResponseSchema.parse(data);
  // Store tokens in persistent storage
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  setAccessToken(null);
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return UserSchema.parse(data);
}
