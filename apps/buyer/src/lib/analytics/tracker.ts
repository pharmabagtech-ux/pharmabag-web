// apps/buyer/src/lib/analytics/tracker.ts
/**
 * PharmaBag first-party analytics tracker.
 *
 * Design rules:
 *  - ZERO impact on the storefront: every call is fire-and-forget, every
 *    failure is swallowed, nothing here may throw into app code.
 *  - Privacy: random UUID visitor id (no fingerprinting), no PII in events,
 *    tracking fully disabled when the browser sends DNT=1, and disabled
 *    entirely unless NEXT_PUBLIC_ANALYTICS_ENABLED is set (safety valve).
 *  - Session rule: a session ends after 30 minutes of inactivity; arriving
 *    with a different utm_source/medium/campaign than the stored session
 *    also starts a new session (campaign re-entry).
 *  - Batching: events queue in memory and flush every 5s / 20 events / on
 *    page hide via sendBeacon to the same-origin /api/track proxy.
 *
 * Public API:
 *   startTracker()               – boots once, called by AnalyticsProvider
 *   track(name, props?)          – custom events (snake_case names)
 *   pageView(path)                – called on every route change
 *   pageLeft(path)                – flushes the page being left
 *   reportScroll(pct)             – max scroll depth for the current page
 *   identify(userId)              – call once a buyer/seller logs in
 *   onVisibilityChange()          – called on document visibilitychange
 */

const VISITOR_KEY = 'pb_vid';
const SESSION_KEY = 'pb_sid';
const SESSION_LAST_ACTIVE_KEY = 'pb_sla';
const SESSION_ATTR_KEY = 'pb_sat';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH = 20;

interface QueuedEvent {
  name: string;
  ts: number;
  page?: string;
  productId?: string;
  props?: Record<string, unknown>;
}

interface SessionAttribution {
  landingPage: string;
  referrer: string;
  source?: string;
  medium?: string;
  campaign?: string;
  clickIds: Record<string, string>;
  utmSignature: string;
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let sessionIsNewForNextFlush = false;
let visitorIsNew = false;
let started = false;
let disabled = false;
let currentUserId: string | undefined;

let engagedSince: number | null = null;
let engagedAccumulatedMs = 0;
let maxScrollPct = 0;

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function analyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
}

function dntEnabled(): boolean {
  if (!hasWindow()) return true;
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1';
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let memVisitorId: string | null = null;
let memSessionId: string | null = null;
let memAttribution: SessionAttribution | null = null;
let memLastActive = 0;

function getVisitorId(): string | null {
  if (!hasWindow() || disabled) return null;
  const store = storage();
  if (!store) {
    if (!memVisitorId) { memVisitorId = uuid(); visitorIsNew = true; }
    return memVisitorId;
  }
  let id = store.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    visitorIsNew = true;
    try {
      store.setItem(VISITOR_KEY, id);
      document.cookie = `${VISITOR_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    } catch { /* ignore */ }
  }
  return id;
}

function currentUtm(): { source?: string; medium?: string; campaign?: string; clickIds: Record<string, string>; signature: string } {
  let source: string | undefined;
  let medium: string | undefined;
  let campaign: string | undefined;
  const clickIds: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    source = params.get('utm_source')?.slice(0, 200) || undefined;
    medium = params.get('utm_medium')?.slice(0, 200) || undefined;
    campaign = params.get('utm_campaign')?.slice(0, 200) || undefined;
    for (const key of ['gclid', 'fbclid', 'msclkid', 'ttclid']) {
      const v = params.get(key);
      if (v) clickIds[key] = v.slice(0, 200);
    }
  } catch { /* ignore */ }
  const signature = [source ?? '', medium ?? '', campaign ?? ''].join('|');
  return { source, medium, campaign, clickIds, signature };
}

function externalReferrer(): string {
  try {
    const ref = document.referrer;
    if (!ref) return '';
    if (new URL(ref).host === window.location.host) return '';
    return ref.slice(0, 2000);
  } catch {
    return '';
  }
}

function loadAttr(store: Storage | null): SessionAttribution | null {
  try {
    const raw = store?.getItem(SESSION_ATTR_KEY);
    return raw ? (JSON.parse(raw) as SessionAttribution) : null;
  } catch {
    return null;
  }
}

function getSessionId(): { id: string; attribution: SessionAttribution } {
  const store = storage();
  const now = Date.now();
  const { source, medium, campaign, clickIds, signature } = currentUtm();

  const lastActive = store ? Number(store.getItem(SESSION_LAST_ACTIVE_KEY) ?? 0) : memLastActive;
  const existingId = store ? store.getItem(SESSION_KEY) : memSessionId;
  const existingAttr = store ? loadAttr(store) : memAttribution;

  const timedOut = !existingId || now - lastActive > SESSION_TIMEOUT_MS;
  const newCampaign = signature !== '||' && existingAttr !== null && existingAttr.utmSignature !== signature;

  if (timedOut || newCampaign || !existingAttr) {
    const id = uuid();
    const attribution: SessionAttribution = {
      landingPage: window.location.pathname,
      referrer: externalReferrer(),
      source,
      medium,
      campaign,
      clickIds,
      utmSignature: signature,
    };
    sessionIsNewForNextFlush = true;
    memSessionId = id;
    memAttribution = attribution;
    try {
      store?.setItem(SESSION_KEY, id);
      store?.setItem(SESSION_ATTR_KEY, JSON.stringify(attribution));
    } catch { /* ignore */ }
    touchSession();
    return { id, attribution };
  }

  touchSession();
  return { id: existingId!, attribution: existingAttr };
}

function touchSession(): void {
  const now = Date.now();
  memLastActive = now;
  try {
    storage()?.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
  } catch { /* ignore */ }
}

function enqueue(event: QueuedEvent): void {
  if (!hasWindow() || disabled) return;
  queue.push(event);
  if (queue.length >= MAX_BATCH) flush();
}

export function flush(useBeacon = false): void {
  if (!hasWindow() || disabled || queue.length === 0) return;
  const visitorId = getVisitorId();
  if (!visitorId) return;
  const { id: sessionId, attribution } = getSessionId();

  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({
    visitor: { id: visitorId },
    session: {
      id: sessionId,
      isNew: sessionIsNewForNextFlush || undefined,
      isNewVisitor: visitorIsNew || undefined,
      landingPage: attribution.landingPage,
      referrer: attribution.referrer || undefined,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      clickIds: Object.keys(attribution.clickIds).length ? attribution.clickIds : undefined,
      userId: currentUserId,
    },
    events,
  });
  sessionIsNewForNextFlush = false;
  visitorIsNew = false;

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch { /* analytics must never surface errors */ }
}

export function track(name: string, props?: Record<string, unknown>, productId?: string): void {
  if (!hasWindow() || disabled) return;
  enqueue({ name: name.slice(0, 100), ts: Date.now(), page: window.location.pathname, productId, props });
  touchSession();
}

export function pageView(path: string): void {
  if (!hasWindow() || disabled) return;
  enqueue({ name: 'page_view', ts: Date.now(), page: path });
  engagedAccumulatedMs = 0;
  maxScrollPct = 0;
  engagedSince = document.visibilityState === 'visible' ? Date.now() : null;
  touchSession();
}

export function pageLeft(path: string, viaBeacon = false): void {
  if (!hasWindow() || disabled) return;
  settleEngagement();
  if (engagedAccumulatedMs > 500 || maxScrollPct > 0) {
    enqueue({
      name: 'page_engagement',
      ts: Date.now(),
      page: path,
      props: { engagedMs: Math.round(engagedAccumulatedMs), maxScroll: maxScrollPct },
    });
  }
  engagedAccumulatedMs = 0;
  maxScrollPct = 0;
  flush(viaBeacon);
}

export function reportScroll(pct: number): void {
  if (pct > maxScrollPct) maxScrollPct = Math.min(Math.round(pct), 100);
}

function settleEngagement(): void {
  if (engagedSince !== null) {
    engagedAccumulatedMs += Date.now() - engagedSince;
    engagedSince = null;
  }
}

export function onVisibilityChange(): void {
  if (!hasWindow() || disabled) return;
  if (document.visibilityState === 'hidden') {
    settleEngagement();
    flush(true);
  } else {
    engagedSince = Date.now();
  }
}

/** Call once a buyer/seller is known to be logged in. */
export function identify(userId: string): void {
  if (!hasWindow() || disabled) return;
  currentUserId = userId.slice(0, 200);
}

export function startTracker(): void {
  if (!hasWindow() || started) return;
  started = true;
  if (!analyticsEnabled() || dntEnabled()) {
    disabled = true;
    return;
  }
  getVisitorId();
  getSessionId();
  flushTimer = setInterval(() => flush(), FLUSH_INTERVAL_MS);
}
