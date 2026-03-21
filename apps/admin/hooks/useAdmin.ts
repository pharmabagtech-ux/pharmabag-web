"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCurrentUser } from "@/api/auth.api";
import {
  getAdminDashboard, getAdminUsers, getUserById, approveUser, rejectUser, blockUser, unblockUser,
  getAdminProducts, disableProduct, enableProduct, deleteProduct,
  getAdminOrders, updateAdminOrderStatus,
  getPayments, confirmPayment, rejectPayment,
  getSettlements, markSettlementPaid,
  getTickets, getTicketById, replyToTicket, updateTicketStatus,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory
} from "@/api/admin.api";
import { useAdminAuth } from "@/store";

// ─── Auth Hooks ──────────────────────────────────────

export function useSendAdminOtp() { return useMutation({ mutationFn: sendOtp }); }

export function useVerifyAdminOtp() {
  const queryClient = useQueryClient();
  const { setUser } = useAdminAuth();
  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      const inner = data.data ?? data;
      if (typeof window !== "undefined" && inner.accessToken) {
        localStorage.setItem("pb_token", inner.accessToken);
      }
      if (inner.user) setUser(inner.user);
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// ─── Data Hooks ──────────────────────────────────────

export function useAdminMe() { return useQuery({ queryKey: ["admin", "me"], queryFn: getCurrentUser, enabled: false, staleTime: 60_000, retry: 1 }); }

export function useAdminDashboard() { return useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard, staleTime: 60_000, retry: 1 }); }

export function useAdminUsers() { return useQuery({ queryKey: ["admin", "users"], queryFn: () => getAdminUsers(1, 50), staleTime: 60_000, retry: 1 }); }

export function useUserById(userId: string) { return useQuery({ queryKey: ["admin", "user", userId], queryFn: () => getUserById(userId), enabled: !!userId, staleTime: 60_000, retry: 1 }); }

export function useAffirmUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "approve" | "reject" | "block" | "unblock" }) => {
      if (action === "approve") return approveUser(userId);
      if (action === "reject") return rejectUser(userId);
      if (action === "block") return blockUser(userId);
      return unblockUser(userId);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminProducts() { return useQuery({ queryKey: ["admin", "products"], queryFn: () => getAdminProducts(1, 50), staleTime: 60_000, retry: 1 }); }

export function useUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, action }: { productId: string; action: "disable" | "enable" }) =>
      action === "enable" ? enableProduct(productId) : disableProduct(productId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (productId: string) => deleteProduct(productId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }) });
}

export function useAdminOrders() { return useQuery({ queryKey: ["admin", "orders"], queryFn: () => getAdminOrders(1, 50), staleTime: 60_000, retry: 1 }); }

export function useUpdateAdminOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateAdminOrderStatus(orderId, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

// ─── Payments ────────────────────────────────────────

export function usePayments() { return useQuery({ queryKey: ["admin", "payments"], queryFn: () => getPayments(1, 50), staleTime: 60_000, retry: 1 }); }

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (paymentId: string) => confirmPayment(paymentId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "payments"] }) });
}

export function useRejectPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (paymentId: string) => rejectPayment(paymentId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "payments"] }) });
}

// ─── Settlements ─────────────────────────────────────

export function useSettlements() { return useQuery({ queryKey: ["admin", "settlements"], queryFn: () => getSettlements(1, 50), staleTime: 60_000, retry: 1 }); }

export function useMarkSettlementPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ settlementId, payoutReference }: { settlementId: string; payoutReference: string }) => markSettlementPaid(settlementId, payoutReference),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "settlements"] }),
  });
}

// ─── Tickets ─────────────────────────────────────────

export function useTickets() { return useQuery({ queryKey: ["admin", "tickets"], queryFn: () => getTickets(1, 50), staleTime: 60_000, retry: 1 }); }

export function useTicketById(ticketId: string) { return useQuery({ queryKey: ["admin", "tickets", ticketId], queryFn: () => getTicketById(ticketId), enabled: !!ticketId }); }

export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) => replyToTicket(ticketId, message),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["admin", "tickets", variables.ticketId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) => updateTicketStatus(ticketId, status),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["admin", "tickets", variables.ticketId] });
      void qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
  });
}

// ─── Categories ──────────────────────────────────────

export function useCategories() { return useQuery({ queryKey: ["admin", "categories"], queryFn: getCategories, staleTime: 60_000, retry: 1 }); }

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createCategory, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "categories"] }) });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateCategory(id, payload), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "categories"] }) });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteCategory, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "categories"] }) });
}

export function useSubCategories(categoryId?: string) { return useQuery({ queryKey: ["admin", "subcategories", categoryId], queryFn: () => getSubCategories(categoryId), staleTime: 60_000, retry: 1 }); }

export function useCreateSubCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createSubCategory, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "subcategories"] }); void qc.invalidateQueries({ queryKey: ["admin", "categories"] }); } });
}

export function useUpdateSubCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSubCategory(id, payload), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "subcategories"] }); void qc.invalidateQueries({ queryKey: ["admin", "categories"] }); } });
}

export function useDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteSubCategory, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "subcategories"] }); void qc.invalidateQueries({ queryKey: ["admin", "categories"] }); } });
}
