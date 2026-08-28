# PharmaBag first-party web analytics — Phase 1 (Real-time)

**Date:** 2026-08-28
**Status:** Approved, ready for implementation planning
**Repos affected:** `pharmabag-api`, `pharmabag-web` (`apps/buyer`, `apps/admin`)

## Background

Rishi saw Yukizi's admin Real-time analytics page (active-visitors-now count, pages
currently being viewed, a live event feed, 10-second polling) and asked for the
equivalent on PharmaBag. Yukizi's full analytics system is a mature, multi-page
suite — a client-side tracker, three core Postgres tables plus a nightly rollup
table, and six admin pages (Overview, Real-time, Audience, Behavior, Traffic &
Acquisition, Health/Export).

Matching that whole suite is the confirmed goal, but it's too large for one
implementation cycle. This spec covers **Phase 1 only**: the foundation
(tracker + ingest pipeline + core schema) and the **Real-time** admin page —
the specific thing Rishi reacted to. Phases 2–5 (Overview/Traffic,
Audience, Behavior, Health/Export) are out of scope here and will each get
their own brainstorm → spec → plan cycle once Phase 1 ships and Rishi has
seen it working.

### Why phase it this way

- Real-time is the concrete thing that prompted the ask; shipping it first
  answers the actual question fastest.
- The tracker and ingest pipeline are prerequisites for every later phase —
  building them once, correctly, avoids re-instrumenting the client multiple
  times.
- Building the *full* tracker/schema now (not a stripped-down version) means
  Phases 2–5 become "add a report + a page" work against data that's already
  been accumulating since Phase 1 shipped, instead of waiting for data to
  build up once each later phase lands.

### Key difference from Yukizi's environment

Yukizi deploys to Vercel, which injects `x-vercel-ip-country/-region/-city`
headers on every request for free — their ingest proxy uses these for geo
enrichment with zero extra infrastructure and without ever storing an IP.
PharmaBag deploys to its own EC2 boxes via rsync; no such headers exist.
Since geo data is Audience-page (Phase 3) scope, **Phase 1 deliberately does
not capture or attempt geo lookup**. It does capture the raw `User-Agent`
string now (free, needs no infra) so Phase 3 can parse device/OS/browser
retroactively from data already on disk, with no gap.

## Data model

Three new Prisma models on `pharmabag-api`, deliberately trimmed from
Yukizi's reference shape to what Phase 1 needs, while still capturing raw
material later phases need (so nothing has to be backfilled):

```prisma
model WebVisitor {
  id             String   @id                    // client-generated UUID, never fingerprinted
  createdAt      DateTime @default(now())
  lastSeenAt     DateTime @default(now())
  userId         String?                          // set via identify() once they log in
  firstSource    String?                          // raw utm_source / referrer domain — captured
  firstMedium    String?                          // now, classified into channels in Phase 2
  firstCampaign  String?
  firstReferrer  String?
  firstLanding   String?
  sessionsCount  Int      @default(0)
  pageviewsCount Int      @default(0)
  isBot          Boolean  @default(false)

  @@index([lastSeenAt])
  @@index([userId])
  @@map("analytics_visitors")
}

model WebSession {
  id           String   @id
  visitorId    String
  userId       String?
  startedAt    DateTime @default(now())
  lastEventAt  DateTime @default(now())
  entryPage    String?
  exitPage     String?
  pageviews    Int      @default(0)
  events       Int      @default(0)
  source       String?                            // raw, unclassified — same reasoning as above
  medium       String?
  campaign     String?
  referrer     String?
  clickIds     Json?
  userAgent    String?                             // raw string, unparsed — Phase 3 parses into
  isNewVisitor Boolean  @default(false)             // device/OS/browser
  isBot        Boolean  @default(false)

  @@index([visitorId])
  @@index([lastEventAt])
  @@map("analytics_sessions")
}

model WebEvent {
  id        String   @id @default(uuid())
  visitorId String
  sessionId String?
  name      String                                 // 'page_view' | 'page_engagement' | custom
  ts        DateTime @default(now())
  page      String?
  productId String?                                 // medicine/product id, when relevant
  props     Json?
  isBot     Boolean  @default(false)                 // denormalized from the session — see below

  @@index([ts])
  @@index([name, ts])
  @@index([visitorId, ts])
  @@map("analytics_events")
}
```

### Deliberate cuts vs. Yukizi's reference schema (Phase 2/3 work, not Phase 1)

- No `SourceCategory`/`AttributionLevel` enums yet. Raw `source`/`medium`/
  `campaign`/`referrer` are captured from day one (can't be captured
  retroactively), but classifying them into channels is a pure function of
  already-stored data — buildable in Phase 2 with zero data loss.
- No `country`/`region`/`city`/`deviceType`/`os`/`browser` columns yet — see
  "Key difference from Yukizi's environment" above. Raw `userAgent` IS
  captured now so Phase 3 can parse it retroactively.

### Deliberate improvement over Yukizi's reference

Yukizi's `WebEvent` has no `isBot` column — only `WebVisitor` and
`WebSession` do — so their real-time "pages being viewed" and "recent
events" panels are **not actually bot-filtered** (only the "active
visitors" count is, via a join to sessions). This spec denormalizes
`isBot` onto `WebEvent` directly, computed once per session and stamped
onto every event in it, so all three Real-time panels are consistently
bot-filtered with no join required.

## Client tracker

New file: `apps/buyer/src/lib/analytics/tracker.ts`. Same public contract
as Yukizi's tracker, adapted for the differences above:

- `startTracker()` — boots once; respects `Do Not Track` (no-ops entirely
  if the browser sends it); also no-ops if
  `NEXT_PUBLIC_ANALYTICS_ENABLED` is unset/false (see Safety valve below).
- `getVisitorId()` — random UUID in `localStorage`, never fingerprinted,
  mirrored to a first-party cookie for future server-side needs.
- Session handling — 30-minute inactivity timeout; a session also rotates
  early if the current UTM signature (`source|medium|campaign`) differs
  from the stored session's, so a buyer arriving from a different campaign
  within the 30-minute window is still re-attributed correctly.
- `pageView(path)` / `pageLeft(path)` — called on every route change
  (via `usePathname` in the App Router) and on page hide.
- `reportScroll(pct)` — tracks max scroll depth per page, for later
  bounce/engagement metrics (Phase 4).
- `track(name, props?)` — generic custom-event hook. Phase 1 mainly emits
  `page_view`/`page_engagement`; Phases 2–4 will add `product_view`,
  `search`, `signup_completed`, etc. without tracker changes.
- `identify(userId)` — called once when a buyer/seller logs in; sets
  `WebVisitor.userId`/`WebSession.userId` on already-existing rows. Cheap
  now, unlocks user-linked reporting later with no tracker rework.
- Batching — events queue in memory; flush every 5 seconds, at 20 queued
  events, or on page-hide via `navigator.sendBeacon`.
- Every call is fire-and-forget and swallows its own errors. Nothing in
  this module may throw into storefront code, ever.
- Wired into the buyer app's existing client-provider tree (same place the
  current `Providers` wrapper sits in `layout.tsx`) via a small new
  `AnalyticsProvider` that calls `startTracker()` once and hooks route
  changes, visibility changes, and scroll depth.

## Ingest proxy (buyer app)

New route: `apps/buyer/src/app/api/track/route.ts`. Same-origin, so
ad-blockers' third-party filters never see it.

- Reads the raw `User-Agent` header server-side and attaches it to the
  batch.
- **No geo lookup** — deferred to Phase 3 per the schema section above.
- Forwards to `POST {NEXT_PUBLIC_API_BASE_URL}/analytics/collect` on
  `pharmabag-api`, with a short timeout.
- Always responds `204`, regardless of outcome. The storefront must
  behave identically whether analytics succeeds, fails, or the backend is
  down.

## Backend ingest (`pharmabag-api`)

New `web-analytics` module (controller/service/DTO), mirroring the layout
of Yukizi's reference module:

- `POST /analytics/collect` accepts `{ visitor, session, events[] }`.
- `WebAnalyticsService.ingest()`:
  - Upserts `WebVisitor` — bump `lastSeenAt`; increment `pageviewsCount` by
    the number of `page_view` events in this batch; increment
    `sessionsCount` by 1 only when this batch starts a new session (see
    next point).
  - Upserts or rotates `WebSession` per the same 30-minute/UTM-change rule
    the client enforces — enforced server-side too, as defense in depth
    against stale `localStorage` state or a multi-tab race. On rotation,
    a new `WebSession` row is created (`isNewVisitor` set from whether the
    visitor row was just created too) and `WebVisitor.sessionsCount`
    increments. On every batch, `WebSession.events` increments by the
    batch's event count and `WebSession.pageviews` by its `page_view`
    count; `lastEventAt` and (when present) `exitPage` are updated to the
    batch's latest event.
  - Inserts `WebEvent` rows, each stamped with the session's `isBot`.
- **Bot detection**: a UA-substring heuristic (`googlebot`, `bingbot`,
  `gptbot`, `claudebot`, `perplexitybot`, `ahrefsbot`, `semrushbot`, `curl`,
  `wget`, `python-requests`, `headless`, and generic `bot`/`crawler`/
  `spider` tokens — several already named in the SEO PR's `robots.txt`),
  computed **once**, when a session is created, from the raw UA. Stamped
  onto the session and copied onto every event in it — no per-event
  recomputation.
  - Known limitation, stated plainly rather than engineered around: this
    won't catch bots that don't identify themselves in their UA, and a
    legitimate tool with an unusual UA could theoretically be
    miscounted. Good enough for "keep obvious crawler noise out of the
    active-now count"; not a security boundary.
- `identify(visitorId, userId)` — small method, called by the buyer app
  right after login.

## Backend report

New `WebAnalyticsReportsService.realtime()`:

```ts
async realtime() {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const [active, pages, recent] = await Promise.all([
    this.prisma.webSession.groupBy({
      by: ['visitorId'],
      where: { lastEventAt: { gte: since }, isBot: false },
    }),
    // "top pages by distinct visitor count in the last 5 minutes" — exact
    // Prisma call vs. raw SQL is a plan-time detail depending on how
    // cleanly Prisma expresses COUNT(DISTINCT ...) in a groupBy; shape is
    // fixed regardless.
    this.prisma.webEvent.groupBy({
      by: ['page'],
      where: { ts: { gte: since }, isBot: false, page: { not: null } },
      _count: { visitorId: true },
      orderBy: { _count: { visitorId: 'desc' } },
      take: 10,
    }),
    this.prisma.webEvent.findMany({
      where: { ts: { gte: since }, isBot: false },
      orderBy: { ts: 'desc' },
      take: 30,
      select: { name: true, ts: true, page: true, productId: true },
    }),
  ]);
  return { activeVisitors: active.length, topPages: pages, recentEvents: recent };
}
```

At PharmaBag's traffic volume, a 10-second poll against indexed queries
(`lastEventAt`, `ts`) is cheap enough that no caching layer is needed in
Phase 1.

## Admin endpoint & UI

- `GET /admin/analytics/realtime` on a new `WebAnalyticsAdminController`,
  gated by the same `@Roles(ADMIN)` guard every other admin route uses.
- New route `apps/admin/app/analytics/realtime/page.tsx`, nested under the
  existing `/analytics` section (per the decision to reuse the
  already-wired Analytics nav entry from PR #81 rather than add a
  separate top-level sidebar item).
- New small tab component `components/analytics/analytics-nav.tsx`,
  shown on both `/analytics` (the existing Platform business-metrics page
  — untouched) and the new `/analytics/realtime` — two tabs today
  ("Platform" / "Real-time"), with room to grow into Audience/Behavior/
  Traffic tabs as those phases ship.
- New hook `useWebAnalyticsRealtime()` in
  `apps/admin/hooks/useWebAnalytics.ts`, React Query with
  `refetchInterval: 10_000`.
- Page content mirrors Yukizi's: an "N active now" badge, a "Pages being
  viewed" bar list, a "Recent events" feed (event name badge + page +
  time), and a "no personal data shown" subtitle. The page only ever
  displays anonymized counts and event names — never a visitor id, IP, or
  anything identifying.

## Privacy policy update

New short section on `/privacy` (added in PR #80), same honest tone as
the rest of that page:

> **Analytics and tracking.** PharmaBag uses first-party analytics to
> understand how the site is used — page views, navigation paths and
> approximate session length. This does not use cookies for tracking (a
> random id is stored in your browser's local storage) and collects no
> personal information. Tracking is automatically disabled if your
> browser sends a Do Not Track signal. This data is never sold or shared
> with third parties.

## Safety valve

`NEXT_PUBLIC_ANALYTICS_ENABLED`, same env-gating pattern used for GA4 in
the SEO PR. `startTracker()` no-ops entirely if it's unset/false. Gives an
instant kill switch (flip the env var, redeploy) if the tracker ever
misbehaves in production, without needing a code revert.

## Testing

- Unit tests: bot heuristic (known bot UAs vs. ordinary browser UAs),
  session-rotation rules (30-minute timeout, UTM-change re-attribution),
  and the `realtime()` query (bot filtering, 5-minute window) — mirroring
  Yukizi's own spec-file structure.
- `tsc --noEmit` + `next build` clean on both `apps/buyer` and
  `apps/admin`.
- Live verification after deploy: open the buyer site in two browser
  tabs, confirm the admin Real-time page shows "2 active now" and updates
  within 10 seconds.

## Rollout

Spans both repos. `pharmabag-api` (schema + ingest module) merges and
deploys first, since the buyer app's proxy calls an endpoint that must
already exist. `pharmabag-web` (tracker + proxy + admin UI) merges
second. Exact PR splitting is decided at the plan-writing stage, but this
ordering is fixed. One PR at a time, per the standing PharmaBag deploy
rule — straight to production, no staging environment.

## Out of scope for Phase 1 (future phases)

- **Phase 2** — nightly rollup table, Overview stat cards, Traffic &
  Acquisition (daily trend, channel classification, referrer domains,
  sources table).
- **Phase 3** — Audience (geo via self-hosted lookup, device/OS/browser
  parsed from the already-captured raw UA, retention cohorts).
- **Phase 4** — Behavior (a PharmaBag-specific conversion funnel — very
  different buyer flow than Yukizi's B2C funnel — top pages/products,
  site search analytics).
- **Phase 5** — Health & Export (tracking-health check, CSV export).

Each gets its own brainstorm → spec → plan → build cycle.
