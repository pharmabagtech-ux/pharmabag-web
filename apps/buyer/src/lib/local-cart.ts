'use client';

export interface CartItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  price?: number;
  mrp?: number;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
}

const STORAGE_KEY = 'pharmabag_local_cart';

export const localCart = {
  get: (): Cart => {
    if (typeof window === 'undefined') return { items: [], totalAmount: 0 };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], totalAmount: 0 };
    try {
      return JSON.parse(stored);
    } catch {
      return { items: [], totalAmount: 0 };
    }
  },

  set: (cart: Cart) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
  },

  addItem: (itemData: Omit<CartItem, 'id'>) => {
    const cart = localCart.get();
    const existingIndex = cart.items.findIndex(item => item.productId === itemData.productId);
    
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += itemData.quantity;
    } else {
      cart.items.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...itemData
      });
    }
    
    localCart.set(cart);
    return cart;
  },

  updateItem: (itemId: string, quantity: number) => {
    const cart = localCart.get();
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      localCart.set(cart);
    }
    return cart;
  },

  removeItem: (itemId: string) => {
    const cart = localCart.get();
    cart.items = cart.items.filter(i => i.id !== itemId);
    localCart.set(cart);
    return cart;
  },

  clear: () => {
    localCart.set({ items: [], totalAmount: 0 });
  }
};
