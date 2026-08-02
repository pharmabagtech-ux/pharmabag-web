import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';
import { routes, absoluteUrl } from '@/lib/seo/url';
import { graph, articleSchema, breadcrumbSchema } from '@/lib/seo/schema';
import { squash } from '@/lib/seo/content';

/**
 * Blog post metadata and Article schema.
 *
 * The post page is a client component, so this server layout fetches the post
 * to build its `<head>` and JSON-LD. Without it every article shared the site
 * default title, which meant editorial content could not rank for its own
 * subject and could not be attributed to an author — both of which matter
 * disproportionately for EEAT in a YMYL vertical.
 *
 * The API already stores `metaTitle`, `metaDescription`, `canonicalUrl` and
 * `ogImage` per post. Those are honoured when present so an editor keeps
 * manual control, with sensible derivations as the fallback.
 */
export const revalidate = 3600;

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

interface BlogPost {
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: string;
  ogImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  author?: { name?: string };
  content?: { text?: string } | string;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/blog/posts/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const post = body?.data ?? body;
    return post?.title ? (post as BlogPost) : null;
  } catch {
    return null;
  }
}

/** Best available summary: explicit meta, then excerpt, then body text. */
function describe(post: BlogPost): string {
  if (post.metaDescription?.trim()) return post.metaDescription.trim();
  if (post.excerpt?.trim()) return squash(post.excerpt.trim(), 200);
  const text =
    typeof post.content === 'string' ? post.content : post.content?.text ?? '';
  if (text.trim()) return squash(text.replace(/<[^>]+>/g, ' ').trim(), 200);
  return `Read ${post.title} on the PharmaBag pharmaceutical industry blog.`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) {
    return buildMetadata({
      title: 'Article not found',
      description: 'Browse pharmaceutical industry articles and buying guides.',
      path: routes.blog(params.slug),
      index: false,
    });
  }

  return buildMetadata({
    title: post.metaTitle?.trim() || (post.title as string),
    description: describe(post),
    path: routes.blog(post.slug ?? params.slug),
    image: post.ogImage || post.featuredImage || null,
    type: 'article',
    publishedTime: post.publishedAt ?? post.createdAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    keywords: post.metaKeywords?.length ? post.metaKeywords : undefined,
  });
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

  if (!post) return <>{children}</>;

  const slug = post.slug ?? params.slug;
  const url = absoluteUrl(routes.blog(slug));

  const jsonLd = graph(
    breadcrumbSchema([
      { name: 'Home', path: routes.home() },
      { name: 'Articles', path: routes.blogs() },
      { name: post.title as string, path: routes.blog(slug) },
    ]),
    articleSchema({
      headline: post.title as string,
      url,
      description: describe(post),
      image: post.ogImage || post.featuredImage || null,
      datePublished: post.publishedAt ?? post.createdAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      /**
       * Only pass a real author. The API seeds "Unknown" for posts with no
       * assigned author, and publishing that as a Person node is worse than
       * falling back to the organisation as publisher.
       */
      authorName:
        post.author?.name && post.author.name.toLowerCase() !== 'unknown'
          ? post.author.name
          : null,
    }),
  );

  return (
    <>
      <JsonLd json={jsonLd} />
      {children}
    </>
  );
}
