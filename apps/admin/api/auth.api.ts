import { apiClient } from "@/lib/apiClient";
import type { User } from "@pharmabag/utils";

export interface SendOtpPayload { phone: string; }
export interface VerifyOtpPayload { phone: string; otp: string; role?: string; }
export interface AuthResponse { data: { accessToken: string; refreshToken?: string; user: User; isNewUser?: boolean }; message?: string; }

export async function sendOtp(payload: SendOtpPayload) {
  const { data } = await apiClient.post<{ message: string }>("/auth/send-otp", payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/verify-otp", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ data: User }>("/auth/me");
  return data.data;
}
