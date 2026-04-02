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
  minimumOrderQuantity: z.number().optional(),
  moq: z.number().optional(),
  maximumOrderQuantity: z.number().optional(),
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

export const SubCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  categoryId: z.string(),
  productCount: z.number().optional(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  productCount: z.number().optional(),
  subCategories: z.array(SubCategorySchema).optional(),
});

export type SubCategory = z.infer<typeof SubCategorySchema>;
export type Category = z.infer<typeof CategorySchema>;

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
  city?: string;
}): Promise<ProductListResponse> {
  try {
    const { data } = await api.get('/products', { params });
    const payload = data?.data ?? data;
    const products = Array.isArray(payload?.products) ? payload.products : (Array.isArray(payload) ? payload : []);
    const meta = payload?.meta ?? (data?.meta ?? {});
    
    return {
      data: products,
      total: meta?.total ?? products.length,
      page: meta?.page ?? params?.page ?? 1,
      limit: meta?.limit ?? params?.limit ?? 24,
    };
  } catch (err) {
    console.warn('[Products] Failed to fetch products:', (err as any)?.response?.status, (err as any)?.message);
    // Return empty products on error - this is a read-only endpoint
    return {
      data: [],
      total: 0,
      page: params?.page ?? 1,
      limit: params?.limit ?? 24,
    };
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  } catch (err) {
    console.warn('[Product] Failed to fetch product:', id, (err as any)?.response?.status);
    throw err; // Re-throw for product detail pages so they can handle the error appropriately
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await api.get('/products/categories');
    
    // Most robust way to find the array:
    const payload = data?.data ?? (Array.isArray(data) ? data : data?.categories);
    
    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    console.warn('[Categories] Failed to fetch categories:', (err as any)?.response?.status, (err as any)?.message);
    return [];
  }
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

// ─── Extended Product APIs ──────────────────────────

export async function getManufacturers(): Promise<{ id: string; name: string; productCount?: number }[]> {
  try {
    const { data } = await api.get('/products/manufacturers');
    const payload = data?.data ?? data;
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.manufacturers) ? payload.manufacturers : []);
  } catch (err) {
    console.warn('[Manufacturers] Failed to fetch manufacturers:', (err as any)?.response?.status, (err as any)?.message);
    return [];
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
    const payload = data?.data ?? data;
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.cities) ? payload.categories : []);
  } catch (err) {
    console.warn('[Cities] Failed to fetch cities:', (err as any)?.response?.status, (err as any)?.message);
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
  try {
    const { data } = await api.get(`/products/${productId}/discount`);
    return data.data ?? data;
  } catch (err) {
    console.warn('[Discount] Failed to fetch discount details for product:', productId, (err as any)?.response?.status);
    // Return default discount details on error
    return {
      discountType: 'none',
      discountPercent: 0,
    };
  }
}
