# PharmaBag first-party web analytics — Phase 3 (Audience)

**Date:** 2026-08-29
**Status:** Approved, ready for implementation planning
**Repos affected:** `pharmabag-api`, `pharmabag-web` (`apps/admin`)

## Background

Phases 1 and 2 shipped the tracker, ingest pipeline, admin Real-time page,
and admin Traffic page (channel/referrer breakdown). The tracker is now
live and collecting real production data.

This spec covers **Phase 3: an "Audience" admin page** — device/OS/browser
breakdown and a traffic-quality summary (bot vs human, bounce rate). It
corresponds to (a trimmed slice of) Yukizi's "Audience" page.

## Scope

**In scope for Phase 3:**
- Devices / Operating systems / Browsers breakdowns, parsed from the
  `userAgent` string already captured since Phase 1.
- Traffic quality: human vs bot session counts (reusing the existing
  `isBot` flag), and a "low engagement" bounce-rate stat (sessions with
  under 5 seconds of total engaged time, using the `page_engagement`
  events the tracker already emits).

**Explicitly out of scope for Phase 3** (deferred to a later pass):
- **Geography (countries/regions/cities).** Yukizi gets this for free
  from Vercel's edge headers (`x-vercel-ip-country` etc.); PharmaBag
  deploys to raw EC2 behind nginx/Docker Compose, with no equivalent.
  Adding it would mean standing up a GeoIP lookup (a paid API or a
  self-hosted MaxMind GeoLite2 database) — real new infrastructure, not
  a data-shape addition. Also of dubious value today: PharmaBag is an
  India-only marketplace, so a country breakdown would read "India: 100%"
  — state/city-level detail might matter later, but that still needs the
  same GeoIP investment first.
- **Signups-by-source.** Needs a new `track()` call at registration
  success that doesn't exist yet — the same instrumentation gap Phase 2
  hit for purchases. A future phase can add both signup and purchase
  tracking together rather than building this piece twice.
- **Retention cohort matrix** (week-by-week return-rate table). The most
  complex, different-in-kind piece of Yukizi's Audience page — a matrix
  UI pattern nothing else in this admin uses — and arguably more
  sophistication than a B2B wholesale marketplace needs today. New-vs-
  returning-visitor volume is already partially visible via Phase 2's
  "New visitors" KPI. A dedicated cohort view can be its own future
  addition if it turns out to matter.
- **Bot family identification** (e.g. "GPTBot: 40 sessions"). The
  existing `bot-detector.ts` (Phase 1) is a boolean check with no family
  name. Traffic quality in this phase shows bot vs human totals only;
  upgrading `bot-detector.ts` to identify specific crawlers is a
  separate, later enhancement, not bundled into a page that doesn't
  strictly need it.

## Data model

One migration, three new columns on `WebSession` — no new table, same
pattern as Phase 2's `sourceCategory`/`referrerDomain`:

```prisma
model WebSession {
  // ...existing Phase 1/2 fields...
  deviceType String?   // NEW — "desktop" | "mobile" | "tablet"
  os         String?   // NEW — "Windows" | "iOS" | "Android" | "macOS" | "ChromeOS" | "Linux" | "Other"
  browser    String?   // NEW — "Chrome" | "Safari" | "Firefox" | "Edge" | ... | "Other"
  @@index([deviceType, startedAt])
  @@index([os, startedAt])
  @@index([browser, startedAt])
}
```

Plain strings, not Prisma enums, matching Phase 2's rationale (avoids an
enum-type migration, trivially extensible).

## UA parsing

New file: `src/modules/web-analytics/ua-parser.ts` — a pure function
ported from Yukizi's reference `parseUa()`, **trimmed to drop its bot-
detection portion** (PharmaBag already has `bot-detector.ts` from Phase 1
handling that responsibility; duplicating bot logic in two files would
create two sources of truth that could disagree). The trimmed function,
`parseDeviceOsBrowser(ua)`, returns only `{ deviceType, os, browser }`:

- Device type: tablet (iPad/Android-without-"Mobile"/Kindle/etc.) before
  mobile (iPhone/Android-with-"Mobile"/etc.) before desktop, in that
  order — order matters, since e.g. Android tablets don't include
  "Mobile" in their UA but Android phones do.
- OS: Windows / iOS / Android / macOS / ChromeOS / Linux / Other, checked
  in an order that avoids one substring shadowing another (e.g. "cros"
  before the generic "linux" check, since ChromeOS UAs also contain
  "Linux").
- Browser: Edge / Samsung Internet / Opera / Firefox / Chrome (incl. iOS
  Chrome's `CriOS/` marker) / Safari / known in-app browsers (Instagram,
  Facebook), checked in an order that avoids Edge/Opera/Samsung Internet
  (all Chromium-based, all contain "Chrome" in their UA) being
  misclassified as plain Chrome.

**Classification happens once, in `WebAnalyticsService.ingest()`**, at the
same point Phase 2's `classifySource()` call already runs (session
creation only) — `parseDeviceOsBrowser(batch.ua)` stamped onto
`WebSession.deviceType`/`os`/`browser`, never recomputed on later events
in the same session (a device/browser doesn't change mid-session).

Ported as its own file with its own unit tests, mirroring the
`bot-detector.ts`/`source-classifier.ts` pattern — a pure function with
no NestJS/Prisma dependency.

## Backend: one consolidated endpoint

`GET /admin/analytics/audience?from=YYYY-MM-DD&to=YYYY-MM-DD` — reuses
`TrafficRangeDto` from Phase 2 (identical shape: two required
`@IsDateString()` fields), guarded identically to every other admin
analytics endpoint (`JwtAuthGuard`, `RolesGuard`, `@Roles(Role.ADMIN)`).

New method `WebAnalyticsReportsService.audience(range)`, running four
queries in parallel via `Promise.all`:

```ts
{
  devices:  [{ deviceType: string, visitors: number, sessions: number }],
  os:       [{ os: string, visitors: number, sessions: number }],
  browsers: [{ browser: string, visitors: number, sessions: number }],
  quality:  {
    totalSessions: number,
    botSessions: number,
    humanSessions: number,
    lowEngagementSessions: number,
    lowEngagementPct: number,   // rounded to 1 decimal, 0 when humanSessions is 0
  },
}
```

`devices`/`os`/`browsers` each `GROUP BY` the corresponding stored
column directly (`COALESCE(..., 'Unknown')` for pre-Phase-3 sessions
that predate this migration, matching Phase 2's `'UNKNOWN'` category
fallback pattern), bot-filtered, `COUNT(DISTINCT "visitorId")` for
visitors. Each of these three is isolated with its own `.catch(() => [])`
+ `Logger.error`, matching Phase 2's precedent for secondary breakdowns
(one panel's failure shouldn't sink the whole report).

`quality` is one query computing `totalSessions`/`botSessions` directly
from `analytics_sessions.isBot` in range, plus a `LEFT JOIN` to a
per-session sum of `page_engagement` event `engagedMs` (from
`analytics_events.props`) to compute the low-engagement count — a
session with **no** `page_engagement` event at all counts as 0ms engaged
(the truest bounce: it never even crossed the tracker's own 500ms/scroll
threshold for emitting that event), not as missing data to exclude. This
one query is **not** wrapped in `.catch()`, matching Phase 2's rule that
primary content should surface a real 500 on failure rather than
silently rendering misleading data — `quality` is this page's headline
number, the same role `current` KPIs play on the Traffic page.

## Frontend

**`AnalyticsNav`** (`apps/admin/components/analytics/analytics-nav.tsx`)
gains a fourth tab: `{ value: "audience", label: "Audience" }`, routing
to `/analytics/audience`. The `active` prop type widens to
`"platform" | "realtime" | "traffic" | "audience"`.

**No new chart components.** This phase reuses `SectionCard`, `BarList`,
and `Badge` — all already built in Phase 1/2 — as-is.

**New page** `apps/admin/app/analytics/audience/page.tsx`:
- Header ("Audience") + `AnalyticsNav active="audience"`.
- The same 7d/30d/90d period-picker button group as the Traffic page.
- Three-column grid: `SectionCard` "Devices", "Operating systems",
  "Browsers" — each a `BarList`.
- `SectionCard` "Traffic quality" with a `Badge` in its header area
  showing "`{humanSessions}` human / `{botSessions}` bot" (variant
  `"warning"` if bot sessions outnumber human, `"success"` otherwise,
  matching Yukizi's convention), and body text stating the
  low-engagement bounce rate ("`{lowEngagementSessions}` sessions
  (`{lowEngagementPct}`%) bounced in under 5 seconds").

**New API client + hook**, following Phase 2's exact pattern:
`getWebAnalyticsAudience(from, to)` appended to `apps/admin/api/
admin.api.ts`; `useWebAnalyticsAudience(from, to)` in the existing
`apps/admin/hooks/useWebAnalytics.ts` (a plain `useQuery`, no polling).

Nothing on the existing Platform Analytics, Real-time, or Traffic pages
changes except `AnalyticsNav` gaining a fourth tab.

## Testing

- `ua-parser.spec.ts` — unit tests covering each device/OS/browser
  branch and the ordering-sensitive cases (Edge-contains-Chrome,
  Chrome-contains-Safari, Android-tablet-lacks-"Mobile",
  ChromeOS-contains-Linux, Chrome-on-iOS's `CriOS/` marker).
- Service-level tests for the new `audience()` method: bigint
  conversion, bot-filtering, the `'Unknown'` fallback for
  pre-migration/null columns, the low-engagement calculation (including
  the zero-engagement-events-counts-as-bounced case), and the
  graceful-degradation `.catch()` path for the three breakdown queries
  (but not for `quality`, which stays uncaught by design).
- `tsc --noEmit` + `next build` on the admin app, confirming
  `/analytics/audience` appears in the route table and the existing
  three analytics routes are unaffected.

## Rollout

Same two-PR pattern as Phases 1 and 2: one PR to `pharmabag-api`
(migration + UA parser + endpoint), merged and deployed first; then one
PR to `pharmabag-web` (nav tab + page + API client/hook), merged and
deployed second. No new env vars.
