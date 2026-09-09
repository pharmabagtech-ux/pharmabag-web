import { NextResponse } from 'next/server';
import {
  bodyToHtml,
  listLandingPages,
  resolvePageDefaults,
} from '@/lib/seo/defaults/resolve';

/**
 * What the storefront GENERATES for a landing page, read by the admin panel.
 *
 * The admin editor opens showing exactly what the live page says, so an editor
 * can see the current wording before changing it. That content is produced by
 * the storefront's own template functions, so this route exists to expose them
 * rather than copying them into the admin app where they would drift.
 *
 * Read-only. It writes nothing, and it reveals nothing a visitor cannot
 * already read on the page itself.
 *
 *   GET /api/seo/page-defaults?path=/categories/ayurvedic  -> one page
 *   GET /api/seo/page-defaults?list=1                      -> every page
 */

export const dynamic = 'force-dynamic';

/**
 * The admin app is served from a different host, so the browser needs an
 * explicit allowance. Configured rather than wildcarded: this is a same-origin
 * app talking to its sibling, not a public API.
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_ADMIN_ORIGIN,
  'https://admin.pharmabag.in',
  'http://localhost:3002',
].filter(Boolean) as string[];

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headers = {
    ...corsHeaders(request.headers.get('origin')),
    'Cache-Control': 'private, max-age=60',
  };

  if (url.searchParams.get('list')) {
    const listed = await listLandingPages();
    return NextResponse.json(listed, { headers });
  }

  const path = url.searchParams.get('path');
  if (!path) {
    return NextResponse.json(
      { error: 'path query parameter is required' },
      { status: 400, headers },
    );
  }

  const resolved = await resolvePageDefaults(path);
  if (!resolved) {
    return NextResponse.json(
      { error: 'Not a generated landing page', path },
      { status: 404, headers },
    );
  }

  const { defaults, pageType, label } = resolved;

  return NextResponse.json(
    {
      pageType,
      label,
      path: resolved.path,
      defaults: {
        title: defaults.title,
        description: defaults.description,
        keywords: defaults.keywords,
        h1: defaults.h1,
        intro: defaults.intro,
        faq: defaults.faqs,
        bodyHtml: bodyToHtml(defaults.body),
      },
    },
    { headers },
  );
}
