import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout } from "@pharmabag/utils";

export async function getSellerDashboard() {
  const { data } = await apiClient.get<{ data: { stats: any; overview: any } }>("/sellers/dashboard");
  return data.data;
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
