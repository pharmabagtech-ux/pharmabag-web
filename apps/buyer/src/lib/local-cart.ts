import { type Cart, type CartItem } from '@pharmabag/api-client';

const STORAGE_KEY = 'pharmabag_local_cart';

export const localCart = {
  get: (): Cart => {
    if (typeof window === 'undefined') return { items: [], subtotal: 0, total: 0 };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], subtotal: 0, total: 0 };
    try {
      const parsed = JSON.parse(stored);
      // Ensure it has everything needed by components — mapping total if missing
      return {
        ...parsed,
        subtotal: parsed.subtotal || 0,
        total: parsed.total || parsed.subtotal || 0,
      };
    } catch {
      return { items: [], subtotal: 0, total: 0 };
    }
  },

  set: (cart: Cart) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
  },

  addItem: (itemData: any, replace: boolean = false) => {
    const cart = localCart.get();
    const existingIndex = cart.items.findIndex(item => item.productId === itemData.productId);
    
    if (existingIndex > -1) {
      if (replace) {
        cart.items[existingIndex].quantity = itemData.quantity;
      } else {
        cart.items[existingIndex].quantity += itemData.quantity;
      }
    } else {
      cart.items.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...itemData
      });
    }
    
    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    cart.total = cart.subtotal;
    
    localCart.set(cart);
    return cart;
  },

  updateItem: (itemId: string, quantity: number) => {
    const cart = localCart.get();
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
      cart.total = cart.subtotal;
      localCart.set(cart);
    }
    return cart;
  },

  removeItem: (itemId: string) => {
    const cart = localCart.get();
    cart.items = cart.items.filter(i => i.id !== itemId);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    cart.total = cart.subtotal;
    localCart.set(cart);
    return cart;
  },

  clear: () => {
    localCart.set({ items: [], subtotal: 0, total: 0 });
  }
};
