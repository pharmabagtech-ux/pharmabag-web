"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCurrentUser } from "@/api/auth.api";
import {
  getSellerDashboard, getSellerProducts, getSellerOrders, getSellerSettlements,
  getSellerSettlementSummary, getMasterProductWithListings, requestSellerPayout, createSellerProduct, updateSellerProduct, deleteSellerProduct,
  updateSellerOrderStatus, getSellerProfile, updateSellerProfile, getSellerProductById,
  getCategories, toggleVacationMode, getSellerTickets, getSellerTicketById, createSellerTicket, addTicketMessage,
  getSellerOrderById, acceptSellerOrder, rejectSellerOrder, uploadOrderInvoice,
  getSellerCustomOrders, getSellerCancelledOrders,
  getSellerNotifications, markNotificationRead, markAllNotificationsRead,
  getSellerFullProfile, getProductRequests, createProductRequest, getSellerAnalytics,
  searchSuggestions, getCategoriesWithSubs,
  verifyGstOrPan, uploadKycDocument, uploadDrugLicense,
} from "@/api/seller.api";
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
        localStorage.setItem("pb_access_token", inner.accessToken);
      }
      if (inner.user) setUser(inner.user);
      // Invalidate ALL seller queries so guard fetches fresh status
      void queryClient.invalidateQueries({ queryKey: ["seller"] });
    },
  });
}

export function useSellerMe(enabled: boolean = false) {
  return useQuery({
    queryKey: ["seller", "me"],
    queryFn: getCurrentUser,
    enabled,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useSellerDashboard(params: { dateFrom?: string; dateTo?: string } = {}) { return useQuery({ queryKey: ["seller", "dashboard", params], queryFn: () => getSellerDashboard(params), staleTime: 60_000, retry: 1 }); }

export function useSellerProfile(enabled: boolean = true) {
  const { setUser, user } = useSellerAuth();
  return useQuery({
    queryKey: ["seller", "profile"],
    queryFn: getSellerProfile,
    enabled,
    staleTime: 60_000,
    retry: 1,
    select: (data: any) => {
      // Sync vacation state from profile to store so sidebar/guard stay in sync
      const vState = data?.isVacation ?? data?.isOnVacation;
      if (typeof vState === "boolean" && user && user.isVacation !== vState) {
        setUser({ ...user, isVacation: vState } as any);
      }
      return data;
    },
  });
}
export function useUpdateSellerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSellerProfile,
    onSuccess: () => {
      // Invalidate both profile AND me queries so guard picks up new status
      void qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      void qc.invalidateQueries({ queryKey: ["seller", "me"] });
    },
  });
}

export function useSellerProducts(params: { page?: number; limit?: number; search?: string; status?: string } = {}) { return useQuery({ queryKey: ["seller", "products", params], queryFn: () => getSellerProducts(params), staleTime: 60_000, retry: 1 }); }

export function useCreateSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: createSellerProduct, onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "products"] }) }); }

export function useUpdateSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ productId, input }: { productId: string; input: Partial<ProductPayload> }) => updateSellerProduct(productId, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "products"] }) }); }

export function useDeleteSellerProduct() { const qc = useQueryClient(); return useMutation({ mutationFn: (productId: string) => deleteSellerProduct(productId), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["seller", "products"] }); void qc.invalidateQueries({ queryKey: ["seller", "dashboard"] }); } }); }

export function useSellerProduct(id: string) { return useQuery({ queryKey: ["seller", "product", id], queryFn: () => getSellerProductById(id), enabled: !!id && id !== "new", retry: 1 }); }

export function useCategories() { return useQuery({ queryKey: ["categories"], queryFn: getCategoriesWithSubs, staleTime: 300_000, retry: 1 }); }

export function useSellerOrders(params: { dateFrom?: string; dateTo?: string } = {}) { return useQuery({ queryKey: ["seller", "orders", params], queryFn: () => getSellerOrders(params), staleTime: 60_000, retry: 1 }); }

export function useUpdateSellerOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateSellerOrderStatus(orderId, status),
    onSuccess: (_, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ["seller", "orders"] });
      void qc.invalidateQueries({ queryKey: ["seller", "order", orderId] });
    },
  });
}

export function useSellerSettlements(params: { dateFrom?: string; dateTo?: string } = {}) { return useQuery({ queryKey: ["seller", "settlements", params], queryFn: () => getSellerSettlements(params), staleTime: 60_000, retry: 1 }); }

export function useSellerSettlementSummary() { return useQuery({ queryKey: ["seller", "settlement-summary"], queryFn: getSellerSettlementSummary, staleTime: 60_000, retry: 1 }); }

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestSellerPayout,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller", "settlements"] });
      void qc.invalidateQueries({ queryKey: ["seller", "settlement-summary"] });
    },
  });
}

export function useToggleVacationMode() {
  const qc = useQueryClient();
  const { user, setUser } = useSellerAuth();
  return useMutation({
    mutationFn: (isVacation: boolean) => toggleVacationMode(isVacation),
    onSuccess: (updatedProfile, isVacation) => {
      // Update Zustand store immediately
      if (user) setUser({ ...user, isVacation } as any);
      // Optimistically update the profile cache to prevent stale re-fetch from reverting state
      qc.setQueryData(["seller", "profile"], (old: any) => ({
        ...(old || {}),
        ...(updatedProfile || {}),
        isVacation,
      }));
      // Also update the /auth/me cache so the SellerGuard doesn't overwrite store on refocus
      qc.setQueryData(["seller", "me"], (old: any) => {
        if (!old) return old;
        return { ...old, isVacation };
      });
      // Invalidate to eventually refetch fresh data from server
      void qc.invalidateQueries({ queryKey: ["seller", "profile"] });
      void qc.invalidateQueries({ queryKey: ["seller", "me"] });
    },
  });
}

// ─── Support Tickets ─────────────────────────────────

export function useSellerTickets() {
  return useQuery({ queryKey: ["seller", "tickets"], queryFn: getSellerTickets, staleTime: 30_000, retry: 1 });
}

export function useCreateSellerTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSellerTicket,
    onSuccess: (ticket) => {
      // Get ticket ID from various possible field names
      const ticketId = ticket?.id || ticket?._id || ticket?.ticketId || ticket?.ticket_id;
      if (ticketId) {
        // Store the created ticket in cache so it's immediately available on detail page
        qc.setQueryData(["seller", "ticket", ticketId], ticket);
      }
      // Invalidate list to refresh
      void qc.invalidateQueries({ queryKey: ["seller", "tickets"] });
    }
  });
}

export function useAddTicketMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) => addTicketMessage(ticketId, message),
    onSuccess: (ticket, { ticketId }) => {
      if (ticket && ticketId) {
        // Update the specific ticket cache with the new message
        qc.setQueryData(["seller", "ticket", ticketId], ticket);
      }
      // Also invalidate the list to keep it fresh
      void qc.invalidateQueries({ queryKey: ["seller", "tickets"] });
    }
  });
}

// ─── Order Detail ─────────────────────────────────────
export function useSellerOrder(orderId: string) {
  return useQuery({ queryKey: ["seller", "order", orderId], queryFn: () => getSellerOrderById(orderId), enabled: !!orderId, staleTime: 10_000, refetchInterval: 10000, retry: 1 });
}

export function useAcceptSellerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => acceptSellerOrder(orderId),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["seller", "orders"] }); void qc.invalidateQueries({ queryKey: ["seller", "order"] }); },
  });
}

export function useRejectSellerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => rejectSellerOrder(orderId, reason),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["seller", "orders"] }); void qc.invalidateQueries({ queryKey: ["seller", "order"] }); },
  });
}

export function useUploadOrderInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, formData }: { orderId: string; formData: FormData }) => uploadOrderInvoice(orderId, formData),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["seller", "orders"] }); void qc.invalidateQueries({ queryKey: ["seller", "order"] }); },
  });
}

export function useSellerCustomOrders() {
  return useQuery({ queryKey: ["seller", "orders", "custom"], queryFn: getSellerCustomOrders, staleTime: 60_000, retry: 1 });
}

export function useSellerCancelledOrders() {
  return useQuery({ queryKey: ["seller", "orders", "cancelled"], queryFn: getSellerCancelledOrders, staleTime: 60_000, retry: 1 });
}

// ─── Notifications ────────────────────────────────────
export function useSellerNotifications() {
  return useQuery({ queryKey: ["seller", "notifications"], queryFn: getSellerNotifications, staleTime: 30_000, refetchInterval: 60_000, retry: 1 });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "notifications"] }),
  });
}

// ─── Profile (full) ───────────────────────────────────
export function useSellerFullProfile() {
  return useQuery({ queryKey: ["seller", "full-profile"], queryFn: getSellerFullProfile, staleTime: 60_000, retry: 1 });
}

// ─── Product Requests ─────────────────────────────────
export function useProductRequests() {
  return useQuery({ queryKey: ["seller", "product-requests"], queryFn: getProductRequests, staleTime: 60_000, retry: 1 });
}

export function useCreateProductRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductRequest,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller", "product-requests"] }),
  });
}

// ─── Analytics ────────────────────────────────────────
export function useSellerAnalytics(params: { dateFrom?: string; dateTo?: string } = {}) { return useQuery({ queryKey: ["seller", "analytics", params], queryFn: () => getSellerAnalytics(params), staleTime: 120_000, retry: 1 }); }

// ─── Ticket by ID ─────────────────────────────────────
export function useSellerTicketById(ticketId: string) {
  return useQuery({ queryKey: ["seller", "ticket", ticketId], queryFn: () => getSellerTicketById(ticketId), enabled: !!ticketId, staleTime: 10_000, refetchInterval: 10_000, retry: 1 });
}

// ─── Suggestion Search (Autocomplete) ─────────────────
export function useSuggestionSearch(query: string, type: 'product' | 'master' = 'product') {
  return useQuery({
    queryKey: ["suggestions", query, type],
    queryFn: () => searchSuggestions(query, type),
    enabled: query.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
}

// ─── Categories with Subcategories ────────────────────
export function useCategoriesWithSubs() {
  return useQuery({
    queryKey: ["categories", "with-subs"],
    queryFn: getCategoriesWithSubs,
    staleTime: 300_000,
    retry: 1,
  });
}

// ─── Verification & KYC ───────────────────────────────
export function useVerifyPanGst() {
  return useMutation({
    mutationFn: ({ type, value }: { type: 'GST' | 'PAN'; value: string }) => verifyGstOrPan(type, value),
  });
}

export function useUploadKycDocument() {
  return useMutation({
    mutationFn: (formData: FormData) => uploadKycDocument(formData),
  });
}

export function useUploadDrugLicense() {
  return useMutation({
    mutationFn: (formData: FormData) => uploadDrugLicense(formData),
  });
}

/** Listings from other sellers for the same master product (competition panel). */
export function useMasterProductWithListings(masterProductId?: string | null) {
  return useQuery({
    queryKey: ["master-product-listings", masterProductId],
    queryFn: () => getMasterProductWithListings(masterProductId as string),
    enabled: !!masterProductId,
    staleTime: 60_000,
    retry: 1,
  });
}
