// ─── Shared Types ───────────────────────────────────────

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'placed'
  | 'accepted'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'completed';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'BLOCKED'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blocked';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'buyer' | 'seller' | 'admin';
  status: ApprovalStatus;
  avatar?: string;
  businessName?: string;
  storeName?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isOnVacation?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  categoryId?: string;
  subCategoryId?: string;
  manufacturer?: string;
  chemicalComposition?: string;
  images?: string[];
  stock?: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  gstPercent?: number;
  expiryDate?: string;
  sellerId?: string;
  sellerName?: string;
  discount?: number;
  isEnabled?: boolean;
  approvalStatus?: ApprovalStatus;
  category?: string;
  genericName?: string;
  gst?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  price: number;
  quantity: number;
  total?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  buyerId?: string;
  buyerName?: string;
  buyerBusiness?: string;
  sellerId?: string;
  sellerName?: string;
  status: OrderStatus;
  items?: OrderItem[];
  subtotal?: number;
  tax?: number;
  deliveryCharge?: number;
  total?: number;
  amount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Payout {
  id: string;
  sellerId?: string;
  sellerName?: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REJECTED' | 'pending' | 'paid' | 'rejected' | 'completed' | 'processing' | 'failed';
  method?: string;
  reference?: string;
  bankAccount?: string;
  utr?: string;
  initiatedAt?: string;
  createdAt: string;
  paidAt?: string;
}

export type DiscountType =
  | "ptr_discount"
  | "same_product_bonus"
  | "ptr_discount_and_same_product_bonus"
  | "different_product_bonus"
  | "different_ptr_discount_and_same_product_bonus";

export type DiscountDetails = {
  type: DiscountType;
  discountPercent?: number;
  buy?: number;
  get?: number;
};

export type ProductPayload = {
  product_name: string;
  product_price: number;
  company_name: string;
  chemical_combination?: string;
  categories: string[];
  sub_categories?: string[];
  stock: number;
  min_order_qty: number;
  max_order_qty: number;
  expire_date: string;
  bulk: boolean;
  image_list: string[];
  extra_fields: Record<string, string>;
  discount_details: DiscountDetails;
};
