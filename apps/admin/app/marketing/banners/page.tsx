"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import BannerFormModal from "@/components/marketing/BannerFormModal";
import {
  useBanners,
  useBannerSettings,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useReorderBanners,
  useUpdateBannerSettings,
} from "@/hooks/useAdmin";
import type { AdminBanner, BannerPayload } from "@/api/admin.api";
import toast from "react-hot-toast";

function placementLabel(banner: AdminBanner): string[] {
  return banner.placements.map((p) =>
    p.scope === "HOMEPAGE"
      ? "Homepage"
      : p.scope === "ALL_CATEGORIES"
        ? "All categories"
        : (p.category?.name ?? "Category"),
  );
}

export default function BannersPage() {
  const { data: banners, isLoading } = useBanners();
  const { data: settings } = useBannerSettings();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const reorderBanners = useReorderBanners();
  const updateSettings = useUpdateBannerSettings();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [rotation, setRotation] = useState("5");

  /**
   * Local copy so a drag reorders instantly instead of waiting for the round
   * trip. Re-synced from the query whenever the server's list changes, which
   * also rolls it back if the reorder call fails.
   */
  const [order, setOrder] = useState<AdminBanner[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const serverList = useMemo(() => (banners ?? []) as AdminBanner[], [banners]);

  useEffect(() => {
    setOrder(serverList);
  }, [serverList]);

  useEffect(() => {
    if (settings?.rotationSeconds) setRotation(String(settings.rotationSeconds));
  }, [settings?.rotationSeconds]);

  function commitOrder(next: AdminBanner[]) {
    const previous = order;
    setOrder(next);
    reorderBanners.mutate(
      next.map((b) => b.id),
      {
        onError: () => {
          setOrder(previous);
          toast.error("Could not save the new order");
        },
      },
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    commitOrder(next);
  }

  function handleDrop(targetIndex: number) {
    if (!dragId) return;
    const from = order.findIndex((b) => b.id === dragId);
    setDragId(null);
    if (from === -1 || from === targetIndex) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    commitOrder(next);
  }

  async function handleSubmit(payload: BannerPayload) {
    try {
      if (editing) {
        await updateBanner.mutateAsync({ id: editing.id, ...payload });
        toast.success("Banner updated");
      } else {
        await createBanner.mutateAsync(payload);
        toast.success("Banner added");
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast.error(editing ? "Could not update the banner" : "Could not add the banner");
    }
  }

  async function handleDelete(banner: AdminBanner) {
    // No window.confirm: a browser modal blocks the page and this is a single
    // undoable-by-recreating row, not a destructive bulk action.
    try {
      await deleteBanner.mutateAsync(banner.id);
      toast.success(`Deleted "${banner.title}"`);
    } catch {
      toast.error("Could not delete the banner");
    }
  }

  function saveRotation() {
    const value = Number(rotation);
    if (!Number.isFinite(value) || value < 2 || value > 30) {
      toast.error("Rotation must be between 2 and 30 seconds");
      setRotation(String(settings?.rotationSeconds ?? 5));
      return;
    }
    updateSettings.mutate(value, {
      onSuccess: () => toast.success("Rotation interval saved"),
      onError: () => toast.error("Could not save the interval"),
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/marketing"
              className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Marketing
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <ImageIcon className="h-6 w-6 text-primary" />
              Banner Management
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The promo strip under the header on the homepage and category pages.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add banner
          </Button>
        </div>

        <div className="glass-card flex flex-wrap items-end gap-3 rounded-2xl p-4">
          <div className="w-40">
            <Input
              label="Rotate every"
              type="number"
              min={2}
              max={30}
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              onBlur={saveRotation}
            />
          </div>
          <p className="pb-2.5 text-xs text-muted-foreground">
            Seconds between slides, 2–30. Visitors who ask for reduced motion never see it
            auto-advance.
          </p>
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          ) : order.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={ImageIcon}
                title="No banners yet"
                description="Add one to show a promo strip on the homepage or category pages."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {order.map((banner, index) => (
                <motion.li
                  key={banner.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  draggable
                  onDragStart={() => setDragId(banner.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-3 p-4 transition-colors hover:bg-accent/30 ${
                    dragId === banner.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" aria-hidden />
                    {/* Drag is not keyboard operable, so the arrows are not
                        decoration — they are the only accessible way to
                        reorder this list. */}
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${banner.title} up`}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === order.length - 1}
                      aria-label={`Move ${banner.title} down`}
                      className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="h-10 w-28 shrink-0 rounded-lg border border-border/50 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{banner.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {placementLabel(banner).length === 0 ? (
                        <Badge variant="warning">Shown nowhere</Badge>
                      ) : (
                        placementLabel(banner).map((label) => (
                          <Badge key={label} variant="info">
                            {label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <Badge variant={banner.active ? "success" : "default"}>
                    {banner.active ? "Active" : "Off"}
                  </Badge>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateBanner.mutate({
                        id: banner.id,
                        title: banner.title,
                        imageUrl: banner.imageUrl,
                        altText: banner.altText,
                        active: !banner.active,
                        ...(banner.mobileImageUrl ? { mobileImageUrl: banner.mobileImageUrl } : {}),
                        ...(banner.linkUrl ? { linkUrl: banner.linkUrl } : {}),
                        placements: banner.placements.map((p) => ({
                          scope: p.scope,
                          ...(p.categoryId ? { categoryId: p.categoryId } : {}),
                        })),
                      })
                    }
                  >
                    {banner.active ? "Turn off" : "Turn on"}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(banner);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${banner.title}`}
                    onClick={() => handleDelete(banner)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BannerFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        banner={editing}
        onSubmit={handleSubmit}
        saving={createBanner.isPending || updateBanner.isPending}
      />
    </AdminLayout>
  );
}
