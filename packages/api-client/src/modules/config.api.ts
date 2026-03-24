import { z } from 'zod';
import { api } from '../api';

// ─── Schema ─────────────────────────────────────────

export const PlatformConfigSchema = z.object({
  gst_rate: z.number(),
  min_order_amount: z.number(),
  shipping_threshold: z.number(),
  shipping_fee: z.number().optional().default(250),
  default_moq: z.number().optional().default(1),
  max_order_qty: z.number().optional().default(100),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

// ─── Defaults ───────────────────────────────────────

const DEFAULT_CONFIG: PlatformConfig = {
  gst_rate: 12,
  min_order_amount: 20000,
  shipping_threshold: 5000,
  shipping_fee: 250,
  default_moq: 1,
  max_order_qty: 100,
};

// ─── In-memory cache ────────────────────────────────

let cachedConfig: PlatformConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── API ────────────────────────────────────────────

export async function getPlatformConfig(): Promise<PlatformConfig> {
  // Return cached if still fresh
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const { data } = await api.get('/config/platform');
    const parsed = PlatformConfigSchema.parse(data.data ?? data);
    cachedConfig = parsed;
    cacheTimestamp = Date.now();
    return parsed;
  } catch {
    // If backend hasn't implemented this endpoint yet, return defaults
    // so the app doesn't break during transition
    if (!cachedConfig) {
      cachedConfig = DEFAULT_CONFIG;
      cacheTimestamp = Date.now();
    }
    return cachedConfig;
  }
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
