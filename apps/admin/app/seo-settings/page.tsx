"use client";
import { useEffect, useState } from "react";
import { Globe, Plus, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Skeleton } from "@/components/ui";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { uploadBlogImage } from "@/api/blog.api";
import type { SiteSettings } from "@/api/site-settings.api";

const EMPTY = {
  gscVerification: "",
  bingVerification: "",
  ga4MeasurementId: "",
  socialProfiles: [] as string[],
  supportEmail: "",
  addressLocality: "",
  addressRegion: "",
  defaultOgImage: "",
};

export default function SeoSettingsPage() {
  const { data, isLoading, isError } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState(EMPTY);
  const [profileDraft, setProfileDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Mirror the stored settings into the form ONCE — later refetches must not
  // clobber unsaved edits.
  useEffect(() => {
    if (data && !loaded) {
      setForm({ ...EMPTY, ...data, socialProfiles: data.socialProfiles ?? [] });
      setLoaded(true);
    }
  }, [data, loaded]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const addProfile = () => {
    const url = profileDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      toast.error("Profile links must start with https://");
      return;
    }
    if (!form.socialProfiles.includes(url)) set({ socialProfiles: [...form.socialProfiles, url] });
    setProfileDraft("");
  };

  const save = () => {
    if (form.ga4MeasurementId && !/^G-[A-Z0-9]{4,16}$/.test(form.ga4MeasurementId)) {
      toast.error("GA4 ID must look like G-XXXXXXXXXX");
      return;
    }
    // Send only non-empty values; the API treats absent keys as "unset".
    const payload: SiteSettings = {};
    if (form.gscVerification.trim()) payload.gscVerification = form.gscVerification.trim();
    if (form.bingVerification.trim()) payload.bingVerification = form.bingVerification.trim();
    if (form.ga4MeasurementId.trim()) payload.ga4MeasurementId = form.ga4MeasurementId.trim();
    if (form.socialProfiles.length) payload.socialProfiles = form.socialProfiles;
    if (form.supportEmail.trim()) payload.supportEmail = form.supportEmail.trim();
    if (form.addressLocality.trim()) payload.addressLocality = form.addressLocality.trim();
    if (form.addressRegion.trim()) payload.addressRegion = form.addressRegion.trim();
    if (form.defaultOgImage) payload.defaultOgImage = form.defaultOgImage;

    update.mutate(payload, {
      onSuccess: () => toast.success("Saved — the storefront picks this up within ~5 minutes"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Save failed"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        Couldn&apos;t load settings — check the API and retry.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Globe className="h-6 w-6 text-primary" /> SEO Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Site-wide search &amp; AI settings. Changes go live on the storefront within about 5 minutes — no deploy needed.
        </p>
      </div>

      {/* Search engine codes */}
      <div className="glass-card space-y-4 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Search engine codes</h2>
        <Input
          label="Google Search Console verification token"
          value={form.gscVerification}
          onChange={(e) => set({ gscVerification: e.target.value })}
          placeholder='Paste the content value from the "HTML tag" method'
        />
        <Input
          label="Bing Webmaster verification token"
          value={form.bingVerification}
          onChange={(e) => set({ bingVerification: e.target.value })}
          placeholder="msvalidate.01 content value"
        />
        <Input
          label="Google Analytics 4 measurement ID"
          value={form.ga4MeasurementId}
          onChange={(e) => set({ ga4MeasurementId: e.target.value.toUpperCase().trim() })}
          placeholder="G-XXXXXXXXXX"
        />
      </div>

      {/* Brand profiles */}
      <div className="glass-card space-y-3 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Official brand profiles</h2>
        <p className="text-xs text-muted-foreground">
          LinkedIn, Play Store, YouTube, Instagram… These become sameAs links in the site&apos;s schema, helping Google and AI systems connect PharmaBag to its real profiles. Only add profiles you own.
        </p>
        <div className="space-y-2">
          {form.socialProfiles.map((url) => (
            <div key={url} className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
              <span className="truncate">{url}</span>
              <button type="button" onClick={() => set({ socialProfiles: form.socialProfiles.filter((u) => u !== url) })}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={profileDraft}
            placeholder="https://…"
            onChange={(e) => setProfileDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProfile();
              }
            }}
          />
          <Button variant="secondary" onClick={addProfile} leftIcon={<Plus className="h-4 w-4" />}>
            Add
          </Button>
        </div>
      </div>

      {/* Organisation */}
      <div className="glass-card space-y-4 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Organisation</h2>
        <Input label="Support email" value={form.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} placeholder="support@pharmabag.in" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" value={form.addressLocality} onChange={(e) => set({ addressLocality: e.target.value })} placeholder="Kolkata" />
          <Input label="State" value={form.addressRegion} onChange={(e) => set({ addressRegion: e.target.value })} placeholder="West Bengal" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Default share image (1200×630)</label>
          <p className="mb-2 text-xs text-muted-foreground">
            Shown when a page without its own image is shared on WhatsApp / LinkedIn / social.
          </p>
          {form.defaultOgImage ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.defaultOgImage} alt="Default share" className="h-16 w-28 rounded-lg border border-border object-cover" />
              <button type="button" className="text-xs font-semibold text-red-500" onClick={() => set({ defaultOgImage: "" })}>
                Remove
              </button>
            </div>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
              <UploadCloud className="h-4 w-4" /> Upload image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    set({ defaultOgImage: await uploadBlogImage(f) });
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || "Upload failed");
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <Button onClick={save} loading={update.isPending} disabled={update.isPending}>
        Save settings
      </Button>
    </div>
  );
}
