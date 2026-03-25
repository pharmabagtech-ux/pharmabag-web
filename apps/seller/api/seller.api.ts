import { apiClient } from "@/lib/apiClient";
import type { Product, Order, Payout, Suggestion, CategoryItem } from "@pharmabag/utils";
import { getLocalProducts, addLocalProduct, updateLocalProduct, deleteLocalProduct, findLocalProduct } from "@pharmabag/utils";
import type { ProductPayload } from "@pharmabag/utils";

export async function getSellerDashboard() {
  try {
    const { data } = await apiClient.get<{ data: { stats: any; overview: any; chartData?: any[] } }>("/sellers/dashboard");
    return data.data;
  } catch {
    const products = getLocalProducts();
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
    // Return all products from local store as if seller owns them
    return getLocalProducts();
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
    addLocalProduct(newProduct);
    return newProduct;
  }
}

export async function updateSellerProduct(productId: string, input: Partial<ProductPayload>) {
  try {
    const { data } = await apiClient.patch<{ data: Product }>(`/products/${productId}`, input);
    return data.data;
  } catch {
    const updated = updateLocalProduct(productId, input as Partial<Product>);
    if (!updated) throw new Error("Product not found");
    return updated;
  }
}

export async function getSellerProductById(productId: string) {
  try {
    const { data } = await apiClient.get<{ data: Product }>(`/products/${productId}`);
    return data.data;
  } catch {
    const product = findLocalProduct(productId);
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
    const deleted = deleteLocalProduct(productId);
    if (!deleted) throw new Error("Product not found");
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

// ─── Suggestion / Autocomplete Search ─────────────────

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "sug-1", productName: "Paracetamol 500mg", companyName: "Cipla", chemicalCombination: "Paracetamol", category: "Tablets", gstPercent: 12 },
  { id: "sug-2", productName: "Amoxicillin 250mg", companyName: "Sun Pharma", chemicalCombination: "Amoxicillin", category: "Capsules", gstPercent: 12 },
  { id: "sug-3", productName: "Cetirizine 10mg", companyName: "Dr. Reddy's", chemicalCombination: "Cetirizine Hydrochloride", category: "Tablets", gstPercent: 12 },
  { id: "sug-4", productName: "Azithromycin 500mg", companyName: "Zydus", chemicalCombination: "Azithromycin", category: "Tablets", gstPercent: 12 },
  { id: "sug-5", productName: "Dolo 650", companyName: "Micro Labs", chemicalCombination: "Paracetamol 650mg", category: "Tablets", gstPercent: 12 },
  { id: "sug-6", productName: "Pantoprazole 40mg", companyName: "Alkem", chemicalCombination: "Pantoprazole", category: "Tablets", gstPercent: 5 },
  { id: "sug-7", productName: "Metformin 500mg", companyName: "USV", chemicalCombination: "Metformin Hydrochloride", category: "Tablets", gstPercent: 5 },
  { id: "sug-8", productName: "Cough Syrup", companyName: "Dabur", chemicalCombination: "Honey, Tulsi, Mulethi", category: "Syrups", gstPercent: 18 },
  { id: "sug-9", productName: "ORS Powder", companyName: "Electral", chemicalCombination: "Sodium Chloride, Potassium Chloride", category: "Sachets", gstPercent: 0 },
  { id: "sug-10", productName: "Vitamin D3 60K", companyName: "USV", chemicalCombination: "Cholecalciferol", category: "Capsules", gstPercent: 12 },
];

export async function searchSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const { data } = await apiClient.get<{ data: Suggestion[] }>("/products/suggestions", {
      params: { q: query },
    });
    return data.data ?? [];
  } catch {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return MOCK_SUGGESTIONS.filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        (s.chemicalCombination?.toLowerCase().includes(q) ?? false)
    );
  }
}

// ─── Categories with Subcategories ────────────────────

export async function getCategoriesWithSubs(): Promise<CategoryItem[]> {
  try {
    const { data } = await apiClient.get<{ data: CategoryItem[] }>("/products/categories?includeSubs=true");
    return data.data ?? [];
  } catch {
    return [
      { id: "cat-1", name: "Tablets", subcategories: [{ id: "sub-1", name: "Pain Relief", categoryId: "cat-1" }, { id: "sub-2", name: "Antibiotics", categoryId: "cat-1" }] },
      { id: "cat-2", name: "Syrups", subcategories: [{ id: "sub-3", name: "Cough", categoryId: "cat-2" }, { id: "sub-4", name: "Digestive", categoryId: "cat-2" }] },
      { id: "cat-3", name: "Injections", subcategories: [] },
      { id: "cat-4", name: "Drops", subcategories: [{ id: "sub-5", name: "Eye Drops", categoryId: "cat-4" }, { id: "sub-6", name: "Ear Drops", categoryId: "cat-4" }] },
      { id: "cat-5", name: "Capsules", subcategories: [] },
      { id: "cat-6", name: "Sachets", subcategories: [] },
    ];
  }
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
