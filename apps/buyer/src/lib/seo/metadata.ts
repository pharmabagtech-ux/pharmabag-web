/**
 * Metadata factory.
 *
 * Every indexable page builds its `<head>` through `buildMetadata` so that
 * canonical, OpenGraph, Twitter and robots directives can never be
 * half-specified. Before this existed the whole site shipped one hardcoded
 * title, so 26,000+ product pages were mutual duplicates in Google's eyes —
 * the single largest indexation problem on the domain.
 */
import type { Metadata } from 'next';
import { SITE_NAME, SITE_LOCALE, DEFAULT_OG_IMAGE } from './config';
import { absoluteUrl } from './url';

/**
 * Budget for the page's OWN title text, before the brand is appended.
 *
 * The root layout declares `title.template = '%s | PharmaBag'`, so Next adds
 * " | PharmaBag" (12 chars) to every page title. Clamping at 48 keeps the
 * finished title inside the ~60 characters a SERP will render.
 */
const TITLE_MAX = 48;
const DESCRIPTION_MAX = 158;

export function clampTitle(title: string): string {
  const t = title.trim().replace(/\s+/g, ' ');
  if (t.length <= TITLE_MAX) return t;
  const cut = t.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function clampDescription(description: string): string {
  const d = description.trim().replace(/\s+/g, ' ');
  if (d.length <= DESCRIPTION_MAX) return d;
  const cut = d.slice(0, DESCRIPTION_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** Site-root-relative canonical path. Always supply one. */
  path: string;
  /** Absolute or relative image URL for social cards. */
  image?: string | null;
  /** Set false for thin, private or duplicate surfaces. */
  index?: boolean;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  /** rel=prev/next equivalents for paginated collections. */
  prevPath?: string | null;
  nextPath?: string | null;
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    image,
    index = true,
    type = 'website',
    publishedTime,
    modifiedTime,
    keywords,
    prevPath,
    nextPath,
  } = input;

  /**
   * The brand is NOT appended here.
   *
   * The root layout's `title.template` already does it, and doing both
   * produced titles ending "| PharmaBag | PharmaBag" — caught by auditing the
   * rendered HTML rather than the source. Pages pass their own subject only.
   *
   * `openGraph.title` and `twitter.title` do NOT inherit the template, so the
   * brand is added explicitly for those below.
   */
  const finalTitle = clampTitle(title);
  const socialTitle = finalTitle.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? finalTitle
    : `${finalTitle} | ${SITE_NAME}`;
  const finalDescription = clampDescription(description);
  const canonical = absoluteUrl(path);
  const ogImage = image
    ? { url: absoluteUrl(image), alt: finalTitle }
    : DEFAULT_OG_IMAGE;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: keywords?.length ? keywords : undefined,
    alternates: {
      canonical,
      /**
       * Self-referencing hreflang. The catalogue is India-targeted English;
       * declaring it stops Google treating the site as ambiguously global and
       * lets it serve the right variant to en-IN searchers.
       */
      languages: { 'en-IN': canonical, 'x-default': canonical },
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            /**
             * Explicitly opting into full snippets and large image previews.
             * `max-snippet:-1` is what allows Google to quote enough of the
             * page to build an AI Overview citation; capping it suppresses
             * exactly the surface this project is trying to win.
             */
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: socialTitle,
      description: finalDescription,
      url: canonical,
      locale: SITE_LOCALE,
      images: [ogImage],
      ...(type === 'article'
        ? { publishedTime, modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: finalDescription,
      images: [typeof ogImage === 'string' ? ogImage : ogImage.url],
    },
    other: {
      ...(prevPath ? { 'link:prev': absoluteUrl(prevPath) } : {}),
      ...(nextPath ? { 'link:next': absoluteUrl(nextPath) } : {}),
    },
  };
}

/**
 * Metadata for routes that must never be indexed (account, checkout, etc.).
 *
 * Like `buildMetadata`, this passes the bare subject — the root layout's
 * `title.template` appends the brand. `follow: true` is deliberate: these
 * pages are not worth indexing, but links out of them still carry equity to
 * pages that are.
 */
export function noIndexMetadata(title: string, path = '/'): Metadata {
  return {
    title: clampTitle(title),
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: false, follow: true, nocache: true },
  };
}
