import { apiClient } from "@/lib/apiClient";
import type { User } from "@pharmabag/utils";

export interface SendOtpPayload { phone: string; }
export interface VerifyOtpPayload { phone: string; otp: string; role: string; }

export interface AuthResponse { data: { accessToken: string; refreshToken?: string; user: User; isNewUser?: boolean }; message?: string; }

export async function sendOtp(payload: SendOtpPayload) {
  const { data } = await apiClient.post<{ message: string }>("/auth/send-otp", payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/verify-otp", {
    phone: payload.phone,
    otp: payload.otp,
    role: payload.role,
  });
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  // Backend returns raw user object (not wrapped in { data }).
  // Handle both shapes defensively in case a response interceptor is added later.
  const user = data?.data ?? data;
  console.log("[AUTH] getCurrentUser resolved status:", user?.status);
  return user;
}
