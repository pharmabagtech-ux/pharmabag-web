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

  /**
   * Line figures are EXACT — no rounding.
   *
   * Two reasons, and the second one is a real defect this fixes:
   *
   * 1. Rounding here hid the true figure from the buyer. 332 x 57.47 is
   *    19,080.04, and the bag displayed 19,080.00 — a number that is not the
   *    arithmetic it sits underneath, on a page whose whole job is showing the
   *    derivation.
   *
   * 2. `OrdersService.checkout` accumulates every line RAW and rounds the cart
   *    subtotal and GST ONCE at the end. Rounding per line here meant the bag
   *    and the server could reach different totals: two lines each ending .4
   *    round down individually (losing 0.8) while their raw sum ends .8 and
   *    rounds up. The cart-level rounding in `priceCart` is what mirrors the
   *    server, so that is the only place it belongs.
   */
  const lineSubtotal = unitPrice * quantity;
  const gstAmount = lineSubtotal * (gstPercent / 100);

  return {
    unitPrice,
    quantity,
    lineSubtotal,
    gstPercent,
    gstAmount,
    lineTotal: lineSubtotal + gstAmount,
  };
}

/**
 * Prices a whole cart the way the server will at checkout.
 * Shipping is order-level and belongs to no single line.
 *
 * The cart subtotal and GST ARE rounded here, and deliberately so: this is not
 * a presentational choice but a mirror of `OrdersService.checkout`, which sums
 * every line raw and then does exactly one `Math.round` on each of the two
 * totals. These figures are what the buyer is actually charged, so they must
 * match the server to the rupee — the line rows above are the derivation and
 * stay exact.
 */
export function priceCart(items: any[], config?: PricingConfig): PricedCart {
  const lines = (items ?? []).map((item) => priceLine(item, config));

  // Sum RAW, then round once — the order the server does it in.
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

/**
 * The minimum a buyer may actually order: the higher of what the seller stored
 * on the listing and what the minimum-order rule requires.
 *
 * Every surface that offers a quantity must use this one. The stored figure is
 * not trustworthy on its own — most listings were saved before the current
 * rules and ask for roughly half the floor — and the rule alone would ignore a
 * seller who deliberately set a higher minimum. The detail page and quick view
 * recomputed while the grid, wishlist and homepage strip passed the stored
 * value straight through, so the same product asked for 102 units on one screen
 * and 66 on another. Keep them all on this helper.
 */
export function effectiveMinQuantity(listing: any, minOrderValue: number): number {
  const stored = Number(listing?.moq) || Number(listing?.minimumOrderQuantity) || 1;
  return Math.max(stored, listingMinOrderQuantity(listing, minOrderValue));
}

/**
 * The step a quantity moves in for this listing.
 *
 * It is the BUY quantity, not buy + get: a 4+1 moves in fours, and the free
 * unit is not part of what the buyer is billed for. Same figure the minimum is
 * rounded to, so the two always agree.
 *
 * Returns 1 when there is no scheme, which makes every helper below behave
 * exactly as a plain stepper.
 */
export function listingLotSize(listing: any): number {
  const meta = listing?.discountMeta ?? {};
  const buy = Number(meta?.buy) || 0;
  const get = Number(meta?.get) || 0;
  return buy > 1 && get > 0 ? buy : 1;
}

/**
 * One step up or down, in whole lots.
 *
 * Returns 0 to mean "below the minimum, remove it", matching what the steppers
 * already do at the minimum, and returns the current quantity unchanged when a
 * step up would exceed stock.
 */
export function stepQuantityByLot(
  current: number,
  direction: 1 | -1,
  lot: number,
  minQty: number,
  stock: number,
): number {
  const next = current + direction * lot;
  if (next < minQty) return 0;
  if (next > stock) return current;
  return next;
}

/**
 * The nearest allowed quantity at or below what was typed.
 *
 * Allowed quantities are minQty, minQty + lot, minQty + 2 x lot and so on, and
 * since the minimum is itself a whole number of lots every one of them is a
 * multiple of the lot. Rounds down so a typed figure never quietly costs more
 * than it asked for, and steps back again if stock cannot cover the lot.
 */
export function snapQuantityToLot(
  desired: number,
  lot: number,
  minQty: number,
  stock: number,
): number {
  if (!Number.isFinite(desired) || desired <= 0 || desired < minQty) return 0;
  if (lot <= 1) return Math.min(desired, stock);

  const stepsWanted = Math.floor((desired - minQty) / lot);
  let qty = minQty + stepsWanted * lot;
  if (qty > stock) {
    const stepsThatFit = Math.floor((stock - minQty) / lot);
    qty = stepsThatFit >= 0 ? minQty + stepsThatFit * lot : 0;
  }
  return qty;
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
