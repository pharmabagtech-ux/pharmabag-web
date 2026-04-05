"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCurrentUser } from "@/api/auth.api";
import {
  getAdminDashboard, getAdminUsers, getUserById, approveUser, rejectUser, blockUser, unblockUser,
  getBuyers, getSellers, updateUser, deleteUser, updateUserStatus, updateGstPanStatus,
  getAdminProducts, getAdminProductsFiltered, getProductById, disableProduct, enableProduct, deleteProduct, createProduct, updateProduct, approveProduct, rejectProduct,
  getAdminOrders, getAdminOrdersFiltered, getOrderById, updateAdminOrderStatus, cancelOrder, getOrderInvoice,
  getPayments, confirmPayment, rejectPayment,
  getSettlements, markSettlementPaid, getSellerSettlements, createSettlement,
  getTickets, getTicketById, replyToTicket, updateTicketStatus,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory as deleteSubCategoryApi,
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
  getSuggestions, createSuggestion, updateSuggestion, deleteSuggestion, importSuggestionsCsv,
  getBanners, createBanner, updateBanner, deleteBanner,
  getReferralCodes, createReferralCode, deleteReferralCode,
  broadcastNotification, getNotificationHistory, sendUserNotification,
  getPlatformSettings, updatePlatformSettings,
  getRevenueChart, getOrdersChart, getTopProducts, getTopSellers,
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
        localStorage.setItem("pb_access_token", inner.accessToken);
      }
      if (inner.user) setUser(inner.user);
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

// ─── Data Hooks ──────────────────────────────────────

export function useAdminMe() { return useQuery({ queryKey: ["admin", "me"], queryFn: getCurrentUser, enabled: false, staleTime: 60_000, retry: 1 }); }

export function useAdminDashboard() { return useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard, staleTime: 60_000, retry: 1 }); }

export function useAdminUsers(page = 1, limit = 20) { return useQuery({ queryKey: ["admin", "users", page, limit], queryFn: () => getAdminUsers(page, limit), staleTime: 60_000, retry: 1 }); }

export function useAdminSellers() { return useQuery({ queryKey: ["admin", "sellers"], queryFn: () => getSellers({ limit: 500 }), staleTime: 60_000, retry: 1 }); }

export function useUserById(userId: string) { return useQuery({ queryKey: ["admin", "user", userId], queryFn: () => getUserById(userId), enabled: !!userId, staleTime: 60_000, retry: 1 }); }

export function useAffirmUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "approve" | "reject" | "block" | "unblock" }) => {
      let result;
      if (action === "approve") result = await approveUser(userId);
      else if (action === "reject") result = await rejectUser(userId);
      else if (action === "block") result = await blockUser(userId);
      else result = await unblockUser(userId);

      // Send verification notification to user on approve
      if (action === "approve") {
        void sendUserNotification(userId, {
          title: "Account Verified!",
          message: "Your business profile has been verified. You can now place orders on PharmaBag.",
          type: "verification",
        });
      }

      return result;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminProducts(page = 1, limit = 20) { return useQuery({ queryKey: ["admin", "products", page, limit], queryFn: () => getAdminProducts(page, limit), staleTime: 60_000, retry: 1 }); }

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

export function useAdminOrders(page = 1, limit = 20) { return useQuery({ queryKey: ["admin", "orders", page, limit], queryFn: () => getAdminOrders(page, limit), staleTime: 60_000, retry: 1 }); }

export function useUpdateAdminOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => updateAdminOrderStatus(orderId, status),
    onSuccess: (_, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      void qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
    },
  });
}

// ─── Payments ────────────────────────────────────────

export function usePayments(page = 1, limit = 20) { return useQuery({ queryKey: ["admin", "payments", page, limit], queryFn: () => getPayments(page, limit), staleTime: 60_000, retry: 1 }); }

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (paymentId: string) => confirmPayment(paymentId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "payments"] }) });
}

export function useRejectPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (paymentId: string) => rejectPayment(paymentId), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "payments"] }) });
}

// ─── Settlements ─────────────────────────────────────

export function useSettlements(page = 1, limit = 20) { return useQuery({ queryKey: ["admin", "settlements", page, limit], queryFn: () => getSettlements(page, limit), staleTime: 60_000, retry: 1 }); }

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
  return useMutation({ mutationFn: deleteSubCategoryApi, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "subcategories"] }); void qc.invalidateQueries({ queryKey: ["admin", "categories"] }); } });
}

// ─── Users Extended ──────────────────────────────────

export function useBuyers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery({ queryKey: ["admin", "buyers", params], queryFn: () => getBuyers(params), staleTime: 60_000, retry: 1 });
}

export function useSellers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery({ queryKey: ["admin", "sellers", params], queryFn: () => getSellers(params), staleTime: 60_000, retry: 1 });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Record<string, any> }) => updateUser(userId, payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "users"] }); void qc.invalidateQueries({ queryKey: ["admin", "buyers"] }); void qc.invalidateQueries({ queryKey: ["admin", "sellers"] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "users"] }); void qc.invalidateQueries({ queryKey: ["admin", "buyers"] }); void qc.invalidateQueries({ queryKey: ["admin", "sellers"] }); },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, statusLevel }: { userId: string; statusLevel: number }) => updateUserStatus(userId, statusLevel),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "users"] }); void qc.invalidateQueries({ queryKey: ["admin", "buyers"] }); void qc.invalidateQueries({ queryKey: ["admin", "sellers"] }); },
  });
}

export function useUpdateGstPanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, data }: { userId: string; role: 'BUYER' | 'SELLER'; data: { verified: boolean; creditTier?: 'PREPAID' | 'EMI' | 'FULLCREDIT' } }) => 
      updateGstPanStatus(userId, role, data),
    onSuccess: () => { 
      void qc.invalidateQueries({ queryKey: ["admin", "users"] }); 
      void qc.invalidateQueries({ queryKey: ["admin", "buyers"] }); 
      void qc.invalidateQueries({ queryKey: ["admin", "sellers"] }); 
    },
  });
}

// ─── Products Extended ───────────────────────────────

export function useAdminProductsFiltered(params: { page?: number; limit?: number; status?: string; search?: string; categoryId?: string; sellerId?: string } = {}) {
  return useQuery({ queryKey: ["admin", "products", params], queryFn: () => getAdminProductsFiltered(params), staleTime: 60_000, retry: 1 });
}

export function useProductById(productId: string) {
  return useQuery({ queryKey: ["admin", "product", productId], queryFn: () => getProductById(productId), enabled: !!productId, staleTime: 60_000, retry: 1 });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createProduct, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }) });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: Record<string, any> }) => updateProduct(productId, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useApproveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => approveProduct(productId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useRejectProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason?: string }) => rejectProduct(productId, reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

// ─── Orders Extended ─────────────────────────────────

export function useAdminOrdersFiltered(params: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({ queryKey: ["admin", "orders", params], queryFn: () => getAdminOrdersFiltered(params), staleTime: 60_000, retry: 1 });
}

export function useOrderById(orderId: string) {
  return useQuery({ queryKey: ["admin", "order", orderId], queryFn: () => getOrderById(orderId), enabled: !!orderId, staleTime: 60_000, refetchInterval: 10000, retry: 1 });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => cancelOrder(orderId, reason),
    onSuccess: (_, { orderId }) => {
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      void qc.invalidateQueries({ queryKey: ["admin", "order", orderId] });
    },
  });
}

export function useOrderInvoice(orderId: string) {
  return useQuery({ queryKey: ["admin", "order", orderId, "invoice"], queryFn: () => getOrderInvoice(orderId), enabled: !!orderId });
}

// ─── Settlements Extended ────────────────────────────

export function useSellerSettlements(sellerId: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({ queryKey: ["admin", "settlements", "seller", sellerId, params], queryFn: () => getSellerSettlements(sellerId, params), enabled: !!sellerId, staleTime: 60_000, retry: 1 });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSettlement,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "settlements"] }),
  });
}

// ─── Admin Management ────────────────────────────────

export function useAdmins() { return useQuery({ queryKey: ["admin", "admins"], queryFn: getAdmins, staleTime: 60_000, retry: 1 }); }

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createAdmin, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "admins"] }) });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, payload }: { adminId: string; payload: Record<string, any> }) => updateAdmin(adminId, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "admins"] }),
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteAdmin, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "admins"] }) });
}

// ─── Suggestions ─────────────────────────────────────

export function useSuggestions(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery({ queryKey: ["admin", "suggestions", params], queryFn: () => getSuggestions(params), staleTime: 60_000, retry: 1 });
}

export function useCreateSuggestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createSuggestion, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "suggestions"] }) });
}

export function useUpdateSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) => updateSuggestion(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "suggestions"] }),
  });
}

export function useDeleteSuggestion() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteSuggestion, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "suggestions"] }) });
}

export function useImportSuggestionsCsv() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: importSuggestionsCsv, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "suggestions"] }) });
}

// ─── Banners ─────────────────────────────────────────

export function useBanners() { return useQuery({ queryKey: ["admin", "banners"], queryFn: getBanners, staleTime: 60_000, retry: 1 }); }

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createBanner, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "banners"] }) });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) => updateBanner(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteBanner, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "banners"] }) });
}

// ─── Referral Codes ──────────────────────────────────

export function useReferralCodes(params: { page?: number; limit?: number } = {}) {
  return useQuery({ queryKey: ["admin", "referrals", params], queryFn: () => getReferralCodes(params), staleTime: 60_000, retry: 1 });
}

export function useCreateReferralCode() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createReferralCode, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "referrals"] }) });
}

export function useDeleteReferralCode() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteReferralCode, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "referrals"] }) });
}

// ─── Notifications ───────────────────────────────────
export function useBroadcastNotification() {
  return useMutation({ mutationFn: (payload: { target: string; message: string }) => broadcastNotification(payload) });
}

export function useNotificationHistory(params: { page?: number; limit?: number } = {}) {
  return useQuery({ queryKey: ["admin", "notifications", params], queryFn: () => getNotificationHistory(params), staleTime: 60_000, retry: 1 });
}

// ─── Platform Settings ───────────────────────────────

export function usePlatformSettings() { return useQuery({ queryKey: ["admin", "settings"], queryFn: getPlatformSettings, staleTime: 60_000, retry: 1 }); }

export function useUpdatePlatformSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: updatePlatformSettings, onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "settings"] }) });
}

// ─── Analytics ───────────────────────────────────────

export function useRevenueChart(period?: string) { return useQuery({ queryKey: ["admin", "analytics", "revenue", period], queryFn: () => getRevenueChart({ period }), staleTime: 120_000, retry: 1 }); }
export function useOrdersChart(period?: string) { return useQuery({ queryKey: ["admin", "analytics", "orders", period], queryFn: () => getOrdersChart({ period }), staleTime: 120_000, retry: 1 }); }
export function useTopProducts(limit?: number) { return useQuery({ queryKey: ["admin", "analytics", "top-products", limit], queryFn: () => getTopProducts({ limit }), staleTime: 120_000, retry: 1 }); }
export function useTopSellers(limit?: number) { return useQuery({ queryKey: ["admin", "analytics", "top-sellers", limit], queryFn: () => getTopSellers({ limit }), staleTime: 120_000, retry: 1 }); }
