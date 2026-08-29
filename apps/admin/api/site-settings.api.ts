import { apiClient } from "@/lib/apiClient";

export interface SiteSettings {
  gscVerification?: string;
  bingVerification?: string;
  ga4MeasurementId?: string;
  socialProfiles?: string[];
  supportEmail?: string;
  addressLocality?: string;
  addressRegion?: string;
  defaultOgImage?: string;
}

export async function getSiteSettings() {
  const { data } = await apiClient.get<{ data: SiteSettings }>("/admin/site-settings");
  return data.data;
}

/**
 * PUT replaces the whole document — clearing a field = omitting it. The page
 * always sends the full current form, so what you see is what gets stored.
 */
export async function updateSiteSettings(payload: SiteSettings) {
  const { data } = await apiClient.put<{ data: SiteSettings }>("/admin/site-settings", payload);
  return data.data;
}
