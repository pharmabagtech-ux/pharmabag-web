# PharmaBag Web Analytics — Phase 1 (Real-time) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first-party web-analytics tracker + ingest pipeline + the admin Real-time page (active-now count, pages being viewed, recent events), across `pharmabag-api` and `pharmabag-web`, per the approved spec at `docs/superpowers/specs/2026-08-28-web-analytics-phase1-realtime-design.md`.

**Architecture:** A client-side tracker in the buyer app batches page-view/engagement events and flushes them via a same-origin `/api/track` proxy to a new `pharmabag-api` `web-analytics` module, which upserts `WebVisitor`/`WebSession`/`WebEvent` rows. A new admin page polls a `realtime()` report every 10 seconds and shows active-visitor count, pages currently being viewed, and a recent-events feed — all bot-filtered.

**Tech Stack:** NestJS + Prisma + Postgres (`pharmabag-api`); Next.js App Router + React Query + axios (`pharmabag-web`, `apps/buyer` + `apps/admin`).

---

## Rollout order (read first)

This spans two repos with a hard dependency: `pharmabag-api` (Part A) must be merged and deployed **before** `pharmabag-web` (Part B), because the buyer app's ingest proxy calls an endpoint that doesn't exist until Part A ships. One PR at a time, per the standing PharmaBag deploy rule — straight to production, no staging environment.

- **Part A (Tasks 1–9)** → one PR against `pharmabagtech-ux/pharmabag-api`. Merge + verify deployed before starting Part B.
- **Part B (Tasks 10–21)** → one PR against `pharmabagtech-ux/pharmabag-web`. Merge + verify deployed after Part A is live.

---

# Part A — pharmabag-api

## Task 1: Prisma schema — WebVisitor, WebSession, WebEvent

**Files:**
- Modify: `prisma/schema.prisma` (append at end of file)
- Create: `prisma/migrations/20260828000000_add_web_analytics/migration.sql`

- [ ] **Step 1: Append the three models to `prisma/schema.prisma`**

```prisma
model WebVisitor {
  id             String   @id
  createdAt      DateTime @default(now())
  lastSeenAt     DateTime @default(now())
  userId         String?
  firstSource    String?
  firstMedium    String?
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
  source       String?
  medium       String?
  campaign     String?
  referrer     String?
  clickIds     Json?
  userAgent    String?
  isNewVisitor Boolean  @default(false)
  isBot        Boolean  @default(false)

  @@index([visitorId])
  @@index([lastEventAt])
  @@map("analytics_sessions")
}

model WebEvent {
  id        String   @id @default(uuid())
  visitorId String
  sessionId String?
  name      String
  ts        DateTime @default(now())
  page      String?
  productId String?
  props     Json?
  isBot     Boolean  @default(false)

  @@index([ts])
  @@index([name, ts])
  @@index([visitorId, ts])
  @@map("analytics_events")
}
```

- [ ] **Step 2: Generate the migration SQL**

Run: `npx prisma migrate dev --name add_web_analytics --create-only`

This creates `prisma/migrations/<timestamp>_add_web_analytics/migration.sql`. Rename the generated folder to `20260828000000_add_web_analytics` if Prisma picked a different timestamp, so it sorts correctly next to the existing `20260731000000_...` migration.

- [ ] **Step 3: Apply the migration locally and regenerate the client**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: migration applies with no errors; `@prisma/client` regenerates with `WebVisitor`, `WebSession`, `WebEvent` types available.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260828000000_add_web_analytics
git commit -m "feat(web-analytics): add WebVisitor/WebSession/WebEvent schema"
```

---

## Task 2: Bot-detection heuristic

**Files:**
- Create: `src/modules/web-analytics/bot-detector.ts`
- Test: `src/modules/web-analytics/bot-detector.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/web-analytics/bot-detector.spec.ts
import { isBotUserAgent } from './bot-detector';

describe('isBotUserAgent', () => {
  it('flags well-known crawler UAs', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) GPTBot/1.0')).toBe(true);
    expect(isBotUserAgent('ClaudeBot/1.0; +claudebot@anthropic.com')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; PerplexityBot/1.0)')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; SemrushBot/7~bl)')).toBe(true);
  });

  it('flags generic tooling UAs', () => {
    expect(isBotUserAgent('curl/8.4.0')).toBe(true);
    expect(isBotUserAgent('Wget/1.21.3')).toBe(true);
    expect(isBotUserAgent('python-requests/2.31.0')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 HeadlessChrome/120.0.0.0 Safari/537.36')).toBe(true);
  });

  it('flags generic bot/crawler/spider tokens', () => {
    expect(isBotUserAgent('SomeInternalTool-crawler/1.0')).toBe(true);
    expect(isBotUserAgent('MySpider v2')).toBe(true);
    expect(isBotUserAgent('WeirdBot')).toBe(true);
  });

  it('does not flag ordinary browser UAs', () => {
    expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false);
    expect(isBotUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1')).toBe(false);
    expect(isBotUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36')).toBe(false);
  });

  it('treats a missing user agent as a bot (never a plausible real browser)', () => {
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent('')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/modules/web-analytics/bot-detector.spec.ts`
Expected: FAIL — `Cannot find module './bot-detector'`

- [ ] **Step 3: Implement the heuristic**

```ts
// src/modules/web-analytics/bot-detector.ts

/**
 * UA-substring heuristic, computed once per session at ingest time (not
 * per-event) and stamped onto the session and every event in it.
 *
 * Known limitation, accepted deliberately: this won't catch a bot that
 * doesn't identify itself, and a legitimate tool with an unusual UA could
 * theoretically be miscounted. Good enough to keep obvious crawler noise
 * out of the Real-time "active now" count; not a security boundary.
 */
const BOT_TOKENS = [
  'bot',
  'crawler',
  'spider',
  'curl',
  'wget',
  'python-requests',
  'headless',
  'googlebot',
  'bingbot',
  'gptbot',
  'oai-searchbot',
  'claudebot',
  'claude-web',
  'perplexitybot',
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'google-extended',
];

export function isBotUserAgent(ua: string | undefined | null): boolean {
  if (!ua || ua.trim() === '') return true;
  const lower = ua.toLowerCase();
  return BOT_TOKENS.some((token) => lower.includes(token));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/modules/web-analytics/bot-detector.spec.ts`
Expected: PASS, 5/5 test suites green

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/bot-detector.ts src/modules/web-analytics/bot-detector.spec.ts
git commit -m "feat(web-analytics): UA-substring bot-detection heuristic"
```

---

## Task 3: Ingest DTOs

**Files:**
- Create: `src/modules/web-analytics/dto/collect-batch.dto.ts`

- [ ] **Step 1: Write the DTOs**

The global `ValidationPipe` runs with `whitelist: true, forbidNonWhitelisted: true, transform: true` (`src/main.ts`), so every nested object needs `@ValidateNested()` + `@Type()` from `class-transformer`, and every field the client can legitimately send must be explicitly declared or the whole request 400s.

```ts
// src/modules/web-analytics/dto/collect-batch.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ArrayMaxSize } from 'class-validator';

export class VisitorPayloadDto {
  @IsUUID()
  id: string;
}

export class SessionPayloadDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isNewVisitor?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  landingPage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @IsObject()
  clickIds?: Record<string, string>;

  // Set by the tracker's identify() once a buyer/seller is logged in.
  // Self-reported, same trust level as the rest of this analytics payload —
  // this is not an authorization boundary.
  @IsOptional()
  @IsString()
  userId?: string;
}

export class EventPayloadDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  ts: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  page?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  productId?: string;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}

export class CollectBatchDto {
  @ValidateNested()
  @Type(() => VisitorPayloadDto)
  visitor: VisitorPayloadDto;

  @ValidateNested()
  @Type(() => SessionPayloadDto)
  session: SessionPayloadDto;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EventPayloadDto)
  events: EventPayloadDto[];

  // Attached server-side by the buyer app's /api/track proxy from the raw
  // User-Agent header — never sent by the client tracker itself.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ua?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/web-analytics/dto/collect-batch.dto.ts
git commit -m "feat(web-analytics): ingest DTOs"
```

---

## Task 4: WebAnalyticsService — ingest()

**Files:**
- Create: `src/modules/web-analytics/web-analytics.service.ts`
- Test: `src/modules/web-analytics/web-analytics.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/modules/web-analytics/web-analytics.service.spec.ts
import { WebAnalyticsService } from './web-analytics.service';
import type { CollectBatchDto } from './dto/collect-batch.dto';

function buildService() {
  const tx: any = {
    webVisitor: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    webSession: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    webEvent: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const prisma: any = {
    $transaction: jest.fn().mockImplementation((cb: any) => cb(tx)),
  };
  const service = new WebAnalyticsService(prisma);
  return { service, prisma, tx };
}

const batch = (over: Partial<CollectBatchDto> = {}): CollectBatchDto =>
  ({
    visitor: { id: 'visitor-1' },
    session: {
      id: 'session-1',
      landingPage: '/products/foo',
      source: 'google',
      medium: 'cpc',
      campaign: 'summer-sale',
    },
    events: [{ name: 'page_view', ts: Date.now(), page: '/products/foo' }],
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    ...over,
  }) as CollectBatchDto;

describe('WebAnalyticsService.ingest', () => {
  it('creates a new visitor and session on first sight, with attribution captured', async () => {
    const { service, tx } = buildService();

    await service.ingest(batch());

    expect(tx.webVisitor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'visitor-1',
          firstSource: 'google',
          firstMedium: 'cpc',
          firstCampaign: 'summer-sale',
          firstLanding: '/products/foo',
          sessionsCount: 1,
          pageviewsCount: 1,
          isBot: false,
        }),
      }),
    );
    expect(tx.webSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'session-1',
          visitorId: 'visitor-1',
          entryPage: '/products/foo',
          isNewVisitor: true,
          isBot: false,
        }),
      }),
    );
    expect(tx.webEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            visitorId: 'visitor-1',
            sessionId: 'session-1',
            name: 'page_view',
            page: '/products/foo',
            isBot: false,
          }),
        ],
      }),
    );
  });

  it('updates an existing visitor/session instead of re-creating them', async () => {
    const { service, tx } = buildService();
    tx.webVisitor.findUnique.mockResolvedValue({ id: 'visitor-1' });
    tx.webSession.findUnique.mockResolvedValue({ id: 'session-1' });

    await service.ingest(batch());

    expect(tx.webVisitor.create).not.toHaveBeenCalled();
    expect(tx.webVisitor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'visitor-1' },
        data: expect.objectContaining({ pageviewsCount: { increment: 1 } }),
      }),
    );
    expect(tx.webSession.create).not.toHaveBeenCalled();
    expect(tx.webSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({
          pageviews: { increment: 1 },
          events: { increment: 1 },
        }),
      }),
    );
  });

  it('increments WebVisitor.sessionsCount only when the session row is newly created', async () => {
    const { service, tx } = buildService();
    // Visitor already exists, but this session id is new (e.g. returned after
    // 30+ minutes away) — sessionsCount must still go up.
    tx.webVisitor.findUnique.mockResolvedValue({ id: 'visitor-1' });
    tx.webSession.findUnique.mockResolvedValue(null);

    await service.ingest(batch());

    expect(tx.webSession.create).toHaveBeenCalled();
    expect(tx.webVisitor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'visitor-1' },
        data: expect.objectContaining({ sessionsCount: { increment: 1 } }),
      }),
    );
  });

  it('stamps isBot from the User-Agent onto the visitor, session, and every event', async () => {
    const { service, tx } = buildService();

    await service.ingest(batch({ ua: 'Googlebot/2.1' }));

    expect(tx.webVisitor.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isBot: true }) }),
    );
    expect(tx.webSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isBot: true }) }),
    );
    expect(tx.webEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [expect.objectContaining({ isBot: true })] }),
    );
  });

  it('propagates session.userId onto both the visitor and the session, once identified', async () => {
    const { service, tx } = buildService();
    tx.webVisitor.findUnique.mockResolvedValue({ id: 'visitor-1' });
    tx.webSession.findUnique.mockResolvedValue({ id: 'session-1' });

    await service.ingest(batch({ session: { id: 'session-1', userId: 'user-42' } as any }));

    expect(tx.webVisitor.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-42' }) }),
    );
    expect(tx.webSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-42' }) }),
    );
  });

  it('does nothing if the batch has zero events beyond the visitor/session touch', async () => {
    const { service, tx } = buildService();

    await service.ingest(batch({ events: [] }));

    expect(tx.webEvent.createMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: FAIL — `Cannot find module './web-analytics.service'`

- [ ] **Step 3: Implement the service**

```ts
// src/modules/web-analytics/web-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { isBotUserAgent } from './bot-detector';

@Injectable()
export class WebAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(batch: CollectBatchDto): Promise<void> {
    const isBot = isBotUserAgent(batch.ua);
    const now = new Date();
    const pageViewCount = batch.events.filter((e) => e.name === 'page_view').length;
    const lastEvent = batch.events[batch.events.length - 1];

    await this.prisma.$transaction(async (tx) => {
      const existingVisitor = await tx.webVisitor.findUnique({ where: { id: batch.visitor.id } });

      if (!existingVisitor) {
        await tx.webVisitor.create({
          data: {
            id: batch.visitor.id,
            userId: batch.session.userId,
            firstSource: batch.session.source,
            firstMedium: batch.session.medium,
            firstCampaign: batch.session.campaign,
            firstReferrer: batch.session.referrer,
            firstLanding: batch.session.landingPage,
            sessionsCount: 1,
            pageviewsCount: pageViewCount,
            isBot,
          },
        });
      } else {
        await tx.webVisitor.update({
          where: { id: batch.visitor.id },
          data: {
            lastSeenAt: now,
            pageviewsCount: { increment: pageViewCount },
            ...(batch.session.userId ? { userId: batch.session.userId } : {}),
          },
        });
      }

      const existingSession = await tx.webSession.findUnique({ where: { id: batch.session.id } });

      if (!existingSession) {
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
          },
        });
        if (existingVisitor) {
          await tx.webVisitor.update({
            where: { id: batch.visitor.id },
            data: { sessionsCount: { increment: 1 } },
          });
        }
      } else {
        await tx.webSession.update({
          where: { id: batch.session.id },
          data: {
            lastEventAt: now,
            pageviews: { increment: pageViewCount },
            events: { increment: batch.events.length },
            ...(lastEvent?.page ? { exitPage: lastEvent.page } : {}),
            ...(batch.session.userId ? { userId: batch.session.userId } : {}),
          },
        });
      }

      if (batch.events.length > 0) {
        await tx.webEvent.createMany({
          data: batch.events.map((e) => ({
            visitorId: batch.visitor.id,
            sessionId: batch.session.id,
            name: e.name,
            ts: new Date(e.ts),
            page: e.page,
            productId: e.productId,
            props: e.props,
            isBot,
          })),
        });
      }
    });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: PASS, 6/6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/web-analytics.service.ts src/modules/web-analytics/web-analytics.service.spec.ts
git commit -m "feat(web-analytics): ingest() — upsert visitor/session, stamp isBot"
```

---

## Task 5: WebAnalyticsService — realtime() report

**Files:**
- Modify: `src/modules/web-analytics/web-analytics.service.ts`
- Modify: `src/modules/web-analytics/web-analytics.service.spec.ts`

- [ ] **Step 1: Add the failing tests**

Append to `web-analytics.service.spec.ts`:

```ts
describe('WebAnalyticsService.realtime', () => {
  function buildRealtimeService() {
    const prisma: any = {
      webSession: {
        groupBy: jest.fn().mockResolvedValue([{ visitorId: 'v1' }, { visitorId: 'v2' }]),
      },
      webEvent: {
        findMany: jest.fn().mockResolvedValue([
          { name: 'page_view', ts: new Date(), page: '/products/foo', productId: null },
        ]),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ page: '/products/foo', visitors: BigInt(2) }]),
    };
    const service = new WebAnalyticsService(prisma);
    return { service, prisma };
  }

  it('returns active visitor count from distinct visitorIds with a recent, non-bot session', async () => {
    const { service, prisma } = buildRealtimeService();

    const result = await service.realtime();

    expect(prisma.webSession.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['visitorId'],
        where: expect.objectContaining({ isBot: false }),
      }),
    );
    expect(result.activeVisitors).toBe(2);
  });

  it('converts the raw-SQL bigint visitor counts to plain numbers for top pages', async () => {
    const { service } = buildRealtimeService();

    const result = await service.realtime();

    expect(result.topPages).toEqual([{ page: '/products/foo', visitors: 2 }]);
    expect(typeof result.topPages[0].visitors).toBe('number');
  });

  it('returns the recent events feed, most recent first, bot-filtered', async () => {
    const { service, prisma } = buildRealtimeService();

    const result = await service.realtime();

    expect(prisma.webEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isBot: false }) }),
    );
    expect(result.recentEvents).toHaveLength(1);
    expect(result.recentEvents[0].page).toBe('/products/foo');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: FAIL — `service.realtime is not a function`

- [ ] **Step 3: Implement `realtime()`**

Add to `web-analytics.service.ts`. Add the `Prisma` import at the top of the file:

```ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { isBotUserAgent } from './bot-detector';
```

Add this method to the class, after `ingest()`:

```ts
  async realtime() {
    const since = new Date(Date.now() - 5 * 60 * 1000);

    const [active, rawPages, recent] = await Promise.all([
      this.prisma.webSession.groupBy({
        by: ['visitorId'],
        where: { lastEventAt: { gte: since }, isBot: false },
      }),
      this.prisma.$queryRaw<Array<{ page: string; visitors: bigint }>>(Prisma.sql`
        SELECT e."page", COUNT(DISTINCT e."visitorId") AS visitors
        FROM "analytics_events" e
        WHERE e."ts" >= ${since} AND e."page" IS NOT NULL AND e."isBot" = false
        GROUP BY e."page" ORDER BY visitors DESC LIMIT 10
      `),
      this.prisma.webEvent.findMany({
        where: { ts: { gte: since }, isBot: false },
        orderBy: { ts: 'desc' },
        take: 30,
        select: { name: true, ts: true, page: true, productId: true },
      }),
    ]);

    // Postgres COUNT(...) comes back as a bigint via node-postgres/Prisma,
    // which JSON.stringify cannot serialize — convert before returning.
    const topPages = rawPages.map((row) => ({ page: row.page, visitors: Number(row.visitors) }));

    return { activeVisitors: active.length, topPages, recentEvents: recent };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: PASS, 9/9 tests green

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/web-analytics.service.ts src/modules/web-analytics/web-analytics.service.spec.ts
git commit -m "feat(web-analytics): realtime() report — active visitors, top pages, recent events"
```

---

## Task 6: Public ingest endpoint

**Files:**
- Create: `src/modules/web-analytics/web-analytics.controller.ts`

- [ ] **Step 1: Write the controller**

Fully public — no `@UseGuards`, so anonymous browsing is tracked too, per the spec. Explicit `@Throttle` override because the tracker can legitimately flush every 5 seconds per open tab, which the app-wide default (100 req/min/IP, `src/app.module.ts`) could clip for a busy shared IP (e.g. an office behind NAT).

```ts
// src/modules/web-analytics/web-analytics.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { WebAnalyticsService } from './web-analytics.service';

@ApiTags('Web Analytics')
@Controller('analytics')
export class WebAnalyticsController {
  constructor(private readonly webAnalyticsService: WebAnalyticsService) {}

  @Post('collect')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @ApiOperation({ summary: 'Ingest a batch of first-party analytics events (public, anonymous)' })
  @ApiResponse({ status: 204, description: 'Batch accepted' })
  async collect(@Body() batch: CollectBatchDto): Promise<void> {
    await this.webAnalyticsService.ingest(batch);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/web-analytics/web-analytics.controller.ts
git commit -m "feat(web-analytics): POST /analytics/collect ingest endpoint"
```

---

## Task 7: Admin realtime endpoint

**Files:**
- Create: `src/modules/web-analytics/web-analytics-admin.controller.ts`

- [ ] **Step 1: Write the controller**

Same guard pattern as every other admin route (`admin.controller.ts`).

```ts
// src/modules/web-analytics/web-analytics-admin.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebAnalyticsService } from './web-analytics.service';

@ApiTags('Admin — Web Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WebAnalyticsAdminController {
  constructor(private readonly webAnalyticsService: WebAnalyticsService) {}

  @Get('realtime')
  @ApiOperation({ summary: 'Active visitors, pages being viewed, and recent events (last 5 minutes)' })
  @ApiResponse({ status: 200, description: 'Realtime snapshot returned' })
  async realtime() {
    const data = await this.webAnalyticsService.realtime();
    return { message: 'Realtime analytics retrieved successfully', data };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/web-analytics/web-analytics-admin.controller.ts
git commit -m "feat(web-analytics): GET /admin/analytics/realtime endpoint"
```

---

## Task 8: Module wiring

**Files:**
- Create: `src/modules/web-analytics/web-analytics.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create the module**

```ts
// src/modules/web-analytics/web-analytics.module.ts
import { Module } from '@nestjs/common';
import { WebAnalyticsController } from './web-analytics.controller';
import { WebAnalyticsAdminController } from './web-analytics-admin.controller';
import { WebAnalyticsService } from './web-analytics.service';

@Module({
  controllers: [WebAnalyticsController, WebAnalyticsAdminController],
  providers: [WebAnalyticsService],
  exports: [WebAnalyticsService],
})
export class WebAnalyticsModule {}
```

- [ ] **Step 2: Register it in `app.module.ts`**

Add the import near the other module imports:

```ts
import { WebAnalyticsModule } from './modules/web-analytics/web-analytics.module';
```

Add `WebAnalyticsModule` to the `imports:` array (any position among the existing feature modules — e.g. next to `CustomOrdersModule`).

- [ ] **Step 3: Commit**

```bash
git add src/modules/web-analytics/web-analytics.module.ts src/app.module.ts
git commit -m "feat(web-analytics): wire WebAnalyticsModule into the app"
```

---

## Task 9: Verify, push, open PR (Part A)

- [ ] **Step 1: Full verification**

Run, in order, from the repo root:
```bash
npx prisma generate
npx tsc --noEmit
npx jest src/modules/web-analytics
npx jest
npx nest build
```
Expected: `tsc` clean; the two `web-analytics` test files pass in full; the FULL suite still passes (no regressions elsewhere); `nest build` completes with no errors.

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-realtime-ingest
```
Then open a PR against `pharmabagtech-ux/pharmabag-api` `main`, titled something like `feat(web-analytics): first-party analytics ingest + Real-time report (Phase 1)`, linking the spec at `docs/superpowers/specs/2026-08-28-web-analytics-phase1-realtime-design.md` (that file lives in the `pharmabag-web` repo — reference it by URL to that repo's blob, since specs are tracked there). Body should state plainly: new public `POST /analytics/collect` endpoint (rate-limited, no auth — anonymous visitors are tracked by design), new `GET /admin/analytics/realtime` (admin-only), three new additive Prisma tables. No existing endpoint or table is touched.

- [ ] **Step 3: Merge, watch the deploy, live-verify**

After merge (one PR at a time, per the standing rule):
```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-api --merge
gh run list -R pharmabagtech-ux/pharmabag-api --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-api --exit-status
```
Then confirm the endpoint is live and correctly rejects a malformed body (proves the route + validation pipe are both wired). The real production API base is `https://www.pharmabag.in/api` (confirmed live — do not use `api.pharmabag.in`, that domain 404s). `curl` reports spurious HTTP 000 on this host (a known standing trap) — use PowerShell's `Invoke-WebRequest`:
```powershell
try {
  Invoke-WebRequest -Uri "https://www.pharmabag.in/api/analytics/collect" -Method Post -ContentType "application/json" -Body '{}' -UseBasicParsing
} catch {
  Write-Output $_.Exception.Response.StatusCode.value__
}
```
Expected: `400` (missing required `visitor`/`session`/`events` fields) — confirms the route exists and validation is active. Do **not** move to Part B until this is confirmed live.

---

# Part B — pharmabag-web

## Task 10: Client tracker

**Files:**
- Create: `apps/buyer/src/lib/analytics/tracker.ts`

- [ ] **Step 1: Write the tracker**

No test framework exists in `apps/buyer` (confirmed: no jest config, no `.test.ts`/`.spec.ts` files anywhere in the app) — verification for this task is `tsc` + `next build` (Task 15) plus the live two-tab check (Task 21), matching how every other buyer-app change this project has been verified.

```ts
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
    store.setItem(VISITOR_KEY, id);
    try {
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

  const lastActive = Number(store?.getItem(SESSION_LAST_ACTIVE_KEY) ?? 0);
  const existingId = store ? store.getItem(SESSION_KEY) : memSessionId;
  const existingAttr = loadAttr(store);

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
  try {
    storage()?.setItem(SESSION_LAST_ACTIVE_KEY, String(Date.now()));
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
  enqueue({ name, ts: Date.now(), page: window.location.pathname, productId, props });
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
  currentUserId = userId;
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/buyer/src/lib/analytics/tracker.ts
git commit -m "feat(analytics): client-side tracker (visitor/session, batching, attribution)"
```

---

## Task 11: Ingest proxy route

**Files:**
- Create: `apps/buyer/src/app/api/track/route.ts`

- [ ] **Step 1: Write the proxy**

```ts
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

    const raw = await req.text();
    if (!raw || raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

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
```

- [ ] **Step 2: Commit**

```bash
git add apps/buyer/src/app/api/track/route.ts
git commit -m "feat(analytics): same-origin /api/track ingest proxy"
```

---

## Task 12: AnalyticsProvider — wire the tracker into the app

**Files:**
- Create: `apps/buyer/src/components/analytics/AnalyticsProvider.tsx`
- Modify: `apps/buyer/src/app/providers.tsx`

- [ ] **Step 1: Write the provider**

Hooks route changes (App Router — `usePathname`/`useSearchParams`), visibility changes, and scroll depth; calls `identify()` once `useAuth().user.id` becomes available.

```tsx
// apps/buyer/src/components/analytics/AnalyticsProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@pharmabag/api-client';
import {
  startTracker,
  pageView,
  pageLeft,
  reportScroll,
  onVisibilityChange,
  identify,
} from '@/lib/analytics/tracker';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const previousPath = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startTracker();
    document.addEventListener('visibilitychange', onVisibilityChange);
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max > 0) reportScroll((scrolled / max) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', () => pageLeft(window.location.pathname, true));
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (previousPath.current && previousPath.current !== fullPath) {
      pageLeft(previousPath.current);
    }
    if (fullPath) {
      pageView(fullPath);
      previousPath.current = fullPath;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (user?.id && user.id !== 'unknown') identify(user.id);
  }, [user?.id]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Wire it into `providers.tsx`**

```tsx
// apps/buyer/src/app/providers.tsx
'use client';

import { ReactQueryProvider } from '@/lib/react-query-provider';
import { AuthProvider } from '@pharmabag/api-client';
import { ToastProvider } from '@/components/shared/Toast';
import { useApiEventHandler } from '@/hooks/useApiEventHandler';
import LoginModal from '@/components/landing/LoginModal';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

function ApiEventBridge({ children }: { children: React.ReactNode }) {
  useApiEventHandler();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider baseURL={process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL}>
        <ToastProvider>
          <AnalyticsProvider>
            <ApiEventBridge>{children}</ApiEventBridge>
            <LoginModal />
          </AnalyticsProvider>
        </ToastProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
```

`AnalyticsProvider` sits inside `AuthProvider` (needs `useAuth()`) and wraps `ApiEventBridge`/`LoginModal` so route-change tracking covers the whole app, matching the existing nesting depth exactly — only the one new wrapping layer is added.

- [ ] **Step 3: Commit**

```bash
git add apps/buyer/src/components/analytics/AnalyticsProvider.tsx apps/buyer/src/app/providers.tsx
git commit -m "feat(analytics): wire AnalyticsProvider into the app's provider tree"
```

---

## Task 13: Safety-valve env var

**Files:**
- Modify: `apps/buyer/.env.example`

- [ ] **Step 1: Document the new env var**

Append to `apps/buyer/.env.example`:

```
# First-party analytics tracker safety valve. Must be exactly "true" to
# enable tracking; unset or any other value disables it entirely (instant
# kill switch — flip this and redeploy if the tracker ever misbehaves).
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

- [ ] **Step 2: Commit**

```bash
git add apps/buyer/.env.example
git commit -m "docs(analytics): document NEXT_PUBLIC_ANALYTICS_ENABLED"
```

**Note for whoever deploys this**: this env var must be set to `true` in the real production environment for tracking to actually turn on — it does not default to enabled. Flag this explicitly in the PR body so it isn't missed.

---

## Task 14: Privacy policy addition

**Files:**
- Modify: `apps/buyer/src/app/privacy/page.tsx`

- [ ] **Step 1: Read the current file to find the insertion point**

Read `apps/buyer/src/app/privacy/page.tsx` (written in PR #80) and locate the `SeoSection`s — insert a new one after the existing "How it is used" section and before "Who it is shared with", following the same `<SeoSection id="..." title="...">` pattern already used for every other section on that page.

- [ ] **Step 2: Add the new section**

```tsx
        <SeoSection id="analytics" title="Analytics and tracking">
          <p>
            {SITE_NAME} uses first-party analytics to understand how the site
            is used — page views, navigation paths and approximate session
            length. This does not use cookies for tracking (a random id is
            stored in your browser&apos;s local storage) and collects no
            personal information. Tracking is automatically disabled if your
            browser sends a Do Not Track signal. This data is never sold or
            shared with third parties.
          </p>
        </SeoSection>
```

- [ ] **Step 3: Commit**

```bash
git add apps/buyer/src/app/privacy/page.tsx
git commit -m "docs(privacy): disclose first-party analytics tracking"
```

---

## Task 15: Verify buyer app

- [ ] **Step 1: Type-check and build**

```bash
cd apps/buyer
npx tsc --noEmit
npx next build
```
Expected: both clean, no errors. `next build`'s route list should include `/api/track`.

- [ ] **Step 2: Commit if anything was left uncommitted**

(Only if the previous steps required fixes.)

---

## Task 16: Admin — SectionCard / BarList components

**Files:**
- Create: `apps/admin/components/analytics/charts.tsx`

- [ ] **Step 1: Write the components**

Small, focused, matching the existing admin UI's visual language (`glass-card`, `rounded-2xl`, the same Tailwind tokens used throughout `components/ui/index.tsx`).

```tsx
// apps/admin/components/analytics/charts.tsx
"use client";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function BarList({
  rows,
  emptyText = "No data yet.",
}: {
  rows: Array<{ label: string; value: number }>;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-sm text-foreground truncate flex-1 min-w-0" title={row.label}>
            {row.label}
          </span>
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground w-8 text-right flex-shrink-0">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/components/analytics/charts.tsx
git commit -m "feat(admin): SectionCard/BarList analytics chart primitives"
```

---

## Task 17: Admin — AnalyticsNav tab component

**Files:**
- Create: `apps/admin/components/analytics/analytics-nav.tsx`
- Modify: `apps/admin/app/analytics/page.tsx`

- [ ] **Step 1: Write the nav**

Two tabs today ("Platform" / "Real-time"), matching the existing `Tabs` primitive already imported by `analytics/page.tsx` (`@/components/ui`).

```tsx
// apps/admin/components/analytics/analytics-nav.tsx
"use client";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui";

const TABS = [
  { value: "platform", label: "Platform" },
  { value: "realtime", label: "Real-time" },
];

export function AnalyticsNav({ active }: { active: "platform" | "realtime" }) {
  const router = useRouter();
  return (
    <Tabs
      tabs={TABS}
      active={active}
      onChange={(value) => router.push(value === "platform" ? "/analytics" : "/analytics/realtime")}
    />
  );
}
```

- [ ] **Step 2: Wire it into the existing Platform Analytics page**

In `apps/admin/app/analytics/page.tsx`, add the import:

```tsx
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
```

Insert `<AnalyticsNav active="platform" />` immediately after the header block and before the "Top-level stats" grid:

```tsx
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive performance metrics from live data</p>
        </div>

        <AnalyticsNav active="platform" />

        {/* Top-level stats */}
```

Nothing else on this page changes — same stat cards, same charts, same top-products/sellers sections.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/components/analytics/analytics-nav.tsx apps/admin/app/analytics/page.tsx
git commit -m "feat(admin): AnalyticsNav tabs, wired into the existing Platform Analytics page"
```

---

## Task 18: Admin — API client + hook for the realtime report

**Files:**
- Modify: `apps/admin/api/admin.api.ts`
- Modify: `apps/admin/hooks/useAdmin.ts` — actually create a dedicated file instead, matching Yukizi's precedent of a separate `useWebAnalytics.ts` for this feature area rather than growing the already-large `useAdmin.ts`.
- Create: `apps/admin/hooks/useWebAnalytics.ts`

- [ ] **Step 1: Add the API function**

Append to `apps/admin/api/admin.api.ts`:

```ts
// ─── Web Analytics ───────────────────────────────────
export interface WebAnalyticsRealtime {
  activeVisitors: number;
  topPages: Array<{ page: string; visitors: number }>;
  recentEvents: Array<{ name: string; ts: string; page: string | null; productId: string | null }>;
}

export async function getWebAnalyticsRealtime(): Promise<WebAnalyticsRealtime> {
  const { data } = await apiClient.get<{ data: WebAnalyticsRealtime }>("/admin/analytics/realtime");
  return data.data;
}
```

- [ ] **Step 2: Write the hook**

```ts
// apps/admin/hooks/useWebAnalytics.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getWebAnalyticsRealtime } from "@/api/admin.api";

export function useWebAnalyticsRealtime() {
  return useQuery({
    queryKey: ["admin", "web-analytics", "realtime"],
    queryFn: getWebAnalyticsRealtime,
    refetchInterval: 10_000,
    staleTime: 0,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/api/admin.api.ts apps/admin/hooks/useWebAnalytics.ts
git commit -m "feat(admin): getWebAnalyticsRealtime API function + polling hook"
```

---

## Task 19: Admin — Real-time page

**Files:**
- Create: `apps/admin/app/analytics/realtime/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// apps/admin/app/analytics/realtime/page.tsx
"use client";
import { Activity } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge, Skeleton } from "@/components/ui";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, SectionCard } from "@/components/analytics/charts";
import { useWebAnalyticsRealtime } from "@/hooks/useWebAnalytics";

export default function RealtimeAnalyticsPage() {
  const realtime = useWebAnalyticsRealtime();
  const active = realtime.data?.activeVisitors ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Real-time</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Activity in the last 5 minutes · refreshes every 10 seconds · no personal data shown
            </p>
          </div>
          <Badge variant={active > 0 ? "success" : "default"} size="md">
            <Activity className="h-3.5 w-3.5" /> {active} active now
          </Badge>
        </div>

        <AnalyticsNav active="realtime" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Pages being viewed">
            {realtime.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(realtime.data?.topPages ?? []).map((p) => ({ label: p.page, value: p.visitors }))}
                emptyText="Nobody on the site right now."
              />
            )}
          </SectionCard>

          <SectionCard title="Recent events" subtitle="Newest first">
            {realtime.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (realtime.data?.recentEvents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No events in the last 5 minutes.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                {(realtime.data?.recentEvents ?? []).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                    <Badge variant={e.name === "page_view" ? "default" : "purple"}>{e.name}</Badge>
                    <span className="truncate text-muted-foreground flex-1">{e.page ?? ""}</span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/app/analytics/realtime/page.tsx
git commit -m "feat(admin): Real-time analytics page"
```

---

## Task 20: Verify admin app

- [ ] **Step 1: Type-check and build**

```bash
cd apps/admin
npx tsc --noEmit
npx next build
```
Expected: both clean. `next build`'s route list should include `/analytics/realtime`.

- [ ] **Step 2: Commit if anything was left uncommitted**

(Only if the previous steps required fixes.)

---

## Task 21: Verify, push, open PR (Part B), live-verify

- [ ] **Step 1: Full workspace verification**

From the repo root:
```bash
pnpm install
cd apps/buyer && npx tsc --noEmit && npx next build && cd ../..
cd apps/admin && npx tsc --noEmit && npx next build && cd ../..
```
Expected: both apps clean and buildable.

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-realtime-ui
```
Open a PR against `pharmabagtech-ux/pharmabag-web` `main`. Title: `feat(analytics): first-party tracker + Real-time admin page (Phase 1)`. Body must state, prominently:
- **Depends on `pharmabag-api` PR from Part A already being merged and deployed** — the ingest proxy calls an endpoint that doesn't exist otherwise.
- **`NEXT_PUBLIC_ANALYTICS_ENABLED=true` must be set in the production environment** for tracking to actually turn on (defaults to disabled — see Task 13's note).
- Links the spec (`docs/superpowers/specs/2026-08-28-web-analytics-phase1-realtime-design.md`) and states this is Phase 1 of 5; Phases 2–5 are explicitly out of scope.

- [ ] **Step 3: Merge, watch the deploy**

```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-web --merge
gh run list -R pharmabagtech-ux/pharmabag-web --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-web --exit-status
```

- [ ] **Step 4: Confirm `NEXT_PUBLIC_ANALYTICS_ENABLED` is actually set in production**

This can't be verified by a live check of the running app (it's a build-time-inlined env var, not visible in any response) — confirm directly with whoever controls the PharmaBag deploy environment that this var is set to `true`. As a secondary signal, check that the tracker code actually shipped by grepping the deployed JS chunks for the tracker's own storage key (this proves the CODE built in; it does not prove the env var is `true` — those are two separate checks). `curl` reports spurious HTTP 000 on this host (a known standing trap) — use PowerShell:
```powershell
$html = (Invoke-WebRequest -Uri "https://pharmabag.in/" -UseBasicParsing -TimeoutSec 30).Content
$chunks = [regex]::Matches($html, 'src="(/_next/static/chunks/[^"]+\.js[^"]*)"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
foreach ($c in $chunks) {
  try {
    $js = (Invoke-WebRequest -Uri "https://pharmabag.in$c" -UseBasicParsing -TimeoutSec 20).Content
    if ($js -match 'pb_vid') { Write-Output "FOUND in $c"; break }
  } catch {}
}
```
If `pb_vid` never appears in any shipped chunk, the tracker code didn't build in — re-check the build. If it does appear but no data ever shows up in the admin Real-time page, the most likely cause is `NEXT_PUBLIC_ANALYTICS_ENABLED` not being `true` in production.

- [ ] **Step 5: Live end-to-end verification**

Open `https://pharmabag.in/` in two separate browser tabs/windows (so there are two distinct visitor ids). In a third tab, log into `https://admin.pharmabag.in/analytics/realtime`. Within 10 seconds, confirm:
- The badge reads "2 active now" (or more, if other real traffic is present).
- "Pages being viewed" lists the pages open in the two tabs.
- "Recent events" shows `page_view` entries with recent timestamps.

Navigate to a different page in one of the buyer tabs and confirm "Pages being viewed" updates within the next 10-second poll.

- [ ] **Step 6: Confirm the Platform Analytics page still works unmodified**

Open `https://admin.pharmabag.in/analytics` and confirm the existing stat cards, charts, and top products/sellers sections still render exactly as before — only the new `AnalyticsNav` tab strip should be visibly different on that page.
