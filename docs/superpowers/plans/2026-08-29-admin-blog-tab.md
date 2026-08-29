# Admin Blog Tab Implementation Plan (Admin SEO Suite — Part 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin panel a full blog manager (list, rich-text editor, authors, categories, per-post SEO controls) against the already-existing `/admin/blogs` API.

**Architecture:** Two PR trains. API first (tiny: relax `categoryId` to optional, add an admin `blog-image` upload route), then the admin UI (new `/blog` pages, TipTap editor, shared `SeoFieldsPanel`) plus one defensive fix in the buyer post renderer. All admin data access follows the existing `api/*.api.ts` + `hooks/use*.ts` + react-query conventions.

**Tech Stack:** NestJS + Prisma (API), Next.js 14 app router, TanStack Query v5, react-hot-toast, TipTap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`) — new deps in `apps/admin` ONLY.

**Repos/branches:**
- API: clone `C:\pbbuild\api-audit`, branch `feat/blog-tab-api-support` off freshly-fetched `origin/main`. Push via gh account `Coder-EraOfMarketing` (origin is NOT a fork).
- Web: clone `C:\pbbuild\web-audit`, branch `feat/admin-blog-tab` off freshly-fetched `origin/main`. Push to remote `fork` via gh account `Server-eraofmarketing`, cross-fork PR to `pharmabagtech-ux/pharmabag-web`.
- **Network note for this machine (this session): the Bash tool has NO network. Run every `git fetch/push`, `gh`, and live HTTP call through PowerShell.** Local git (branch/add/commit), file edits and test runs work fine in Bash.
- Commit identity is already configured per-repo ("The Era of Marketing"). NEVER add a Co-Authored-By trailer.

**Verified API facts this plan relies on:**
- `@Controller('admin/blogs')`, class-level `@Roles(ADMIN)`; endpoints: `POST /`, `GET /` (QueryBlogDto: page/limit/search/categoryId/status), `GET /:id`, `PUT /:id` (UpdateBlogPostDto = PartialType(Create)), `PATCH /:id/status` ({status: 'DRAFT'|'PUBLISHED'}), `DELETE /:id`, plus `/authors` and `/categories` CRUD under the same prefix.
- List response: `{message, data: {items, meta: {total, page, limit, totalPages}}}`; items include `author` and `category` relations.
- `CreateBlogPostDto` requires `authorId` (keep) and currently requires `categoryId` (relax — schema column is nullable and the one live row has `categoryId: null`).
- Storage: `@Controller('storage')`; `POST storage/product-image` pattern to mirror; `StorageService.uploadProductImage` = `validateFile(file, ALLOWED_IMAGE_TYPES)` → `upload(file, 'product-images')` → public S3 URL. The live blog featured image already sits under `blog-images/` in the bucket.

---

## API TRAIN

### Task 1: Relax `categoryId` to optional in CreateBlogPostDto

**Files:**
- Modify: `src/modules/blog/dto/create-blog-post.dto.ts` (the `categoryId` property, ~line 49)
- Test: `src/modules/blog/dto/create-blog-post.dto.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBlogPostDto } from './create-blog-post.dto';

/**
 * `BlogPost.categoryId` is nullable in the Prisma schema and the one live post
 * carries null — but the DTO required it, so the admin UI could never create
 * an uncategorised post. authorId stays required (posts need attribution).
 */
describe('CreateBlogPostDto', () => {
  const base = {
    title: 'What is PTR pricing?',
    content: '<p>PTR is…</p>',
    authorId: '55c94c35-dee6-4b0f-8873-a51508e7c62e',
  };

  it('accepts a post with NO categoryId', async () => {
    const dto = plainToInstance(CreateBlogPostDto, base);
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'categoryId')).toHaveLength(0);
  });

  it('still rejects a non-UUID categoryId when one IS supplied', async () => {
    const dto = plainToInstance(CreateBlogPostDto, {
      ...base,
      categoryId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'categoryId')).toBe(true);
  });

  it('still requires authorId', async () => {
    const { authorId: _omitted, ...noAuthor } = base;
    const dto = plainToInstance(CreateBlogPostDto, noAuthor);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'authorId')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — expect the FIRST test to fail** (`categoryId` violation present)

Run: `npx jest create-blog-post.dto --silent`
Expected: 1 failed (accepts NO categoryId), 2 passed.

- [ ] **Step 3: Relax the DTO**

In `create-blog-post.dto.ts` replace the `categoryId` block:

```ts
  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
```

(`ApiPropertyOptional` is already imported in this file for other fields; `IsOptional` likewise.)

- [ ] **Step 4: Check the service create path tolerates undefined.** Open `src/modules/blog/blog.service.ts` `createPost` — if it passes `dto.categoryId` straight into `prisma.blogPost.create`, `undefined` is fine (Prisma omits it). If it does `connect: { id: dto.categoryId }`, guard it:

```ts
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
```

Adapt to the file's actual shape — the requirement is simply: creating with no categoryId must not throw.

- [ ] **Step 5: Run the spec (3/3 green), then the full suite**

Run: `npx jest create-blog-post.dto --silent` → 3 passed.
Run: `npx jest --silent` → everything passes (224+ tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/blog/dto/create-blog-post.dto.ts src/modules/blog/dto/create-blog-post.dto.spec.ts src/modules/blog/blog.service.ts
git commit -m "fix(blog): categoryId optional on post creation, matching the nullable schema column"
```

### Task 2: `POST storage/blog-image` (ADMIN)

**Files:**
- Modify: `src/modules/storage/storage.service.ts` (new method after `uploadProductImage`)
- Modify: `src/modules/storage/storage.controller.ts` (new route after `product-image`)
- Test: `src/modules/storage/storage.blog-image.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
import { StorageService } from './storage.service';

/**
 * Blog images are public marketing assets like product images, but live under
 * their own `blog-images/` prefix (matching where the existing live post's
 * featured image already sits) so the bucket stays organised.
 */
describe('StorageService.uploadBlogImage', () => {
  const makeService = () => {
    const service = Object.create(StorageService.prototype) as StorageService;
    (service as any).bucket = 'pharmabag03';
    (service as any).region = 'ap-south-1';
    (service as any).ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const uploaded: Array<{ folder: string }> = [];
    (service as any).validateFile = jest.fn();
    (service as any).upload = jest.fn(async (_file: unknown, folder: string) => {
      uploaded.push({ folder });
      return `${folder}/fake-key.png`;
    });
    return { service, uploaded };
  };

  const file = { originalname: 'hero.png', mimetype: 'image/png', size: 1024 } as any;

  it('uploads under the blog-images/ prefix and returns the public URL', async () => {
    const { service, uploaded } = makeService();
    const url = await service.uploadBlogImage(file);
    expect(uploaded).toEqual([{ folder: 'blog-images' }]);
    expect(url).toBe('https://pharmabag03.s3.ap-south-1.amazonaws.com/blog-images/fake-key.png');
  });

  it('validates the file as an image before uploading', async () => {
    const { service } = makeService();
    await service.uploadBlogImage(file);
    expect((service as any).validateFile).toHaveBeenCalledWith(file, (service as any).ALLOWED_IMAGE_TYPES);
  });
});
```

NOTE: if `ALLOWED_IMAGE_TYPES`/`validateFile`/`upload` names differ in the real
service, mirror the real names — read `uploadProductImage` first and copy its
exact structure; the test's job is to pin folder + validation + URL shape.

- [ ] **Step 2: Run to verify failure**

Run: `npx jest storage.blog-image --silent`
Expected: FAIL — `uploadBlogImage is not a function`.

- [ ] **Step 3: Implement service method** (in `storage.service.ts`, directly after `uploadProductImage`, copying its exact style):

```ts
  async uploadBlogImage(file: Express.Multer.File): Promise<string> {
    this.validateFile(file, this.ALLOWED_IMAGE_TYPES);
    const key = await this.upload(file, 'blog-images');
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
```

- [ ] **Step 4: Add the controller route** (in `storage.controller.ts`, after the `product-image` route, mirroring its decorators exactly but ADMIN-only):

```ts
  @Post('blog-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload blog image (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileUploadBody)
  @ApiResponse({ status: 201, description: 'Image uploaded, URL returned' })
  async uploadBlogImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadBlogImage(file);
    return { message: 'Blog image uploaded', data: { url } };
  }
```

- [ ] **Step 5: Run spec (2/2), full suite, and build**

Run: `npx jest storage.blog-image --silent` → 2 passed.
Run: `npx jest --silent && npx nest build` → all green, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/modules/storage/storage.service.ts src/modules/storage/storage.controller.ts src/modules/storage/storage.blog-image.spec.ts
git commit -m "feat(storage): admin blog-image upload under blog-images/ prefix"
```

### Task 3: Push API branch + open PR (do NOT merge without the user's word)

- [ ] **Step 1 (PowerShell):** `cd C:\pbbuild\api-audit; git fetch origin; git rebase origin/main` (expect no conflicts; branch is 2 small commits)
- [ ] **Step 2 (PowerShell):** `gh auth switch --user Coder-EraOfMarketing; git push -u origin feat/blog-tab-api-support`
- [ ] **Step 3 (PowerShell):** `gh pr create --repo pharmabagtech-ux/pharmabag-api --base main --head feat/blog-tab-api-support --title "feat(blog): unblock the admin blog tab (optional categoryId + blog-image upload)" --body-file <scratchpad body file>` — body explains: admin panel is gaining a Blog tab (companion web PR); these are the two API gaps: DTO required a category the schema says is optional, and there was no admin image-upload route for blog assets.
- [ ] **Step 4:** Report PR number. Merging waits for Arko's explicit word; after merge, verify deploy run success and (unauthenticated) that `POST /api/storage/blog-image` returns 401 (route exists, guard active) via PowerShell `Invoke-WebRequest`.

---

## WEB TRAIN

### Task 4: Install TipTap in apps/admin

**Files:**
- Modify: `apps/admin/package.json`, `pnpm-lock.yaml`

- [ ] **Step 1:**

```bash
cd /c/pbbuild/web-audit && pnpm --filter admin add @tiptap/react@^2.6.0 @tiptap/starter-kit@^2.6.0 @tiptap/extension-link@^2.6.0 @tiptap/extension-image@^2.6.0
```

(pnpm needs network → run via PowerShell if Bash networking is still dead: `cd C:\pbbuild\web-audit; pnpm --filter admin add ...`.)

- [ ] **Step 2: Sanity-check the install**

```bash
node -e "require.resolve('@tiptap/react/package.json', { paths: ['C:/pbbuild/web-audit/apps/admin'] }) && console.log('OK')"
```

- [ ] **Step 3: Commit** (`package.json` + lockfile only)

```bash
git add apps/admin/package.json pnpm-lock.yaml
git commit -m "chore(admin): add TipTap for the blog editor"
```

### Task 5: Blog API client + hooks

**Files:**
- Create: `apps/admin/api/blog.api.ts`
- Create: `apps/admin/hooks/useBlog.ts`

- [ ] **Step 1: `apps/admin/api/blog.api.ts`** — follows `admin.api.ts` conventions exactly (apiClient, unwrap `data.data`):

```ts
import { apiClient } from "@/lib/apiClient";

// ─── Types (mirror the API's BlogPost/Author/Category payloads) ───

export interface BlogAuthor {
  id: string;
  name: string;
  bio?: string | null;
  avatar?: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  /** HTML string for new posts; the legacy row stores { text }. */
  content?: string | { text?: string } | null;
  featuredImage?: string | null;
  images?: string[];
  authorId: string;
  categoryId?: string | null;
  tags?: string[];
  status: "DRAFT" | "PUBLISHED";
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[];
  canonicalUrl?: string | null;
  ogImage?: string | null;
  views?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  author?: BlogAuthor;
  category?: BlogCategory | null;
}

export interface BlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorId: string;
  categoryId?: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

// ─── Posts ───

export async function getBlogPosts(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  qs.set("limit", String(params.limit ?? 50));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const { data } = await apiClient.get<{ data: { items: BlogPost[]; meta: { total: number; totalPages: number } } }>(`/admin/blogs?${qs}`);
  return data.data;
}

export async function getBlogPost(id: string) {
  const { data } = await apiClient.get<{ data: BlogPost }>(`/admin/blogs/${id}`);
  return data.data;
}

export async function createBlogPost(payload: BlogPostPayload) {
  const { data } = await apiClient.post<{ data: BlogPost }>("/admin/blogs", payload);
  return data.data;
}

export async function updateBlogPost(id: string, payload: Partial<BlogPostPayload>) {
  const { data } = await apiClient.put<{ data: BlogPost }>(`/admin/blogs/${id}`, payload);
  return data.data;
}

export async function updateBlogPostStatus(id: string, status: "DRAFT" | "PUBLISHED") {
  const { data } = await apiClient.patch<{ data: BlogPost }>(`/admin/blogs/${id}/status`, { status });
  return data.data;
}

export async function deleteBlogPost(id: string) {
  const { data } = await apiClient.delete<{ data: unknown }>(`/admin/blogs/${id}`);
  return data.data;
}

// ─── Authors / Categories ───

export async function getBlogAuthors() {
  const { data } = await apiClient.get<{ data: BlogAuthor[] }>("/admin/blogs/authors");
  return data.data;
}

export async function createBlogAuthor(payload: { name: string; bio?: string; avatar?: string }) {
  const { data } = await apiClient.post<{ data: BlogAuthor }>("/admin/blogs/authors", payload);
  return data.data;
}

export async function getBlogCategories() {
  const { data } = await apiClient.get<{ data: BlogCategory[] }>("/admin/blogs/categories");
  return data.data;
}

export async function createBlogCategory(payload: { name: string }) {
  const { data } = await apiClient.post<{ data: BlogCategory }>("/admin/blogs/categories", payload);
  return data.data;
}

// ─── Images ───

export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ data: { url: string } }>("/storage/blog-image", formData);
  return data.data.url;
}
```

CAUTION: `GET /admin/blogs/authors` vs `GET /admin/blogs/:id` route ordering —
the API declares `authors`/`categories` routes; if `:id` uses `ParseUUIDPipe`
(it does), the literal paths still 400 IF declared after `:id`. They are
declared AFTER `:id` in the controller — but NestJS matches static segments
before params only when registered first. **Verify with a live unauthenticated
probe (expect 401 not 400/404) BEFORE building the UI**:
`Invoke-WebRequest https://api.pharmabag.in/api/admin/blogs/authors` → 401 means
the route resolves; a 400 "id must be a UUID" means route ordering must be fixed
in the API PR (move `authors`/`categories` routes ABOVE `GET :id`). If the API
change is needed, add it to the Task-3 PR before it merges.

- [ ] **Step 2: `apps/admin/hooks/useBlog.ts`** — same one-liner style as `useAdmin.ts`:

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBlogPosts, getBlogPost, createBlogPost, updateBlogPost,
  updateBlogPostStatus, deleteBlogPost,
  getBlogAuthors, createBlogAuthor, getBlogCategories, createBlogCategory,
  type BlogPostPayload,
} from "@/api/blog.api";

export function useBlogPosts(params: { page?: number; search?: string; status?: string } = {}) {
  return useQuery({ queryKey: ["admin", "blog", "posts", params], queryFn: () => getBlogPosts(params), staleTime: 30_000, retry: 1 });
}
export function useBlogPost(id: string) {
  return useQuery({ queryKey: ["admin", "blog", "post", id], queryFn: () => getBlogPost(id), enabled: !!id, retry: 1 });
}
export function useBlogAuthors() {
  return useQuery({ queryKey: ["admin", "blog", "authors"], queryFn: getBlogAuthors, staleTime: 60_000, retry: 1 });
}
export function useBlogCategories() {
  return useQuery({ queryKey: ["admin", "blog", "categories"], queryFn: getBlogCategories, staleTime: 60_000, retry: 1 });
}

function useInvalidatePosts() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["admin", "blog"] });
}

export function useCreateBlogPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: (p: BlogPostPayload) => createBlogPost(p), onSuccess: invalidate });
}
export function useUpdateBlogPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<BlogPostPayload> }) => updateBlogPost(id, payload), onSuccess: invalidate });
}
export function useUpdateBlogPostStatus() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" }) => updateBlogPostStatus(id, status), onSuccess: invalidate });
}
export function useDeleteBlogPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: (id: string) => deleteBlogPost(id), onSuccess: invalidate });
}
export function useCreateBlogAuthor() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: createBlogAuthor, onSuccess: invalidate });
}
export function useCreateBlogCategory() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: createBlogCategory, onSuccess: invalidate });
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/api/blog.api.ts apps/admin/hooks/useBlog.ts
git commit -m "feat(admin): blog api client + react-query hooks"
```

### Task 6: RichTextEditor component

**Files:**
- Create: `apps/admin/components/blog/RichTextEditor.tsx`

- [ ] **Step 1: Component** (client component; controlled via `value`/`onChange` HTML strings):

```tsx
"use client";
import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, List, ListOrdered, Quote, Link2, Image as ImageIcon,
  Undo2, Redo2, Heading2, Heading3, Pilcrow,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadBlogImage } from "@/api/blog.api";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

/**
 * The buyer storefront renders post content as raw HTML
 * (dangerouslySetInnerHTML), so this editor's output format IS the storage
 * format: a plain HTML string.
 */
export default function RichTextEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[320px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const onPickImage = useCallback(async (file: File) => {
    if (!editor) return;
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[a-z]+$/i, "") }).run();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Image upload failed");
    }
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn("p-2 rounded-lg transition-colors", active ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100");

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-2">
        <button type="button" title="Paragraph" className={btn(editor.isActive("paragraph") && !editor.isActive("heading"))} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow className="h-4 w-4" /></button>
        <button type="button" title="Heading 2" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></button>
        <button type="button" title="Heading 3" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Bold" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></button>
        <button type="button" title="Italic" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Bullet list" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></button>
        <button type="button" title="Numbered list" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" title="Quote" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Link" className={btn(editor.isActive("link"))} onClick={setLink}><Link2 className="h-4 w-4" /></button>
        <button type="button" title="Insert image" className={btn(false)} onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" title="Undo" className={btn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></button>
        <button type="button" title="Redo" className={btn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
```

NOTE: check `apps/admin/lib/utils.ts` exists with `cn` (the ui/index.tsx uses
`cn`, so the import path is discoverable there — copy whatever path
`components/ui/index.tsx` imports `cn` from). If the admin app lacks Tailwind's
`prose` classes (no @tailwindcss/typography), REPLACE the `prose prose-sm
max-w-none` classes with plain `text-sm leading-relaxed [&_h2]:text-lg
[&_h2]:font-bold [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:mt-3 [&_ul]:list-disc
[&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2
[&_blockquote]:pl-3 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full` —
do NOT add the typography plugin just for this.

- [ ] **Step 2: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/components/blog/RichTextEditor.tsx
git commit -m "feat(admin): TipTap rich-text editor for blog posts"
```

### Task 7: SeoFieldsPanel (shared) + Google preview

**Files:**
- Create: `apps/admin/components/seo/SeoFieldsPanel.tsx`

- [ ] **Step 1: Component** (deliberately generic — Part 4 reuses it for products):

```tsx
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
  return <span className={cn("text-[11px] font-semibold", ok ? "text-emerald-600" : "text-amber-600")}>{len}/{max}</span>;
}

export default function SeoFieldsPanel({
  value, onChange, fallbackTitle, fallbackDescription, previewUrl,
  showKeywords = true, showCanonical = true,
}: Props) {
  const [open, setOpen] = useState(true);
  const [keywordDraft, setKeywordDraft] = useState("");
  const set = (patch: Partial<SeoFieldsValue>) => onChange({ ...value, ...patch });

  const previewTitle = value.metaTitle.trim() || fallbackTitle;
  const previewDesc = value.metaDescription.trim() || fallbackDescription;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800"><Search className="h-4 w-4 text-primary" /> SEO</span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          {/* Google-result preview */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Google preview</p>
            <p className="truncate text-[13px] text-gray-600">{previewUrl}</p>
            <p className="truncate text-[18px] leading-snug text-[#1a0dab]">{previewTitle}</p>
            <p className="line-clamp-2 text-[13px] text-[#4d5156]">{previewDesc}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Meta title</label>
              <Counter len={value.metaTitle.length} min={15} max={60} />
            </div>
            <Input value={value.metaTitle} placeholder={fallbackTitle} onChange={(e) => set({ metaTitle: e.target.value })} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Meta description</label>
              <Counter len={value.metaDescription.length} min={50} max={160} />
            </div>
            <Textarea rows={3} value={value.metaDescription} placeholder={fallbackDescription} onChange={(e) => set({ metaDescription: e.target.value })} />
          </div>

          {showKeywords && (
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">Keywords</label>
              <div className="flex flex-wrap items-center gap-2">
                {value.metaKeywords.map((k) => (
                  <span key={k} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {k}
                    <button type="button" onClick={() => set({ metaKeywords: value.metaKeywords.filter((x) => x !== k) })}><X className="h-3 w-3" /></button>
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
              <label className="mb-1 block text-xs font-bold text-gray-700">Canonical URL <span className="font-normal text-gray-400">(leave blank unless this content exists elsewhere first)</span></label>
              <Input value={value.canonicalUrl} placeholder="https://…" onChange={(e) => set({ canonicalUrl: e.target.value })} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">Share image (1200×630)</label>
            {value.ogImage ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.ogImage} alt="OG preview" className="h-16 w-28 rounded-lg border border-gray-200 object-cover" />
                <button type="button" className="text-xs font-semibold text-red-500" onClick={() => set({ ogImage: "" })}>Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
                <UploadCloud className="h-4 w-4" /> Upload image
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try { set({ ogImage: await uploadBlogImage(f) }); }
                    catch (err: any) { toast.error(err?.response?.data?.message || "Upload failed"); }
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
```

(If `line-clamp-2` is unavailable in the admin Tailwind config, use
`overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`.)

- [ ] **Step 2: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/components/seo/SeoFieldsPanel.tsx
git commit -m "feat(admin): shared SEO fields panel with live Google-result preview"
```

### Task 8: Posts list page `/blog`

**Files:**
- Create: `apps/admin/app/blog/page.tsx`

- [ ] **Step 1: Page** (mirror the table/tab/badge idiom of existing admin list pages — open `app/users/page.tsx` or `app/payments/page.tsx` for the local flavour before writing):

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Input, Skeleton, Tabs, EmptyState } from "@/components/ui";
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPostStatus } from "@/hooks/useBlog";
import type { BlogPost } from "@/api/blog.api";

const TABS = [
  { key: "", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "PUBLISHED", label: "Published" },
];

export default function BlogPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBlogPosts({ status: status || undefined, search: search || undefined });
  const del = useDeleteBlogPost();
  const setPostStatus = useUpdateBlogPostStatus();

  const posts: BlogPost[] = data?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500">Write and publish articles — every published post is server-rendered with its SEO fields and added to the sitemap automatically.</p>
        </div>
        <Link href="/blog/new"><Button><Plus className="mr-1 h-4 w-4" /> New post</Button></Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs tabs={TABS.map((t) => t.label)} active={TABS.findIndex((t) => t.key === status)} onChange={(i) => setStatus(TABS[i].key)} />
        <Input className="max-w-xs" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">Couldn&apos;t load posts — check the API and retry.</div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet" description="Your first article is one click away." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Category</th>
                <th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Updated</th><th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400">/blogs/{p.slug}</p>
                  </td>
                  <td className="p-3 text-gray-600">{p.author?.name ?? "—"}</td>
                  <td className="p-3 text-gray-600">{p.category?.name ?? "—"}</td>
                  <td className="p-3"><Badge variant={p.status === "PUBLISHED" ? "success" : "default"}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</Badge></td>
                  <td className="p-3 text-gray-600">{p.views ?? 0}</td>
                  <td className="p-3 text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        onClick={() =>
                          setPostStatus.mutate(
                            { id: p.id, status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
                            { onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update status") },
                          )
                        }
                      >
                        {p.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link href={`/blog/${p.id}/edit`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-4 w-4" /></Link>
                      <button
                        title="Delete"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        onClick={() => {
                          if (!window.confirm(`Delete "${p.title}" permanently?`)) return;
                          del.mutate(p.id, { onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete") });
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
```

ADAPT: the `Tabs` component's real props are `{ tabs, active, onChange }` per
`ui/index.tsx` — confirm its exact prop types before use (it may take labels or
objects); if `Badge` lacks a `success` variant, use the closest existing one.
The admin `Button` is a plain forwardRef button — check whether pages wrap it
in `<Link>` or use `router.push`; copy the local idiom.

- [ ] **Step 2: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/app/blog/page.tsx
git commit -m "feat(admin): blog posts list page"
```

### Task 9: Editor form (`/blog/new` + `/blog/[id]/edit`)

**Files:**
- Create: `apps/admin/components/blog/BlogPostForm.tsx`
- Create: `apps/admin/app/blog/new/page.tsx`
- Create: `apps/admin/app/blog/[id]/edit/page.tsx`

- [ ] **Step 1: `BlogPostForm.tsx`** — the meat. Plain `useState` form (admin app does not use react-hook-form):

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import RichTextEditor from "@/components/blog/RichTextEditor";
import SeoFieldsPanel, { type SeoFieldsValue } from "@/components/seo/SeoFieldsPanel";
import {
  useBlogAuthors, useBlogCategories, useCreateBlogAuthor, useCreateBlogCategory,
  useCreateBlogPost, useUpdateBlogPost,
} from "@/hooks/useBlog";
import { uploadBlogImage, type BlogPost, type BlogPostPayload } from "@/api/blog.api";

/** Must mirror the API's slugify exactly, or edit forms will show phantom slug changes. */
export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");
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

  const plainText = useMemo(() => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), [content]);
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

    const onError = (e: any) => toast.error(e?.response?.data?.message || e?.message || "Save failed");
    const onSuccess = () => { toast.success(status === "PUBLISHED" ? "Published" : "Saved as draft"); router.push("/blog"); };

    if (isEdit) updatePost.mutate({ id: post!.id, payload }, { onSuccess, onError });
    else createPost.mutate(payload, { onSuccess, onError });
  };

  const saving = createPost.isPending || updatePost.isPending;

  return (
    <div className="space-y-6 p-6 pb-28">
      <button onClick={() => router.push("/blog")} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> All posts
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Content column ── */}
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is PTR pricing?" />
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">pharmabag.in/blogs/</span>
              <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
            </div>
            {isEdit && post!.status === "PUBLISHED" && slug !== post!.slug && (
              <p className="mt-1 text-xs font-semibold text-amber-600">
                Changing a published post&apos;s slug breaks its old URL. (Automatic redirects arrive with the Redirects manager.)
              </p>
            )}
          </div>
          <RichTextEditor value={content} onChange={setContent} />
          <Textarea label="Excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One-or-two-sentence summary shown on the blog index and used as the default description." />
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <label className="mb-2 block text-xs font-bold text-gray-700">Featured image</label>
            {featuredImage ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredImage} alt="Featured" className="mb-2 w-full rounded-xl border border-gray-100 object-cover" />
                <button type="button" className="text-xs font-semibold text-red-500" onClick={() => setFeaturedImage("")}>Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
                <UploadCloud className="h-4 w-4" /> Upload
                <input type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (!f) return;
                    try { setFeaturedImage(await uploadBlogImage(f)); }
                    catch (err: any) { toast.error(err?.response?.data?.message || "Upload failed"); }
                  }} />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Author</label>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setAuthorModal(true)}><Plus className="h-3 w-3" /> New</button>
            </div>
            <Select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
              <option value="">Select author…</option>
              {(authors ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.name.toLowerCase() === "unknown" ? " (set a real author for SEO)" : ""}</option>
              ))}
            </Select>

            <div className="mb-1 mt-4 flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Category <span className="font-normal text-gray-400">(optional)</span></label>
              <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setCategoryModal(true)}><Plus className="h-3 w-3" /> New</button>
            </div>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            <label className="mb-1 mt-4 block text-xs font-bold text-gray-700">Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs">{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                </span>
              ))}
              <Input className="max-w-[140px]" value={tagDraft} placeholder="Add ↵"
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const t = tagDraft.trim();
                    if (t && !tags.includes(t)) setTags([...tags, t]);
                    setTagDraft("");
                  }
                }} />
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

      {/* ── Sticky publish bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 p-4 backdrop-blur lg:pl-72">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => setStatus("DRAFT")} className={status === "DRAFT" ? "font-bold text-gray-900" : "text-gray-400"}>Draft</button>
            <span className="text-gray-300">/</span>
            <button type="button" onClick={() => setStatus("PUBLISHED")} className={status === "PUBLISHED" ? "font-bold text-emerald-600" : "text-gray-400"}>Published</button>
          </div>
          <div className="flex items-center gap-3">
            {isEdit && post!.status === "PUBLISHED" && (
              <a href={`https://pharmabag.in/blogs/${post!.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary">View live ↗</a>
            )}
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : status === "PUBLISHED" ? "Save & publish" : "Save draft"}</Button>
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
              createAuthor.mutate({ name: newAuthor.name.trim(), bio: newAuthor.bio.trim() || undefined }, {
                onSuccess: (a: any) => { setAuthorId(a.id); setAuthorModal(false); setNewAuthor({ name: "", bio: "" }); },
                onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
              });
            }}
            disabled={createAuthor.isPending}
          >Create</Button>
        </div>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="New category">
        <div className="space-y-3">
          <Input label="Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
          <Button
            onClick={() => {
              if (!newCategory.trim()) return toast.error("Name required");
              createCategory.mutate({ name: newCategory.trim() }, {
                onSuccess: (c: any) => { setCategoryId(c.id); setCategoryModal(false); setNewCategory(""); },
                onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
              });
            }}
            disabled={createCategory.isPending}
          >Create</Button>
        </div>
      </Modal>
    </div>
  );
}
```

ADAPT: check whether the admin `Select` accepts children options (per
ui/index.tsx it's a forwardRef native select — yes); check the admin layout's
sidebar width for the sticky bar's `lg:pl-72` offset (read `app/layout.tsx` /
the sidebar component; use whatever left-padding the content area uses).

- [ ] **Step 2: The two pages**

`apps/admin/app/blog/new/page.tsx`:

```tsx
"use client";
import BlogPostForm from "@/components/blog/BlogPostForm";

export default function NewBlogPostPage() {
  return <BlogPostForm />;
}
```

`apps/admin/app/blog/[id]/edit/page.tsx`:

```tsx
"use client";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui";
import BlogPostForm from "@/components/blog/BlogPostForm";
import { useBlogPost } from "@/hooks/useBlog";

export default function EditBlogPostPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { data: post, isLoading, isError } = useBlogPost(id);

  if (isLoading) return <div className="space-y-4 p-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !post) return <div className="p-6 text-sm text-red-600">Couldn&apos;t load this post.</div>;
  return <BlogPostForm post={post} />;
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/components/blog/BlogPostForm.tsx apps/admin/app/blog
git commit -m "feat(admin): blog post editor with rich text + SEO panel + authors/categories"
```

### Task 10: Sidebar nav entry

**Files:**
- Modify: `apps/admin/components/layout/sidebar.tsx` (NAV array, after the Marketing entry ~line 28)

- [ ] **Step 1:** Import `Newspaper` from lucide-react alongside the existing icon imports, and add to NAV between Marketing and Settlements:

```ts
  { icon: Newspaper, label: "Blog", href: "/blog" },
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /c/pbbuild/web-audit/apps/admin && npx tsc --noEmit
git add apps/admin/components/layout/sidebar.tsx
git commit -m "feat(admin): Blog entry in sidebar nav"
```

### Task 11: Buyer post page — tolerate both content shapes

**Files:**
- Modify: `apps/buyer/src/app/blogs/[slug]/page.tsx` (~line 139, the `dangerouslySetInnerHTML` block)

- [ ] **Step 1:** The page currently does `dangerouslySetInnerHTML={{ __html: blog.content }}` — with the legacy `{text}` object shape this renders garbage. Replace with:

```tsx
            dangerouslySetInnerHTML={{
              __html:
                typeof blog.content === "string"
                  ? blog.content
                  : blog.content?.text ?? "",
            }}
```

and keep the surrounding conditional; also update its guard from `blog.content ?` to a check that the RESOLVED string is non-empty, e.g. compute above the JSX:

```tsx
  const contentHtml =
    typeof blog?.content === "string" ? blog.content : blog?.content?.text ?? "";
```

then `{contentHtml ? (<div … dangerouslySetInnerHTML={{ __html: contentHtml }} />) : (<p …>No content…</p>)}`.

- [ ] **Step 2: Typecheck buyer + commit**

```bash
cd /c/pbbuild/web-audit/apps/buyer && npx tsc --noEmit
git add "apps/buyer/src/app/blogs/[slug]/page.tsx"
git commit -m "fix(buyer): render blog content for both HTML-string and legacy {text} shapes"
```

### Task 12: Build both apps, push, PR

- [ ] **Step 1: Full builds** (jest-worker trap: chain the reinstall, verify, build; ONE app per command):

```bash
cd /c/pbbuild/web-audit && pnpm install --force && ls node_modules/.pnpm/next@14.2.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/jest-worker/processChild.js && pnpm --filter admin build
cd /c/pbbuild/web-audit && pnpm install --force && ls node_modules/.pnpm/next@14.2.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/compiled/jest-worker/processChild.js && pnpm --filter buyer build
```

Expected: both exit 0. (If a build stalls >5min with low CPU, kill and retry — documented OneDrive/pnpm quirk.)

- [ ] **Step 2 (PowerShell): push + PR**

```powershell
cd C:\pbbuild\web-audit
gh auth switch --user Server-eraofmarketing
git push -u fork feat/admin-blog-tab
gh pr create --repo pharmabagtech-ux/pharmabag-web --base main --head "Server-eraofmarketing:feat/admin-blog-tab" --title "feat(admin): Blog tab — posts, rich-text editor, authors/categories, full SEO controls" --body-file <scratchpad body file>
```

Body must state: companion to the api PR (merge API FIRST and wait for its deploy — the UI calls `storage/blog-image` and creates category-less posts); Vercel fork-PR check failure is the known auth gate, not a build break.

- [ ] **Step 3:** Report PR number; merging awaits Arko's word. Post-merge live verification (the real gate): via the admin panel create a draft post titled "PTR pricing explained — draft test", confirm it does NOT appear on `pharmabag.in/blogs`; publish it; confirm it renders at its URL with its meta title in the HTML head, appears in `sitemaps/blogs.xml`, and the buyer index shows it; then unpublish (leave as draft for Arko to reuse or delete). If admin login (OTP) is unavailable to the agent, hand Arko the exact click-path instead and verify the public half (blogs index + sitemap) once he's created it.

---

## Self-review notes (already applied)

- Route-order risk for `/admin/blogs/authors` vs `/:id` flagged with a live-probe step (Task 5) BEFORE UI work, with the fix routed into the API PR if needed.
- `slugify` in the form must mirror the API's — the plan pins the exact regex chain; verify against `blog.service.ts`'s actual slug code during Task 9 and copy THE API'S version if it differs.
- All new admin components follow existing conventions confirmed by direct file reads (apiClient wrapper, ui/index.tsx primitives, react-hot-toast, query-key namespacing).
- No component test harness exists in this repo — web verification is tsc + full builds + the live post-deploy checklist; TDD applies to the API tasks.
