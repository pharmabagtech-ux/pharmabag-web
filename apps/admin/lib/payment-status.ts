/**
 * How a payment status should be shown.
 *
 * The database stores PENDING | SUCCESS | FAILED | PARTIAL. Two screens tested
 * for `"PAID"` — a value the API has never sent — so a fully paid order fell
 * through to the failure branch and was rendered in red, while the orders list
 * showed the same order as paid. One order, two contradictory answers.
 *
 * Kept here so the next screen does not invent a third version.
 */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export function paymentBadge(status: unknown): { variant: BadgeVariant; label: string } {
  const value = String(status ?? '').toUpperCase();

  switch (value) {
    // "PAID" is accepted because older payloads and some admin screens used it.
    case 'SUCCESS':
    case 'PAID':
      return { variant: 'success', label: 'PAID' };
    case 'PARTIAL':
      return { variant: 'warning', label: 'PARTIAL' };
    case 'PENDING':
      return { variant: 'warning', label: 'PENDING' };
    case 'FAILED':
      return { variant: 'error', label: 'FAILED' };
    case '':
      return { variant: 'info', label: '—' };
    default:
      // Unknown is not the same as failed — say so rather than colouring it red.
      return { variant: 'info', label: value };
  }
}
