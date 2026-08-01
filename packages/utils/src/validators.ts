import { z } from 'zod';
import { VALID_GST_PERCENTAGES, calculatePricing } from './pricing';

/**
 * Validate an Indian phone number (10 digits, optionally prefixed with +91).
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Validate an email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a 6-digit OTP.
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Validate a pincode (6 digits for Indian pincodes).
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

/**
 * Validate a GST number.
 */
export function isValidGST(gst: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gst);
}

/**
 * Validate a PAN number.
 */
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
}

// ─── Zod Schemas ────────────────────────────────────

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .refine(isValidPhone, 'Invalid phone number');

export const emailSchema = z.string().email('Invalid email address');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .refine(isValidOtp, 'OTP must contain only digits');

export const pincodeSchema = z
  .string()
  .length(6, 'Pincode must be 6 digits')
  .refine(isValidPincode, 'Invalid pincode');

export const gstSchema = z
  .string()
  .length(15, 'GST must be 15 characters')
  .refine(isValidGST, 'Invalid GST number');

export const panSchema = z
  .string()
  .length(10, 'PAN must be 10 characters')
  .refine(isValidPAN, 'Invalid PAN number');

// ─── Product Validation ────────────────────────────

const validGstValues = VALID_GST_PERCENTAGES as readonly number[];

export const discountFormDetailsSchema = z.object({
  type: z.enum([
    'ptr_discount',
    'same_product_bonus',
    'ptr_discount_and_same_product_bonus',
    'different_product_bonus',
    'ptr_discount_and_different_product_bonus',
    'special_price',
  ]),
  discountPercent: z.number().min(0).max(100).optional(),
  buy: z.number().int().min(1).optional(),
  get: z.number().int().min(1).optional(),
  bonusProductName: z.string().optional(),
  specialPrice: z.number().min(0).optional(),
});

export const MIN_ORDER_VALUE = 20000;

/**
 * The smallest order the 20,000 rule allows, in units.
 *
 * Must agree with the seller product form to the unit, or the form offers a
 * quantity its own validator then rejects. Two things it has to honour: the
 * buyer's real rate per unit received (free goods included, NOT the rate per
 * billed unit), and whole scheme lots.
 */
export function minimumOrderQuantity(
  mrp: number,
  gstPercent: number,
  discount?: { type?: string; discountPercent?: number; buy?: number; get?: number; specialPrice?: number },
  minOrderValue: number = MIN_ORDER_VALUE,
): number {
  if (!mrp || mrp <= 0) return 0;

  let perUnit = mrp;
  if (VALID_GST_PERCENTAGES.includes(gstPercent as any)) {
    try {
      perUnit = calculatePricing(mrp, gstPercent, {
        type: (discount?.type as any) ?? 'ptr_discount',
        discountPercent: discount?.discountPercent,
        buy: discount?.buy,
        get: discount?.get,
        specialPrice: discount?.specialPrice,
      }).effectivePerUnit;
    } catch {
      perUnit = mrp;
    }
  }
  if (!perUnit || perUnit <= 0) perUnit = mrp;

  const raw = Math.ceil(minOrderValue / perUnit);
  const lot = (discount?.get ?? 0) > 0 ? (discount?.buy ?? 0) : 0;
  return lot > 1 ? Math.ceil(raw / lot) * lot : raw;
}

export const productFormSchema = z.object({
  sku: z.string().optional(),
  product_name: z.string().min(2, 'Product name must be at least 2 characters'),
  product_price: z.number().min(0.01, 'MRP must be greater than 0'),
  company_name: z.string().min(2, 'Company name is required'),
  chemical_combination: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  sub_categories: z.array(z.string()).optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  min_order_qty: z.number().int().min(1, 'Minimum 1 required'),
  max_order_qty: z.number().int().min(1, 'Minimum 1 required'),
  expire_date: z.string().refine((val) => {
    if (!val) return false;
    // Set selected date to the 1st of the month
    const parts = val.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    
    // Set comparison date to the 1st of the current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return date >= currentMonthStart;
  }, {
    message: 'Expiry date must be current month or later',
  }),
  gst_percent: z.number().refine((val) => validGstValues.includes(val), {
    message: `GST must be one of: ${VALID_GST_PERCENTAGES.join(', ')}%`,
  }),
  image_list: z.array(z.string()).optional().default([]),
  custom_extra_fields: z.array(z.object({ key: z.string().min(1), value: z.string().min(1) })),
  discount_form_details: discountFormDetailsSchema,
}).refine((data) => data.min_order_qty <= data.max_order_qty, {
  message: 'Max order qty must be >= min order qty',
  path: ['max_order_qty'],
}).refine((data) => data.stock >= data.min_order_qty, {
  message: 'Current stock must be at least equal to minimum order quantity',
  path: ['stock'],
}).refine((data) => data.min_order_qty <= data.stock, {
  message: 'Minimum order quantity cannot exceed current stock',
  path: ['min_order_qty'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Types that require discount percent
  if (['ptr_discount', 'ptr_discount_and_same_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (d.discountPercent === undefined || d.discountPercent <= 0) return false;
  }
  return true;
}, {
  message: 'PTR discount percentage is required for this discount type',
  path: ['discount_form_details', 'discountPercent'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Types that require buy/get
  if (['same_product_bonus', 'ptr_discount_and_same_product_bonus', 'different_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (!d.buy || d.buy < 1 || !d.get || d.get < 1) return false;
  }
  return true;
}, {
  message: 'Buy and Get quantities are required for bonus discount types',
  path: ['discount_form_details', 'buy'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Different product bonus requires product name
  if (['different_product_bonus', 'ptr_discount_and_different_product_bonus'].includes(d.type)) {
    if (!d.bonusProductName || d.bonusProductName.trim().length === 0) return false;
  }
  return true;
}, {
  message: 'Bonus product name is required for different product bonus',
  path: ['discount_form_details', 'bonusProductName'],
}).refine((data) => {
  const d = data.discount_form_details;
  // Special price requires the price value
  if (d.type === 'special_price') {
    if (d.specialPrice === undefined || d.specialPrice <= 0) return false;
  }
  return true;
}, {
  message: 'Special price is required',
  path: ['discount_form_details', 'specialPrice'],
}).refine((data) => {
  const d = data.discount_form_details;
  // A fixed price at or above the MRP is not a price, it is an overcharge:
  // 900 against a 700 MRP bills the buyer 1,008 once GST is added.
  if (d.type === 'special_price' && typeof d.specialPrice === 'number' && data.product_price > 0) {
    if (d.specialPrice >= data.product_price) return false;
  }
  return true;
}, (data) => ({
  message: `Special price must be lower than the MRP of ₹${data.product_price}.`,
  path: ['discount_form_details', 'specialPrice'],
})).refine((data) => {
  // 20,000 minimum order VALUE, priced off what the buyer actually pays.
  const minRequiredMoq = minimumOrderQuantity(data.product_price, data.gst_percent, data.discount_form_details);
  return minRequiredMoq === 0 || data.min_order_qty >= minRequiredMoq;
}, (data) => ({
  message: `Minimum order quantity must be at least ${minimumOrderQuantity(data.product_price, data.gst_percent, data.discount_form_details)} to meet the ₹${MIN_ORDER_VALUE.toLocaleString('en-IN')} requirement.`,
  path: ['min_order_qty'],
})).refine((data) => {
  // Stock has to be able to satisfy one minimum order.
  const minRequiredMoq = minimumOrderQuantity(data.product_price, data.gst_percent, data.discount_form_details);
  return minRequiredMoq === 0 || data.stock >= minRequiredMoq;
}, (data) => ({
  message: `Current stock must be at least ${minimumOrderQuantity(data.product_price, data.gst_percent, data.discount_form_details)} units to meet the ₹${MIN_ORDER_VALUE.toLocaleString('en-IN')} requirement.`,
  path: ['stock'],
}));

export type ProductFormValues = z.infer<typeof productFormSchema>;
