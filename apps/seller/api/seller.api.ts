import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout } from "@pharmabag/utils";

export async function getSellerDashboard() {
  const { data } = await apiClient.get<{ data: { stats: any; overview: any; chartData?: any[] } }>("/sellers/dashboard");
  return data.data;
}

export async function getSellerProfile() {
  const { data } = await apiClient.get<any>("/sellers/profile");
  return data.data ?? data.profile ?? data;
}

export async function updateSellerProfile(payload: Partial<any>) {
  const { data } = await apiClient.patch<any>("/sellers/profile", payload);
  return data.data ?? data.profile ?? data;
}

import { ProductPayload } from "@pharmabag/utils";

export async function getSellerProducts() {
  const { data } = await apiClient.get<{ data: { products: Product[] } }>("/products/seller/own");
  return data.data?.products ?? [];
}

export async function createSellerProduct(input: ProductPayload) {
  // Backend is POST /products (ProductsController)
  const { data } = await apiClient.post<{ data: Product }>("/products", input);
  return data.data;
}

export async function updateSellerProduct(productId: string, input: Partial<ProductPayload>) {
  // Backend is PATCH /products/:id (ProductsController)
  const { data } = await apiClient.patch<{ data: Product }>(`/products/${productId}`, input);
  return data.data;
}

export async function getSellerProductById(productId: string) {
  // Backend is GET /products/:id (ProductsController)
  const { data } = await apiClient.get<{ data: Product }>(`/products/${productId}`);
  return data.data;
}

export async function getCategories() {
  const { data } = await apiClient.get<{ data: any[] }>("/products/categories");
  return data.data || [];
}

export async function deleteSellerProduct(productId: string) {
  const { data } = await apiClient.delete<{ message: string }>(`/products/${productId}`);
  return data;
}

export async function getSellerOrders() {
  const { data } = await apiClient.get<{ data: Order[] }>("/orders/seller");
  return data.data || [];
}

export async function updateSellerOrderStatus(orderId: string, status: string) {
  const { data } = await apiClient.patch<{ order: Order }>(`/orders/${orderId}/status`, { status });
  return data.order;
}

export async function getSellerSettlements() {
  const { data } = await apiClient.get<{ settlements: any }>("/settlements/seller");
  return data.settlements;
}

export async function getSellerSettlementSummary() {
  const { data } = await apiClient.get<{ summary: any }>("/settlements/summary");
  return data.summary;
}

export async function requestSellerPayout() {
  const { data } = await apiClient.post<{ data: any }>("/settlements/request");
  return data.data ?? data;
}

export async function toggleVacationMode(isOnVacation: boolean) {
  const { data } = await apiClient.patch<any>("/sellers/profile", { isOnVacation });
  return data.data ?? data.profile ?? data;
}

// ─── Orders (extended) ────────────────────────────────
export async function getSellerOrderById(orderId: string) {
  const { data } = await apiClient.get<any>(`/orders/${orderId}`);
  return data.data ?? data.order ?? data;
}

export async function acceptSellerOrder(orderId: string) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/status`, { status: "ACCEPTED" });
  return data.data ?? data.order ?? data;
}

export async function rejectSellerOrder(orderId: string, reason: string) {
  const { data } = await apiClient.patch<any>(`/orders/${orderId}/status`, { status: "CANCELLED", reason });
  return data.data ?? data.order ?? data;
}

export async function uploadOrderInvoice(orderId: string, formData: FormData) {
  const { data } = await apiClient.post<any>(`/orders/${orderId}/invoice`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data ?? data;
}

export async function getSellerCustomOrders() {
  const { data } = await apiClient.get<any>("/orders/seller?type=custom");
  return data.data ?? data;
}

export async function getSellerCancelledOrders() {
  const { data } = await apiClient.get<any>("/orders/seller?status=CANCELLED");
  return data.data ?? data;
}

// ─── Notifications ────────────────────────────────────
export async function getSellerNotifications() {
  const { data } = await apiClient.get<any>("/notifications");
  return data.data ?? data;
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await apiClient.patch<any>(`/notifications/${notificationId}/read`);
  return data.data ?? data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch<any>("/notifications/read-all");
  return data.data ?? data;
}

// ─── Profile (extended) ───────────────────────────────
export async function getSellerFullProfile() {
  const { data } = await apiClient.get<any>("/sellers/profile");
  return data.data ?? data.profile ?? data;
}

// ─── Product Requests ─────────────────────────────────
export async function getProductRequests() {
  const { data } = await apiClient.get<any>("/products/requests");
  return data.data ?? data;
}

export async function createProductRequest(payload: { productName: string; manufacturer?: string; description?: string }) {
  const { data } = await apiClient.post<any>("/products/requests", payload);
  return data.data ?? data;
}

// ─── Analytics ────────────────────────────────────────
export async function getSellerAnalytics() {
  const { data } = await apiClient.get<any>("/sellers/analytics");
  return data.data ?? data;
}

// ─── Support Tickets ─────────────────────────────────
export async function getSellerTickets() {
  const { data } = await apiClient.get<any>("/tickets");
  return data.data ?? data;
}

export async function getSellerTicketById(ticketId: string) {
  const { data } = await apiClient.get<any>(`/tickets/${ticketId}`);
  return data.data ?? data;
}

export async function createSellerTicket(payload: { subject: string; message: string }) {
  const { data } = await apiClient.post<any>("/tickets", payload);
  return data.data ?? data;
}

export async function addTicketMessage(ticketId: string, message: string) {
  const { data } = await apiClient.post<any>(`/tickets/${ticketId}/messages`, { message });
  return data.data ?? data;
}
