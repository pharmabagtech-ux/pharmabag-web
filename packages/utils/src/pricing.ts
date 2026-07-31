// ─── PharmaBag Centralized Pricing Engine ──────────────
// All pricing calculations are done here. NO pricing logic in frontend components.
// Matches legacy PHP/Node system with bug fixes noted inline.

// ─── GST to Retail Margin Mapping ────────────────────
// Legacy: {0: 18.12, 5: 23.81, 12: 28.57, 18: 32.20}
// BUG FIX: GST 12% margin was 28.57 in legacy — corrected to 28.67

const GST_RETAIL_MARGIN_MAP: Record<number, number> = {
  0: 18.12,
  5: 23.81,
  12: 28.67, // Fixed from legacy 28.57
  18: 32.20,
};

export const VALID_GST_PERCENTAGES = [0, 5, 12, 18] as const;
export type ValidGST = (typeof VALID_GST_PERCENTAGES)[number];

/** Get the retail margin percentage for a given GST percentage */
export function getRetailMarginPercent(gstPercent: number): number {
  const margin = GST_RETAIL_MARGIN_MAP[gstPercent];
  if (margin === undefined) {
    throw new Error(`Invalid GST percentage: ${gstPercent}. Must be one of ${VALID_GST_PERCENTAGES.join(', ')}`);
  }
  return margin;
}

/** Calculate PTR from MRP and GST percentage.
 *  PTR = MRP - (MRP × RetailMargin / 100)
 */
export function calculatePTR(mrp: number, gstPercent: number): number {
  const retailMargin = getRetailMarginPercent(gstPercent);
  return round2(mrp - (mrp * retailMargin / 100));
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Discount Types ─────────────────────────────────
// 6 types matching legacy system exactly

export type PricingDiscountType =
  | 'ptr_discount'                                     // Type 1: PTR discount only
  | 'same_product_bonus'                               // Type 2: Same product bonus (buy X get Y same)
  | 'ptr_discount_and_same_product_bonus'              // Type 3: PTR discount + same product bonus
  | 'different_product_bonus'                          // Type 4: Different product bonus
  | 'ptr_discount_and_different_product_bonus'         // Type 5: PTR discount + different product bonus
  | 'special_price';                                   // Type 6: Special/fixed price

export interface DiscountFormInput {
  type: PricingDiscountType;
  /** PTR discount percentage (for types 1, 3, 5) */
  discountPercent?: number;
  /** Buy quantity (for types 2, 3, 4, 5) */
  buy?: number;
  /** Get quantity (for types 2, 3, 4, 5) */
  get?: number;
  /** Bonus product name (for types 4, 5 — different product) */
  bonusProductName?: string;
  /** Special/fixed price (for type 6) */
  specialPrice?: number;
}

export interface PricingOutput {
  /** MRP entered by seller */
  mrp: number;
  /** GST percentage */
  gstPercent: number;
  /** Retail margin percentage from GST map */
  retailMarginPercent: number;
  /** Base PTR = MRP - (MRP × retailMargin / 100) */
  ptr: number;
  /** Final PTR after any PTR discount */
  finalPtr: number;
  /** PTR discount percentage applied (0 if none) */
  discountPercent: number;
  /** PTR discount absolute value = ptr × discountPercent / 100 */
  discountValue: number;
  /** GST value = finalPtr × gstPercent / 100 */
  gstValue: number;
  /** Per unit PTR including GST = finalPtr + gstValue */
  perPtrWithGst: number;
  /** Items to pay for (buy quantity — NOT buy+get) */
  itemsToPayFor: number;
  /** Total units received (buy + get for same product bonus, else buy) */
  totalUnits: number;
  /** Final user buy price = perPtrWithGst × itemsToPayFor */
  finalUserBuy: number;
  /** Final order value = same as finalUserBuy */
  finalOrderValue: number;
  /**
   * What the buyer actually pays for one unit, free goods included:
   * finalUserBuy / totalUnits. perPtrWithGst is the rate per PAID unit, so on a
   * buy-7-get-5 the buyer pays for 7 but carries away 12 and the real rate is
   * far lower. This is the figure the API charges (calculateNetUnitPrice
   * applies the same bonus fraction), so it is the one to price minimums and
   * order values off.
   */
  effectivePerUnit: number;
  /** Buy quantity */
  buy: number;
  /** Get (bonus) quantity */
  get: number;
  /** Bonus product name (for different product bonus) */
  bonusProductName: string;
  /** The discount type used */
  discountType: PricingDiscountType;
}

/**
 * Main pricing calculation function.
 * All 6 discount types handled with legacy-accurate formulas.
 * Bug fixes applied (see inline comments).
 */
export function calculatePricing(
  mrp: number,
  gstPercent: number,
  discountInput: DiscountFormInput,
): PricingOutput {
  const retailMarginPercent = getRetailMarginPercent(gstPercent);
  const ptr = calculatePTR(mrp, gstPercent);
  const type = discountInput.type;

  let finalPtr: number;
  let discountPercent = 0;
  let buy = discountInput.buy ?? 1;
  let get = discountInput.get ?? 0;
  let bonusProductName = discountInput.bonusProductName ?? '';

  switch (type) {
    case 'ptr_discount': {
      // Type 1: PTR discount only — no bonus
      discountPercent = discountInput.discountPercent ?? 0;
      finalPtr = round2(ptr - (ptr * discountPercent / 100));
      get = 0;
      break;
    }

    case 'same_product_bonus': {
      // Type 2: Same product bonus — no PTR discount
      // BUG FIX: Legacy used `userBuy = buy + get` — WRONG. itemsToPayFor = buy only.
      finalPtr = ptr;
      discountPercent = 0;
      break;
    }

    case 'ptr_discount_and_same_product_bonus': {
      // Type 3: PTR discount + same product bonus
      discountPercent = discountInput.discountPercent ?? 0;
      finalPtr = round2(ptr - (ptr * discountPercent / 100));
      break;
    }

    case 'different_product_bonus': {
      // Type 4: Different product bonus — no PTR discount
      finalPtr = ptr;
      discountPercent = 0;
      bonusProductName = discountInput.bonusProductName ?? '';
      break;
    }

    case 'ptr_discount_and_different_product_bonus': {
      // Type 5: PTR discount + different product bonus
      discountPercent = discountInput.discountPercent ?? 0;
      finalPtr = round2(ptr - (ptr * discountPercent / 100));
      bonusProductName = discountInput.bonusProductName ?? '';
      break;
    }

    case 'special_price': {
      // Type 6: Special/fixed price — overrides PTR completely
      finalPtr = discountInput.specialPrice ?? ptr;
      discountPercent = 0;
      get = 0;
      break;
    }

    default: {
      finalPtr = ptr;
    }
  }

  const discountValue = round2(ptr * discountPercent / 100);
  const gstValue = round2(finalPtr * gstPercent / 100);
  const perPtrWithGst = round2(finalPtr + gstValue);

  // itemsToPayFor = buy (NEVER buy + get — legacy bug fixed)
  const itemsToPayFor = buy;
  const finalUserBuy = round2(perPtrWithGst * itemsToPayFor);
  const finalOrderValue = finalUserBuy;

  // totalUnits calculation
  const totalUnits = (type === 'same_product_bonus' || type === 'ptr_discount_and_same_product_bonus')
    ? (buy + get)
    : buy;

  // Spread the bill across everything the buyer receives, not only what they
  // are billed for. Mirrors the API's net unit price to the paisa.
  const effectivePerUnit = totalUnits > 0
    ? round2(finalUserBuy / totalUnits)
    : perPtrWithGst;

  return {
    mrp,
    gstPercent,
    retailMarginPercent,
    ptr,
    finalPtr,
    discountPercent,
    discountValue,
    gstValue,
    perPtrWithGst,
    effectivePerUnit,
    itemsToPayFor,
    totalUnits,
    finalUserBuy,
    finalOrderValue,
    buy,
    get,
    bonusProductName,
    discountType: type,
  };
}


// ─── Helpers ────────────────────────────────────────

/** Format a pricing output into a human-readable summary for display */
export function formatPricingSummary(p: PricingOutput): string {
  const lines = [
    `MRP: ₹${p.mrp}`,
    `GST: ${p.gstPercent}% (Retail Margin: ${p.retailMarginPercent}%)`,
    `PTR: ₹${p.ptr}`,
  ];

  if (p.discountPercent > 0) {
    lines.push(`PTR Discount: ${p.discountPercent}% (₹${p.discountValue})`);
  }

  lines.push(`Final PTR: ₹${p.finalPtr}`);
  lines.push(`GST Value: ₹${p.gstValue}`);
  lines.push(`Price per unit (incl. GST): ₹${p.perPtrWithGst}`);

  if (p.get > 0) {
    lines.push(`Buy ${p.buy} Get ${p.get} (${p.bonusProductName || 'same product'})`);
  }

  lines.push(`Items to Pay For: ${p.itemsToPayFor}`);
  lines.push(`Final Order Value: ₹${p.finalOrderValue}`);

  return lines.join('\n');
}

/** Check if a discount type requires a PTR discount percentage */
export function requiresDiscountPercent(type: PricingDiscountType): boolean {
  return type === 'ptr_discount'
    || type === 'ptr_discount_and_same_product_bonus'
    || type === 'ptr_discount_and_different_product_bonus';
}

/** Check if a discount type involves a bonus (buy/get) */
export function requiresBuyGet(type: PricingDiscountType): boolean {
  return type === 'same_product_bonus'
    || type === 'ptr_discount_and_same_product_bonus'
    || type === 'different_product_bonus'
    || type === 'ptr_discount_and_different_product_bonus';
}

/** Check if a discount type involves a different product bonus */
export function requiresBonusProductName(type: PricingDiscountType): boolean {
  return type === 'different_product_bonus'
    || type === 'ptr_discount_and_different_product_bonus';
}

/** Check if this is a special price type */
export function isSpecialPriceType(type: PricingDiscountType): boolean {
  return type === 'special_price';
}

/** Get effective selling price for buyer display (per-unit final PTR incl GST) */
export function getSellingPrice(p: PricingOutput): number {
  return p.perPtrWithGst;
}

/** Calculate effective discount percentage for display tag */
export function getEffectiveDiscountPercent(mrp: number, sellingPrice: number): number {
  if (mrp <= 0 || sellingPrice <= 0 || sellingPrice >= mrp) return 0;
  const pct = round2(((mrp - sellingPrice) / mrp) * 100);
  return pct > 0 && pct < 100 ? pct : 0;
}
