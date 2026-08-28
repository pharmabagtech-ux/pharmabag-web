# PharmaBag first-party web analytics — Phase 2 (Overview / Traffic)

**Date:** 2026-08-28
**Status:** Approved, ready for implementation planning
**Repos affected:** `pharmabag-api`, `pharmabag-web` (`apps/admin`)

## Background

Phase 1 shipped the tracker, ingest pipeline, and the admin "Real-time" page
(`docs/superpowers/specs/2026-08-28-web-analytics-phase1-realtime-design.md`).
That spec named Phases 2–5 as Overview/Traffic, Audience, Behavior, and
Health/Export, mirroring Yukizi's six-page analytics suite (Overview,
Real-time, Audience, Behavior, Traffic & Acquisition, Health/Export).

This spec covers **Phase 2: a "Traffic" admin page** — daily visitor/session
trends and acquisition-channel breakdown. It corresponds to Yukizi's
"Traffic & Acquisition" page, trimmed down (see Scope below).

**Known caveat going in:** as of this writing, PharmaBag's production
`NEXT_PUBLIC_ANALYTICS_ENABLED` env var is not yet set, so zero real
sessions have been collected. This phase builds against the schema and
ships regardless — data will start accumulating whenever that env var is
turned on, with no gap, since the tracker itself has been live since Phase 1.

## Scope

**In scope for Phase 2:**
- KPI row: Visitors, New visitors, Sessions, Page views — each with a
  vs-previous-period delta.
- Daily trend chart (visitors + sessions per day, for a selected range).
- Acquisition channels breakdown (Organic Search, Social, AI, Direct,
  Referral, Paid, Email, Video, Messaging).
- Top referrer domains.

**Explicitly out of scope for Phase 2** (deferred to a later pass, each to
get its own brainstorm → spec → plan cycle):
- Signups / Purchases / Revenue KPIs and channel-level conversion — these
  need new `track()` calls at registration-success and order-success that
  don't exist yet. Phase 2 is traffic-only; it reads only what Phase 1
  already collects.
- AI-referral traffic breakdown page section (landing pages / products
  viewed / signups from AI assistants specifically).
- UTM campaigns table.
- Source drill-down table (per-source visitor/session/pageview counts).
- A nightly rollup table / cron job. PharmaBag's traffic volume doesn't
  need one yet — see "Nightly rollup" below.

## Nightly rollup: deliberately not built

Yukizi pre-aggregates `analytics_sessions`/`analytics_events` into a
`analytics_daily` rollup table via a nightly cron job, so its dashboard
queries stay cheap at its traffic volume. PharmaBag has much lower traffic
(and zero real sessions so far). Phase 2 computes everything **on demand**
— a bounded `GROUP BY` query per report, no new table, no cron job. If
PharmaBag's traffic later grows enough that these queries get slow, a
rollup table can be added then without changing the report response
shapes the frontend depends on.

## Data model

One migration, one new column — no new table:

```prisma
model WebSession {
  // ...existing Phase 1 fields...
  sourceCategory String?   // NEW — see Source classification below
  @@index([sourceCategory, startedAt])  // NEW
}
```

`sourceCategory` is a plain nullable string, **not a Prisma enum** — this
avoids an enum-type migration and keeps the column trivially extensible if
new categories are added later. Existing rows (there should be none in
production yet) get `NULL`, which reports simply group under "Unknown".

## Source classification

New file (in the `pharmabag-api` repo): `src/modules/web-analytics/
source-classifier.ts` — a pure function ported from Yukizi's reference
implementation
(`classifySource({ referrer, utmSource, utmMedium, clickIds })` →
`{ source, category, referrerDomain }`), adapted to return a plain string
category instead of a Prisma enum member. Evidence priority, strongest
first: ad click-ids (gclid/fbclid/msclkid/ttclid) → Paid; UTM parameters →
mapped category; referrer domain → mapped via a domain rule table (Google/
Bing/DuckDuckGo → Organic Search; ChatGPT/Claude/Perplexity/Gemini/Copilot
→ AI; Instagram/Facebook/X/LinkedIn/Reddit/Pinterest/TikTok → Social;
YouTube → Video; WhatsApp/Telegram → Messaging; recognized webmail →
Email; unrecognized referrer → Referral, with the real domain kept
visible, never silently dropped into Direct); no referrer at all → Direct.

**Classification happens once, in `WebAnalyticsService.ingest()`**, at the
same point sessions are created (Phase 1's existing `ingest()` already has
every input the classifier needs — `source`, `medium`, `referrer`,
`clickIds` — right there). Stamped onto `WebSession.sourceCategory` at
write time; never recomputed at report time. This keeps every report
(this phase's and later ones') a cheap indexed `GROUP BY` instead of
re-classifying raw rows on every request.

Ported as its own file with its own unit tests (mirroring Phase 1's
`bot-detector.ts`/`bot-detector.spec.ts` pattern) — a pure function with no
NestJS/Prisma dependency, easy to test in isolation.

## Backend: one consolidated endpoint

`GET /admin/analytics/traffic?from=YYYY-MM-DD&to=YYYY-MM-DD` — both params
required, validated via a DTO (reject invalid dates, reject `to` before
`from`, same `ValidationPipe` conventions as every other endpoint in this
codebase). Guarded identically to Phase 1's realtime endpoint
(`JwtAuthGuard`, `RolesGuard`, `@Roles(Role.ADMIN)`).

One new method on `WebAnalyticsService` (or a focused new
`WebAnalyticsReportsService` if the file would otherwise grow too large —
implementation plan decides based on actual line count), running four
queries in parallel via `Promise.all`:

```ts
{
  current:  { visitors, newVisitors, sessions, pageviews },
  previous: { visitors, newVisitors, sessions, pageviews }, // immediately
                                                             // preceding
                                                             // period of
                                                             // equal length
  daily:    [{ date, visitors, sessions }],
  channels: [{ category, visitors, sessions }],
  referrers:[{ domain, visitors, sessions }],  // top 20
}
```

All four queries filter `isBot: false`, matching every existing analytics
query. `visitors` counts are `COUNT(DISTINCT "visitorId")`; `newVisitors`
is `COUNT(*) FILTER (WHERE "isNewVisitor")` — a field Phase 1's schema
already has on `WebSession`, so this needs no new column. (Yukizi's
reference KPI row also includes an average-engaged-time metric, backed by
an `engagedMs` column denormalized onto its session table; PharmaBag's
Phase 1 schema never added that column — engagement duration only exists
inside individual `WebEvent.props` for `page_engagement` events. Rather
than add a new column or a JSON-aggregation query for one KPI, Phase 2
uses `newVisitors` instead, which is both directly available and a more
directly actionable acquisition-quality signal for this page anyway.)
bigint→Number conversion follows the same pattern as Phase 1's
`realtime()`. The `daily`
query uses `date_trunc('day', "startedAt")` via `$queryRaw` (same
raw-SQL-with-`.catch(() => [])`-isolation pattern Phase 1 established for
the "top pages" query, so one query's failure doesn't take down the whole
report). `channels` groups by the new `sourceCategory` column directly.
`referrers` groups by a `referrerDomain` value computed the same way
`ingest()` already computes it (needs the same small helper Phase 1's
tracker already conceptually has client-side — server-side equivalent
lives in the new classifier file as an exported `referrerDomain()`
helper, reused by both classification and this query).

## Frontend

**`AnalyticsNav`** (`apps/admin/components/analytics/analytics-nav.tsx`)
gains a third tab: `{ value: "traffic", label: "Traffic" }`, routing to
`/analytics/traffic`. The `active` prop type widens to
`"platform" | "realtime" | "traffic"`.

**New components**, added to the existing
`apps/admin/components/analytics/charts.tsx` (alongside Phase 1's
`SectionCard`/`BarList`):
- `KpiCard({ label, value, previous, format? })` — current value, a small
  vs-previous-period delta (`+12%` in green / `-4%` in red / `—` if
  `previous` is 0), ported from Yukizi's reference implementation.
- `TrendChart({ data, series, height? })` — a `recharts` `LineChart`
  (the package is already a dependency of this admin app — no new
  package needed), ported directly from Yukizi's reference implementation
  since it has no PharmaBag-specific logic.

**New page** `apps/admin/app/analytics/traffic/page.tsx`:
- Header ("Traffic") + `AnalyticsNav active="traffic"`.
- A simple 7d/30d/90d range picker — reusing the exact button-group
  pattern already on the Platform Analytics page (`apps/admin/app/
  analytics/page.tsx`'s "Period" filter), not a new date-picker component.
- KPI row: four `KpiCard`s (Visitors, New visitors, Sessions, Page views).
- `SectionCard` with the daily `TrendChart` (visitors + sessions lines).
- Two-column grid: `SectionCard` "Acquisition channels" (`BarList`) and
  `SectionCard` "Top referrer domains" (`BarList`) — reusing Phase 1's
  existing `BarList` component unmodified.

**New API client + hook**, following Phase 1's exact pattern
(`getWebAnalyticsRealtime`/`useWebAnalyticsRealtime`):
`getWebAnalyticsTraffic(from, to)` appended to `apps/admin/api/
admin.api.ts`; `useWebAnalyticsTraffic(range)` in the existing
`apps/admin/hooks/useWebAnalytics.ts` (a plain `useQuery`, no polling —
unlike Real-time, this data doesn't need a 10-second refresh).

Nothing on the existing Platform Analytics or Real-time pages changes
except `AnalyticsNav` gaining a third tab.

## Testing

- `source-classifier.spec.ts` — unit tests covering each evidence tier
  (click-id, UTM, referrer domain, no-referrer), mirroring Yukizi's
  reference test file's coverage.
- Service-level tests for the new report method: bigint conversion,
  bot-filtering, the raw-SQL daily-trend query's graceful-degradation
  `.catch()` path (same pattern as Phase 1's `realtime()` tests).
- `tsc --noEmit` + `next build` on the admin app, confirming
  `/analytics/traffic` appears in the route table and the existing
  `/analytics` and `/analytics/realtime` routes are unaffected.

## Rollout

Same as Phase 1: one PR to `pharmabag-api` (migration + classifier +
endpoint), merged and deployed first; then one PR to `pharmabag-web`
(nav tab + page + API client/hook), merged and deployed second. No new
env vars, no new safety valve — this reads the same tracker data Phase 1
already gates behind `NEXT_PUBLIC_ANALYTICS_ENABLED`.
