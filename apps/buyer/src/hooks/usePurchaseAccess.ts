'use client';

import { useMemo } from 'react';
import { useAuth } from '@pharmabag/api-client';
import { useAddToCart } from './useCart';
import { useToast } from '@/components/shared/Toast';

/**
 * Only BUYER accounts can hold a cart or place an order — the API gates
 * /cart and /orders with @Roles(Role.BUYER), and User.role is a single value,
 * so a seller or admin signed into the storefront cannot purchase.
 *
 * Without this check the storefront still offered "Add to Bag" and "Checkout",
 * and the block only surfaced as a raw 403 ("You do not have permission to
 * access this resource") once the cart tried to sync at checkout.
 *
 * Guests are deliberately allowed through: they build a local cart and are
 * prompted to sign in at checkout, which is the existing intended flow.
 */
export function usePurchaseAccess() {
  const { user, isAuthenticated } = useAuth();

  const role = (user as any)?.role as
    | 'BUYER'
    | 'SELLER'
    | 'ADMIN'
    | undefined;

  const canPurchase = !isAuthenticated || !role || role === 'BUYER';

  let reason = '';
  if (!canPurchase) {
    reason =
      role === 'SELLER'
        ? 'You are signed in as a seller. Switch to a buyer account to place an order.'
        : 'You are signed in as an admin account. Switch to a buyer account to place an order.';
  }

  return { canPurchase, role, reason };
}

/**
 * Drop-in replacement for useAddToCart that explains the block instead of
 * letting a seller/admin fill a bag they can never check out.
 */
export function useGuardedAddToCart() {
  const addToCart = useAddToCart();
  const { canPurchase, reason } = usePurchaseAccess();
  const { toast } = useToast();

  return useMemo(
    () => ({
      ...addToCart,
      mutate: (variables: any, options?: any) => {
        if (!canPurchase) {
          toast(reason, 'error');
          return;
        }
        return addToCart.mutate(variables, options);
      },
      mutateAsync: async (variables: any, options?: any) => {
        if (!canPurchase) {
          toast(reason, 'error');
          throw new Error(reason);
        }
        return addToCart.mutateAsync(variables, options);
      },
    }),
    [addToCart, canPurchase, reason, toast],
  );
}
