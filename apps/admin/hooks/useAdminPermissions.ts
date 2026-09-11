"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAdminAuth } from "@/store";
import {
  parseAdminPermissions,
  type AdminCapabilities,
} from "@/lib/admin-areas";

/**
 * What the signed-in admin may actually do.
 *
 * Prefers the API's own answer, so the console and the server can never
 * disagree about a grant. Falls back to reading the stored permission string
 * locally with the same rules, which matters for exactly two cases:
 *
 *  - this app deploying before the API change lands, when the endpoint 404s
 *  - a brief API hiccup, where showing the admin their console beats showing
 *    them an empty sidebar
 *
 * Either way this only decides what is RENDERED. Enforcement is server-side;
 * a stale or optimistic answer here buys nobody access to anything.
 */
async function fetchMyPermissions(): Promise<AdminCapabilities | null> {
  try {
    const { data } = await apiClient.get<any>("/admin/dashboard/my-permissions");
    const payload = data?.data ?? data;
    if (!payload || typeof payload !== "object" || !payload.areas) return null;
    return {
      isSuper: Boolean(payload.isSuper),
      format: payload.format ?? "v2",
      areas: payload.areas,
    };
  } catch {
    return null;
  }
}

export function useAdminPermissions() {
  const { user, isAuth } = useAdminAuth();
  const stored =
    (user as any)?.adminProfile?.permissions ?? (user as any)?.permissions;

  const query = useQuery({
    queryKey: ["admin", "my-permissions"],
    queryFn: fetchMyPermissions,
    enabled: isAuth,
    staleTime: 60_000,
    retry: 1,
  });

  const capabilities: AdminCapabilities =
    query.data ?? parseAdminPermissions(stored);

  return {
    capabilities,
    /** True while we have neither a server answer nor a stored string to read. */
    isLoading: query.isLoading && stored === undefined,
    /** The server answered; the fallback was not needed. */
    isAuthoritative: Boolean(query.data),
  };
}
