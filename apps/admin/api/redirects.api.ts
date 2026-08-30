import { apiClient } from "@/lib/apiClient";

export interface UrlRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  source: "MANUAL" | "PRODUCT_RENAME";
  hits: number;
  lastHitAt?: string | null;
  createdAt: string;
}

export interface NotFoundEntry {
  id: string;
  path: string;
  hits: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastReferrer?: string | null;
  resolved: boolean;
}

export async function getRedirects() {
  const { data } = await apiClient.get<{ data: UrlRedirect[] }>("/admin/redirects");
  return data.data;
}

export async function createRedirect(payload: { from: string; to: string }) {
  const { data } = await apiClient.post<{ data: UrlRedirect }>("/admin/redirects", payload);
  return data.data;
}

export async function updateRedirect(id: string, payload: { to: string }) {
  const { data } = await apiClient.put<{ data: UrlRedirect }>(`/admin/redirects/${id}`, payload);
  return data.data;
}

export async function deleteRedirect(id: string) {
  const { data } = await apiClient.delete<{ data: unknown }>(`/admin/redirects/${id}`);
  return data.data;
}

export async function get404s(all: boolean) {
  const { data } = await apiClient.get<{ data: NotFoundEntry[] }>(
    `/admin/redirects/404s${all ? "?all=true" : ""}`,
  );
  return data.data;
}

export async function dismiss404(id: string) {
  const { data } = await apiClient.delete<{ data: unknown }>(`/admin/redirects/404s/${id}`);
  return data.data;
}

/** Product picker: the PUBLIC master-catalogue autocomplete (returns slug). */
export interface ProductSuggestion {
  id: string;
  sku?: string | null;
  productName: string;
  companyName?: string;
  slug?: string | null;
}

export async function searchMasterProducts(search: string) {
  const { data } = await apiClient.get<{ data: ProductSuggestion[] }>(
    `/products/suggestions?search=${encodeURIComponent(search)}&type=master`,
  );
  return data.data;
}
