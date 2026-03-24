import axios from "axios";
import toast from "react-hot-toast";
import { useAdminAuth } from "@/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: any) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("pb_access_token");
    if (token && config.headers) {
      const cleanToken = token.replace(/^(Bearer\s+)+/i, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    const status = error?.response?.status;
    const serverMsg = error?.response?.data?.message || error?.response?.data?.error;

    if (status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pb_access_token");
        useAdminAuth.getState().logout();
        window.location.href = "/auth";
      }
    } else if (status === 403) {
      toast.error(serverMsg || "You do not have permission to perform this action.");
    } else if (status && status >= 500) {
      toast.error(serverMsg || "Something went wrong. Please try again.");
    } else if (!error?.response && error?.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);
