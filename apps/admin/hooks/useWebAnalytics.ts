"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getWebAnalyticsRealtime,
  getWebAnalyticsTraffic,
  getWebAnalyticsAudience,
  getWebAnalyticsGeography,
  getWebAnalyticsProductGeography,
} from "@/api/admin.api";

export function useWebAnalyticsRealtime() {
  return useQuery({
    queryKey: ["admin", "web-analytics", "realtime"],
    queryFn: getWebAnalyticsRealtime,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useWebAnalyticsTraffic(from: string, to: string) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "traffic", from, to],
    queryFn: () => getWebAnalyticsTraffic(from, to),
  });
}

export function useWebAnalyticsAudience(from: string, to: string) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "audience", from, to],
    queryFn: () => getWebAnalyticsAudience(from, to),
  });
}

export function useWebAnalyticsGeography(from: string, to: string) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "geography", from, to],
    queryFn: () => getWebAnalyticsGeography(from, to),
  });
}

/**
 * Per-product location breakdown. Skipped entirely until a productId exists,
 * so this can be called unconditionally from a product page that is still
 * loading its product.
 */
export function useWebAnalyticsProductGeography(
  productId: string | undefined,
  from: string,
  to: string,
  path?: string,
) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "product-geography", productId, from, to, path ?? null],
    queryFn: () => getWebAnalyticsProductGeography(productId as string, from, to, path),
    enabled: Boolean(productId),
  });
}
