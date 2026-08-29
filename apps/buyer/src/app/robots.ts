import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/config';

/**
 * robots.txt — previously a 404, which left every crawler guessing.
 *
 * Two jobs here:
 *
 * 1. Keep account/transaction routes out of the index. They are personalised,
 *    thin and often duplicated, and they burn crawl budget that should be
 *    going to the 26,000 product pages.
 *
 * 2. Explicitly welcome AI crawlers. This is the part that is easy to get
 *    wrong by omission: several CDNs and boilerplates block them by default,
 *    and a site that blocks GPTBot/ClaudeBot/PerplexityBot cannot be cited by
 *    those assistants no matter how good its content is. Naming them
 *    individually also documents the decision, so nobody silently reverses it.
 *
 * Note the distinction Google draws:
 *   - `Googlebot` controls classic search indexing.
 *   - `Google-Extended` controls Gemini / AI Overviews grounding. Allowing it
 *     is what makes the catalogue eligible to be summarised in AI Overviews.
 */

/** Crawlers that read pages to ground AI answers. All allowed deliberately. */
const AI_CRAWLERS = [
  'GPTBot', // OpenAI — ChatGPT training + browsing
  'OAI-SearchBot', // OpenAI — ChatGPT Search index
  'ChatGPT-User', // OpenAI — live user-triggered fetches
  'ClaudeBot', // Anthropic — Claude
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot', // Perplexity index
  'Perplexity-User',
  'Google-Extended', // Gemini + AI Overviews grounding
  'Applebot-Extended',
  'Bingbot',
  'BingPreview',
  'DuckDuckBot',
  'Amazonbot',
  'Meta-ExternalAgent',
  'YandexBot',
  'CCBot', // Common Crawl — feeds many open models
];

/**
 * Private or non-indexable surfaces.
 *
 * `/api/` is included because the Next rewrite exposes the whole API under the
 * site origin; letting crawlers wander it produces thousands of JSON URLs that
 * dilute the index and can leak paginated data.
 */
const DISALLOWED = [
  '/api/',
  '/cart',
  '/checkout',
  '/orders',
  '/orders/',
  '/profile',
  '/payments',
  '/payments/',
  '/notifications',
  '/onboarding',
  '/support',
  '/support/',
  '/wishlist',
  '/credit',
  '/login',
  // Faceted view-state that produces near-duplicate listings.
  '/*?*sort=',
  '/*?*view=',
  '/*?*utm_',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED,
      },
      ...AI_CRAWLERS.map((agent) => ({
        userAgent: agent,
        allow: '/',
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // The robots.txt Host directive (a Yandex extension) takes a bare
    // hostname, not a URL with scheme.
    host: SITE_URL.replace(/^https?:\/\//, ''),
  };
}
