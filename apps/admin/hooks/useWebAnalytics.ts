"use client";
import { useQuery } from "@tanstack/react-query";
import { getWebAnalyticsRealtime } from "@/api/admin.api";

export function useWebAnalyticsRealtime() {
  return useQuery({
    queryKey: ["admin", "web-analytics", "realtime"],
    queryFn: getWebAnalyticsRealtime,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}
