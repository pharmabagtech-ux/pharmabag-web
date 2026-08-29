# PharmaBag Web Analytics — Phase 3 (Audience) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an admin "Audience" page (device/OS/browser breakdown, traffic-quality summary) across `pharmabag-api` and `pharmabag-web`, per the approved spec at `docs/superpowers/specs/2026-08-29-web-analytics-phase3-audience-design.md`.

**Architecture:** A pure `parseDeviceOsBrowser()` function (a trimmed port of Yukizi's reference UA parser, with the bot-detection portion removed since `bot-detector.ts` already owns that) runs once per session at ingest time, stamping device type / OS / browser onto `WebSession` — same pattern as Phase 2's `sourceCategory`. A new `GET /admin/analytics/audience?from=&to=` endpoint runs four bounded, on-demand queries (devices, OS, browsers, traffic quality). A new admin "Audience" tab renders three `BarList` breakdowns and a quality card, reusing every component Phase 1/2 already built — no new chart primitives.

**Tech Stack:** NestJS + Prisma + Postgres (`pharmabag-api`); Next.js App Router + React Query (`pharmabag-web`, `apps/admin`).

---

## Rollout order (read first)

Same two-repo, hard-dependency structure as Phases 1 and 2: `pharmabag-api` (Part A) must be merged and deployed **before** `pharmabag-web` (Part B).

- **Part A (Tasks 1–6)** → one PR against `pharmabagtech-ux/pharmabag-api`. Merge + verify deployed before starting Part B.
- **Part B (Tasks 7–12)** → one PR against `pharmabagtech-ux/pharmabag-web`. Merge + verify deployed after Part A is live.

---

# Part A — pharmabag-api

## Task 1: Prisma schema — `deviceType`, `os`, `browser` on `WebSession`

**Files:**
- Modify: `prisma/schema.prisma` (the existing `WebSession` model block)
- Create: `prisma/migrations/20260829000000_add_web_analytics_audience/migration.sql`

- [ ] **Step 1: Replace the `WebSession` model block in `prisma/schema.prisma`**

Find the existing block (starts with `model WebSession {`) and replace it with:

```prisma
model WebSession {
  id             String   @id
  visitorId      String
  userId         String?
  startedAt      DateTime @default(now())
  lastEventAt    DateTime @default(now())
  entryPage      String?
  exitPage       String?
  pageviews      Int      @default(0)
  events         Int      @default(0)
  source         String?
  medium         String?
  campaign       String?
  referrer       String?
  clickIds       Json?
  userAgent      String?
  isNewVisitor   Boolean  @default(false)
  isBot          Boolean  @default(false)
  sourceCategory String?
  referrerDomain String?
  deviceType     String?
  os             String?
  browser        String?

  @@index([visitorId])
  @@index([lastEventAt])
  @@index([sourceCategory, startedAt])
  @@index([referrerDomain])
  @@index([deviceType, startedAt])
  @@index([os, startedAt])
  @@index([browser, startedAt])
  @@map("analytics_sessions")
}
```

Only the `WebSession` block changes — three new fields and three new indexes. **Do not run `npx prisma format` on the whole file** (Phase 1 hit a real incident where that reformatted ~150 unrelated lines). Edit only this block by hand.

- [ ] **Step 2: Create the migration file**

`prisma/migrations/20260829000000_add_web_analytics_audience/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "analytics_sessions" ADD COLUMN "deviceType" TEXT;
ALTER TABLE "analytics_sessions" ADD COLUMN "os" TEXT;
ALTER TABLE "analytics_sessions" ADD COLUMN "browser" TEXT;

-- CreateIndex
CREATE INDEX "analytics_sessions_deviceType_startedAt_idx" ON "analytics_sessions"("deviceType", "startedAt");

-- CreateIndex
CREATE INDEX "analytics_sessions_os_startedAt_idx" ON "analytics_sessions"("os", "startedAt");

-- CreateIndex
CREATE INDEX "analytics_sessions_browser_startedAt_idx" ON "analytics_sessions"("browser", "startedAt");
```

- [ ] **Step 3: Generate the Prisma client**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Verify the diff is minimal**

Run: `git diff --stat prisma/schema.prisma`
Expected: only `prisma/schema.prisma` changed, confined to the `WebSession` block (3 new field lines + 3 new index lines, plus realignment of the existing lines in that block — the same pattern Phase 2's Task 1 produced). If other models show diffs, you ran a formatter — revert (`git checkout -- prisma/schema.prisma`) and redo by hand.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260829000000_add_web_analytics_audience/migration.sql
git commit -m "feat(web-analytics): add deviceType/os/browser to WebSession"
```

---

## Task 2: UA parser

**Files:**
- Create: `src/modules/web-analytics/ua-parser.ts`
- Test: `src/modules/web-analytics/ua-parser.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/modules/web-analytics/ua-parser.spec.ts`:

```ts
import { parseDeviceOsBrowser } from './ua-parser';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';
const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36';
const CHROMEOS =
  'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1';
const FIREFOX_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0';

describe('parseDeviceOsBrowser', () => {
  it('Chrome on Windows desktop', () => {
    expect(parseDeviceOsBrowser(CHROME_WIN)).toEqual({ deviceType: 'desktop', os: 'Windows', browser: 'Chrome' });
  });

  it('Safari on iPhone is mobile/iOS', () => {
    expect(parseDeviceOsBrowser(SAFARI_IPHONE)).toEqual({ deviceType: 'mobile', os: 'iOS', browser: 'Safari' });
  });

  it('Chrome on Android phone is mobile', () => {
    expect(parseDeviceOsBrowser(CHROME_ANDROID)).toMatchObject({ deviceType: 'mobile', os: 'Android', browser: 'Chrome' });
  });

  it('Android without a Mobile token is a tablet', () => {
    expect(parseDeviceOsBrowser(ANDROID_TABLET)).toMatchObject({ deviceType: 'tablet', os: 'Android' });
  });

  it('Edge is not misread as Chrome', () => {
    expect(parseDeviceOsBrowser(EDGE_WIN).browser).toBe('Edge');
  });

  it('Samsung Internet is not misread as Chrome', () => {
    expect(parseDeviceOsBrowser(SAMSUNG).browser).toBe('Samsung Internet');
  });

  it('ChromeOS is not misread as Linux', () => {
    expect(parseDeviceOsBrowser(CHROMEOS).os).toBe('ChromeOS');
  });

  it('Chrome on iOS (CriOS) is recognized as Chrome, on iOS', () => {
    expect(parseDeviceOsBrowser(CHROME_IOS)).toMatchObject({ os: 'iOS', browser: 'Chrome' });
  });

  it('Firefox on macOS', () => {
    expect(parseDeviceOsBrowser(FIREFOX_MAC)).toEqual({ deviceType: 'desktop', os: 'macOS', browser: 'Firefox' });
  });

  it('empty or missing UA falls back to Unknown/Unknown/desktop', () => {
    expect(parseDeviceOsBrowser('')).toEqual({ deviceType: 'desktop', os: 'Unknown', browser: 'Unknown' });
    expect(parseDeviceOsBrowser(null)).toEqual({ deviceType: 'desktop', os: 'Unknown', browser: 'Unknown' });
    expect(parseDeviceOsBrowser(undefined)).toEqual({ deviceType: 'desktop', os: 'Unknown', browser: 'Unknown' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/modules/web-analytics/ua-parser.spec.ts`
Expected: FAIL with `Cannot find module './ua-parser'`

- [ ] **Step 3: Write the implementation**

`src/modules/web-analytics/ua-parser.ts`:

```ts
/**
 * Minimal dependency-free user-agent classification: device type, OS, and
 * browser family for analytics breakdowns — not a full parser. Order of
 * checks matters throughout — e.g. Edge contains "Chrome", Chrome contains
 * "Safari", Android contains "Linux", ChromeOS contains "Linux".
 *
 * Bot detection is NOT this file's job — see bot-detector.ts, which already
 * handles that independently. Duplicating it here would create two sources
 * of truth that could disagree.
 */

export interface ParsedUa {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
}

export function parseDeviceOsBrowser(ua: string | null | undefined): ParsedUa {
  const s = (ua ?? '').trim();
  if (!s) return { deviceType: 'desktop', os: 'Unknown', browser: 'Unknown' };

  // Device type: tablet before mobile before desktop — Android tablets lack
  // "Mobile" in their UA, so the tablet check must exclude that case first.
  let deviceType: ParsedUa['deviceType'] = 'desktop';
  if (/ipad|tablet|kindle|silk|playbook/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s))) deviceType = 'tablet';
  else if (/iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(s)) deviceType = 'mobile';

  let os = 'Other';
  if (/windows nt/i.test(s)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(s)) os = 'iOS';
  else if (/android/i.test(s)) os = 'Android';
  else if (/mac os x|macintosh/i.test(s)) os = 'macOS';
  else if (/cros/i.test(s)) os = 'ChromeOS';
  else if (/linux/i.test(s)) os = 'Linux';

  let browser = 'Other';
  if (/edg(e|a|ios)?\//i.test(s)) browser = 'Edge';
  else if (/samsungbrowser\//i.test(s)) browser = 'Samsung Internet';
  else if (/opr\/|opera/i.test(s)) browser = 'Opera';
  else if (/firefox\/|fxios\//i.test(s)) browser = 'Firefox';
  else if (/crios\//i.test(s)) browser = 'Chrome';
  else if (/chrome\//i.test(s)) browser = 'Chrome';
  else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari';
  else if (/instagram/i.test(s)) browser = 'Instagram in-app';
  else if (/fbav|fb_iab/i.test(s)) browser = 'Facebook in-app';

  return { deviceType, os, browser };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/ua-parser.spec.ts`
Expected: PASS, all 10 cases green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/ua-parser.ts src/modules/web-analytics/ua-parser.spec.ts
git commit -m "feat(web-analytics): device/OS/browser UA parser"
```

---

## Task 3: Wire the UA parser into `ingest()`

**Files:**
- Modify: `src/modules/web-analytics/web-analytics.service.ts`
- Test: `src/modules/web-analytics/web-analytics.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add these two tests to the existing `describe('WebAnalyticsService.ingest', ...)` block in `web-analytics.service.spec.ts` (alongside the existing tests — do not remove any):

```ts
  it('parses and stamps deviceType/os/browser on session creation', async () => {
    const { service, tx } = buildService();

    await service.ingest(
      batch({
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      }),
    );

    expect(tx.webSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deviceType: 'desktop',
          os: 'Windows',
          browser: 'Chrome',
        }),
      }),
    );
  });

  it('does not recompute deviceType/os/browser on session update (device is fixed at session start)', async () => {
    const { service, tx } = buildService();
    tx.webVisitor.findUnique.mockResolvedValue({ id: 'visitor-1' });
    tx.webSession.findUnique.mockResolvedValue({ id: 'session-1' });

    await service.ingest(batch());

    const updateCall = tx.webSession.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('deviceType');
    expect(updateCall.data).not.toHaveProperty('os');
    expect(updateCall.data).not.toHaveProperty('browser');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts -t "deviceType"`
Expected: FAIL — `webSession.create` was not called with `deviceType`/`os`/`browser` yet.

- [ ] **Step 3: Wire the parser into `ingest()`**

In `web-analytics.service.ts`, add the import alongside the existing ones:

```ts
import { parseDeviceOsBrowser } from './ua-parser';
```

Then, inside the `if (!existingSession) { ... }` branch, compute the parsed UA alongside the existing `classified` value and add the three new fields to the `create` payload:

```ts
      if (!existingSession) {
        const classified = classifySource({
          referrer: batch.session.referrer,
          utmSource: batch.session.source,
          utmMedium: batch.session.medium,
          clickIds: batch.session.clickIds,
        });
        const ua = parseDeviceOsBrowser(batch.ua);
        await tx.webSession.create({
          data: {
            id: batch.session.id,
            visitorId: batch.visitor.id,
            userId: batch.session.userId,
            entryPage: batch.session.landingPage,
            pageviews: pageViewCount,
            events: batch.events.length,
            source: batch.session.source,
            medium: batch.session.medium,
            campaign: batch.session.campaign,
            referrer: batch.session.referrer,
            clickIds: batch.session.clickIds,
            userAgent: batch.ua,
            isNewVisitor: !existingVisitor,
            isBot,
            sourceCategory: classified.category,
            referrerDomain: classified.referrerDomain,
            deviceType: ua.deviceType,
            os: ua.os,
            browser: ua.browser,
          },
        });
      } else {
```

The `else` branch (the `update` call) must remain byte-for-byte identical — do not touch it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Verify nothing else broke**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/modules/web-analytics/web-analytics.service.ts src/modules/web-analytics/web-analytics.service.spec.ts
git commit -m "feat(web-analytics): stamp device/OS/browser at session creation"
```

---

## Task 4: `WebAnalyticsReportsService.audience()`

**Files:**
- Modify: `src/modules/web-analytics/web-analytics-reports.service.ts` (append)
- Modify: `src/modules/web-analytics/web-analytics-reports.service.spec.ts` (append)

- [ ] **Step 1: Write the failing tests**

Add this new `describe` block to the end of `web-analytics-reports.service.spec.ts` (the existing `range` constant and `buildService()` helper are already defined earlier in the file — reuse them, don't redefine):

```ts
describe('WebAnalyticsReportsService.audience', () => {
  it('returns device/os/browser breakdowns, converting bigint counts to numbers, defaulting nulls to Unknown', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ deviceType: 'desktop', visitors: BigInt(10), sessions: BigInt(12) }])
      .mockResolvedValueOnce([{ os: null, visitors: BigInt(2), sessions: BigInt(3) }])
      .mockResolvedValueOnce([{ browser: 'Chrome', visitors: BigInt(8), sessions: BigInt(9) }])
      .mockResolvedValueOnce([
        { totalSessions: BigInt(20), botSessions: BigInt(2), humanSessions: BigInt(18), lowEngagementSessions: BigInt(3) },
      ]);

    const result = await service.audience(range);

    expect(result.devices).toEqual([{ deviceType: 'desktop', visitors: 10, sessions: 12 }]);
    expect(result.os).toEqual([{ os: 'Unknown', visitors: 2, sessions: 3 }]);
    expect(result.browsers).toEqual([{ browser: 'Chrome', visitors: 8, sessions: 9 }]);
  });

  it('computes lowEngagementPct rounded to 1 decimal, based on human sessions only', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { totalSessions: BigInt(23), botSessions: BigInt(3), humanSessions: BigInt(20), lowEngagementSessions: BigInt(7) },
      ]);

    const result = await service.audience(range);

    expect(result.quality).toEqual({
      totalSessions: 23,
      botSessions: 3,
      humanSessions: 20,
      lowEngagementSessions: 7,
      lowEngagementPct: 35,
    });
  });

  it('returns lowEngagementPct 0 when there are no human sessions, avoiding a divide-by-zero', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { totalSessions: BigInt(5), botSessions: BigInt(5), humanSessions: BigInt(0), lowEngagementSessions: BigInt(0) },
      ]);

    const result = await service.audience(range);

    expect(result.quality.lowEngagementPct).toBe(0);
  });

  it('degrades the devices/os/browsers breakdowns gracefully on failure, without losing quality', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([
        { totalSessions: BigInt(1), botSessions: BigInt(0), humanSessions: BigInt(1), lowEngagementSessions: BigInt(0) },
      ]);

    const result = await service.audience(range);

    expect(result.devices).toEqual([]);
    expect(result.os).toEqual([]);
    expect(result.browsers).toEqual([]);
    expect(result.quality.totalSessions).toBe(1);
  });

  it('does not bot-filter the base session set in the quality query (it needs both to compute totals)', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([]);

    await service.audience(range);

    const qualitySql: any = prisma.$queryRaw.mock.calls[3][0];
    const sqlText = Array.isArray(qualitySql?.strings) ? qualitySql.strings.join('') : String(qualitySql);
    expect(sqlText).not.toContain('"isBot" = false');
    expect(sqlText).toContain('FILTER (WHERE s."isBot")');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics-reports.service.spec.ts -t "audience"`
Expected: FAIL — `service.audience` is not a function.

- [ ] **Step 3: Write the implementation**

Append these methods to the `WebAnalyticsReportsService` class in `web-analytics-reports.service.ts` (the existing `traffic()`, `kpis()`, `dailySeries()`, `channels()`, `referrers()` methods, the `previousPeriod()`/`toNumber()` helper functions, and the `TrafficRange`/`TrafficKpis` interfaces all stay exactly as they are — this only adds new methods to the same class):

```ts
  async audience(range: TrafficRange): Promise<{
    devices: Array<{ deviceType: string; visitors: number; sessions: number }>;
    os: Array<{ os: string; visitors: number; sessions: number }>;
    browsers: Array<{ browser: string; visitors: number; sessions: number }>;
    quality: {
      totalSessions: number;
      botSessions: number;
      humanSessions: number;
      lowEngagementSessions: number;
      lowEngagementPct: number;
    };
  }> {
    const [devices, os, browsers, quality] = await Promise.all([
      this.devices(range),
      this.osBreakdown(range),
      this.browsers(range),
      this.quality(range),
    ]);
    return { devices, os, browsers, quality };
  }

  private devices({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ deviceType: string | null; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT COALESCE(s."deviceType", 'Unknown') AS "deviceType",
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
        GROUP BY COALESCE(s."deviceType", 'Unknown')
        ORDER BY sessions DESC
      `)
      .then((rows) => rows.map((r) => ({ deviceType: r.deviceType ?? 'Unknown', visitors: toNumber(r.visitors), sessions: toNumber(r.sessions) })))
      .catch((err) => {
        this.logger.error('audience: devices query failed', err);
        return [] as Array<{ deviceType: string; visitors: number; sessions: number }>;
      });
  }

  private osBreakdown({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ os: string | null; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT COALESCE(s."os", 'Unknown') AS os,
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
        GROUP BY COALESCE(s."os", 'Unknown')
        ORDER BY sessions DESC
      `)
      .then((rows) => rows.map((r) => ({ os: r.os ?? 'Unknown', visitors: toNumber(r.visitors), sessions: toNumber(r.sessions) })))
      .catch((err) => {
        this.logger.error('audience: os query failed', err);
        return [] as Array<{ os: string; visitors: number; sessions: number }>;
      });
  }

  private browsers({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ browser: string | null; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT COALESCE(s."browser", 'Unknown') AS browser,
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
        GROUP BY COALESCE(s."browser", 'Unknown')
        ORDER BY sessions DESC
      `)
      .then((rows) => rows.map((r) => ({ browser: r.browser ?? 'Unknown', visitors: toNumber(r.visitors), sessions: toNumber(r.sessions) })))
      .catch((err) => {
        this.logger.error('audience: browsers query failed', err);
        return [] as Array<{ browser: string; visitors: number; sessions: number }>;
      });
  }

  // The headline number on this page — deliberately NOT wrapped in .catch(),
  // same reasoning as traffic()'s current-period KPIs: a genuine failure
  // here should surface as a real 500, not silently render as "all clean".
  //
  // Deliberately does NOT filter isBot in the base WHERE clause — this
  // query needs to see both bot and human sessions to report totals for
  // each, unlike every other query on this page which filters bots out.
  private async quality({ from, to }: TrafficRange) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      WITH engagement AS (
        SELECT e."sessionId", SUM((e."props"->>'engagedMs')::numeric) AS "engagedMs"
        FROM "analytics_events" e
        WHERE e."name" = 'page_engagement' AND e."isBot" = false
        GROUP BY e."sessionId"
      )
      SELECT
        COUNT(*) AS "totalSessions",
        COUNT(*) FILTER (WHERE s."isBot") AS "botSessions",
        COUNT(*) FILTER (WHERE NOT s."isBot") AS "humanSessions",
        COUNT(*) FILTER (WHERE NOT s."isBot" AND COALESCE(en."engagedMs", 0) < 5000) AS "lowEngagementSessions"
      FROM "analytics_sessions" s
      LEFT JOIN engagement en ON en."sessionId" = s."id"
      WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to}
    `);
    const row = rows[0] ?? {};
    const humanSessions = toNumber(row.humanSessions);
    const lowEngagementSessions = toNumber(row.lowEngagementSessions);
    return {
      totalSessions: toNumber(row.totalSessions),
      botSessions: toNumber(row.botSessions),
      humanSessions,
      lowEngagementSessions,
      lowEngagementPct: humanSessions > 0 ? Math.round((lowEngagementSessions / humanSessions) * 1000) / 10 : 0,
    };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics-reports.service.spec.ts`
Expected: PASS, all tests in the file green (existing `traffic()` tests + the 5 new `audience()` tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/web-analytics-reports.service.ts src/modules/web-analytics/web-analytics-reports.service.spec.ts
git commit -m "feat(web-analytics): audience report (devices, OS, browsers, traffic quality)"
```

---

## Task 5: Wire `audience()` into the admin controller

**Files:**
- Modify: `src/modules/web-analytics/web-analytics-admin.controller.ts`

No module changes needed this time — `WebAnalyticsReportsService` is already registered from Phase 2.

- [ ] **Step 1: Add the endpoint**

Add this method to the `WebAnalyticsAdminController` class, alongside the existing `realtime()` and `traffic()` methods (reusing `TrafficRangeDto` from Phase 2, already imported — no new import needed for the DTO):

```ts
  @Get('audience')
  @ApiOperation({ summary: 'Device/OS/browser breakdown and traffic-quality summary for a date range' })
  @ApiResponse({ status: 200, description: 'Audience report returned' })
  async audience(@Query() query: TrafficRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }
    const data = await this.webAnalyticsReportsService.audience({ from, to });
    return { message: 'Audience report retrieved successfully', data };
  }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest src/modules/web-analytics`
Expected: PASS — all tests in the module still green.

- [ ] **Step 3: Commit**

```bash
git add src/modules/web-analytics/web-analytics-admin.controller.ts
git commit -m "feat(web-analytics): GET /admin/analytics/audience endpoint"
```

---

## Task 6: Verify, push, open PR, merge + deploy + live-verify (Part A)

- [ ] **Step 1: Full verification**

```bash
npx prisma generate
npx tsc --noEmit
npx jest src/modules/web-analytics
```

Expected: clean typecheck, all tests passing.

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-audience-report
```

Open a PR against `pharmabagtech-ux/pharmabag-api` `main`. Title: `feat(analytics): Audience report — device/OS/browser + traffic quality (Phase 3)`. Body must state:
- This is Phase 3 of the web-analytics plan (Phases 1–2 already live). Links `docs/superpowers/specs/2026-08-29-web-analytics-phase3-audience-design.md`.
- Adds a migration (three new nullable columns on `analytics_sessions`, additive-only).
- The corresponding `pharmabag-web` PR (Part B) depends on this being merged and deployed first.

- [ ] **Step 3: Merge, watch the deploy**

```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-api --merge
gh run list -R pharmabagtech-ux/pharmabag-api --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-api --exit-status
```

Confirm the deploy log's migration step shows `20260829000000_add_web_analytics_audience` applied.

- [ ] **Step 4: Live-verify the endpoint exists and is guarded**

```powershell
try {
  $r = Invoke-WebRequest -Uri "https://www.pharmabag.in/api/admin/analytics/audience?from=2026-08-01&to=2026-08-08" -UseBasicParsing
  "StatusCode=$($r.StatusCode)"
} catch {
  "StatusCode=$($_.Exception.Response.StatusCode.value__)"
}
```

Expected: `401` (route exists, guard is active — same signature as `realtime` and `traffic`). A `404` would mean the deploy didn't pick up the new route.

---

# Part B — pharmabag-web (apps/admin)

**Do not start until Part A is merged, deployed, and live-verified above.**

## Task 7: `AnalyticsNav` — add the "Audience" tab

**Files:**
- Modify: `apps/admin/components/analytics/analytics-nav.tsx`

- [ ] **Step 1: Replace the file**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui";

const TABS = [
  { value: "platform", label: "Platform" },
  { value: "realtime", label: "Real-time" },
  { value: "traffic", label: "Traffic" },
  { value: "audience", label: "Audience" },
];

const ROUTES: Record<string, string> = {
  platform: "/analytics",
  realtime: "/analytics/realtime",
  traffic: "/analytics/traffic",
  audience: "/analytics/audience",
};

export function AnalyticsNav({ active }: { active: "platform" | "realtime" | "traffic" | "audience" }) {
  const router = useRouter();
  return (
    <Tabs
      tabs={TABS}
      active={active}
      onChange={(value) => router.push(ROUTES[value] ?? "/analytics")}
    />
  );
}
```

- [ ] **Step 2: Verify the three existing pages that use this component still compile**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors (confirms `active="platform"`, `active="realtime"`, `active="traffic"` all still satisfy the widened union type).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/components/analytics/analytics-nav.tsx
git commit -m "feat(admin): add Audience tab to AnalyticsNav"
```

---

## Task 8: API client — `getWebAnalyticsAudience`

**Files:**
- Modify: `apps/admin/api/admin.api.ts`

- [ ] **Step 1: Append after the existing `getWebAnalyticsTraffic` function**

```ts
export interface WebAnalyticsAudienceQuality {
  totalSessions: number;
  botSessions: number;
  humanSessions: number;
  lowEngagementSessions: number;
  lowEngagementPct: number;
}

export interface WebAnalyticsAudience {
  devices: Array<{ deviceType: string; visitors: number; sessions: number }>;
  os: Array<{ os: string; visitors: number; sessions: number }>;
  browsers: Array<{ browser: string; visitors: number; sessions: number }>;
  quality: WebAnalyticsAudienceQuality;
}

export async function getWebAnalyticsAudience(from: string, to: string): Promise<WebAnalyticsAudience> {
  const { data } = await apiClient.get<{ data: WebAnalyticsAudience }>(
    `/admin/analytics/audience?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
  return data.data;
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/api/admin.api.ts
git commit -m "feat(admin): getWebAnalyticsAudience API function"
```

---

## Task 9: `useWebAnalyticsAudience` hook

**Files:**
- Modify: `apps/admin/hooks/useWebAnalytics.ts`

- [ ] **Step 1: Add the import and the new hook**

In `apps/admin/hooks/useWebAnalytics.ts`, add `getWebAnalyticsAudience` to the existing import line, and append the new hook after the existing `useWebAnalyticsTraffic`:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getWebAnalyticsRealtime, getWebAnalyticsTraffic, getWebAnalyticsAudience } from "@/api/admin.api";

export function useWebAnalyticsRealtime() {
  return useQuery({
    queryKey: ["admin", "web-analytics", "realtime"],
    queryFn: getWebAnalyticsRealtime,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useWebAnalyticsTraffic(from: string, to: string) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "traffic", from, to],
    queryFn: () => getWebAnalyticsTraffic(from, to),
  });
}

export function useWebAnalyticsAudience(from: string, to: string) {
  return useQuery({
    queryKey: ["admin", "web-analytics", "audience", from, to],
    queryFn: () => getWebAnalyticsAudience(from, to),
  });
}
```

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/hooks/useWebAnalytics.ts
git commit -m "feat(admin): useWebAnalyticsAudience hook"
```

---

## Task 10: Audience page

**Files:**
- Create: `apps/admin/app/analytics/audience/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { useWebAnalyticsAudience } from "@/hooks/useWebAnalytics";

const PERIODS = [
  { k: "7d", l: "7 Days", days: 7 },
  { k: "30d", l: "30 Days", days: 30 },
  { k: "90d", l: "90 Days", days: 90 },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AudienceAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { from, to } = useMemo(() => {
    const days = PERIODS.find((p) => p.k === period)?.days ?? 30;
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: isoDate(fromDate), to: isoDate(toDate) };
  }, [period]);

  const audience = useWebAnalyticsAudience(from, to);
  const quality = audience.data?.quality;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Audience</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Devices, browsers, and traffic quality</p>
        </div>

        <AnalyticsNav active="audience" />

        {audience.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t load audience data. Retrying automatically — check back shortly.
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          {PERIODS.map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setPeriod(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                period === k ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-accent/60"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Devices">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.devices ?? []).map((d) => ({ label: d.deviceType, value: d.sessions }))} />
            )}
          </SectionCard>

          <SectionCard title="Operating systems">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.os ?? []).map((o) => ({ label: o.os, value: o.sessions }))} />
            )}
          </SectionCard>

          <SectionCard title="Browsers">
            {audience.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(audience.data?.browsers ?? []).map((b) => ({ label: b.browser, value: b.sessions }))} />
            )}
          </SectionCard>
        </div>

        <SectionCard title="Traffic quality" subtitle="Bots are stored but never mixed into the human breakdowns above">
          {audience.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3">
              <Badge variant={(quality?.botSessions ?? 0) > (quality?.humanSessions ?? 0) ? "warning" : "success"} size="md">
                {quality?.humanSessions ?? 0} human / {quality?.botSessions ?? 0} bot
              </Badge>
              <p className="text-sm text-muted-foreground">
                {quality?.lowEngagementSessions ?? 0} human sessions ({quality?.lowEngagementPct ?? 0}%) bounced in under 5 seconds.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
```

Nothing on the existing `/analytics`, `/analytics/realtime`, or `/analytics/traffic` pages changes.

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/app/analytics/audience/page.tsx
git commit -m "feat(admin): Audience analytics page"
```

---

## Task 11: Verify the admin app

- [ ] **Step 1: Full build**

```bash
cd apps/admin
npx tsc --noEmit
npx next build
```

Expected: clean typecheck; build succeeds; the route table includes `/analytics/audience` as a static (`○`) entry alongside the existing three analytics routes.

---

## Task 12: Verify, push, open PR, merge + deploy + live-verify (Part B)

- [ ] **Step 1: Full workspace verification**

```bash
pnpm install
cd apps/admin && npx tsc --noEmit && npx next build && cd ..
```

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-audience-page
```

Open a PR against `pharmabagtech-ux/pharmabag-web` `main`. Title: `feat(analytics): Audience page — devices, browsers, traffic quality (Phase 3)`. Body must state:
- **Depends on the `pharmabag-api` PR from Part A already being merged and deployed** — the new hook calls `GET /admin/analytics/audience`, which doesn't exist otherwise.
- Links the spec (`docs/superpowers/specs/2026-08-29-web-analytics-phase3-audience-design.md`) and states this is Phase 3 of 5; Phases 4–5 (Behavior, Health/Export) remain out of scope.
- No new env vars.

- [ ] **Step 3: Merge, watch the deploy**

```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-web --merge
gh run list -R pharmabagtech-ux/pharmabag-web --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-web --exit-status
```

- [ ] **Step 4: Live-verify what's checkable without admin credentials**

```powershell
try {
  $r = Invoke-WebRequest -Uri "https://admin.pharmabag.in/analytics/audience" -UseBasicParsing
  "StatusCode=$($r.StatusCode)"
} catch {
  "StatusCode=$($_.Exception.Response.StatusCode.value__)"
}
```

Expected: `200` (route deployed, not a `404`). Then grep the deployed JS chunks for a distinctive string from this page (e.g. `"Traffic quality"` or `"bounced in under 5 seconds"`) the same way earlier phases confirmed their pages' code specifically shipped, not just that some route resolves at that path.

- [ ] **Step 5: Flag for manual visual confirmation**

Ask whoever has admin access to open `https://admin.pharmabag.in/analytics/audience` and confirm the "Audience" tab appears and the page loads without errors. Since the tracker is now live and collecting real data (as of the Phase 1/2 follow-up work), this page should show real numbers, not just zeros.

---

## Self-review notes

- **Spec coverage:** every in-scope item (device/OS/browser breakdown, traffic quality with human/bot totals and low-engagement bounce rate, one consolidated endpoint, fourth `AnalyticsNav` tab, no new chart components) has a task above. Explicitly-out-of-scope items (geography, signups-by-source, retention cohort matrix, bot family identification) have no tasks, as intended.
- **Type consistency checked:** `WebAnalyticsAudience`'s shape (`devices`, `os`, `browsers`, `quality`) matches the backend `audience()` method's return type field-for-field, matches the frontend `WebAnalyticsAudience` interface, matches the page's actual field access (`audience.data?.devices`, `.os`, `.browsers`, `.quality`). `WebAnalyticsAudienceQuality`'s five fields (`totalSessions`, `botSessions`, `humanSessions`, `lowEngagementSessions`, `lowEngagementPct`) are consistent across the backend response, the frontend interface, and the page's usage.
- **Placeholder scan:** no TBD/TODO in any task; every code block is complete and copy-pasteable.
