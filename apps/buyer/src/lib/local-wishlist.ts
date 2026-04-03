import { type Wishlist, type WishlistItem } from '@pharmabag/api-client';

const STORAGE_KEY = 'pharmabag_local_wishlist';

export const localWishlist = {
  get: (): Wishlist => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [], total: 0 };
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        total: parsed.items?.length || 0,
      };
    } catch {
      return { items: [], total: 0 };
    }
  },

  set: (wishlist: Wishlist) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    window.dispatchEvent(new Event('storage'));
  },

  addItem: (productData: any) => {
    const list = localWishlist.get();
    const existingIndex = list.items.findIndex((item: any) => item.productId === productData.id);
    
    if (existingIndex > -1) {
      return list; // already exists
    } else {
      list.items.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: productData.id,
        product: productData,
        createdAt: new Date().toISOString()
      });
    }
    
    list.total = list.items.length;
    localWishlist.set(list);
    return list;
  },

  removeItem: (productId: string) => {
    const list = localWishlist.get();
    list.items = list.items.filter((i: any) => i.productId !== productId);
    list.total = list.items.length;
    localWishlist.set(list);
    return list;
  },

  clear: () => {
    localWishlist.set({ items: [], total: 0 });
  }
};
