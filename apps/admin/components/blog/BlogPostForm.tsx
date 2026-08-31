"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import RichTextEditor from "@/components/blog/RichTextEditor";
import SeoFieldsPanel, { type SeoFieldsValue } from "@/components/seo/SeoFieldsPanel";
import {
  useBlogAuthors,
  useBlogCategories,
  useCreateBlogAuthor,
  useCreateBlogCategory,
  useCreateBlogPost,
  useUpdateBlogPost,
} from "@/hooks/useBlog";
import { uploadBlogImage, type BlogPost, type BlogPostPayload } from "@/api/blog.api";

/**
 * EXACT mirror of the API's slug derivation (blog.service.ts createPost), so
 * the slug shown here is the slug that gets stored — an edit form that
 * derived slugs differently would show phantom slug changes on every save.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The legacy live row stores content as { text }; new posts store HTML strings. */
function contentToHtml(content: BlogPost["content"]): string {
  if (typeof content === "string") return content;
  return content?.text ?? "";
}

export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [content, setContent] = useState(contentToHtml(post?.content));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [authorId, setAuthorId] = useState(post?.authorId ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(post?.status ?? "DRAFT");
  const [seo, setSeo] = useState<SeoFieldsValue>({
    metaTitle: post?.metaTitle ?? "",
    metaDescription: post?.metaDescription ?? "",
    metaKeywords: post?.metaKeywords ?? [],
    canonicalUrl: post?.canonicalUrl ?? "",
    ogImage: post?.ogImage ?? "",
  });
  const [authorModal, setAuthorModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState({ name: "", bio: "" });
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const { data: authors } = useBlogAuthors();
  const { data: categories } = useBlogCategories();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const createAuthor = useCreateBlogAuthor();
  const createCategory = useCreateBlogCategory();

  const plainText = useMemo(
    () => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    [content],
  );
  const fallbackDescription = excerpt.trim() || plainText.slice(0, 160);

  const save = () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!plainText) return toast.error("Post content is empty");
    if (!authorId) return toast.error("Pick an author (or create one)");

    const payload: BlogPostPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content,
      featuredImage: featuredImage || undefined,
      authorId,
      categoryId: categoryId || undefined,
      tags,
      status,
      metaTitle: seo.metaTitle.trim() || undefined,
      metaDescription: seo.metaDescription.trim() || undefined,
      metaKeywords: seo.metaKeywords.length ? seo.metaKeywords : undefined,
      canonicalUrl: seo.canonicalUrl.trim() || undefined,
      ogImage: seo.ogImage || undefined,
    };

    const onError = (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    const onSuccess = () => {
      toast.success(status === "PUBLISHED" ? "Published" : "Saved as draft");
      router.push("/blogs");
    };

    if (isEdit) updatePost.mutate({ id: post!.id, payload }, { onSuccess, onError });
    else createPost.mutate(payload, { onSuccess, onError });
  };

  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div className="space-y-6 pb-28">
      <button
        onClick={() => router.push("/blogs")}
        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All posts
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Content column ── */}
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is PTR pricing?" />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs text-muted-foreground">pharmabag.in/blogs/</span>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </div>
            {isEdit && post!.status === "PUBLISHED" && slug !== post!.slug && (
              <p className="mt-1 text-xs font-semibold text-yellow-600">
                Changing a published post&apos;s slug breaks its old URL. (Automatic redirects arrive with the Redirects manager.)
              </p>
            )}
          </div>
          <RichTextEditor value={content} onChange={setContent} />
          <Textarea
            label="Excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="One-or-two-sentence summary shown on the blog index and used as the default description."
          />
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl border border-border p-4">
            <label className="mb-2 block text-xs font-semibold text-foreground">Featured image</label>
            {featuredImage ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredImage} alt="Featured" className="mb-2 w-full rounded-xl border border-border object-cover" />
                <button type="button" className="text-xs font-semibold text-red-500" onClick={() => setFeaturedImage("")}>
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
                <UploadCloud className="h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      setFeaturedImage(await uploadBlogImage(f));
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Upload failed");
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="glass-card rounded-2xl border border-border p-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Author</label>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setAuthorModal(true)}>
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <Select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
              <option value="">Select author…</option>
              {(authors ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.name.toLowerCase() === "unknown" ? " (set a real author for SEO)" : ""}
                </option>
              ))}
            </Select>

            <div className="mb-1 mt-4 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Category <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setCategoryModal(true)}>
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <label className="mb-1 mt-4 block text-xs font-semibold text-foreground">Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Input
                className="max-w-[140px]"
                value={tagDraft}
                placeholder="Add ↵"
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const t = tagDraft.trim();
                    if (t && !tags.includes(t)) setTags([...tags, t]);
                    setTagDraft("");
                  }
                }}
              />
            </div>
          </div>

          <SeoFieldsPanel
            value={seo}
            onChange={setSeo}
            fallbackTitle={title || "Post title"}
            fallbackDescription={fallbackDescription || "Post description"}
            previewUrl={`pharmabag.in/blogs/${slug || "post-slug"}`}
          />
        </div>
      </div>

      {/* ── Sticky publish bar (offset matches the admin sidebar: lg:pl-64) ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-4 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => setStatus("DRAFT")} className={status === "DRAFT" ? "font-bold text-foreground" : "text-muted-foreground"}>
              Draft
            </button>
            <span className="text-muted-foreground/50">/</span>
            <button type="button" onClick={() => setStatus("PUBLISHED")} className={status === "PUBLISHED" ? "font-bold text-green-600" : "text-muted-foreground"}>
              Published
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isEdit && post!.status === "PUBLISHED" && (
              <a href={`https://pharmabag.in/blogs/${post!.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary">
                View live ↗
              </a>
            )}
            <Button onClick={save} disabled={saving} loading={saving}>
              {status === "PUBLISHED" ? "Save & publish" : "Save draft"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal open={authorModal} onClose={() => setAuthorModal(false)} title="New author">
        <div className="space-y-3">
          <Input label="Name" value={newAuthor.name} onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })} />
          <Textarea label="Bio" rows={2} value={newAuthor.bio} onChange={(e) => setNewAuthor({ ...newAuthor, bio: e.target.value })} />
          <Button
            onClick={() => {
              if (!newAuthor.name.trim()) return toast.error("Name required");
              createAuthor.mutate(
                { name: newAuthor.name.trim(), bio: newAuthor.bio.trim() || undefined },
                {
                  onSuccess: (a) => {
                    setAuthorId(a.id);
                    setAuthorModal(false);
                    setNewAuthor({ name: "", bio: "" });
                  },
                  onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
                },
              );
            }}
            disabled={createAuthor.isPending}
          >
            Create
          </Button>
        </div>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="New category">
        <div className="space-y-3">
          <Input label="Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <Button
            onClick={() => {
              if (!newCategory.trim()) return toast.error("Name required");
              createCategory.mutate(
                { name: newCategory.trim() },
                {
                  onSuccess: (c) => {
                    setCategoryId(c.id);
                    setCategoryModal(false);
                    setNewCategory("");
                  },
                  onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
                },
              );
            }}
            disabled={createCategory.isPending}
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}
