import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const OrderItemSchema = z.object({
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
    images: z.array(z.string()).optional(),
  }).optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string().optional(),
  status: z.string(),
  items: z.array(OrderItemSchema).optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  deliveryCharge: z.number().optional(),
  total: z.number().optional(),
  amount: z.number().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const OrderListResponseSchema = z.object({
  data: z.array(OrderSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const CreateOrderSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
});

// ─── Types ──────────────────────────────────────────

export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ─── API Functions ──────────────────────────────────

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<OrderListResponse> {
  const { data } = await api.get('/orders', { params });
  return data;
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post('/orders', input);
  return data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/cancel`);
  return data;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data;
}
