// apps/buyer/src/app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * First-party analytics ingest proxy.
 *
 * Same-origin path — invisible to ad-blockers' third-party filters. Reads
 * the raw User-Agent server-side and attaches it (no geo lookup: PharmaBag
 * deploys to its own EC2 boxes via rsync, not Vercel, so there's no free
 * geo-header equivalent — deferred to a later phase).
 *
 * Always answers 204 no matter what: the storefront must behave identically
 * whether analytics works or not.
 */

const MAX_BODY_BYTES = 32 * 1024;

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return base ? base.replace(/\/$/, '') : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const base = apiBase();
    if (!base) return new NextResponse(null, { status: 204 });

    const declaredLength = Number(req.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

    const raw = await req.text();
    if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return new NextResponse(null, { status: 204 });
    }

    body.ua = req.headers.get('user-agent') ?? undefined;

    await fetch(`${base}/analytics/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    }).catch(() => undefined);
  } catch {
    // swallow everything — see contract above
  }
  return new NextResponse(null, { status: 204 });
}
