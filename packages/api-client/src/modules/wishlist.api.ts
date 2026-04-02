import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const WishlistItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    mrp: z.number().optional(),
    images: z.array(z.string()).optional(),
    manufacturer: z.string().optional(),
    stock: z.number().optional(),
  }).optional(),
  createdAt: z.string().optional(),
});

export const WishlistSchema = z.object({
  items: z.array(WishlistItemSchema),
  total: z.number().optional(),
});

// ─── Types ──────────────────────────────────────────

export type WishlistItem = z.infer<typeof WishlistItemSchema>;
export type Wishlist = z.infer<typeof WishlistSchema>;

// ─── Response Mapping ───────────────────────────────

function mapBackendWishlist(responseData: any): Wishlist {
  const payload = responseData?.data ?? responseData;
  
  // The backend might return an array directly, or an object with `items` array
  const rawItems = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
  
  const items = rawItems.map((raw: any) => {
    // If the backend returns product nested inside or just flattened, we normalize it here
    const product = raw.product || {};
    return {
      id: raw.id || (product.id ? `wishlist-item-${product.id}` : Math.random().toString()),
      productId: raw.productId || product.id || raw.id,
      product: {
        id: product.id || raw.productId || raw.id,
        name: product.name || raw.name,
        price: product.price ?? raw.price ?? 0,
        mrp: product.mrp ?? raw.mrp,
        images: Array.isArray(product.images) ? product.images : (raw.image ? [raw.image] : []),
        manufacturer: product.manufacturer || raw.manufacturer,
        stock: product.stock ?? raw.stock,
      },
      createdAt: raw.createdAt,
    };
  });

  return {
    items,
    total: payload?.total || items.length,
  };
}

// ─── API Functions ──────────────────────────────────

export async function getWishlist(): Promise<Wishlist> {
  try {
    const { data } = await api.get('/wishlist');
    return mapBackendWishlist(data);
  } catch (err) {
    console.error('[Wishlist] Error fetching wishlist:', err);
    return { items: [], total: 0 };
  }
}

export async function addToWishlist(productId: string): Promise<WishlistItem> {
  const { data } = await api.post('/wishlist', { productId });
  // Backend returns success message. We return a simplified item to satisfy types for now
  // The hook refetches the full list anyway.
  const payload = data?.data ?? data;
  return {
    id: payload?.id || "temp-id",
    productId: productId
  };
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await api.delete(`/wishlist/${productId}`);
}
