"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/api/site-settings.api";

export function useSiteSettings() {
  return useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: getSiteSettings,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: SiteSettings) => updateSiteSettings(p),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "site-settings"] }),
  });
}
