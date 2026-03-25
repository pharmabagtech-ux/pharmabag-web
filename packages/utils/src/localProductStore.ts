/**
 * Shared local product store for dev mode (no backend).
 * Persists seller-created products to localStorage so they survive
 * page refreshes and appear across all tabs of the same app.
 *
 * Each app (seller/admin/buyer) runs on its own port so they have
 * separate localStorage. To sync, all apps use the SAME key and each
 * app writes to its own localStorage whenever it creates/updates products.
 */

import type { Product } from './types';
import { PRODUCTS as BASE_MOCK_PRODUCTS } from './mockData';

const STORAGE_KEY = 'pb_local_products';

/** Safe check for browser environment (works without DOM lib). */
function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage !== 'undefined';
}

function getStorage(): any {
  if (!isBrowser()) return null;
  return (globalThis as any).localStorage;
}

// ─── Read / Write helpers ──────────────────────────

function readLocalProducts(): Product[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY) as string | null;
    if (!raw) return [];
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function writeLocalProducts(products: Product[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

// ─── In-memory cache (merged: base mock + localStorage products) ─

let _cache: Product[] | null = null;

/** Get all products (base mock + locally created). Initializes from localStorage on first call. */
export function getLocalProducts(): Product[] {
  if (!_cache) {
    const base = structuredClone(BASE_MOCK_PRODUCTS);
    const local = readLocalProducts();
    // Merge: base products + any locally-created products not already in base
    const baseIds = new Set(base.map((p) => p.id));
    const extras = local.filter((p) => !baseIds.has(p.id));
    // Also apply any local updates to base products (e.g., admin approve/reject)
    for (const lp of local) {
      const idx = base.findIndex((bp) => bp.id === lp.id);
      if (idx !== -1) {
        base[idx] = lp;
      }
    }
    _cache = [...base, ...extras];
  }
  return _cache;
}

/** Add a product to the local store and persist. */
export function addLocalProduct(product: Product): void {
  const products = getLocalProducts();
  products.push(product);
  _cache = products;
  persistToStorage();
}

/** Update a product in the local store by ID. Returns the updated product or null. */
export function updateLocalProduct(productId: string, updates: Partial<Product>): Product | null {
  const products = getLocalProducts();
  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
  _cache = products;
  persistToStorage();
  return products[idx];
}

/** Delete a product from the local store by ID. Returns true if found and deleted. */
export function deleteLocalProduct(productId: string): boolean {
  const products = getLocalProducts();
  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) return false;
  products.splice(idx, 1);
  _cache = products;
  persistToStorage();
  return true;
}

/** Find a single product by ID. */
export function findLocalProduct(productId: string): Product | undefined {
  return getLocalProducts().find((p) => p.id === productId);
}

/** Force re-read from localStorage (e.g., if another tab wrote data). */
export function refreshLocalProducts(): void {
  _cache = null;
}

// ─── Internal ──────────────────────────────────────

function persistToStorage(): void {
  if (!_cache) return;
  // Only persist locally-created or modified products (not the original base data)
  // Actually, persist ALL so that admin approve/reject changes are preserved
  writeLocalProducts(_cache);
}
