"use client";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowRightLeft, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, Modal, Skeleton, Tabs, EmptyState } from "@/components/ui";
import {
  useRedirects,
  use404s,
  useCreateRedirect,
  useUpdateRedirect,
  useDeleteRedirect,
  useDismiss404,
} from "@/hooks/useRedirects";
import { searchMasterProducts, type ProductSuggestion, type UrlRedirect } from "@/api/redirects.api";
import { useDebounce } from "@/hooks/useDebounce";

const TABS = [
  { label: "404 Log", value: "404s" },
  { label: "Redirects", value: "redirects" },
];

interface DialogState {
  open: boolean;
  /** Prefilled when launched from a 404 row; editable in new-mode. */
  from: string;
  fromLocked: boolean;
}

export default function RedirectsPage() {
  const [tab, setTab] = useState("404s");
  const [showAll404s, setShowAll404s] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ open: false, from: "", fromLocked: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ArrowRightLeft className="h-6 w-6 text-primary" /> Redirects
          </h1>
          <p className="text-sm text-muted-foreground">
            See every URL visitors and crawlers hit that no longer exists, and point it somewhere useful. Redirects go live on the storefront within a minute.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialog({ open: true, from: "", fromLocked: false })}>
          New redirect
        </Button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "404s" ? (
        <NotFoundLog
          showAll={showAll404s}
          onToggleAll={() => setShowAll404s(!showAll404s)}
          onCreateRedirect={(path) => setDialog({ open: true, from: path, fromLocked: true })}
        />
      ) : (
        <RedirectsList />
      )}

      <CreateRedirectDialog state={dialog} onClose={() => setDialog({ open: false, from: "", fromLocked: false })} />
    </div>
  );
}

function NotFoundLog({
  showAll,
  onToggleAll,
  onCreateRedirect,
}: {
  showAll: boolean;
  onToggleAll: () => void;
  onCreateRedirect: (path: string) => void;
}) {
  const { data, isLoading, isError } = use404s(showAll);
  const dismiss = useDismiss404();
  const rows = data ?? [];

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">Couldn&apos;t load the 404 log — check the API and retry.</div>;

  return (
    <div className="space-y-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
        <input type="checkbox" checked={showAll} onChange={onToggleAll} />
        Include resolved entries
      </label>
      {rows.length === 0 ? (
        <EmptyState icon={Search} title="No 404s logged" description="When a visitor or crawler hits a missing page, it shows up here." />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Path</th>
                <th className="p-3">Hits</th>
                <th className="p-3">Last seen</th>
                <th className="p-3">Came from</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-accent/40">
                  <td className="max-w-[320px] truncate p-3 font-mono text-xs text-foreground">{r.path}</td>
                  <td className="p-3 font-semibold text-foreground">{r.hits}</td>
                  <td className="p-3 text-muted-foreground">{new Date(r.lastSeenAt).toLocaleString()}</td>
                  <td className="max-w-[200px] truncate p-3 text-xs text-muted-foreground">{r.lastReferrer ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {r.resolved ? (
                        <Badge variant="success">Resolved</Badge>
                      ) : (
                        <Button variant="secondary" onClick={() => onCreateRedirect(r.path)}>
                          Create redirect
                        </Button>
                      )}
                      <button
                        title="Dismiss"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                        onClick={() =>
                          dismiss.mutate(r.id, {
                            onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to dismiss"),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RedirectsList() {
  const { data, isLoading, isError } = useRedirects();
  const del = useDeleteRedirect();
  const [editing, setEditing] = useState<UrlRedirect | null>(null);
  const [editTo, setEditTo] = useState("");
  const update = useUpdateRedirect();
  const rows = data ?? [];

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">Couldn&apos;t load redirects — check the API and retry.</div>;

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No redirects yet" description="Create one manually, or bulk catalogue uploads will add them automatically when product URLs change." />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-3">From</th>
                <th className="p-3">To</th>
                <th className="p-3">Hits</th>
                <th className="p-3">Source</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-accent/40">
                  <td className="max-w-[260px] truncate p-3 font-mono text-xs text-foreground">{r.fromPath}</td>
                  <td className="max-w-[260px] truncate p-3 font-mono text-xs text-foreground">{r.toPath}</td>
                  <td className="p-3 font-semibold text-foreground">{r.hits}</td>
                  <td className="p-3">
                    <Badge variant={r.source === "PRODUCT_RENAME" ? "info" : "default"}>
                      {r.source === "PRODUCT_RENAME" ? "Auto (rename)" : "Manual"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" onClick={() => { setEditing(r); setEditTo(r.toPath); }}>Edit</Button>
                      <button
                        title="Delete"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                        onClick={() => {
                          if (!window.confirm(`Delete the redirect for ${r.fromPath}? The old URL will 404 again.`)) return;
                          del.mutate(r.id, { onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete") });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Change redirect target">
        {editing && (
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground">{editing.fromPath}</p>
            <Input label="New target" value={editTo} onChange={(e) => setEditTo(e.target.value)} />
            <Button
              onClick={() =>
                update.mutate(
                  { id: editing.id, to: editTo.trim() },
                  {
                    onSuccess: () => { toast.success("Updated"); setEditing(null); },
                    onError: (e: any) => toast.error(e?.response?.data?.message || "Update failed"),
                  },
                )
              }
              disabled={update.isPending || !editTo.trim()}
            >
              Save
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

function CreateRedirectDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const create = useCreateRedirect();
  const [from, setFrom] = useState(state.from);
  const [target, setTarget] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const debouncedQuery = useDebounce(productQuery, 400);

  // Re-sync when the dialog opens for a different 404 row.
  useEffect(() => {
    setFrom(state.from);
    setTarget("");
    setProductQuery("");
    setSuggestions([]);
  }, [state.open, state.from]);

  useEffect(() => {
    let cancelled = false;
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    searchMasterProducts(debouncedQuery.trim())
      .then((rows) => {
        if (!cancelled) setSuggestions(rows.filter((r) => r.slug));
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const save = () => {
    const fromClean = from.trim();
    const toClean = target.trim();
    if (!fromClean) return toast.error("Enter the old path (e.g. /products/old-name)");
    if (!toClean) return toast.error("Pick a product or enter a target path/URL");
    create.mutate(
      { from: fromClean, to: toClean },
      {
        onSuccess: () => { toast.success("Redirect live within a minute"); onClose(); },
        onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create redirect"),
      },
    );
  };

  return (
    <Modal open={state.open} onClose={onClose} title="Create redirect">
      <div className="space-y-4">
        <Input
          label="From (the dead URL path)"
          value={from}
          disabled={state.fromLocked}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="/products/old-name-pb123"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Send visitors to…</label>
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search the catalogue by product name"
          />
          {suggestions.length > 0 && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setTarget(`/products/${s.slug}`);
                    setProductQuery(s.productName);
                    setSuggestions([]);
                  }}
                >
                  <span className="truncate">{s.productName}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{s.companyName}</span>
                </button>
              ))}
            </div>
          )}
          <p className="my-2 text-center text-xs text-muted-foreground">— or —</p>
          <Input
            label="Target path or URL"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="/products or https://…"
          />
        </div>

        {from.trim() && target.trim() && (
          <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 font-mono text-xs text-foreground">
            <span className="truncate">{from.trim()}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{target.trim()}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} leftIcon={<X className="h-4 w-4" />}>Cancel</Button>
          <Button onClick={save} disabled={create.isPending} loading={create.isPending}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}
