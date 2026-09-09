"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePageSeo,
  getPageDefaults,
  getPageSeo,
  getPageSeoMap,
  listLandingPages,
  upsertPageSeo,
  type UpsertPageSeoPayload,
} from "@/api/page-seo.api";

/** The list of every landing page the storefront generates. Rarely changes. */
export function useLandingPages() {
  return useQuery({
    queryKey: ["admin", "page-seo", "landing-pages"],
    queryFn: listLandingPages,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** Which pages carry an override, so the list can badge Auto vs Custom. */
export function usePageSeoMap() {
  return useQuery({
    queryKey: ["admin", "page-seo", "map"],
    queryFn: getPageSeoMap,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePageSeo(path: string | null) {
  return useQuery({
    queryKey: ["admin", "page-seo", "one", path],
    queryFn: () => getPageSeo(path as string),
    enabled: Boolean(path),
    retry: 1,
  });
}

/**
 * What the live page says right now.
 *
 * Kept separate from the stored override so the editor can show both: the
 * generated text as the placeholder, the stored text as the value.
 */
export function usePageDefaults(path: string | null) {
  return useQuery({
    queryKey: ["admin", "page-seo", "defaults", path],
    queryFn: () => getPageDefaults(path as string),
    enabled: Boolean(path),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

function useInvalidatePageSeo() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["admin", "page-seo"] });
}

export function useUpsertPageSeo() {
  const invalidate = useInvalidatePageSeo();
  return useMutation({
    mutationFn: ({ path, payload }: { path: string; payload: UpsertPageSeoPayload }) =>
      upsertPageSeo(path, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePageSeo() {
  const invalidate = useInvalidatePageSeo();
  return useMutation({ mutationFn: deletePageSeo, onSuccess: invalidate });
}
