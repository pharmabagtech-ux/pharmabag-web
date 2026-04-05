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

export type ProductStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SellerProfile {
  verificationStatus?: string;
  businessName?: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  drugLicenseUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'buyer' | 'seller' | 'admin';
  permissions?: string;
  status: ApprovalStatus;
  sellerProfile?: SellerProfile;
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
  isActive?: boolean;
  status?: ProductStatus;
  approvalStatus?: ProductStatus;
  rejectionReason?: string;
  category?: string;
  genericName?: string;
  gst?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
  /** Seller form input for discount */
  discountFormDetails?: DiscountFormDetails;
  /** Computed pricing/discount output */
  discountDetails?: DiscountDetails;
  /** Structured extra fields */
  extraFields?: ExtraField[];
  /** PTR (computed from pricing engine) */
  ptr?: number;
  /** Final selling price per unit incl GST */
  sellingPrice?: number;
  /** Backend discount type enumeration */
  discountType?: string;
  /** Backend discount raw properties array */
  discountMeta?: {
    discountPercent?: number;
    buy?: number;
    get?: number;
    bonusProductName?: string;
    specialPrice?: number;
    tag?: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  name?: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  total?: number;
  totalPrice?: number;
  image?: string;
  product?: Product;
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
  orderStatus?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  subtotal?: number;
  tax?: number;
  deliveryCharge?: number;
  total?: number;
  amount?: number;
  totalAmount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  shippingAddress?: string | any;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
  updatedAt?: string;
  cancelReason?: string;
  buyer?: any;
  seller?: any;
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
  | "ptr_discount_and_different_product_bonus"
  | "special_price";

/** What the seller fills in the form (input) */
export type DiscountFormDetails = {
  type: DiscountType;
  discountPercent?: number;
  buy?: number;
  get?: number;
  bonusProductName?: string;
  specialPrice?: number;
};

/** Computed pricing output stored on the product (output) */
export type DiscountDetails = {
  type: DiscountType;
  discountPercent?: number;
  buy?: number;
  get?: number;
  bonusProductName?: string;
  specialPrice?: number;
  /** Computed fields from pricing engine */
  ptr?: number;
  finalPtr?: number;
  discountValue?: number;
  gstValue?: number;
  perPtrWithGst?: number;
  itemsToPayFor?: number;
  finalUserBuy?: number;
  finalOrderValue?: number;
  retailMarginPercent?: number;
};

/** Suggestion / catalog item returned from search */
export interface Suggestion {
  id: string;
  productName: string;
  companyName: string;
  chemicalCombination?: string;
  category?: string;
  subCategory?: string;
  categoryId?: string;
  subCategoryId?: string;
  gstPercent?: number;
  mrp?: number;
  images?: string[] | { url: string }[];
  description?: string;
}


/** Category with optional subcategories */
export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  productCount?: number;
  subcategories?: SubCategoryItem[];
}

export interface SubCategoryItem {
  id: string;
  name: string;
  categoryId: string;
  slug?: string;
  productCount?: number;
}

/** Extra field on a product (key-value pair) */
export interface ExtraField {
  key: string;
  value: string;
}

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
  gst_percent: number;
  bulk: boolean;
  image_list: string[];
  extra_fields: ExtraField[] | Record<string, string>;
  discount_form_details: DiscountFormDetails;
  discount_details?: DiscountDetails;
};
