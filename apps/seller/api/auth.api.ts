import { apiClient } from "@/lib/apiClient";
import type { User } from "@pharmabag/utils";

export interface SendOtpPayload { phone: string; }
export interface VerifyOtpPayload { phone: string; otp: string; role?: string; }

export interface AuthResponse { accessToken: string; refreshToken?: string; user: User; }

export async function sendOtp(payload: SendOtpPayload) {
  const { data } = await apiClient.post<{ message: string }>("/auth/send-otp", payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/verify-otp", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ user: User }>("/auth/me");
  return data.user;
}
