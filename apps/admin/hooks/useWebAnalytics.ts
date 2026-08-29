"use client";
import { useQuery } from "@tanstack/react-query";
import { getWebAnalyticsRealtime, getWebAnalyticsTraffic, getWebAnalyticsAudience } from "@/api/admin.api";

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
