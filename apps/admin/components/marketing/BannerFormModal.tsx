"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, AlertTriangle } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { useCategories } from "@/hooks/useAdmin";
import { uploadBannerImage, type AdminBanner, type BannerPayload } from "@/api/admin.api";
import toast from "react-hot-toast";

/** Artwork the strip is designed around. Advice, not a rule — see checkRatio. */
const DESKTOP_RATIO = 1920 / 180;
const MOBILE_RATIO = 800 / 240;
const RATIO_TOLERANCE = 0.15;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Null when creating. */
  banner: AdminBanner | null;
  onSubmit: (payload: BannerPayload) => Promise<unknown>;
  saving: boolean;
}

interface Category {
  id: string;
  name: string;
}

/**
 * Reads an image file's natural dimensions so the form can warn about artwork
 * that will be letterboxed. Resolves null rather than rejecting: a ratio hint
 * failing must never block an upload.
 */
function readRatio(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function ratioWarning(actual: number | null, target: number, label: string): string {
  if (actual === null) return "";
  const drift = Math.abs(actual - target) / target;
  if (drift <= RATIO_TOLERANCE) return "";
  return `This image is ${actual.toFixed(1)}:1 but the ${label} slot is about ${target.toFixed(
    1,
  )}:1. It will be cropped or letterboxed. You can still save it.`;
}

export default function BannerFormModal({ open, onClose, banner, onSubmit, saving }: Props) {
  const { data: categoriesRaw } = useCategories();
  const categories: Category[] = useMemo(() => {
    const list = Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw?.data ?? []);
    return list as Category[];
  }, [categoriesRaw]);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [active, setActive] = useState(true);
  const [homepage, setHomepage] = useState(false);
  const [allCategories, setAllCategories] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [desktopWarning, setDesktopWarning] = useState("");
  const [mobileWarning, setMobileWarning] = useState("");

  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  // Reset from the banner being edited every time the modal opens, so a
  // cancelled edit does not leak its half-typed values into the next one.
  useEffect(() => {
    if (!open) return;
    setTitle(banner?.title ?? "");
    setImageUrl(banner?.imageUrl ?? "");
    setMobileImageUrl(banner?.mobileImageUrl ?? "");
    setAltText(banner?.altText ?? "");
    setLinkUrl(banner?.linkUrl ?? "");
    setActive(banner?.active ?? true);
    setHomepage(!!banner?.placements.some((p) => p.scope === "HOMEPAGE"));
    setAllCategories(!!banner?.placements.some((p) => p.scope === "ALL_CATEGORIES"));
    setCategoryIds(
      banner?.placements.filter((p) => p.scope === "CATEGORY" && p.categoryId).map((p) => p.categoryId as string) ?? [],
    );
    setDesktopWarning("");
    setMobileWarning("");
  }, [open, banner]);

  async function handleFile(file: File | undefined, which: "desktop" | "mobile") {
    if (!file) return;
    setUploading(which);
    try {
      const ratio = await readRatio(file);
      const url = await uploadBannerImage(file);
      if (which === "desktop") {
        setImageUrl(url);
        setDesktopWarning(ratioWarning(ratio, DESKTOP_RATIO, "desktop"));
      } else {
        setMobileImageUrl(url);
        setMobileWarning(ratioWarning(ratio, MOBILE_RATIO, "mobile"));
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  const canSave = title.trim() !== "" && imageUrl !== "" && altText.trim() !== "" && !uploading && !saving;

  async function handleSubmit() {
    // ONE payload for both create and update — the API's UpdateBannerDto is
    // derived from CreateBannerDto with PartialType, so resending everything
    // is safe. If you add a field here, add it to CreateBannerDto.
    const payload: BannerPayload = {
      title: title.trim(),
      imageUrl,
      altText: altText.trim(),
      active,
      placements: [
        ...(homepage ? [{ scope: "HOMEPAGE" as const }] : []),
        ...(allCategories ? [{ scope: "ALL_CATEGORIES" as const }] : []),
        ...categoryIds.map((categoryId) => ({ scope: "CATEGORY" as const, categoryId })),
      ],
    };
    // Omitted rather than sent empty: the API treats '' as "clear" and
    // undefined as "leave alone", and both are correct here only if we are
    // explicit about which we mean.
    if (mobileImageUrl) payload.mobileImageUrl = mobileImageUrl;
    if (linkUrl.trim()) payload.linkUrl = linkUrl.trim();

    await onSubmit(payload);
  }

  const noPlacements = !homepage && !allCategories && categoryIds.length === 0;

  return (
    <Modal open={open} onClose={onClose} title={banner ? "Edit banner" : "Add banner"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <Field hint="Shown in this list only — never rendered on the site.">
          <Input
            label="Internal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Veltam 0.4mg featured"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Desktop artwork"
            hint="1920 × 180 recommended"
            url={imageUrl}
            busy={uploading === "desktop"}
            warning={desktopWarning}
            inputRef={desktopInput}
            onPick={(f) => handleFile(f, "desktop")}
          />
          <ImageField
            label="Mobile artwork (optional)"
            hint="800 × 240 recommended; falls back to the desktop image"
            url={mobileImageUrl}
            busy={uploading === "mobile"}
            warning={mobileWarning}
            inputRef={mobileInput}
            onPick={(f) => handleFile(f, "mobile")}
            onClear={() => {
              setMobileImageUrl("");
              setMobileWarning("");
            }}
          />
        </div>

        <Field hint="Required. The words are inside the image, so this is the only text a screen reader can read.">
          <Input
            label="Alt text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Veltam 0.4mg Tablet — better urological care"
          />
        </Field>

        <Field hint="Leave empty to make the banner non-clickable.">
          <Input
            label="Link (optional)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/products/veltam-0-4mg-tablet"
          />
        </Field>

        <fieldset className="rounded-xl border border-border/60 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Show on
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Check label="Homepage" checked={homepage} onChange={setHomepage} />
            <Check label="All category pages" checked={allCategories} onChange={setAllCategories} />
            {categories.map((c) => (
              <Check
                key={c.id}
                label={c.name}
                checked={categoryIds.includes(c.id)}
                onChange={(on) =>
                  setCategoryIds((prev) => (on ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                }
              />
            ))}
          </div>
          {noPlacements && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              With nothing ticked this banner is saved but shown nowhere.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            A category also covers its dosage-form pages — ticking Ethical shows the banner on
            /categories/ethical and /categories/ethical/tablet.
          </p>
        </fieldset>

        <Check label="Active" checked={active} onChange={setActive} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {saving ? "Saving…" : banner ? "Save changes" : "Add banner"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Helper text under a field. The shared Input has no `hint` prop and spreads
 * everything it does not recognise onto the native <input>, so passing one
 * would put an unknown attribute on the DOM node.
 */
function Field({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      {label}
    </label>
  );
}

function ImageField({
  label,
  hint,
  url,
  busy,
  warning,
  inputRef,
  onPick,
  onClear,
}: {
  label: string;
  hint: string;
  url: string;
  busy: boolean;
  warning: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onPick: (file: File | undefined) => void;
  onClear?: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      <div className="rounded-xl border border-dashed border-border/70 p-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 items-center justify-center text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : url ? "Replace" : "Upload"}
          </Button>
          {url && onClear && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {warning && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
}
