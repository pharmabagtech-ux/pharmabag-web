/**
 * Single source of pricing arithmetic for the buyer app.
 *
 * The bag, the /cart page, the checkout page and the order page each used to
 * compute the total their own way — the bag omitted GST entirely, /cart applied
 * one flat rate to the whole subtotal, and only checkout used each item's own
 * gstPercent. The same bag therefore showed three different totals before the
 * order showed a fourth.
 *
 * This mirrors OrdersService.checkout in pharmabag-api, which is the authority
 * on what the buyer is actually charged: per-item GST from the product's own
 * gstPercent, then free shipping above a threshold.
 */

import { calculatePricing, formatSchemeQuantity, minimumOrderQuantity, VALID_GST_PERCENTAGES } from '@pharmabag/utils';

export const PRICING_DEFAULTS = {
  gstPercentFallback: 12,
  shippingThreshold: 5000,
  shippingFee: 250,
};

export type PricingConfig = {
  gst_rate?: number;
  shipping_threshold?: number;
  shipping_fee?: number;
};

export type PricedLine = {
  unitPrice: number;
  quantity: number;
  /** quantity x unitPrice, GST-exclusive */
  lineSubtotal: number;
  gstPercent: number;
  gstAmount: number;
  /** what this line contributes to the total, GST-inclusive */
  lineTotal: number;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotal: number;
  gstAmount: number;
  shipping: number;
  total: number;
};

/** Cart items carry `price`; order items carry `unitPrice`. */
export function readUnitPrice(item: any): number {
  return item?.product?.price ?? item?.price ?? item?.unitPrice ?? 0;
}

export function readGstPercent(item: any, fallback: number): number {
  return item?.product?.gstPercent ?? item?.gstPercent ?? fallback;
}

export function priceLine(item: any, config?: PricingConfig): PricedLine {
  const fallbackGst = config?.gst_rate ?? PRICING_DEFAULTS.gstPercentFallback;
  const unitPrice = readUnitPrice(item);
  const quantity = item?.quantity ?? 1;
  const gstPercent = readGstPercent(item, fallbackGst);

  const lineSubtotal = unitPrice * quantity;
  const gstAmount = Math.round(lineSubtotal * (gstPercent / 100));

  return {
    unitPrice,
    quantity,
    lineSubtotal: Math.round(lineSubtotal),
    gstPercent,
    gstAmount,
    lineTotal: Math.round(lineSubtotal) + gstAmount,
  };
}

/**
 * Prices a whole cart the way the server will at checkout.
 * Shipping is order-level and belongs to no single line.
 */
export function priceCart(items: any[], config?: PricingConfig): PricedCart {
  const lines = (items ?? []).map((item) => priceLine(item, config));

  const subtotal = Math.round(
    lines.reduce((sum, l) => sum + l.lineSubtotal, 0),
  );
  const gstAmount = Math.round(lines.reduce((sum, l) => sum + l.gstAmount, 0));

  const shippingThreshold =
    config?.shipping_threshold ?? PRICING_DEFAULTS.shippingThreshold;
  const shippingFee = config?.shipping_fee ?? PRICING_DEFAULTS.shippingFee;
  const shipping = subtotal > shippingThreshold ? 0 : shippingFee;

  return {
    lines,
    subtotal,
    gstAmount,
    shipping,
    total: subtotal + gstAmount + shipping,
  };
}

/**
 * The same figures the seller sees in their Pricing Preview, for the buyer:
 * PTR, the discount off it, the scheme, GST and the rate actually charged.
 *
 * The money is anchored to `line`, which comes from the server's own unit
 * price, so the breakdown can never disagree with the total. Only the
 * derivation above the net rate is recomputed here, and any of it that cannot
 * be worked out (a catalogue item with no seller, so no MRP and no GST slab)
 * is simply left out rather than guessed.
 */
export type PriceExplanation = {
  mrp: number | null;
  ptr: number | null;
  discountPercent: number;
  discountValue: number;
  finalPtr: number | null;
  scheme: string;
  /** ex-GST rate the buyer is charged per unit — free goods already applied */
  netRate: number;
  quantity: number;
  lineSubtotal: number;
  gstPercent: number;
  gstAmount: number;
  lineTotal: number;
};

const BACKEND_TO_FORM_TYPE: Record<string, string> = {
  PTR_DISCOUNT: 'ptr_discount',
  SAME_PRODUCT_BONUS: 'same_product_bonus',
  PTR_PLUS_SAME_PRODUCT_BONUS: 'ptr_discount_and_same_product_bonus',
  DIFFERENT_PRODUCT_BONUS: 'different_product_bonus',
  PTR_PLUS_DIFFERENT_PRODUCT_BONUS: 'ptr_discount_and_different_product_bonus',
  SPECIAL_PRICE: 'special_price',
};

/**
 * The GST-exclusive rate the buyer is charged for a raw listing: PTR, less the
 * discount, less the share of the order that arrives free.
 *
 * The storefront grid gets this figure from the API. The featured strip and the
 * wishlist get the listing itself and no price, so they work it out here, the
 * same way calculateNetUnitPrice does on the server. Falls back to the MRP when
 * it cannot be computed, as every other surface does.
 */
/**
 * The smallest quantity of this listing a buyer may order.
 *
 * Uses the shared rule, so the figure a buyer is shown is the one the seller
 * was shown when they set the listing up: priced on what the buyer actually
 * pays per unit, and rounded up to a whole scheme lot. A buy-9-get-1 whose raw
 * minimum is 31 asks for 36, four complete lots, not 31.
 */
export function listingMinOrderQuantity(listing: any, minOrderValue: number): number {
  const meta = listing?.discountMeta ?? {};
  return minimumOrderQuantity(
    Number(listing?.mrp) || 0,
    Number(listing?.gstPercent),
    {
      type: BACKEND_TO_FORM_TYPE[listing?.discountType ?? ''] ?? 'ptr_discount',
      discountPercent: meta?.discountPercent,
      buy: meta?.buy,
      get: meta?.get,
      specialPrice: meta?.specialPrice,
    },
    minOrderValue,
  );
}

export function listingNetRate(product: any): number {
  const mrp = Number(product?.mrp) || 0;
  const gst = Number(product?.gstPercent);
  if (!mrp) return 0;
  if (!VALID_GST_PERCENTAGES.includes(gst as any)) return mrp;

  try {
    const meta = product?.discountMeta ?? {};
    const p = calculatePricing(mrp, gst as any, {
      type: (BACKEND_TO_FORM_TYPE[product?.discountType ?? ''] ?? 'ptr_discount') as any,
      discountPercent: meta?.discountPercent,
      buy: meta?.buy,
      get: meta?.get,
      bonusProductName: meta?.bonusProductName,
      specialPrice: meta?.specialPrice,
    });
    const buy = Number(meta?.buy) || 0;
    const get = Number(meta?.get) || 0;
    const bonusFraction = buy > 0 && get > 0 ? get / (buy + get) : 0;
    return Math.round(p.finalPtr * (1 - bonusFraction) * 100) / 100;
  } catch {
    return mrp;
  }
}

export function explainLine(item: any, line: PricedLine): PriceExplanation {
  const mrpRaw = item?.mrp ?? item?.product?.mrp ?? null;
  const mrp = typeof mrpRaw === 'number' && mrpRaw > 0 ? mrpRaw : null;
  const discountType: string | undefined = item?.discountType ?? item?.product?.discountType;
  const meta = item?.discountMeta ?? item?.product?.discountMeta ?? {};

  let ptr: number | null = null;
  let finalPtr: number | null = null;
  let discountPercent = 0;
  let discountValue = 0;

  if (mrp !== null && VALID_GST_PERCENTAGES.includes(line.gstPercent as any)) {
    try {
      const p = calculatePricing(mrp, line.gstPercent as any, {
        type: (BACKEND_TO_FORM_TYPE[discountType ?? ''] ?? 'ptr_discount') as any,
        discountPercent: meta?.discountPercent,
        buy: meta?.buy,
        get: meta?.get,
        bonusProductName: meta?.bonusProductName,
        specialPrice: meta?.specialPrice,
      });
      ptr = p.ptr;
      finalPtr = p.finalPtr;
      discountPercent = p.discountPercent;
      discountValue = p.discountValue;
    } catch {
      // an unmapped slab must not take the bag down; the rows just do not show
    }
  }

  return {
    mrp,
    ptr,
    discountPercent,
    discountValue,
    finalPtr,
    scheme: formatSchemeQuantity(discountType, meta),
    netRate: line.unitPrice,
    quantity: line.quantity,
    lineSubtotal: line.lineSubtotal,
    gstPercent: line.gstPercent,
    gstAmount: line.gstAmount,
    lineTotal: line.lineTotal,
  };
}
