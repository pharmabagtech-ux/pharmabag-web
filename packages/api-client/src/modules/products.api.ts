import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const ProductStatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']);

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
  status: ProductStatusEnum.optional(),
  approvalStatus: ProductStatusEnum.optional(),
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
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
  categoryId: z.string().min(1),
  subCategoryId: z.string().optional(),
  manufacturer: z.string().optional(),
  chemicalComposition: z.string().optional(),
  description: z.string().optional(),
  mrp: z.number().positive(),
  gstPercent: z.number().optional(),
  minimumOrderQuantity: z.number().int().positive().optional(),
  maximumOrderQuantity: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  expiryDate: z.string().optional(),
  images: z.array(z.string()).optional(),
  discountType: z.string().optional(),
  discountMeta: z.record(z.unknown()).optional(),
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

// ─── Mock Fallback (used when backend is unavailable) ─
import { PRODUCTS as MOCK_PRODUCTS } from '@pharmabag/utils/mockData';

// ─── API Functions ──────────────────────────────────

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  manufacturer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductListResponse> {
  try {
    const { data } = await api.get('/products', { params });
    return {
      data: data.data.products,
      total: data.data.meta.total,
      page: data.data.meta.page,
      limit: data.data.meta.limit,
    };
  } catch {
    // Fallback to mock data — only return APPROVED products for buyer-facing API
    const approved = (MOCK_PRODUCTS as any[]).filter(
      (p) => (p.status === 'APPROVED' || p.approvalStatus === 'APPROVED') && p.isActive !== false
    );
    const search = params?.search?.toLowerCase();
    const filtered = search
      ? approved.filter((p) => p.name?.toLowerCase().includes(search) || p.manufacturer?.toLowerCase().includes(search))
      : approved;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    return { data: paged as Product[], total: filtered.length, page, limit };
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  } catch {
    const found = (MOCK_PRODUCTS as any[]).find((p) => p.id === id);
    if (found) return found as Product;
    throw new Error('Product not found');
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await api.get('/products/categories');
    return data.data;
  } catch {
    return [];
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const body = CreateProductSchema.parse(input);
  try {
    const { data } = await api.post('/products', body);
    return data;
  } catch {
    // Fallback: simulate creation with PENDING status
    return {
      id: `p-${Date.now()}`,
      name: body.name,
      price: body.mrp,
      mrp: body.mrp,
      manufacturer: body.manufacturer,
      stock: body.stock,
      isActive: false,
      status: 'PENDING',
      approvalStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  }
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ─── Extended Product APIs ──────────────────────────

export async function getManufacturers(): Promise<{ id: string; name: string; productCount?: number }[]> {
  try {
    const { data } = await api.get('/products/manufacturers');
    return data.data ?? data;
  } catch {
    // Derive from mock data
    const mfrs = new Map<string, number>();
    for (const p of MOCK_PRODUCTS as any[]) {
      if (p.manufacturer) mfrs.set(p.manufacturer, (mfrs.get(p.manufacturer) || 0) + 1);
    }
    return Array.from(mfrs).map(([name, count], i) => ({ id: `mfr-${i}`, name, productCount: count }));
  }
}

export async function getProductsByManufacturer(manufacturer: string, params?: {
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  return getProducts({ ...params, manufacturer });
}

export async function getNearbyProducts(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}): Promise<ProductListResponse> {
  const { data } = await api.get('/products/nearby', { params });
  return {
    data: data.data?.products ?? data.data ?? [],
    total: data.data?.meta?.total ?? 0,
    page: data.data?.meta?.page ?? params.page ?? 1,
    limit: data.data?.meta?.limit ?? params.limit ?? 10,
  };
}

export async function getCities(): Promise<{ id: string; name: string; state: string }[]> {
  try {
    const { data } = await api.get('/locations/cities');
    return data.data ?? data;
  } catch {
    return [];
  }
}

export async function getDiscountDetails(productId: string): Promise<{
  discountType: string;
  discountPercent: number;
  ptr?: number;
  gstPercent?: number;
  netRate?: number;
  savings?: number;
}> {
  const { data } = await api.get(`/products/${productId}/discount`);
  return data.data ?? data;
}
