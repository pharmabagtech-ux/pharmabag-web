"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, Input, Pagination, Tabs } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useLandingPages, usePageSeoMap } from "@/hooks/usePageSeo";
import PageContentEditor from "@/components/seo/PageContentEditor";

/**
 * Content manager for the storefront's generated landing pages.
 *
 * Every category, dosage form, molecule, state, city and brand page carries
 * copy that lives in the storefront's page templates. Before this screen there
 * was no way to read it, let alone change it, without a deploy.
 *
 * The list is the union of two sources: every page the storefront generates,
 * and the rows the API holds for pages someone has edited. A page with no row
 * is not empty — it is generated, and the editor shows exactly what it says.
 */

const FAMILY_LABELS: Record<string, string> = {
  MOLECULE: "Molecules",
  STATE: "States",
  CITY: "Cities",
  BRAND: "Brands",
  BRAND_CITY: "Brand × city",
};

/**
 * CATEGORY and DOSAGE_FORM are deliberately absent.
 *
 * A category and the page it creates are one thing to the person making it,
 * so both are edited in the Categories tab, next to the category itself —
 * creating one there opens its page content straight away. The families left
 * here are the ones with no other home: they are derived from the catalogue
 * rather than created by anyone, so this screen is the only place they exist.
 *
 * Both screens drive the same editor and write the same record, so this is
 * about having one door per thing, not about capability.
 */
const FAMILY_ORDER = ["MOLECULE", "STATE", "CITY", "BRAND", "BRAND_CITY"];

const PER_PAGE = 25;

const STOREFRONT_ORIGIN =
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN || "https://pharmabag.in";

export default function SeoPagesPage() {
  const { data: listed, isLoading, error } = useLandingPages();
  const { data: overrides } = usePageSeoMap();

  const [family, setFamily] = useState(FAMILY_ORDER[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ path: string; label: string } | null>(
    null,
  );

  // Categories and dosage forms are edited in the Categories tab, so they are
  // filtered out here too — otherwise the counts and the "custom" total on
  // this screen would describe pages it does not list.
  const pages = (listed?.pages ?? []).filter((p) =>
    FAMILY_ORDER.includes(p.pageType),
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of pages) c[p.pageType] = (c[p.pageType] ?? 0) + 1;
    return c;
  }, [pages]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return pages
      .filter((p) => p.pageType === family)
      .filter(
        (p) =>
          !q ||
          p.label.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q),
      );
  }, [pages, family, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  /** A page is "Custom" when a stored row carries any content of its own. */
  const isCustom = (path: string) => {
    const row = overrides?.[path];
    if (!row) return false;
    return Boolean(
      row.title ||
        row.description ||
        row.h1 ||
        row.intro ||
        row.bodyHtml ||
        (row.faq && row.faq.length),
    );
  };

  const customCount = pages.filter((p) => isCustom(p.path)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <FileText className="h-6 w-6 text-primary" />
            Page content
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Heading, intro, description and FAQs for every landing page. Pages
            you have not edited are generated automatically — open one to see
            exactly what it says today.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Category and dosage-form pages are edited in{" "}
            <Link href="/categories" className="font-medium text-primary hover:underline">
              Categories
            </Link>
            , alongside the category itself.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100">
            Could not reach the storefront to list its pages ({String(error)}).
            Saved overrides are unaffected and every live page is still serving
            its generated content.
          </div>
        ) : null}

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Tabs
            tabs={FAMILY_ORDER.filter((f) => counts[f]).map((f) => ({
              label: FAMILY_LABELS[f] ?? f,
              value: f,
              count: counts[f],
            }))}
            active={family}
            onChange={(v) => {
              setFamily(v);
              setPage(1);
            }}
          />
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search by name or URL…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {listed && (listed.brandsOmitted > 0 || listed.brandCityOmitted > 0) ? (
          <p className="text-xs text-muted-foreground">
            Showing the {counts.BRAND ?? 0} largest brands.{" "}
            {listed.brandsOmitted.toLocaleString("en-IN")} smaller brands and{" "}
            {listed.brandCityOmitted.toLocaleString("en-IN")} brand-in-city
            combinations are not listed — they still render from generated
            content, and nothing about them has changed.
          </p>
        ) : null}

        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Landing pages">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Page
                  </th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    URL
                  </th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Content
                  </th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                      Loading pages…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      No pages match that search.
                    </td>
                  </tr>
                ) : (
                  visible.map((p) => (
                    <tr key={p.path} className="transition-colors hover:bg-accent/30">
                      <td className="px-5 py-4 font-medium text-foreground">{p.label}</td>
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        {p.path}
                      </td>
                      <td className="px-5 py-4">
                        {isCustom(p.path) ? (
                          <Badge variant="success">Custom</Badge>
                        ) : (
                          <Badge variant="default">Auto</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setEditing({ path: p.path, label: p.label })}
                          >
                            Edit
                          </Button>
                          <Link
                            href={`${STOREFRONT_ORIGIN}${p.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length.toLocaleString("en-IN")} pages in this group ·{" "}
            {customCount.toLocaleString("en-IN")} edited across the site
          </p>
          <Pagination page={current} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {editing ? (
        <PageContentEditor
          path={editing.path}
          label={editing.label}
          onClose={() => setEditing(null)}
          onSaved={() => toast.success("Saved — live within about five minutes")}
        />
      ) : null}
    </AdminLayout>
  );
}
