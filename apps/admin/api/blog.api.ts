import { apiClient } from "@/lib/apiClient";

// ─── Types (mirror the API's BlogPost/Author/Category payloads) ───

export interface BlogAuthor {
  id: string;
  name: string;
  bio?: string | null;
  avatar?: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  /** HTML string for posts written in the admin editor; the legacy row stores { text }. */
  content?: string | { text?: string } | null;
  featuredImage?: string | null;
  images?: string[];
  authorId: string;
  categoryId?: string | null;
  tags?: string[];
  status: "DRAFT" | "PUBLISHED";
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[];
  canonicalUrl?: string | null;
  ogImage?: string | null;
  views?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  author?: BlogAuthor;
  category?: BlogCategory | null;
}

export interface BlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorId: string;
  categoryId?: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

// ─── Posts ───

export async function getBlogPosts(
  params: { page?: number; limit?: number; search?: string; status?: string } = {},
) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  qs.set("limit", String(params.limit ?? 50));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const { data } = await apiClient.get<{
    data: { items: BlogPost[]; meta: { total: number; totalPages: number } };
  }>(`/admin/blogs?${qs}`);
  return data.data;
}

export async function getBlogPost(id: string) {
  const { data } = await apiClient.get<{ data: BlogPost }>(`/admin/blogs/${id}`);
  return data.data;
}

export async function createBlogPost(payload: BlogPostPayload) {
  const { data } = await apiClient.post<{ data: BlogPost }>("/admin/blogs", payload);
  return data.data;
}

export async function updateBlogPost(id: string, payload: Partial<BlogPostPayload>) {
  const { data } = await apiClient.put<{ data: BlogPost }>(`/admin/blogs/${id}`, payload);
  return data.data;
}

export async function updateBlogPostStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  const { data } = await apiClient.patch<{ data: BlogPost }>(`/admin/blogs/${id}/status`, { status });
  return data.data;
}

export async function deleteBlogPost(id: string) {
  const { data } = await apiClient.delete<{ data: unknown }>(`/admin/blogs/${id}`);
  return data.data;
}

// ─── Authors / Categories ───

export async function getBlogAuthors() {
  const { data } = await apiClient.get<{ data: BlogAuthor[] }>("/admin/blogs/authors");
  return data.data;
}

export async function createBlogAuthor(payload: { name: string; bio?: string; avatar?: string }) {
  const { data } = await apiClient.post<{ data: BlogAuthor }>("/admin/blogs/authors", payload);
  return data.data;
}

export async function getBlogCategories() {
  const { data } = await apiClient.get<{ data: BlogCategory[] }>("/admin/blogs/categories");
  return data.data;
}

export async function createBlogCategory(payload: { name: string }) {
  const { data } = await apiClient.post<{ data: BlogCategory }>("/admin/blogs/categories", payload);
  return data.data;
}

// ─── Images ───

export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ data: { url: string } }>("/storage/blog-image", formData);
  return data.data.url;
}
