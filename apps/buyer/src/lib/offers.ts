/**
 * Formats a seller's discount scheme into the short tag the storefront shows
 * (e.g. "10% Off (20+2 3-Nite Vag Capsule)").
 *
 * This logic already existed inline on the product detail page but only ever
 * ran for the top-level product, so the Marketplace Offers rows — which are
 * per-seller listings, each with its own scheme — showed nothing but a bare
 * percentage. Extracted here so both use exactly the same wording.
 */

export type DiscountMeta = {
  discountPercent?: number;
  buy?: number;
  get?: number;
  bonusProductName?: string;
  tag?: string;
};

export function formatSchemeTag(
  discountType?: string | null,
  meta?: DiscountMeta | null,
): string {
  if (!discountType) return '';

  const d = meta ?? {};
  const percent = d.discountPercent ?? 0;
  const buy = d.buy ?? 0;
  const get = d.get ?? 0;
  const bonus = d.bonusProductName || '';

  const offPart = `${percent}% Off`;
  const bonusPart = `(${buy}+${get}${bonus ? ` ${bonus}` : ''})`;

  switch (discountType) {
    case 'PTR_DISCOUNT':
      return percent > 0 ? offPart : '';

    case 'SAME_PRODUCT_BONUS':
      return get > 0 ? `(${buy}+${get}) Free` : '';

    case 'PTR_PLUS_SAME_PRODUCT_BONUS':
      if (percent > 0 && get > 0) return `${offPart} (${buy}+${get})`;
      if (percent > 0) return offPart;
      if (get > 0) return `(${buy}+${get}) Free`;
      return '';

    case 'DIFFERENT_PRODUCT_BONUS':
      return get > 0 ? `${bonusPart} Free` : '';

    case 'PTR_PLUS_DIFFERENT_PRODUCT_BONUS':
      if (percent > 0 && get > 0) return `${offPart} ${bonusPart}`;
      if (percent > 0) return offPart;
      if (get > 0) return `${bonusPart} Free`;
      return '';

    case 'SPECIAL_PRICE':
      return 'Special Price';

    default:
      return '';
  }
}
