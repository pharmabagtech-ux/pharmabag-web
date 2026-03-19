import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string().optional(),
  name: z.string().optional(),
  price: z.number(),
  quantity: z.number(),
  total: z.number().optional(),
  image: z.string().optional(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    mrp: z.number().optional(),
    images: z.array(z.string()).optional(),
    manufacturer: z.string().optional(),
  }).optional(),
});

export const CartSchema = z.object({
  id: z.string().optional(),
  items: z.array(CartItemSchema),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  itemCount: z.number().optional(),
});

// ─── Types ──────────────────────────────────────────

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// ─── API Functions ──────────────────────────────────

export async function getCart(): Promise<Cart> {
  const { data } = await api.get('/cart');
  return data;
}

export async function addToCart(productId: string, quantity: number = 1): Promise<Cart> {
  const { data } = await api.post('/cart/add', { productId, quantity });
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await api.patch(`/cart/item/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete(`/cart/item/${itemId}`);
  return data;
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart');
}
