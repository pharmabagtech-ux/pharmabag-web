"use client";
import { useState } from "react";
import Link from "next/link";
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, Skeleton, Tabs, EmptyState } from "@/components/ui";
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPostStatus } from "@/hooks/useBlog";
import type { BlogPost } from "@/api/blog.api";

const TABS = [
  { label: "All", value: "" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
];

export default function BlogPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBlogPosts({
    status: status || undefined,
    search: search || undefined,
  });
  const del = useDeleteBlogPost();
  const setPostStatus = useUpdateBlogPostStatus();

  const posts: BlogPost[] = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground">
            Write and publish articles — every published post ships server-rendered with its SEO fields and joins the sitemap automatically.
          </p>
        </div>
        <Link href="/blog/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New post</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={status} onChange={setStatus} />
        <Input className="max-w-xs" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Couldn&apos;t load posts — check the API and retry.
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet" description="Your first article is one click away." />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Title</th>
                <th className="p-3">Author</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Views</th>
                <th className="p-3">Updated</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-accent/40">
                  <td className="p-3">
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">/blogs/{p.slug}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.author?.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={p.status === "PUBLISHED" ? "success" : "default"}>
                      {p.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.views ?? 0}</td>
                  <td className="p-3 text-muted-foreground">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        onClick={() =>
                          setPostStatus.mutate(
                            { id: p.id, status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
                            {
                              onError: (e: any) =>
                                toast.error(e?.response?.data?.message || "Failed to update status"),
                            },
                          )
                        }
                      >
                        {p.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/blog/${p.id}/edit`}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        title="Delete"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                        onClick={() => {
                          if (!window.confirm(`Delete "${p.title}" permanently?`)) return;
                          del.mutate(p.id, {
                            onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
                          });
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
    </div>
  );
}
