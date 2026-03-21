"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCurrentUser } from "@/api/auth.api";
import { getSellerDashboard, getSellerProducts, getSellerOrders, getSellerSettlements, getSellerSettlementSummary, createSellerProduct, updateSellerProduct, deleteSellerProduct, updateSellerOrderStatus, getSellerProfile, updateSellerProfile, getSellerProductById, getCategories } from "@/api/seller.api";
import type { ProductPayload } from "@pharmabag/utils";
import { useSellerAuth } from "@/store";

export function useSendOtp() { return useMutation({ mutationFn: sendOtp }); }

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const { setUser } = useSellerAuth();
  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      // Backend wraps response in { data: { accessToken, user } } — handle both nested and flat shapes
      const inner = (data as any).data ?? data;
      if (typeof window !== "undefined" && inner.accessToken) {
        localStorage.setItem("pb_token", inner.accessToken);
      }
      if (inner.user) setUser(inner.user);
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard"] });
    },
  });
}

export function useSellerMe() {
  return useQuery({ queryKey: ["seller", "me"], queryFn: getCurrentUser, enabled: false, staleTime: 60_000, retry: 1 });
}

export function useSellerDashboard() { return useQuery({ queryKey: ["seller", "dashboard"], queryFn: getSellerDashboard, staleTime: 60_000, retry: 1 }); }

export function useSellerProfile() { return useQuery({ queryKey: ["seller", "profile"], queryFn: getSellerProfile, staleTime: 60_000, retry: 1 }); }
export function useUpdateSellerProfile() { const qc = useQueryClient(); return useMutation({ mutationFn: updateSellerProfile, onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "profile"] }) }); }

export function useSellerProducts() { return useQuery({ queryKey: ["seller", "products"], queryFn: getSellerProducts, staleTime: 60_000, retry: 1 }); }

export function useCreateSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: createSellerProduct, onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "products"] }) }); }

export function useUpdateSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ productId, input }: { productId: string; input: Partial<ProductPayload> }) => updateSellerProduct(productId, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "products"] }) }); }

export function useDeleteSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: (productId: string) => deleteSellerProduct(productId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "products"] }) }); }

export function useSellerProduct(id: string) { return useQuery({ queryKey: ["seller", "product", id], queryFn: () => getSellerProductById(id), enabled: !!id && id !== "new", retry: 1 }); }

export function useCategories() { return useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: 300_000, retry: 1 }); }

export function useSellerOrders() { return useQuery({ queryKey: ["seller", "orders"], queryFn: getSellerOrders, staleTime: 60_000, retry: 1 }); }

export function useUpdateSellerOrderStatus() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateSellerOrderStatus(orderId, status), onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "orders"] }) }); }

export function useSellerSettlements() { return useQuery({ queryKey: ["seller", "settlements"], queryFn: getSellerSettlements, staleTime: 60_000, retry: 1 }); }

export function useSellerSettlementSummary() { return useQuery({ queryKey: ["seller", "settlement-summary"], queryFn: getSellerSettlementSummary, staleTime: 60_000, retry: 1 }); }
