"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  get404s,
  dismiss404,
} from "@/api/redirects.api";

export function useRedirects() {
  return useQuery({ queryKey: ["admin", "redirects", "list"], queryFn: getRedirects, staleTime: 30_000, retry: 1 });
}

export function use404s(all: boolean) {
  return useQuery({ queryKey: ["admin", "redirects", "404s", all], queryFn: () => get404s(all), staleTime: 30_000, retry: 1 });
}

function useInvalidateRedirects() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["admin", "redirects"] });
}

export function useCreateRedirect() {
  const invalidate = useInvalidateRedirects();
  return useMutation({ mutationFn: createRedirect, onSuccess: invalidate });
}
export function useUpdateRedirect() {
  const invalidate = useInvalidateRedirects();
  return useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) => updateRedirect(id, { to }),
    onSuccess: invalidate,
  });
}
export function useDeleteRedirect() {
  const invalidate = useInvalidateRedirects();
  return useMutation({ mutationFn: deleteRedirect, onSuccess: invalidate });
}
export function useDismiss404() {
  const invalidate = useInvalidateRedirects();
  return useMutation({ mutationFn: dismiss404, onSuccess: invalidate });
}
