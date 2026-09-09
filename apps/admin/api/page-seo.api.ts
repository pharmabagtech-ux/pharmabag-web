import { apiClient } from "@/lib/apiClient";

/**
 * Per-page content and SEO overrides.
 *
 * Two sources, deliberately:
 *  - the API holds what an admin has WRITTEN (only edited pages have rows);
 *  - the storefront reports what it GENERATES for any page.
 *
 * The editor needs both, because a page nobody has touched still has content —
 * it just lives in the storefront's templates. Showing only stored rows is the
 * gap that made the panel look empty.
 */

export interface FaqPair {
  question: string;
  answer: string;
}

export interface PageSeo {
  id: string;
  path: string;
  entityType?: string | null;
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  intro?: string | null;
  bodyHtml?: string | null;
  faq?: FaqPair[] | null;
  robots?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string[] | null;
  updatedAt?: string;
}

export type UpsertPageSeoPayload = Partial<
  Omit<PageSeo, "id" | "updatedAt" | "path">
>;

export interface LandingPage {
  pageType: string;
  label: string;
  path: string;
}

export interface PageDefaults {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  intro: string;
  faq: FaqPair[];
  bodyHtml: string;
}

/** Every override row, path-keyed, as the storefront reads it. */
export async function getPageSeoMap() {
  const { data } = await apiClient.get<{ data: Record<string, PageSeo> }>(
    "/page-seo/map",
  );
  return data.data ?? {};
}

export async function getPageSeo(path: string) {
  const { data } = await apiClient.get<{ data: PageSeo | null }>(
    `/admin/page-seo/one?path=${encodeURIComponent(path)}`,
  );
  return data.data;
}

export async function upsertPageSeo(path: string, payload: UpsertPageSeoPayload) {
  const { data } = await apiClient.put<{ data: PageSeo }>(
    `/admin/page-seo?path=${encodeURIComponent(path)}`,
    payload,
  );
  return data.data;
}

export async function deletePageSeo(path: string) {
  const { data } = await apiClient.delete<{ data: unknown }>(
    `/admin/page-seo?path=${encodeURIComponent(path)}`,
  );
  return data.data;
}

/**
 * The storefront's own origin.
 *
 * These two reads go to the site, not the API, because the content they return
 * is produced by the site's page templates. Falls back to the public domain so
 * a missing env var degrades to "prefill unavailable" rather than breaking the
 * whole screen.
 */
const STOREFRONT_ORIGIN =
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN || "https://pharmabag.in";

export async function listLandingPages(): Promise<{
  pages: LandingPage[];
  brandsOmitted: number;
  brandCityOmitted: number;
}> {
  const res = await fetch(`${STOREFRONT_ORIGIN}/api/seo/page-defaults?list=1`);
  if (!res.ok) throw new Error(`Storefront returned ${res.status}`);
  return res.json();
}

export async function getPageDefaults(path: string): Promise<{
  pageType: string;
  label: string;
  path: string;
  defaults: PageDefaults;
}> {
  const res = await fetch(
    `${STOREFRONT_ORIGIN}/api/seo/page-defaults?path=${encodeURIComponent(path)}`,
  );
  if (!res.ok) throw new Error(`Storefront returned ${res.status}`);
  return res.json();
}
