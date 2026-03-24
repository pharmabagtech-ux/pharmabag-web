import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout } from "@pharmabag/utils";
import { PRODUCTS as MOCK_PRODUCTS } from "@pharmabag/utils/mockData";
import type { ProductPayload } from "@pharmabag/utils";

// Local mock store for seller product mutations
let _sellerMockProducts: Product[] | null = null;
function getSellerMockProducts(): Product[] {
  if (!_sellerMockProducts) _sellerMockProducts = structuredClone(MOCK_PRODUCTS);
  return _sellerMockProducts;
}

export async function getSellerDashboard() {
  try {
    const { data } = await apiClient.get<{ data: { stats: any; overview: any; chartData?: any[] } }>("/sellers/dashboard");
    return data.data;
  } catch {
    const products = getSellerMockProducts();
    return {
      stats: {
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        pendingProducts: products.filter((p) => p.approvalStatus === "PENDING").length,
        totalOrders: 0,
        totalRevenue: 0,
      },
      overview: { revenue: 0, orders: 0 },
      chartData: [],
    };
  }
}

export async function getSellerProfile() {
  try {
    const { data } = await apiClient.get<any>("/sellers/profile");
    return data.data ?? data.profile ?? data;
  } catch {
    return {
      id: "seller-1",
      name: "Demo Seller",
      phone: "9831864222",
      email: "seller@demo.com",
      businessName: "Demo Pharmacy",
      gstNumber: "22AAAAA0000A1Z5",
      isVerified: true,
      isOnVacation: false,
    };
  }
}

export async function updateSellerProfile(payload: Partial<any>) {
  try {
    const { data } = await apiClient.patch<any>("/sellers/profile", payload);
    return data.data ?? data.profile ?? data;
  } catch {
    return { id: "seller-1", name: "Demo Seller", ...payload };
  }
}

export async function getSellerProducts() {
  try {
    const { data } = await apiClient.get<{ data: { products: Product[] } }>("/products/seller/own");
    return data.data?.products ?? [];
  } catch {
    // Return all mock products as if seller owns them
    return getSellerMockProducts();
  }
}

export async function createSellerProduct(input: ProductPayload | Record<string, any>) {
  try {
    const { data } = await apiClient.post<{ data: Product }>("/products", input);
    return data.data;
  } catch {
    // Seller-created products ALWAYS start as PENDING — never auto-approve
    const p = input as Record<string, any>;
    const newProduct: Product = {
      id: `seller-p-${Date.now()}`,
      name: p.name ?? p.product_name ?? "New Product",
      genericName: p.genericName ?? p.chemical_combination ?? "",
      manufacturer: p.manufacturer ?? p.company_name ?? "",
      category: p.category ?? "",
      categoryId: p.categoryId ?? (p.categories?.[0]) ?? "",
      price: p.mrp ?? p.product_price ?? 0,
      mrp: p.mrp ?? p.product_price ?? 0,
      status: "PENDING",
      approvalStatus: "PENDING",
      isActive: false,
      stock: p.stock ?? 0,
      images: p.images ?? p.image_list ?? [],
      description: p.description ?? "",
      sellerId: "seller-1",
      sellerName: "Demo Seller",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    getSellerMockProducts().push(newProduct);
    return newProduct;
  }
}

export async function updateSellerProduct(productId: string, input: Partial<ProductPayload>) {
  try {
    const { data } = await apiClient.patch<{ data: Product }>(`/products/${productId}`, input);
    return data.data;
  } catch {
    const products = getSellerMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = { ...products[idx], ...input, updatedAt: new Date().toISOString() };
    return products[idx];
  }
}

export async function getSellerProductById(productId: string) {
  try {
    const { data } = await apiClient.get<{ data: Product }>(`/products/${productId}`);
    return data.data;
  } catch {
    const product = getSellerMockProducts().find((p) => p.id === productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
}

export async function getCategories() {
  try {
    const { data } = await apiClient.get<{ data: any[] }>("/products/categories");
    return data.data || [];
  } catch {
    return [
      { id: "cat-1", name: "Tablets" },
      { id: "cat-2", name: "Syrups" },
      { id: "cat-3", name: "Injections" },
      { id: "cat-4", name: "Drops" },
    ];
  }
}

export async function deleteSellerProduct(productId: string) {
  try {
    const { data } = await apiClient.delete<{ message: string }>(`/products/${productId}`);
    return data;
  } catch {
    const products = getSellerMockProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error("Product not found");
    products.splice(idx, 1);
    return { message: "Product deleted" };
  }
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
