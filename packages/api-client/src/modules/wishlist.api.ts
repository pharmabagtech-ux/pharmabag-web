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

// ─── API Functions ──────────────────────────────────

export async function getWishlist(): Promise<Wishlist> {
  const { data } = await api.get('/wishlist');
  return data;
}

export async function addToWishlist(productId: string): Promise<WishlistItem> {
  const { data } = await api.post('/wishlist', { productId });
  return data;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await api.delete(`/wishlist/${productId}`);
}
