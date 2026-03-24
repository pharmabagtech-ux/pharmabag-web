import { apiClient } from "@/lib/apiClient";
import { PRODUCTS as MOCK_PRODUCTS, ADMIN_STATS } from "@pharmabag/utils/mockData";
import type { Product } from "@pharmabag/utils";

// ─── Local mock product store for approve/reject simulation ───
let _mockProducts: Product[] | null = null;
function getMockProducts(): Product[] {
  if (!_mockProducts) _mockProducts = structuredClone(MOCK_PRODUCTS);
  return _mockProducts;
}

// ─── Dashboard ───────────────────────────────────────
export async function getAdminDashboard() {
  try {
    const { data } = await apiClient.get<{ data: any }>("/admin/dashboard");
    return data.data;
  } catch {
    return ADMIN_STATS;
  }
}

// ─── Users ───────────────────────────────────────────
export async function getAdminUsers(page = 1, limit = 50) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/users?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getPendingUsers() {
  const { data } = await apiClient.get<{ data: any }>("/admin/users/pending");
  return data.data;
}

export async function getUserById(userId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/users/${userId}`);
  return data.data;
}

export async function approveUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/approve`);
  return data.data;
}

export async function rejectUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/reject`);
  return data.data;
}

export async function blockUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/block`);
  return data.data;
}

export async function unblockUser(userId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/unblock`);
  return data.data;
}

// ─── Products ────────────────────────────────────────
export async function getAdminProducts(page = 1, limit = 50) {
  try {
    const { data } = await apiClient.get<{ data: any }>(`/admin/products?page=${page}&limit=${limit}`);
    return data.data;
  } catch (error) {
    console.error("Admin Products Error:", error);
    // Fallback to mock data — admin sees ALL products regardless of status
    const products = getMockProducts();
    const start = (page - 1) * limit;
    return { data: products.slice(start, start + limit), total: products.length, page, limit };
  }
}

export async function getProductById(productId: string) {
  try {
    const { data } = await apiClient.get<{ data: any }>(`/admin/products/${productId}`);
    return data.data;
  } catch {
    const product = getMockProducts().find((p) => p.id === productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
}

export async function disableProduct(productId: string) {
  try {
    const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/disable`);
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = { ...products[idx], isActive: false };
    return products[idx];
  }
}

export async function enableProduct(productId: string) {
  try {
    const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/enable`);
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    // Only allow enabling if product is APPROVED
    if (products[idx].status !== "APPROVED" && products[idx].approvalStatus !== "APPROVED") {
      throw new Error("Only approved products can be enabled");
    }
    products[idx] = { ...products[idx], isActive: true };
    return products[idx];
  }
}

export async function deleteProduct(productId: string) {
  try {
    const { data } = await apiClient.delete<{ data: any }>(`/admin/products/${productId}`);
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    const removed = products.splice(idx, 1)[0];
    return removed;
  }
}

export async function approveProduct(productId: string) {
  try {
    const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/approve`);
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    const current = products[idx];
    if (current.status !== "PENDING" && current.approvalStatus !== "PENDING") {
      throw new Error("Only pending products can be approved");
    }
    products[idx] = { ...current, status: "APPROVED", approvalStatus: "APPROVED", isActive: true };
    return products[idx];
  }
}

export async function rejectProduct(productId: string, reason?: string) {
  try {
    const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/reject`, { reason });
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    const current = products[idx];
    if (current.status !== "PENDING" && current.approvalStatus !== "PENDING") {
      throw new Error("Only pending products can be rejected");
    }
    products[idx] = { ...current, status: "REJECTED", approvalStatus: "REJECTED", isActive: false, rejectionReason: reason };
    return products[idx];
  }
}

// ─── Orders ──────────────────────────────────────────
export async function getAdminOrders(page = 1, limit = 50) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/orders?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getOrderById(orderId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/orders/${orderId}`);
  return data.data;
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/orders/${orderId}/status`, { status });
  return data.data;
}

// ─── Payments ────────────────────────────────────────
export async function getPayments(page = 1, limit = 50) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/payments?page=${page}&limit=${limit}`);
  return data.data;
}

export async function confirmPayment(paymentId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/payments/${paymentId}/confirm`);
  return data.data;
}

export async function rejectPayment(paymentId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/payments/${paymentId}/reject`);
  return data.data;
}

// ─── Settlements ─────────────────────────────────────
export async function getSettlements(page = 1, limit = 50) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/settlements?page=${page}&limit=${limit}`);
  return data.data;
}

export async function markSettlementPaid(settlementId: string, payoutReference: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/settlements/${settlementId}/mark-paid`, { payoutReference });
  return data.data;
}

// ─── Tickets ─────────────────────────────────────────
export async function getTickets(page = 1, limit = 50) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/tickets?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getTicketById(ticketId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/tickets/${ticketId}`);
  return data.data;
}

export async function replyToTicket(ticketId: string, message: string) {
  const { data } = await apiClient.post<{ data: any }>(`/admin/tickets/${ticketId}/reply`, { message });
  return data.data;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/tickets/${ticketId}/status`, { status });
  return data.data;
}

// ─── Categories ──────────────────────────────────────
export async function getCategories() {
  const { data } = await apiClient.get<{ data: any }>("/admin/categories");
  return data.data;
}

export async function createCategory(payload: { name: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/categories", payload);
  return data.data;
}

export async function updateCategory(id: string, payload: { name?: string }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/categories/${id}`);
  return data.data; // Note: may not return data depending on backend
}

export async function getSubCategories(categoryId?: string) {
  const url = categoryId ? `/admin/subcategories?categoryId=${categoryId}` : "/admin/subcategories";
  const { data } = await apiClient.get<{ data: any }>(url);
  return data.data;
}

export async function createSubCategory(payload: { name: string; categoryId: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/subcategories", payload);
  return data.data;
}

export async function updateSubCategory(id: string, payload: { name?: string; categoryId?: string }) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/subcategories/${id}`, payload);
  return data.data;
}

export async function deleteSubCategory(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/subcategories/${id}`);
  return data.data;
}

// ─── Users (Extended) ────────────────────────────────
export async function getBuyers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const { data } = await apiClient.get<{ data: any }>(`/admin/users/buyers?${qs}`);
  return data.data;
}

export async function getSellers(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const { data } = await apiClient.get<{ data: any }>(`/admin/users/sellers?${qs}`);
  return data.data;
}

export async function updateUser(userId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}`, payload);
  return data.data;
}

export async function deleteUser(userId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/users/${userId}`);
  return data.data;
}

export async function updateUserStatus(userId: string, statusLevel: number) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/users/${userId}/status-level`, { statusLevel });
  return data.data;
}

// ─── Products (Extended) ─────────────────────────────
export async function getAdminProductsFiltered(params: { page?: number; limit?: number; status?: string; search?: string; categoryId?: string; sellerId?: string } = {}) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    const { data } = await apiClient.get<{ data: any }>(`/admin/products?${qs}`);
    return data.data;
  } catch {
    let products = getMockProducts();
    if (params.status) {
      const s = params.status.toUpperCase();
      if (s === "ACTIVE") products = products.filter((p) => p.isActive);
      else if (s === "INACTIVE") products = products.filter((p) => !p.isActive);
      else products = products.filter((p) => (p.approvalStatus ?? p.status) === s);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params.categoryId) products = products.filter((p) => p.categoryId === params.categoryId);
    if (params.sellerId) products = products.filter((p) => p.sellerId === params.sellerId);
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const start = (page - 1) * limit;
    return { data: products.slice(start, start + limit), total: products.length, page, limit };
  }
}

export async function createProduct(payload: Record<string, any>) {
  try {
    const { data } = await apiClient.post<{ data: any }>("/admin/products", payload);
    return data.data;
  } catch {
    // Admin-created products default to APPROVED
    const newProduct: Product = {
      id: `admin-p-${Date.now()}`,
      name: payload.name ?? "New Product",
      genericName: payload.genericName ?? "",
      manufacturer: payload.manufacturer ?? "",
      category: payload.category ?? "",
      categoryId: payload.categoryId ?? "",
      price: payload.mrp ?? payload.price ?? 0,
      mrp: payload.mrp ?? 0,
      status: "APPROVED",
      approvalStatus: "APPROVED",
      isActive: true,
      stock: payload.stock ?? 0,
      images: payload.images ?? [],
      description: payload.description ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    getMockProducts().push(newProduct);
    return newProduct;
  }
}

export async function updateProduct(productId: string, payload: Record<string, any>) {
  try {
    const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}`, payload);
    return data.data;
  } catch {
    const products = getMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = { ...products[idx], ...payload, updatedAt: new Date().toISOString() };
    return products[idx];
  }
}

// ─── Orders (Extended) ───────────────────────────────
export async function getAdminOrdersFiltered(params: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<{ data: any }>(`/admin/orders?${qs}`);
  return data.data;
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/orders/${orderId}/cancel`, { reason });
  return data.data;
}

export async function getOrderInvoice(orderId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/orders/${orderId}/invoice`);
  return data.data;
}

// ─── Settlements (Extended) ──────────────────────────
export async function getSellerSettlements(sellerId: string, params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await apiClient.get<{ data: any }>(`/admin/settlements/seller/${sellerId}?${qs}`);
  return data.data;
}

export async function createSettlement(payload: { sellerId: string; orderIds: string[]; amount: number }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/settlements", payload);
  return data.data;
}

// ─── Admin Management ────────────────────────────────
export async function getAdmins() {
  const { data } = await apiClient.get<{ data: any }>("/admin/admins");
  return data.data;
}

export async function createAdmin(payload: { phone: string; name: string; role?: string; permissions?: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/admins", payload);
  return data.data;
}

export async function updateAdmin(adminId: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/admins/${adminId}`, payload);
  return data.data;
}

export async function deleteAdmin(adminId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/admins/${adminId}`);
  return data.data;
}

// ─── Suggestions / Catalog ───────────────────────────
export async function getSuggestions(params: { page?: number; limit?: number; search?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const { data } = await apiClient.get<{ data: any }>(`/admin/suggestions?${qs}`);
  return data.data;
}

export async function createSuggestion(payload: Record<string, any>) {
  const { data } = await apiClient.post<{ data: any }>("/admin/suggestions", payload);
  return data.data;
}

export async function updateSuggestion(id: string, payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/suggestions/${id}`, payload);
  return data.data;
}

export async function deleteSuggestion(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/suggestions/${id}`);
  return data.data;
}

export async function importSuggestionsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ data: any }>("/admin/suggestions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

// ─── Banners ─────────────────────────────────────────
export async function getBanners() {
  const { data } = await apiClient.get<{ data: any }>("/admin/banners");
  return data.data;
}

export async function createBanner(payload: FormData) {
  const { data } = await apiClient.post<{ data: any }>("/admin/banners", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function updateBanner(id: string, payload: FormData) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/banners/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function deleteBanner(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/banners/${id}`);
  return data.data;
}

// ─── Referral Codes ──────────────────────────────────
export async function getReferralCodes(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await apiClient.get<{ data: any }>(`/admin/referrals?${qs}`);
  return data.data;
}

export async function createReferralCode(payload: { code: string; discountPercent: number; maxUses?: number; expiresAt?: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/referrals", payload);
  return data.data;
}

export async function deleteReferralCode(id: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/referrals/${id}`);
  return data.data;
}

// ─── Notifications (Extended) ────────────────────────
export async function broadcastNotification(payload: { target: string; message: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/notifications/broadcast", payload);
  return data.data;
}

export async function getNotificationHistory(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const { data } = await apiClient.get<{ data: any }>(`/admin/notifications?${qs}`);
  return data.data;
}

// ─── Platform Settings ───────────────────────────────
export async function getPlatformSettings() {
  const { data } = await apiClient.get<{ data: any }>("/admin/settings");
  return data.data;
}

export async function updatePlatformSettings(payload: Record<string, any>) {
  const { data } = await apiClient.patch<{ data: any }>("/admin/settings", payload);
  return data.data;
}

// ─── Analytics ───────────────────────────────────────
export async function getRevenueChart(params: { period?: string } = {}) {
  const qs = params.period ? `?period=${params.period}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/revenue${qs}`);
  return data.data;
}

export async function getOrdersChart(params: { period?: string } = {}) {
  const qs = params.period ? `?period=${params.period}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/orders${qs}`);
  return data.data;
}

export async function getTopProducts(params: { limit?: number } = {}) {
  const qs = params.limit ? `?limit=${params.limit}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/top-products${qs}`);
  return data.data;
}

export async function getTopSellers(params: { limit?: number } = {}) {
  const qs = params.limit ? `?limit=${params.limit}` : "";
  const { data } = await apiClient.get<{ data: any }>(`/admin/analytics/top-sellers${qs}`);
  return data.data;
}
