import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout } from "@pharmabag/utils";

export async function getSellerDashboard() {
  const { data } = await apiClient.get<{ stats: { totalProducts: number; activeListings: number; totalOrders: number; pendingOrders: number; totalRevenue: number; pendingPayouts: number; avgRating: number; lowStockItems: number }; overview: { orders: Order[] }; payouts: { balance: number; paid: number; pending: number; history: Payout[] } }>("/seller/dashboard");
  return data;
}

export async function getSellerProfile() {
  const { data } = await apiClient.get<{ profile: any }>("/sellers/profile");
  return data.profile;
}

export async function updateSellerProfile(payload: Partial<any>) {
  const { data } = await apiClient.patch<{ profile: any }>("/sellers/profile", payload);
  return data.profile;
}

import { ProductPayload } from "@pharmabag/utils";

export async function getSellerProducts() {
  const { data } = await apiClient.get<{ products: Product[] }>("/products/seller/own");
  return data.products;
}

export async function createSellerProduct(input: ProductPayload) {
  const { data } = await apiClient.post<{ product: Product }>("/seller/products/add", input);
  return data.product;
}

export async function updateSellerProduct(productId: string, input: Partial<ProductPayload>) {
  const { data } = await apiClient.put<{ product: Product }>(`/seller/products/add/${productId}`, input);
  return data.product;
}

export async function getSellerProductById(productId: string) {
  const { data } = await apiClient.get<{ product: Product }>(`/seller/products/${productId}`);
  return data.product;
}

export async function getCategories() {
  // Try to use a shared categories endpoint or specific to seller
  const { data } = await apiClient.get<{ categories: any[] }>("/categories");
  return data.categories || data;
}

export async function deleteSellerProduct(productId: string) {
  const { data } = await apiClient.delete<{ message: string }>(`/products/${productId}`);
  return data;
}

export async function getSellerOrders() {
  const { data } = await apiClient.get<{ orders: Order[] }>("/orders/seller");
  return data.orders;
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
