"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, Plus, Pencil, Trash2, Eye, ExternalLink, Search } from "lucide-react";
import toast from "react-hot-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Button, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPostStatus } from "@/hooks/useBlog";
import type { BlogPost } from "@/api/blog.api";

const BUYER_URL = process.env.NEXT_PUBLIC_BUYER_URL ?? "https://pharmabag.in";

export default function AdminBlogsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "DRAFT" | "PUBLISHED">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useBlogPosts({
    search: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });
  const deletePost = useDeleteBlogPost();
  const updateStatus = useUpdateBlogPostStatus();

  const posts: BlogPost[] = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to delete post.");
    }
  };

  const handleToggleStatus = async (id: string, current: "DRAFT" | "PUBLISHED") => {
    try {
      await updateStatus.mutateAsync({ id, status: current === "PUBLISHED" ? "DRAFT" : "PUBLISHED" });
      toast.success(current === "PUBLISHED" ? "Unpublished." : "Published.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update status.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Blogs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${total} post${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link href="/blogs/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New post</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | "DRAFT" | "PUBLISHED");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))}
                {isError && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-red-500">
                      Couldn&apos;t load posts — check the API and retry.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && posts.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Newspaper}
                        title="No blog posts yet"
                        description="Publishing posts is one of the highest-impact things you can do for search and AI-answer visibility. Create your first one."
                      />
                    </td>
                  </tr>
                )}
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 max-w-[20rem]">
                      <Link
                        href={`/blogs/${post.id}`}
                        className="block truncate font-medium text-foreground hover:text-primary"
                      >
                        {post.title}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">/{post.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{post.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{post.author?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {/* The badge is the control: clicking it flips draft/published. */}
                      <button
                        onClick={() => handleToggleStatus(post.id, post.status as "DRAFT" | "PUBLISHED")}
                        title={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      >
                        <Badge variant={post.status === "PUBLISHED" ? "success" : "default"}>
                          {post.status === "PUBLISHED" ? "Published" : "Draft"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.views ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {post.updatedAt || post.createdAt
                        ? new Date(post.updatedAt ?? post.createdAt!).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {post.status === "PUBLISHED" && (
                          <a
                            href={`${BUYER_URL}/blogs/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View live"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <Link href={`/blogs/${post.id}`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDelete(post.id, post.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </motion.div>
      </div>
    </AdminLayout>
  );
}
