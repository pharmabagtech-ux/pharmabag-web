import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  mrp: z.number().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  images: z.array(z.string()).optional(),
  stock: z.number().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ProductListResponseSchema = z.object({
  data: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  mrp: z.number().positive().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
});

// ─── Types ──────────────────────────────────────────

export type Product = z.infer<typeof ProductSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// ─── Category Schema ────────────────────────────────

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  productCount: z.number().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// ─── API Functions ──────────────────────────────────

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  manufacturer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductListResponse> {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/products/categories');
  return data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const body = CreateProductSchema.parse(input);
  const { data } = await api.post('/products', body);
  return data;
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}
