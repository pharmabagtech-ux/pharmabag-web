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
