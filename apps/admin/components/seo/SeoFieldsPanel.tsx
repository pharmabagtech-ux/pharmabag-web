"use client";
import { useState } from "react";
import { ChevronDown, Search, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Textarea } from "@/components/ui";
import { uploadBlogImage } from "@/api/blog.api";
import { cn } from "@/lib/utils";

export interface SeoFieldsValue {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl: string;
  ogImage: string;
}

interface Props {
  value: SeoFieldsValue;
  onChange: (v: SeoFieldsValue) => void;
  /** What ships when the fields are left empty — shown as placeholders + preview fallback. */
  fallbackTitle: string;
  fallbackDescription: string;
  /** e.g. `pharmabag.in/blogs/my-post` — shown in the Google preview. */
  previewUrl: string;
  /** Hide fields a surface doesn't support (products omit keywords + canonical). */
  showKeywords?: boolean;
  showCanonical?: boolean;
}

function Counter({ len, min, max }: { len: number; min: number; max: number }) {
  const ok = len === 0 || (len >= min && len <= max);
  return (
    <span className={cn("text-[11px] font-semibold", ok ? "text-green-600" : "text-yellow-600")}>
      {len}/{max}
    </span>
  );
}

/**
 * Shared SEO editing panel: blog posts today, product overrides next. Empty
 * fields are legitimate — the storefront derives sensible defaults, and the
 * placeholders/preview show exactly what ships if a field stays blank.
 */
export default function SeoFieldsPanel({
  value,
  onChange,
  fallbackTitle,
  fallbackDescription,
  previewUrl,
  showKeywords = true,
  showCanonical = true,
}: Props) {
  const [open, setOpen] = useState(true);
  const [keywordDraft, setKeywordDraft] = useState("");
  const set = (patch: Partial<SeoFieldsValue>) => onChange({ ...value, ...patch });

  const previewTitle = value.metaTitle.trim() || fallbackTitle;
  const previewDesc = value.metaDescription.trim() || fallbackDescription;

  return (
    <div className="glass-card rounded-2xl border border-border">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Search className="h-4 w-4 text-primary" /> SEO
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border/50 p-4">
          {/* Google-result preview */}
          <div className="rounded-xl border border-border/50 bg-background p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Google preview
            </p>
            <p className="truncate text-[13px] text-muted-foreground">{previewUrl}</p>
            <p className="truncate text-[18px] leading-snug text-[#1a0dab] dark:text-blue-400">{previewTitle}</p>
            <p className="line-clamp-2 text-[13px] text-muted-foreground">{previewDesc}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Meta title</label>
              <Counter len={value.metaTitle.length} min={15} max={60} />
            </div>
            <Input value={value.metaTitle} placeholder={fallbackTitle} onChange={(e) => set({ metaTitle: e.target.value })} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Meta description</label>
              <Counter len={value.metaDescription.length} min={50} max={160} />
            </div>
            <Textarea rows={3} value={value.metaDescription} placeholder={fallbackDescription} onChange={(e) => set({ metaDescription: e.target.value })} />
          </div>

          {showKeywords && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Keywords</label>
              <div className="flex flex-wrap items-center gap-2">
                {value.metaKeywords.map((k) => (
                  <span key={k} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                    {k}
                    <button type="button" onClick={() => set({ metaKeywords: value.metaKeywords.filter((x) => x !== k) })}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Input
                  className="max-w-[180px]"
                  value={keywordDraft}
                  placeholder="Add keyword ↵"
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const k = keywordDraft.trim();
                      if (k && !value.metaKeywords.includes(k)) set({ metaKeywords: [...value.metaKeywords, k] });
                      setKeywordDraft("");
                    }
                  }}
                />
              </div>
            </div>
          )}

          {showCanonical && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Canonical URL <span className="font-normal text-muted-foreground">(leave blank unless this content exists elsewhere first)</span>
              </label>
              <Input value={value.canonicalUrl} placeholder="https://…" onChange={(e) => set({ canonicalUrl: e.target.value })} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Share image (1200×630)</label>
            {value.ogImage ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.ogImage} alt="Share preview" className="h-16 w-28 rounded-lg border border-border object-cover" />
                <button type="button" className="text-xs font-semibold text-red-500" onClick={() => set({ ogImage: "" })}>
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
                      set({ ogImage: await uploadBlogImage(f) });
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Upload failed");
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
