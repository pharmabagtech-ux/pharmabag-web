import { apiClient } from "@/lib/apiClient";

// ─── Dashboard ───────────────────────────────────────
export async function getAdminDashboard() {
  const { data } = await apiClient.get<{ data: any }>("/admin/dashboard");
  return data.data;
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
  const { data } = await apiClient.get<{ data: any }>(`/admin/products?page=${page}&limit=${limit}`);
  return data.data;
}

export async function getProductById(productId: string) {
  const { data } = await apiClient.get<{ data: any }>(`/admin/products/${productId}`);
  return data.data;
}

export async function disableProduct(productId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/disable`);
  return data.data;
}

export async function enableProduct(productId: string) {
  const { data } = await apiClient.patch<{ data: any }>(`/admin/products/${productId}/enable`);
  return data.data;
}

export async function deleteProduct(productId: string) {
  const { data } = await apiClient.delete<{ data: any }>(`/admin/products/${productId}`);
  return data.data;
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

// ─── Notifications ───────────────────────────────────
export async function broadcastNotification(payload: { target: string; message: string }) {
  const { data } = await apiClient.post<{ data: any }>("/admin/notifications/broadcast", payload);
  return data.data;
}
