// apps/buyer/src/app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * First-party analytics ingest proxy.
 *
 * Same-origin path — invisible to ad-blockers' third-party filters. Reads the
 * raw User-Agent and the client IP server-side and attaches both.
 *
 * The IP is forwarded so the API can resolve country/state/city from its local
 * GeoLite2 database; it is used for that lookup and then discarded, never
 * stored. It must be read here rather than in the API because the API only
 * ever sees this proxy as its peer.
 *
 * Always answers 204 no matter what: the storefront must behave identically
 * whether analytics works or not.
 */

const MAX_BODY_BYTES = 32 * 1024;

/** Loopback, private and link-local ranges — never geo-locatable. */
function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('127.')) return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.') || ip.startsWith('fe80:')) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  const m = /^172\.(\d{1,3})\./.exec(ip);
  return !!m && Number(m[1]) >= 16 && Number(m[1]) <= 31;
}

/**
 * The visitor's address, taken from the left-most PUBLIC entry of the
 * forwarding chain.
 *
 * `x-forwarded-for` is appended to by each hop, so position 0 is normally the
 * client — but a request that passed through nginx on the same box arrives as
 * "127.0.0.1, <real ip>", and taking position 0 blindly would geo-locate our
 * own server for every single visitor. Private entries are therefore skipped.
 */
function clientIp(req: NextRequest): string | undefined {
  const candidates = [
    ...(req.headers.get('x-forwarded-for')?.split(',') ?? []),
    req.headers.get('x-real-ip') ?? '',
  ];
  for (const raw of candidates) {
    let ip = raw.trim().replace(/^\[|\]$/g, '');
    if (!ip) continue;
    const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(ip);
    if (withPort) ip = withPort[1];
    if (isPrivateIp(ip)) continue;
    return ip.slice(0, 64);
  }
  return undefined;
}

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
    body.ip = clientIp(req);

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
