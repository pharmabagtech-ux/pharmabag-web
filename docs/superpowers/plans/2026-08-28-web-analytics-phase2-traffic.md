# PharmaBag Web Analytics — Phase 2 (Traffic) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an admin "Traffic" page (daily visitor/session trend, acquisition-channel breakdown, top referrer domains) across `pharmabag-api` and `pharmabag-web`, per the approved spec at `docs/superpowers/specs/2026-08-28-web-analytics-phase2-traffic-design.md`.

**Architecture:** A pure `classifySource()` function (ported from Yukizi's reference implementation) runs once per session at ingest time, stamping a channel category and a normalized referrer domain onto `WebSession`. A new consolidated `GET /admin/analytics/traffic?from=&to=` endpoint runs four bounded, on-demand SQL aggregates (current-period KPIs, previous-period KPIs, daily trend, channels, referrers — no rollup table, no cron job). A new admin "Traffic" tab renders KPI cards with period-over-period deltas, a `recharts` line chart, and two bar-list breakdowns, reusing Phase 1's `SectionCard`/`BarList` components unmodified.

**Tech Stack:** NestJS + Prisma + Postgres (`pharmabag-api`); Next.js App Router + React Query + `recharts` (`pharmabag-web`, `apps/admin`).

---

## Refinement over the approved spec (read before starting)

The spec's Data Model section says "one new column: `sourceCategory`". While researching the exact report queries during planning, a real correctness gap surfaced: computing "top referrer domains" from the raw `referrer` URL at query time would require grouping by raw referrer text and then merging rows into domains in application code — and a visitor whose raw referrer varies across sessions (e.g. `https://www.google.com/` vs `https://www.google.com/search?q=x`, both mapping to `google.com`) could be double-counted in the merged distinct-visitor total. Yukizi's reference implementation avoids this entirely by storing a normalized `referrerDomain` column and grouping on it directly.

**This plan therefore adds a second column, `referrerDomain`, computed by the exact same `classifySource()` call that already produces it as part of its return value** — zero extra computation, same migration, same `ingest()` edit. This keeps the "top referrers" report an exact, cheap, indexed `GROUP BY` with no double-counting risk. Flagging this now so it isn't a surprise mid-implementation.

---

## Rollout order (read first)

Same two-repo, hard-dependency structure as Phase 1: `pharmabag-api` (Part A) must be merged and deployed **before** `pharmabag-web` (Part B), because the admin page's new hook calls an endpoint that doesn't exist until Part A ships. One PR at a time, straight to production, no staging environment.

- **Part A (Tasks 1–7)** → one PR against `pharmabagtech-ux/pharmabag-api`. Merge + verify deployed before starting Part B.
- **Part B (Tasks 8–14)** → one PR against `pharmabagtech-ux/pharmabag-web`. Merge + verify deployed after Part A is live.

---

# Part A — pharmabag-api

## Task 1: Prisma schema — `sourceCategory` + `referrerDomain` on `WebSession`

**Files:**
- Modify: `prisma/schema.prisma` (the existing `WebSession` model block)
- Create: `prisma/migrations/20260828010000_add_web_analytics_traffic/migration.sql`

- [ ] **Step 1: Replace the `WebSession` model block in `prisma/schema.prisma`**

Find the existing block (it starts with `model WebSession {`) and replace it with:

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

  @@index([visitorId])
  @@index([lastEventAt])
  @@index([sourceCategory, startedAt])
  @@index([referrerDomain])
  @@map("analytics_sessions")
}
```

Only the `WebSession` block changes — two new fields (`sourceCategory`, `referrerDomain`) and two new indexes, appended after the existing fields/indexes. **Do not run `npx prisma format` on the whole file** — Phase 1 hit a real incident where that reformatted ~150 unrelated lines across other models. Edit only this block by hand.

- [ ] **Step 2: Create the migration file**

`prisma/migrations/20260828010000_add_web_analytics_traffic/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "analytics_sessions" ADD COLUMN "sourceCategory" TEXT;
ALTER TABLE "analytics_sessions" ADD COLUMN "referrerDomain" TEXT;

-- CreateIndex
CREATE INDEX "analytics_sessions_sourceCategory_startedAt_idx" ON "analytics_sessions"("sourceCategory", "startedAt");

-- CreateIndex
CREATE INDEX "analytics_sessions_referrerDomain_idx" ON "analytics_sessions"("referrerDomain");
```

- [ ] **Step 3: Generate the Prisma client**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client` — this updates the local TypeScript types so `sourceCategory`/`referrerDomain` are recognized fields on `WebSession` (needed before Task 3's code will type-check).

- [ ] **Step 4: Verify the diff is minimal**

Run: `git diff --stat prisma/schema.prisma`
Expected: only `prisma/schema.prisma` shows changed lines, and the count is small (roughly 2 insertions to the field list + 2 insertions to the index list — not a full-file rewrite). If the diff touches other models, you ran `prisma format` or an editor auto-formatter — revert and redo by hand.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260828010000_add_web_analytics_traffic/migration.sql
git commit -m "feat(web-analytics): add sourceCategory + referrerDomain to WebSession"
```

---

## Task 2: Source classifier

**Files:**
- Create: `src/modules/web-analytics/source-classifier.ts`
- Test: `src/modules/web-analytics/source-classifier.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/modules/web-analytics/source-classifier.spec.ts`:

```ts
import { classifySource, referrerDomain } from './source-classifier';

describe('referrerDomain', () => {
  it.each([
    ['https://www.google.com/search?q=x', 'google.com'],
    ['https://chatgpt.com/', 'chatgpt.com'],
    ['http://m.facebook.com/story', 'm.facebook.com'],
    ['gemini.google.com', 'gemini.google.com'],
    ['', null],
    [null, null],
    ['::::not a url::::', null],
  ])('%s -> %s', (input, expected) => {
    expect(referrerDomain(input as string | null)).toBe(expected);
  });
});

describe('classifySource', () => {
  const cases: Array<{
    name: string;
    input: Parameters<typeof classifySource>[0];
    source: string;
    category: string;
    level: string;
  }> = [
    { name: 'ChatGPT web', input: { referrer: 'https://chatgpt.com/' }, source: 'ChatGPT', category: 'AI', level: 'REFERRER' },
    { name: 'ChatGPT legacy domain', input: { referrer: 'https://chat.openai.com/c/abc' }, source: 'ChatGPT', category: 'AI', level: 'REFERRER' },
    { name: 'Gemini', input: { referrer: 'https://gemini.google.com/app' }, source: 'Google Gemini', category: 'AI', level: 'REFERRER' },
    { name: 'Claude', input: { referrer: 'https://claude.ai/chat/x' }, source: 'Claude', category: 'AI', level: 'REFERRER' },
    { name: 'Perplexity', input: { referrer: 'https://www.perplexity.ai/search' }, source: 'Perplexity', category: 'AI', level: 'REFERRER' },
    { name: 'Copilot', input: { referrer: 'https://copilot.microsoft.com/' }, source: 'Microsoft Copilot', category: 'AI', level: 'REFERRER' },

    { name: 'Google search', input: { referrer: 'https://www.google.com/' }, source: 'Google', category: 'ORGANIC_SEARCH', level: 'REFERRER' },
    { name: 'Google India', input: { referrer: 'https://www.google.co.in/url' }, source: 'Google', category: 'ORGANIC_SEARCH', level: 'REFERRER' },
    { name: 'Bing', input: { referrer: 'https://www.bing.com/search' }, source: 'Bing', category: 'ORGANIC_SEARCH', level: 'REFERRER' },
    { name: 'DuckDuckGo', input: { referrer: 'https://duckduckgo.com/' }, source: 'DuckDuckGo', category: 'ORGANIC_SEARCH', level: 'REFERRER' },

    { name: 'Instagram', input: { referrer: 'https://l.instagram.com/' }, source: 'Instagram', category: 'SOCIAL', level: 'REFERRER' },
    { name: 'Facebook mobile', input: { referrer: 'https://m.facebook.com/' }, source: 'Facebook', category: 'SOCIAL', level: 'REFERRER' },
    { name: 'X shortener', input: { referrer: 'https://t.co/abc' }, source: 'X (Twitter)', category: 'SOCIAL', level: 'REFERRER' },
    { name: 'YouTube', input: { referrer: 'https://www.youtube.com/watch' }, source: 'YouTube', category: 'VIDEO', level: 'REFERRER' },
    { name: 'Reddit outbound', input: { referrer: 'https://out.reddit.com/' }, source: 'Reddit', category: 'SOCIAL', level: 'REFERRER' },
    { name: 'WhatsApp', input: { referrer: 'https://wa.me/' }, source: 'WhatsApp', category: 'MESSAGING', level: 'REFERRER' },
    { name: 'Telegram t.me', input: { referrer: 'https://t.me/channel' }, source: 'Telegram', category: 'MESSAGING', level: 'REFERRER' },

    { name: 'Unknown blog', input: { referrer: 'https://some-anime-blog.example.net/post' }, source: 'some-anime-blog.example.net', category: 'REFERRAL', level: 'REFERRER' },

    { name: 'UTM instagram over google referrer', input: { referrer: 'https://google.com', utmSource: 'instagram' }, source: 'Instagram', category: 'SOCIAL', level: 'UTM' },
    { name: 'UTM chatgpt', input: { utmSource: 'chatgpt' }, source: 'ChatGPT', category: 'AI', level: 'UTM' },
    { name: 'UTM paid medium', input: { utmSource: 'google', utmMedium: 'cpc' }, source: 'Google (paid)', category: 'PAID', level: 'UTM' },
    { name: 'UTM email medium', input: { utmSource: 'mailchimp', utmMedium: 'email' }, source: 'Email', category: 'EMAIL', level: 'UTM' },
    { name: 'UTM unknown source', input: { utmSource: 'partner-site' }, source: 'partner-site', category: 'REFERRAL', level: 'UTM' },

    { name: 'gclid', input: { referrer: 'https://google.com', utmSource: 'google', clickIds: { gclid: 'x' } }, source: 'Google Ads', category: 'PAID', level: 'CLICK_ID' },
    { name: 'fbclid', input: { referrer: 'https://l.facebook.com', clickIds: { fbclid: 'y' } }, source: 'Meta Ads', category: 'PAID', level: 'CLICK_ID' },

    { name: 'no referrer = Direct', input: {}, source: 'Direct', category: 'DIRECT', level: 'DIRECT' },
  ];

  it.each(cases.map((c) => [c.name, c] as const))('%s', (_label, c) => {
    const result = classifySource(c.input);
    expect(result.source).toBe(c.source);
    expect(result.category).toBe(c.category);
    expect(result.level).toBe(c.level);
  });

  it('keeps the raw referrer domain for drill-down even when UTM wins', () => {
    const r = classifySource({ referrer: 'https://news.ycombinator.com/item', utmSource: 'instagram' });
    expect(r.referrerDomain).toBe('news.ycombinator.com');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/modules/web-analytics/source-classifier.spec.ts`
Expected: FAIL with `Cannot find module './source-classifier'`

- [ ] **Step 3: Write the implementation**

`src/modules/web-analytics/source-classifier.ts`:

```ts
/**
 * Classifies raw acquisition evidence (referrer / UTM / ad click ids) into
 * a channel category, computed once at ingest time and stamped onto the
 * session (see WebAnalyticsService.ingest). Ported from Yukizi's reference
 * classifier; the ANDROID_APP_RULES branch is dropped — PharmaBag has no
 * native app, so android-app:// referrers never occur here.
 *
 * Evidence priority (strongest wins):
 *   1. Ad click ids (gclid/fbclid/msclkid/ttclid) -> PAID
 *   2. UTM parameters                              -> mapped category
 *   3. Referrer domain                              -> mapped via DOMAIN_RULES
 *   4. No referrer at all                           -> DIRECT
 *
 * "DIRECT" strictly means "the browser provided no referrer information" —
 * it must never be presented as "typed the URL". An unrecognized referrer
 * domain is REFERRAL with the real domain preserved, never dropped to
 * DIRECT/UNKNOWN.
 */

export type SourceCategory =
  | 'ORGANIC_SEARCH'
  | 'AI'
  | 'SOCIAL'
  | 'VIDEO'
  | 'REFERRAL'
  | 'DIRECT'
  | 'PAID'
  | 'EMAIL'
  | 'MESSAGING'
  | 'UNKNOWN';

export type AttributionLevel = 'UTM' | 'CLICK_ID' | 'REFERRER' | 'DIRECT' | 'UNKNOWN';

export interface ClassifierInput {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  clickIds?: Partial<Record<'gclid' | 'fbclid' | 'msclkid' | 'ttclid', string>> | null;
}

export interface ClassifiedSource {
  source: string;
  category: SourceCategory;
  level: AttributionLevel;
  referrerDomain: string | null;
}

interface DomainRule {
  match: RegExp;
  source: string;
  category: SourceCategory;
}

// Order matters: first match wins. AI assistants sit above generic search
// (gemini.google.com must not fall through to Google Search).
const DOMAIN_RULES: DomainRule[] = [
  { match: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, source: 'ChatGPT', category: 'AI' },
  { match: /(^|\.)openai\.com$/, source: 'OpenAI', category: 'AI' },
  { match: /^gemini\.google\.com$|^bard\.google\.com$|^aistudio\.google\.com$/, source: 'Google Gemini', category: 'AI' },
  { match: /(^|\.)claude\.ai$|(^|\.)anthropic\.com$/, source: 'Claude', category: 'AI' },
  { match: /(^|\.)perplexity\.ai$/, source: 'Perplexity', category: 'AI' },
  { match: /^copilot\.microsoft\.com$|(^|\.)bing\.com\/chat$/, source: 'Microsoft Copilot', category: 'AI' },
  { match: /(^|\.)you\.com$/, source: 'You.com', category: 'AI' },
  { match: /(^|\.)phind\.com$/, source: 'Phind', category: 'AI' },
  { match: /(^|\.)poe\.com$/, source: 'Poe', category: 'AI' },
  { match: /(^|\.)meta\.ai$/, source: 'Meta AI', category: 'AI' },
  { match: /(^|\.)mistral\.ai$|(^|\.)lechat\.mistral\.ai$/, source: 'Mistral', category: 'AI' },
  { match: /(^|\.)grok\.com$|^grok\.x\.com$/, source: 'Grok', category: 'AI' },
  { match: /(^|\.)deepseek\.com$/, source: 'DeepSeek', category: 'AI' },

  { match: /(^|\.)google\.[a-z.]+$/, source: 'Google', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)bing\.com$/, source: 'Bing', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)duckduckgo\.com$/, source: 'DuckDuckGo', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$/, source: 'Yahoo', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)search\.brave\.com$/, source: 'Brave Search', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)ecosia\.org$/, source: 'Ecosia', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)startpage\.com$/, source: 'Startpage', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)yandex\.(com|ru)$/, source: 'Yandex', category: 'ORGANIC_SEARCH' },
  { match: /(^|\.)baidu\.com$/, source: 'Baidu', category: 'ORGANIC_SEARCH' },

  { match: /(^|\.)youtube\.com$|^youtu\.be$/, source: 'YouTube', category: 'VIDEO' },

  { match: /(^|\.)instagram\.com$/, source: 'Instagram', category: 'SOCIAL' },
  { match: /(^|\.)facebook\.com$|^fb\.me$|^m\.facebook\.com$|^l\.facebook\.com$|^lm\.facebook\.com$/, source: 'Facebook', category: 'SOCIAL' },
  { match: /(^|\.)twitter\.com$|(^|\.)x\.com$|^t\.co$/, source: 'X (Twitter)', category: 'SOCIAL' },
  { match: /(^|\.)linkedin\.com$|^lnkd\.in$/, source: 'LinkedIn', category: 'SOCIAL' },
  { match: /(^|\.)reddit\.com$|^redd\.it$|^out\.reddit\.com$/, source: 'Reddit', category: 'SOCIAL' },
  { match: /(^|\.)pinterest\.[a-z.]+$|^pin\.it$/, source: 'Pinterest', category: 'SOCIAL' },
  { match: /(^|\.)tiktok\.com$/, source: 'TikTok', category: 'SOCIAL' },
  { match: /(^|\.)threads\.net$|(^|\.)threads\.com$/, source: 'Threads', category: 'SOCIAL' },
  { match: /(^|\.)snapchat\.com$/, source: 'Snapchat', category: 'SOCIAL' },

  { match: /(^|\.)whatsapp\.com$|^wa\.me$|^web\.whatsapp\.com$/, source: 'WhatsApp', category: 'MESSAGING' },
  { match: /(^|\.)telegram\.(org|me)$|^t\.me$|^web\.telegram\.org$/, source: 'Telegram', category: 'MESSAGING' },

  { match: /^mail\.google\.com$|(^|\.)outlook\.(com|live\.com)$|^mail\.yahoo\.com$/, source: 'Email (webmail)', category: 'EMAIL' },
];

const UTM_SOURCE_MAP: Record<string, { source: string; category: SourceCategory }> = {
  google: { source: 'Google', category: 'ORGANIC_SEARCH' },
  bing: { source: 'Bing', category: 'ORGANIC_SEARCH' },
  chatgpt: { source: 'ChatGPT', category: 'AI' },
  openai: { source: 'ChatGPT', category: 'AI' },
  gemini: { source: 'Google Gemini', category: 'AI' },
  claude: { source: 'Claude', category: 'AI' },
  perplexity: { source: 'Perplexity', category: 'AI' },
  copilot: { source: 'Microsoft Copilot', category: 'AI' },
  facebook: { source: 'Facebook', category: 'SOCIAL' },
  fb: { source: 'Facebook', category: 'SOCIAL' },
  instagram: { source: 'Instagram', category: 'SOCIAL' },
  ig: { source: 'Instagram', category: 'SOCIAL' },
  youtube: { source: 'YouTube', category: 'VIDEO' },
  twitter: { source: 'X (Twitter)', category: 'SOCIAL' },
  x: { source: 'X (Twitter)', category: 'SOCIAL' },
  linkedin: { source: 'LinkedIn', category: 'SOCIAL' },
  reddit: { source: 'Reddit', category: 'SOCIAL' },
  pinterest: { source: 'Pinterest', category: 'SOCIAL' },
  tiktok: { source: 'TikTok', category: 'SOCIAL' },
  whatsapp: { source: 'WhatsApp', category: 'MESSAGING' },
  telegram: { source: 'Telegram', category: 'MESSAGING' },
  email: { source: 'Email', category: 'EMAIL' },
  newsletter: { source: 'Email', category: 'EMAIL' },
};

const PAID_MEDIUMS = /^(cpc|ppc|cpm|cpv|cpa|paid|paidsocial|paid_social|paid-social|display|banner|retargeting)$/i;
const EMAIL_MEDIUMS = /^(email|e-mail|newsletter)$/i;
const SOCIAL_MEDIUMS = /^(social|social-network|social-media|sm)$/i;

/** Hostname (lowercased, no port/www) from a referrer URL or bare host. Null when unparseable. */
export function referrerDomain(referrer?: string | null): string | null {
  if (!referrer) return null;
  const raw = referrer.trim();
  if (!raw) return null;
  try {
    const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function classifySource(input: ClassifierInput): ClassifiedSource {
  const domain = referrerDomain(input.referrer);
  const utmSource = input.utmSource?.trim().toLowerCase() || null;
  const utmMedium = input.utmMedium?.trim().toLowerCase() || null;
  const clickIds = input.clickIds ?? {};

  if (clickIds.gclid) return { source: 'Google Ads', category: 'PAID', level: 'CLICK_ID', referrerDomain: domain };
  if (clickIds.fbclid) return { source: 'Meta Ads', category: 'PAID', level: 'CLICK_ID', referrerDomain: domain };
  if (clickIds.msclkid) return { source: 'Microsoft Ads', category: 'PAID', level: 'CLICK_ID', referrerDomain: domain };
  if (clickIds.ttclid) return { source: 'TikTok Ads', category: 'PAID', level: 'CLICK_ID', referrerDomain: domain };

  if (utmSource) {
    const mapped = UTM_SOURCE_MAP[utmSource];
    if (utmMedium && PAID_MEDIUMS.test(utmMedium)) {
      return { source: mapped ? `${mapped.source} (paid)` : `${utmSource} (paid)`, category: 'PAID', level: 'UTM', referrerDomain: domain };
    }
    if (utmMedium && EMAIL_MEDIUMS.test(utmMedium)) {
      return { source: 'Email', category: 'EMAIL', level: 'UTM', referrerDomain: domain };
    }
    if (mapped) return { source: mapped.source, category: mapped.category, level: 'UTM', referrerDomain: domain };
    if (utmMedium && SOCIAL_MEDIUMS.test(utmMedium)) {
      return { source: utmSource, category: 'SOCIAL', level: 'UTM', referrerDomain: domain };
    }
    return { source: utmSource, category: 'REFERRAL', level: 'UTM', referrerDomain: domain };
  }

  if (domain) {
    for (const rule of DOMAIN_RULES) {
      if (rule.match.test(domain)) {
        return { source: rule.source, category: rule.category, level: 'REFERRER', referrerDomain: domain };
      }
    }
    return { source: domain, category: 'REFERRAL', level: 'REFERRER', referrerDomain: domain };
  }

  return { source: 'Direct', category: 'DIRECT', level: 'DIRECT', referrerDomain: null };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/source-classifier.spec.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/source-classifier.ts src/modules/web-analytics/source-classifier.spec.ts
git commit -m "feat(web-analytics): source classifier (channel + referrer domain)"
```

---

## Task 3: Wire the classifier into `ingest()`

**Files:**
- Modify: `src/modules/web-analytics/web-analytics.service.ts`
- Test: `src/modules/web-analytics/web-analytics.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add these two tests to the existing `describe('WebAnalyticsService.ingest', ...)` block in `web-analytics.service.spec.ts` (alongside the existing tests — do not remove any):

```ts
  it('classifies and stamps sourceCategory/referrerDomain on session creation', async () => {
    const { service, tx } = buildService();

    await service.ingest(
      batch({
        session: {
          id: 'session-1',
          landingPage: '/products/foo',
          referrer: 'https://www.google.com/',
        } as any,
      }),
    );

    expect(tx.webSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceCategory: 'ORGANIC_SEARCH',
          referrerDomain: 'google.com',
        }),
      }),
    );
  });

  it('does not recompute sourceCategory/referrerDomain on session update (attribution fixed at session start)', async () => {
    const { service, tx } = buildService();
    tx.webVisitor.findUnique.mockResolvedValue({ id: 'visitor-1' });
    tx.webSession.findUnique.mockResolvedValue({ id: 'session-1' });

    await service.ingest(batch());

    const updateCall = tx.webSession.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('sourceCategory');
    expect(updateCall.data).not.toHaveProperty('referrerDomain');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts -t "sourceCategory"`
Expected: FAIL — `webSession.create` was not called with `sourceCategory`/`referrerDomain` (the field doesn't exist in the create payload yet).

- [ ] **Step 3: Wire the classifier into `ingest()`**

In `web-analytics.service.ts`, add the import:

```ts
import { classifySource } from './source-classifier';
```

Then, inside `ingest()`, in the `if (!existingSession) { ... }` branch, compute the classification once and add the two fields to the `create` payload:

```ts
      if (!existingSession) {
        const classified = classifySource({
          referrer: batch.session.referrer,
          utmSource: batch.session.source,
          utmMedium: batch.session.medium,
          clickIds: batch.session.clickIds,
        });
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
          },
        });
      } else {
```

(The `else` branch — the session `update` call — is unchanged; leave it exactly as it is, so `sourceCategory`/`referrerDomain` are never touched after session creation.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics.service.spec.ts`
Expected: PASS, all tests in the file green (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/web-analytics.service.ts src/modules/web-analytics/web-analytics.service.spec.ts
git commit -m "feat(web-analytics): classify channel + referrer domain at session creation"
```

---

## Task 4: Traffic range DTO

**Files:**
- Create: `src/modules/web-analytics/dto/traffic-range.dto.ts`

- [ ] **Step 1: Write the DTO**

```ts
// src/modules/web-analytics/dto/traffic-range.dto.ts
import { IsDateString } from 'class-validator';

export class TrafficRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
```

No test file for this one — it's declarative validation metadata with no branching logic of its own; its behavior is exercised end-to-end by Task 6's controller wiring and the live verification in Task 7.

- [ ] **Step 2: Commit**

```bash
git add src/modules/web-analytics/dto/traffic-range.dto.ts
git commit -m "feat(web-analytics): traffic report date-range DTO"
```

---

## Task 5: `WebAnalyticsReportsService.traffic()`

**Files:**
- Create: `src/modules/web-analytics/web-analytics-reports.service.ts`
- Test: `src/modules/web-analytics/web-analytics-reports.service.spec.ts`

This is a separate service from `WebAnalyticsService` (which owns ingestion) rather than a growing addition to it — ingestion and admin reporting are different responsibilities, and every future phase (Audience, Behavior) will keep adding report methods here rather than to the ingest-facing service.

- [ ] **Step 1: Write the failing tests**

`src/modules/web-analytics/web-analytics-reports.service.spec.ts`:

```ts
import { WebAnalyticsReportsService } from './web-analytics-reports.service';

function buildService() {
  const prisma: any = { $queryRaw: jest.fn() };
  const service = new WebAnalyticsReportsService(prisma);
  return { service, prisma };
}

const range = { from: new Date('2026-08-01T00:00:00.000Z'), to: new Date('2026-08-08T00:00:00.000Z') };

describe('WebAnalyticsReportsService.traffic', () => {
  it('returns current/previous KPIs, converting bigint counts to numbers', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ visitors: BigInt(10), newVisitors: BigInt(4), sessions: BigInt(12), pageviews: BigInt(50) }])
      .mockResolvedValueOnce([{ visitors: BigInt(8), newVisitors: BigInt(3), sessions: BigInt(9), pageviews: BigInt(40) }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.traffic(range);

    expect(result.current).toEqual({ visitors: 10, newVisitors: 4, sessions: 12, pageviews: 50 });
    expect(result.previous).toEqual({ visitors: 8, newVisitors: 3, sessions: 9, pageviews: 40 });
    expect(typeof result.current.visitors).toBe('number');
  });

  it('computes the previous period as the immediately preceding period of equal length', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([]);

    await service.traffic(range);

    const previousCallSql: any = prisma.$queryRaw.mock.calls[1][0];
    expect(previousCallSql.values).toContainEqual(new Date('2026-07-25T00:00:00.000Z'));
    expect(previousCallSql.values).toContainEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('returns the daily series with ISO date strings and numeric counts', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ date: new Date('2026-08-02T00:00:00.000Z'), visitors: BigInt(3), sessions: BigInt(4) }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.traffic(range);

    expect(result.daily).toEqual([{ date: '2026-08-02', visitors: 3, sessions: 4 }]);
  });

  it('degrades gracefully when the daily-series query fails, without losing the KPIs', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ visitors: BigInt(1), newVisitors: BigInt(1), sessions: BigInt(1), pageviews: BigInt(1) }])
      .mockResolvedValueOnce([{ visitors: BigInt(0), newVisitors: BigInt(0), sessions: BigInt(0), pageviews: BigInt(0) }])
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.traffic(range);

    expect(result.daily).toEqual([]);
    expect(result.current.visitors).toBe(1);
  });

  it('defaults an unclassified session to UNKNOWN in the channels breakdown', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ category: null, visitors: BigInt(2), sessions: BigInt(3) }])
      .mockResolvedValueOnce([]);

    const result = await service.traffic(range);

    expect(result.channels).toEqual([{ category: 'UNKNOWN', visitors: 2, sessions: 3 }]);
  });

  it('returns top referrer domains, bot-filtered and capped at 20', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ domain: 'google.com', visitors: BigInt(5), sessions: BigInt(6) }]);

    const result = await service.traffic(range);

    expect(result.referrers).toEqual([{ domain: 'google.com', visitors: 5, sessions: 6 }]);
    const referrersSql: any = prisma.$queryRaw.mock.calls[4][0];
    const sqlText = Array.isArray(referrersSql?.strings) ? referrersSql.strings.join('') : String(referrersSql);
    expect(sqlText).toContain('"isBot" = false');
    expect(sqlText).toContain('LIMIT 20');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/modules/web-analytics/web-analytics-reports.service.spec.ts`
Expected: FAIL with `Cannot find module './web-analytics-reports.service'`

- [ ] **Step 3: Write the implementation**

`src/modules/web-analytics/web-analytics-reports.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface TrafficRange {
  from: Date;
  to: Date;
}

interface TrafficKpis {
  visitors: number;
  newVisitors: number;
  sessions: number;
  pageviews: number;
}

function previousPeriod({ from, to }: TrafficRange): TrafficRange {
  const lengthMs = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - lengthMs), to: new Date(from.getTime()) };
}

function toNumber(v: unknown): number {
  return typeof v === 'bigint' ? Number(v) : Number(v ?? 0);
}

@Injectable()
export class WebAnalyticsReportsService {
  private readonly logger = new Logger(WebAnalyticsReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async traffic(range: TrafficRange) {
    const [current, previous, daily, channels, referrers] = await Promise.all([
      this.kpis(range),
      this.kpis(previousPeriod(range)),
      this.dailySeries(range),
      this.channels(range),
      this.referrers(range),
    ]);
    return { current, previous, daily, channels, referrers };
  }

  // KPIs are the primary content of the page — deliberately NOT wrapped in
  // .catch(), same reasoning as the admin realtime endpoint: a genuine
  // failure here should surface as a real 500, not silently render as
  // "zero traffic".
  private async kpis({ from, to }: TrafficRange): Promise<TrafficKpis> {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        COUNT(DISTINCT s."visitorId") AS visitors,
        COUNT(*) FILTER (WHERE s."isNewVisitor") AS "newVisitors",
        COUNT(*) AS sessions,
        COALESCE(SUM(s."pageviews"), 0) AS pageviews
      FROM "analytics_sessions" s
      WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
    `);
    const row = rows[0] ?? {};
    return {
      visitors: toNumber(row.visitors),
      newVisitors: toNumber(row.newVisitors),
      sessions: toNumber(row.sessions),
      pageviews: toNumber(row.pageviews),
    };
  }

  // Secondary breakdowns below are isolated with .catch(), same pattern as
  // Phase 1's realtime() "top pages" query — one panel failing shouldn't
  // take down the whole report.
  private dailySeries({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ date: Date; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT date_trunc('day', s."startedAt") AS date,
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
        GROUP BY date_trunc('day', s."startedAt")
        ORDER BY date_trunc('day', s."startedAt") ASC
      `)
      .then((rows) =>
        rows.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          visitors: toNumber(r.visitors),
          sessions: toNumber(r.sessions),
        })),
      )
      .catch((err) => {
        this.logger.error('traffic: daily-series query failed', err);
        return [] as Array<{ date: string; visitors: number; sessions: number }>;
      });
  }

  private channels({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ category: string | null; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT COALESCE(s."sourceCategory", 'UNKNOWN') AS category,
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
        GROUP BY COALESCE(s."sourceCategory", 'UNKNOWN')
        ORDER BY sessions DESC
      `)
      .then((rows) => rows.map((r) => ({ category: r.category ?? 'UNKNOWN', visitors: toNumber(r.visitors), sessions: toNumber(r.sessions) })))
      .catch((err) => {
        this.logger.error('traffic: channels query failed', err);
        return [] as Array<{ category: string; visitors: number; sessions: number }>;
      });
  }

  private referrers({ from, to }: TrafficRange) {
    return this.prisma
      .$queryRaw<Array<{ domain: string; visitors: bigint; sessions: bigint }>>(Prisma.sql`
        SELECT s."referrerDomain" AS domain,
               COUNT(DISTINCT s."visitorId") AS visitors,
               COUNT(*) AS sessions
        FROM "analytics_sessions" s
        WHERE s."startedAt" >= ${from} AND s."startedAt" < ${to} AND s."isBot" = false
          AND s."referrerDomain" IS NOT NULL
        GROUP BY s."referrerDomain"
        ORDER BY sessions DESC
        LIMIT 20
      `)
      .then((rows) => rows.map((r) => ({ domain: r.domain, visitors: toNumber(r.visitors), sessions: toNumber(r.sessions) })))
      .catch((err) => {
        this.logger.error('traffic: referrers query failed', err);
        return [] as Array<{ domain: string; visitors: number; sessions: number }>;
      });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/modules/web-analytics/web-analytics-reports.service.spec.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/web-analytics/web-analytics-reports.service.ts src/modules/web-analytics/web-analytics-reports.service.spec.ts
git commit -m "feat(web-analytics): traffic report (KPIs, daily trend, channels, referrers)"
```

---

## Task 6: Wire `traffic()` into the admin controller + module

**Files:**
- Modify: `src/modules/web-analytics/web-analytics-admin.controller.ts`
- Modify: `src/modules/web-analytics/web-analytics.module.ts`

- [ ] **Step 1: Add the endpoint**

Replace the full contents of `web-analytics-admin.controller.ts` with:

```ts
import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebAnalyticsService } from './web-analytics.service';
import { WebAnalyticsReportsService } from './web-analytics-reports.service';
import { TrafficRangeDto } from './dto/traffic-range.dto';

@ApiTags('Admin — Web Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WebAnalyticsAdminController {
  constructor(
    private readonly webAnalyticsService: WebAnalyticsService,
    private readonly webAnalyticsReportsService: WebAnalyticsReportsService,
  ) {}

  @Get('realtime')
  @ApiOperation({ summary: 'Active visitors, pages being viewed, and recent events (last 5 minutes)' })
  @ApiResponse({ status: 200, description: 'Realtime snapshot returned' })
  async realtime() {
    const data = await this.webAnalyticsService.realtime();
    return { message: 'Realtime analytics retrieved successfully', data };
  }

  @Get('traffic')
  @ApiOperation({ summary: 'Daily visitor/session trend, acquisition channels, and top referrers for a date range' })
  @ApiResponse({ status: 200, description: 'Traffic report returned' })
  async traffic(@Query() query: TrafficRangeDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }
    const data = await this.webAnalyticsReportsService.traffic({ from, to });
    return { message: 'Traffic report retrieved successfully', data };
  }
}
```

- [ ] **Step 2: Register the new service**

Replace the full contents of `web-analytics.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { WebAnalyticsController } from './web-analytics.controller';
import { WebAnalyticsAdminController } from './web-analytics-admin.controller';
import { WebAnalyticsService } from './web-analytics.service';
import { WebAnalyticsReportsService } from './web-analytics-reports.service';

@Module({
  controllers: [WebAnalyticsController, WebAnalyticsAdminController],
  providers: [WebAnalyticsService, WebAnalyticsReportsService],
  exports: [WebAnalyticsService],
})
export class WebAnalyticsModule {}
```

- [ ] **Step 3: Verify the app still compiles and boots**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest src/modules/web-analytics`
Expected: PASS — all existing + new tests in the module still green (confirms the DI wiring didn't break the two existing controllers/services).

- [ ] **Step 4: Commit**

```bash
git add src/modules/web-analytics/web-analytics-admin.controller.ts src/modules/web-analytics/web-analytics.module.ts
git commit -m "feat(web-analytics): GET /admin/analytics/traffic endpoint"
```

---

## Task 7: Verify, push, open PR, merge + deploy + live-verify (Part A)

- [ ] **Step 1: Full verification**

```bash
npx prisma generate
npx tsc --noEmit
npx jest src/modules/web-analytics
```

Expected: clean typecheck, all tests passing.

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-traffic-report
```

Open a PR against `pharmabagtech-ux/pharmabag-api` `main`. Title: `feat(analytics): Traffic report — channel classification + KPIs (Phase 2)`. Body must state:
- This is Phase 2 of the web-analytics plan (Phase 1 — tracker, ingest, Real-time page — already live). Links `docs/superpowers/specs/2026-08-28-web-analytics-phase2-traffic-design.md`.
- Adds a migration (two new nullable columns on `analytics_sessions`, no data loss, no backfill needed — there is no real session data in production yet).
- The corresponding `pharmabag-web` PR (Part B) depends on this being merged and deployed first.

- [ ] **Step 3: Merge, watch the deploy**

```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-api --merge
gh run list -R pharmabagtech-ux/pharmabag-api --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-api --exit-status
```

Confirm the deploy log's migration step shows `20260828010000_add_web_analytics_traffic` applied (the CI fix from Phase 1's Task 8b — `prisma migrate deploy` on every deploy — should apply it automatically).

- [ ] **Step 4: Live-verify the endpoint exists and is guarded**

`GET /admin/analytics/traffic` requires an admin JWT, so a full response can't be checked without admin credentials — but its *existence and guard* can be confirmed with an unauthenticated request, exactly like Phase 1's `realtime` endpoint:

```powershell
(Invoke-WebRequest -Uri "https://www.pharmabag.in/api/admin/analytics/traffic?from=2026-08-01&to=2026-08-08" -UseBasicParsing -SkipHttpErrorCheck).StatusCode
```

Expected: `401` (route exists, guard is active — the same signature as the already-live `realtime` endpoint). A `404` would mean the deploy didn't pick up the new route.

---

# Part B — pharmabag-web (apps/admin)

**Do not start until Part A is merged, deployed, and live-verified above.**

## Task 8: `AnalyticsNav` — add the "Traffic" tab

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
];

const ROUTES: Record<string, string> = {
  platform: "/analytics",
  realtime: "/analytics/realtime",
  traffic: "/analytics/traffic",
};

export function AnalyticsNav({ active }: { active: "platform" | "realtime" | "traffic" }) {
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

This widens the `active` union type (adding `"traffic"`) and switches the two-way ternary to a route map (cleaner than a three-way nested ternary) — both existing call sites (`active="platform"` on the Platform Analytics page, `active="realtime"` on the Real-time page) keep working unmodified.

- [ ] **Step 2: Verify the two existing pages that use this component still compile**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors (confirms `active="platform"` and `active="realtime"` still satisfy the widened union type).

- [ ] **Step 3: Commit**

```bash
git add apps/admin/components/analytics/analytics-nav.tsx
git commit -m "feat(admin): add Traffic tab to AnalyticsNav"
```

---

## Task 9: Chart primitives — `useChartPalette`, `KpiCard`, `TrendChart`

**Files:**
- Modify: `apps/admin/components/analytics/charts.tsx` (append — `SectionCard`/`BarList` stay exactly as they are)

- [ ] **Step 1: Replace the full file**

`SectionCard` and `BarList` (the two existing exports) are reproduced below byte-for-byte, unchanged — only the new imports at the top and the four new exports at the bottom are additions. Replace the entire file with:

```tsx
"use client";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

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

/**
 * Categorical hues in FIXED order (never cycled) — for multi-series line
 * charts where color encodes series identity. Ranked breakdowns (BarList
 * above) use a single hue for magnitude instead, since rank ≠ identity.
 */
const LIGHT_SERIES = ["#7B2FBE", "#0891B2", "#D97706"];
const DARK_SERIES = ["#9D5CE6", "#0FA3B1", "#D97706"];

export function useChartPalette(): string[] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? DARK_SERIES : LIGHT_SERIES;
}

/** KPI with a comparison delta vs the previous period. */
export function KpiCard({
  label,
  value,
  previous,
  format,
}: {
  label: string;
  value: number | undefined;
  previous?: number;
  format?: (n: number) => string;
}) {
  const fmt = format ?? ((n: number) => n.toLocaleString());
  const hasDelta = previous !== undefined && previous > 0 && value !== undefined;
  const deltaPct = hasDelta ? ((value! - previous!) / previous!) * 100 : null;
  const Dir = deltaPct === null ? Minus : deltaPct >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value === undefined ? "…" : fmt(value)}</p>
      <p
        className={cn(
          "flex items-center gap-0.5 text-xs mt-0.5",
          deltaPct === null ? "text-muted-foreground" : deltaPct >= 0 ? "text-green-600" : "text-red-500",
        )}
      >
        <Dir className="h-3 w-3" aria-hidden />
        {deltaPct === null ? "no prior data" : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% vs previous`}
      </p>
    </div>
  );
}

interface TrendPoint {
  date: string;
  [key: string]: number | string;
}

/** Multi-series line chart: thin 2px lines, crosshair tooltip, legend (>=2 series). */
export function TrendChart({
  data,
  series,
  height = 260,
}: {
  data: TrendPoint[];
  series: Array<{ key: string; label: string }>;
  height?: number;
}) {
  const palette = useChartPalette();
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data yet for this period.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d: string) => d.slice(5)}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(128,128,128,0.25)", background: "var(--card, #fff)", fontSize: 12 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={palette[i % palette.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

`recharts` is already a dependency of this app (`package.json` — `"recharts": "^2.12.7"`), so no install step is needed.

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/components/analytics/charts.tsx
git commit -m "feat(admin): KpiCard + TrendChart analytics chart primitives"
```

---

## Task 10: API client — `getWebAnalyticsTraffic`

**Files:**
- Modify: `apps/admin/api/admin.api.ts`

- [ ] **Step 1: Append after the existing `getWebAnalyticsRealtime` function**

```ts
export interface WebAnalyticsTrafficKpis {
  visitors: number;
  newVisitors: number;
  sessions: number;
  pageviews: number;
}

export interface WebAnalyticsTraffic {
  current: WebAnalyticsTrafficKpis;
  previous: WebAnalyticsTrafficKpis;
  daily: Array<{ date: string; visitors: number; sessions: number }>;
  channels: Array<{ category: string; visitors: number; sessions: number }>;
  referrers: Array<{ domain: string; visitors: number; sessions: number }>;
}

export async function getWebAnalyticsTraffic(from: string, to: string): Promise<WebAnalyticsTraffic> {
  const { data } = await apiClient.get<{ data: WebAnalyticsTraffic }>(
    `/admin/analytics/traffic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
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
git commit -m "feat(admin): getWebAnalyticsTraffic API function"
```

---

## Task 11: `useWebAnalyticsTraffic` hook

**Files:**
- Modify: `apps/admin/hooks/useWebAnalytics.ts`

- [ ] **Step 1: Replace the file**

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { getWebAnalyticsRealtime, getWebAnalyticsTraffic } from "@/api/admin.api";

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
```

No polling here (unlike Real-time) — a daily trend report doesn't need a 10-second refresh; it refetches when `from`/`to` change (the query key includes them) or on normal React Query refocus/remount behavior.

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/hooks/useWebAnalytics.ts
git commit -m "feat(admin): useWebAnalyticsTraffic hook"
```

---

## Task 12: Traffic page

**Files:**
- Create: `apps/admin/app/analytics/traffic/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";
import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AnalyticsNav } from "@/components/analytics/analytics-nav";
import { BarList, KpiCard, SectionCard, TrendChart } from "@/components/analytics/charts";
import { useWebAnalyticsTraffic } from "@/hooks/useWebAnalytics";

const PERIODS = [
  { k: "7d", l: "7 Days", days: 7 },
  { k: "30d", l: "30 Days", days: 30 },
  { k: "90d", l: "90 Days", days: 90 },
];

const CATEGORY_LABELS: Record<string, string> = {
  ORGANIC_SEARCH: "Organic search",
  AI: "AI assistants",
  SOCIAL: "Social",
  VIDEO: "Video",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  PAID: "Paid",
  EMAIL: "Email",
  MESSAGING: "Messaging",
  UNKNOWN: "Unknown",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function TrafficAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { from, to } = useMemo(() => {
    const days = PERIODS.find((p) => p.k === period)?.days ?? 30;
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: isoDate(fromDate), to: isoDate(toDate) };
  }, [period]);

  const traffic = useWebAnalyticsTraffic(from, to);
  const current = traffic.data?.current;
  const previous = traffic.data?.previous;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl text-foreground">Traffic</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visitor and session trends, bots excluded</p>
        </div>

        <AnalyticsNav active="traffic" />

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Visitors" value={current?.visitors} previous={previous?.visitors} />
          <KpiCard label="New visitors" value={current?.newVisitors} previous={previous?.newVisitors} />
          <KpiCard label="Sessions" value={current?.sessions} previous={previous?.sessions} />
          <KpiCard label="Page views" value={current?.pageviews} previous={previous?.pageviews} />
        </div>

        <SectionCard title="Daily trend" subtitle="Visitors and sessions per day">
          <TrendChart
            data={traffic.data?.daily ?? []}
            series={[
              { key: "visitors", label: "Visitors" },
              { key: "sessions", label: "Sessions" },
            ]}
          />
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Acquisition channels" subtitle="Sessions by channel">
            <BarList
              rows={(traffic.data?.channels ?? []).map((c) => ({
                label: CATEGORY_LABELS[c.category] ?? c.category,
                value: c.sessions,
              }))}
            />
          </SectionCard>

          <SectionCard title="Top referrer domains" subtitle="Real domains that sent traffic">
            <BarList
              rows={(traffic.data?.referrers ?? []).map((r) => ({ label: r.domain, value: r.sessions }))}
            />
          </SectionCard>
        </div>
      </div>
    </AdminLayout>
  );
}
```

Nothing on the existing `/analytics` or `/analytics/realtime` pages changes.

- [ ] **Step 2: Verify**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/app/analytics/traffic/page.tsx
git commit -m "feat(admin): Traffic analytics page"
```

---

## Task 13: Verify the admin app

- [ ] **Step 1: Full build**

```bash
cd apps/admin
npx tsc --noEmit
npx next build
```

Expected: clean typecheck; build succeeds; the route table includes `/analytics/traffic` alongside the existing `/analytics` and `/analytics/realtime` routes, all as static (`○`) entries — this page has no server-only data dependency at build time (it's `"use client"` throughout, matching the existing two analytics pages).

---

## Task 14: Verify, push, open PR, merge + deploy + live-verify (Part B)

- [ ] **Step 1: Full workspace verification**

```bash
pnpm install
cd apps/admin && npx tsc --noEmit && npx next build && cd ..
```

- [ ] **Step 2: Push and open the PR**

```bash
git push fork feat/web-analytics-traffic-page
```

Open a PR against `pharmabagtech-ux/pharmabag-web` `main`. Title: `feat(analytics): Traffic page — trend chart, channels, referrers (Phase 2)`. Body must state:
- **Depends on the `pharmabag-api` PR from Part A already being merged and deployed** — the new hook calls `GET /admin/analytics/traffic`, which doesn't exist otherwise.
- Links the spec (`docs/superpowers/specs/2026-08-28-web-analytics-phase2-traffic-design.md`) and states this is Phase 2 of 5; Phases 3–5 (Audience, Behavior, Health/Export) remain out of scope.
- No new env vars — this reads the same tracker data already gated behind Phase 1's `NEXT_PUBLIC_ANALYTICS_ENABLED`.

- [ ] **Step 3: Merge, watch the deploy**

```bash
gh pr merge <number> -R pharmabagtech-ux/pharmabag-web --merge
gh run list -R pharmabagtech-ux/pharmabag-web --limit 1
gh run watch <run-id> -R pharmabagtech-ux/pharmabag-web --exit-status
```

- [ ] **Step 4: Live-verify what's checkable without admin credentials**

Full visual confirmation of the new page needs an authenticated admin session (same limitation Phase 1 hit — no admin credentials are available in this environment). What CAN be verified directly:

```powershell
$html = (Invoke-WebRequest -Uri "https://admin.pharmabag.in/analytics/traffic" -UseBasicParsing -TimeoutSec 30).Content
```

Expected: `200` and the response is the Next.js app shell (not a `404` page) — confirms the route deployed. Grep the deployed JS chunks for a distinctive string (e.g. `"Acquisition channels"` or `"Top referrer domains"`) the same way Phase 1 grepped for `pb_vid`, to confirm the new page's code specifically shipped (not just that *some* route exists at that path).

- [ ] **Step 5: Flag for manual visual confirmation**

Ask whoever has admin access (Rishi, most likely) to open `https://admin.pharmabag.in/analytics/traffic` and confirm: the "Traffic" tab appears next to "Platform"/"Real-time"; the page loads without errors; and — since `NEXT_PUBLIC_ANALYTICS_ENABLED` may still not be set in production as of this writing (see Phase 1's outstanding item) — if all the numbers read zero, that's expected until that env var is turned on, not a bug in this page.

---

## Self-review notes

- **Spec coverage:** every in-scope item from the spec (KPI row, daily trend, acquisition channels, top referrers, on-demand aggregation, no rollup table, one consolidated endpoint, third `AnalyticsNav` tab) has a task above. Explicitly-out-of-scope items (signups/purchases/revenue, AI-traffic section, campaigns table, source drill-down) have no tasks, as intended.
- **Type consistency checked:** `WebAnalyticsTraffic`'s `current`/`previous` shape (`visitors`, `newVisitors`, `sessions`, `pageviews`) matches `TrafficKpis` in the backend service, matches the KPI row in Task 12's page, matches the test assertions in Task 5. `channels: {category, visitors, sessions}` and `referrers: {domain, visitors, sessions}` are consistent across the backend response, the frontend `WebAnalyticsTraffic` interface, and the page's `BarList` mapping.
- **Placeholder scan:** no TBD/TODO in any task; every code block is complete and copy-pasteable.
