# Site SEO Settings Implementation Plan (Admin SEO Suite — Part 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-editable site-wide SEO settings (GSC/Bing verification, GA4 ID, social profile sameAs links, org contact info, default share image) that the buyer storefront picks up at render time — paste a token in the panel, live within ~5 minutes, no redeploy.

**Architecture:** Single-row `SiteSetting` table (validated JSON) + a tiny API module: public whitelisted GET (cached) and admin PUT. The buyer's root layout switches from a static `metadata` export to `generateMetadata()` backed by a tolerant, 300s-revalidated fetch (env vars remain the fallback so nothing can regress); GA4 renders from the same settings; `organizationSchema()` gains an optional overrides parameter.

**Tech Stack:** NestJS + Prisma (JSONB single row), Next 14 `generateMetadata` + cached `fetch`, existing admin conventions (apiClient/hooks/ui primitives).

**Verified facts this plan relies on (recon 2026-08-29):**
- Global `ValidationPipe({ whitelist: true, transform: true })` in `main.ts` — unknown DTO keys are stripped automatically.
- Migrations: committed SQL folders `prisma/migrations/<ts>_<name>/migration.sql` (style: quoted camelCase columns, `TIMESTAMP(3)`); deploy runs `prisma migrate deploy` since 2026-08-28.
- Buyer root layout (`apps/buyer/src/app/layout.tsx`): static `export const metadata` carries env-gated `verification` (lines ~110-117); env-gated GA4 `<Script>` pair at ~167-180; `organizationSchema()` (no args) in `lib/seo/schema.ts` reads `CONTACT`/`SOCIAL_PROFILES` from `lib/seo/config.ts` and prunes empties; `sameAs` emitted only when non-empty.
- A fetch with `next: { revalidate }` does NOT force dynamic rendering; build-time fetch failures must degrade to `{}` (tolerant) so `next build` works offline.
- Admin UI kit: `Input/Textarea/Select` (label/error/className), `Button` (leftIcon/loading), semantic tokens + `glass-card`, `Tabs` value-based, toast = react-hot-toast, sidebar NAV array in `components/layout/sidebar.tsx`, content offset `lg:pl-64`. Admin = next@14.2.5 (jest-worker guard path), buyer = 14.2.0.
- Image upload endpoint for the default share image: `POST storage/blog-image` (ADMIN) — shipped in api#36, reused via the existing `uploadBlogImage` helper in `apps/admin/api/blog.api.ts`.
- Repos/branches: api `feat/site-settings-api` off fresh `origin/main` (push via Coder); web `feat/site-seo-settings-ui` off fresh `origin/main` (push to `fork` via Server, cross-fork PR). Bash has no network this session — network ops via PowerShell.

---

## API TRAIN (branch `feat/site-settings-api`)

### Task 1: Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma` (append model)
- Create: `prisma/migrations/20260829200000_add_site_settings/migration.sql`

- [ ] **Step 1: Append to schema.prisma**

```prisma
/// Single-row site-wide settings (id is always "site"). Stored as validated
/// JSON rather than one column per key so adding a setting is a DTO change,
/// not a migration.
model SiteSetting {
  id        String   @id
  data      Json     @default("{}")
  updatedAt DateTime @updatedAt

  @@map("site_settings")
}
```

- [ ] **Step 2: Migration SQL** (hand-written, matching repo style):

```sql
-- CreateTable "site_settings"
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
```

- [ ] **Step 3: `npx prisma generate`** (regenerates the client so `prisma.siteSetting` exists). Expect exit 0.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260829200000_add_site_settings
git commit -m "feat(site-settings): single-row site_settings table"
```

### Task 2: DTO with failing validation spec first

**Files:**
- Create: `src/modules/site-settings/dto/update-site-settings.dto.ts`
- Create: `src/modules/site-settings/dto/update-site-settings.dto.spec.ts`

- [ ] **Step 1: Write the failing spec**

```ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSiteSettingsDto } from './update-site-settings.dto';

describe('UpdateSiteSettingsDto', () => {
  it('accepts a full valid payload', async () => {
    const dto = plainToInstance(UpdateSiteSettingsDto, {
      gscVerification: 'abc123XYZ',
      bingVerification: 'DEF456',
      ga4MeasurementId: 'G-ABC123XYZ0',
      socialProfiles: ['https://www.linkedin.com/company/pharmabag'],
      supportEmail: 'support@pharmabag.in',
      addressLocality: 'Kolkata',
      addressRegion: 'West Bengal',
      defaultOgImage: 'https://pharmabag03.s3.ap-south-1.amazonaws.com/blog-images/og.png',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts an empty payload (every field optional)', async () => {
    const dto = plainToInstance(UpdateSiteSettingsDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a malformed GA4 measurement id', async () => {
    const dto = plainToInstance(UpdateSiteSettingsDto, { ga4MeasurementId: 'UA-12345-1' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'ga4MeasurementId')).toBe(true);
  });

  it('rejects a non-URL social profile', async () => {
    const dto = plainToInstance(UpdateSiteSettingsDto, { socialProfiles: ['not a url'] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'socialProfiles')).toBe(true);
  });

  it('rejects a non-email supportEmail', async () => {
    const dto = plainToInstance(UpdateSiteSettingsDto, { supportEmail: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'supportEmail')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect module-not-found failure.** `npx jest update-site-settings --silent`

- [ ] **Step 3: Implement the DTO**

```ts
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * The whole admin-editable site-SEO surface. Every field optional — an empty
 * object is a valid "use the code defaults" state. The global ValidationPipe
 * runs with whitelist:true, so unknown keys are stripped before they reach
 * the service; nothing off this shape can ever be stored.
 */
export class UpdateSiteSettingsDto {
  /** Google Search Console "HTML tag" verification token (content= value). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gscVerification?: string;

  /** Bing Webmaster msvalidate.01 token. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bingVerification?: string;

  /** GA4 measurement id, e.g. G-ABC123XYZ0. */
  @ApiPropertyOptional({ example: 'G-ABC123XYZ0' })
  @IsOptional()
  @Matches(/^G-[A-Z0-9]{4,16}$/, {
    message: 'ga4MeasurementId must look like G-XXXXXXXXXX',
  })
  ga4MeasurementId?: string;

  /** Official brand profiles — feeds the Organization sameAs entity links. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  socialProfiles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({ example: 'Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressLocality?: string;

  @ApiPropertyOptional({ example: 'West Bengal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressRegion?: string;

  /** 1200x630 image URL used when a page has no share image of its own. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  defaultOgImage?: string;
}
```

- [ ] **Step 4: Spec green (5/5), commit**

```bash
git add src/modules/site-settings/dto
git commit -m "feat(site-settings): validated settings DTO"
```

### Task 3: Service + controllers + module (spec first)

**Files:**
- Create: `src/modules/site-settings/site-settings.service.ts`
- Create: `src/modules/site-settings/site-settings.service.spec.ts`
- Create: `src/modules/site-settings/site-settings.controller.ts` (public + admin controllers in one file — the module is tiny)
- Create: `src/modules/site-settings/site-settings.module.ts`
- Modify: `src/app.module.ts` (import + register)

- [ ] **Step 1: Failing service spec**

```ts
import { SiteSettingsService, SETTINGS_ROW_ID } from './site-settings.service';

describe('SiteSettingsService', () => {
  const makeService = (stored: any | null) => {
    const prisma = {
      siteSetting: {
        findUnique: jest.fn(async () => (stored ? { id: SETTINGS_ROW_ID, data: stored } : null)),
        upsert: jest.fn(async ({ create, update }: any) => ({
          id: SETTINGS_ROW_ID,
          data: update.data ?? create.data,
        })),
      },
    };
    return { service: new SiteSettingsService(prisma as any), prisma };
  };

  it('returns {} when no row exists', async () => {
    const { service } = makeService(null);
    expect(await service.get()).toEqual({});
  });

  it('returns ONLY whitelisted keys from the stored JSON', async () => {
    const { service } = makeService({
      ga4MeasurementId: 'G-ABC123XYZ0',
      hacked: 'nope',
      DATABASE_URL: 'leak',
    });
    expect(await service.get()).toEqual({ ga4MeasurementId: 'G-ABC123XYZ0' });
  });

  it('drops empty strings so the storefront falls back cleanly', async () => {
    const { service } = makeService({ gscVerification: '   ', supportEmail: 'a@b.in' });
    expect(await service.get()).toEqual({ supportEmail: 'a@b.in' });
  });

  it('upserts the single row on update and returns the stored shape', async () => {
    const { service, prisma } = makeService(null);
    const result = await service.update({ ga4MeasurementId: 'G-ABC123XYZ0' });
    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SETTINGS_ROW_ID } }),
    );
    expect(result).toEqual({ ga4MeasurementId: 'G-ABC123XYZ0' });
  });
});
```

- [ ] **Step 2: Run — fails (module missing).** Then implement service:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export const SETTINGS_ROW_ID = 'site';

/** Keys allowed OUT. Anything else in the stored JSON is never returned. */
const PUBLIC_KEYS = [
  'gscVerification',
  'bingVerification',
  'ga4MeasurementId',
  'socialProfiles',
  'supportEmail',
  'addressLocality',
  'addressRegion',
  'defaultOgImage',
] as const;

export type SiteSettingsShape = Partial<Record<(typeof PUBLIC_KEYS)[number], unknown>>;

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read the single settings row, projected onto the public whitelist.
   * The projection runs on READ as well as write so that even a row edited
   * outside the API (manual SQL) can never leak an unexpected key.
   */
  async get(): Promise<SiteSettingsShape> {
    const row = await this.prisma.siteSetting.findUnique({
      where: { id: SETTINGS_ROW_ID },
    });
    return this.project((row?.data as Record<string, unknown>) ?? {});
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettingsShape> {
    const data = this.project(dto as Record<string, unknown>);
    const row = await this.prisma.siteSetting.upsert({
      where: { id: SETTINGS_ROW_ID },
      create: { id: SETTINGS_ROW_ID, data },
      update: { data },
    });
    return this.project(row.data as Record<string, unknown>);
  }

  private project(raw: Record<string, unknown>): SiteSettingsShape {
    const out: Record<string, unknown> = {};
    for (const key of PUBLIC_KEYS) {
      const value = raw[key];
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      out[key] = value;
    }
    return out;
  }
}
```

- [ ] **Step 3: Controllers**

```ts
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

/**
 * Public read: the buyer storefront fetches this server-side to render
 * verification metas, GA4 and Organization-schema fields at request time —
 * which is what lets an admin paste a token in the panel and go live without
 * a redeploy. The service whitelists on read, so nothing non-public can leak.
 */
@ApiTags('Site Settings')
@Controller('site-settings')
export class SiteSettingsPublicController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get('public')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Public site-SEO settings (whitelisted shape)' })
  @ApiResponse({ status: 200, description: 'Settings returned' })
  async getPublic() {
    const data = await this.service.get();
    return { message: 'Site settings retrieved successfully', data };
  }
}

@ApiTags('Admin / Site Settings')
@ApiBearerAuth('JWT-auth')
@Controller('admin/site-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SiteSettingsAdminController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Read site-SEO settings (admin)' })
  async get() {
    const data = await this.service.get();
    return { message: 'Site settings retrieved successfully', data };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace site-SEO settings (admin)' })
  async update(@Body() dto: UpdateSiteSettingsDto) {
    const data = await this.service.update(dto);
    return { message: 'Site settings updated successfully', data };
  }
}
```

- [ ] **Step 4: Module + registration**

```ts
import { Module } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import {
  SiteSettingsPublicController,
  SiteSettingsAdminController,
} from './site-settings.controller';

@Module({
  controllers: [SiteSettingsPublicController, SiteSettingsAdminController],
  providers: [SiteSettingsService],
})
export class SiteSettingsModule {}
```

In `app.module.ts`: `import { SiteSettingsModule } from './modules/site-settings/site-settings.module';` and add `SiteSettingsModule,` to `imports` next to `WebAnalyticsModule`. (PrismaService: check how other modules get it — if there's a global `DatabaseModule`, nothing more needed; mirror `web-analytics.module.ts`.)

- [ ] **Step 5: Specs green, full suite, build.** `npx jest site-settings --silent` → all green; `npx jest --silent && npx nest build` → green.

- [ ] **Step 6: Commit**

```bash
git add src/modules/site-settings src/app.module.ts
git commit -m "feat(site-settings): public whitelisted GET + admin PUT over the single settings row"
```

### Task 4: Push + PR (no merge without the user's word)

- [ ] PowerShell: switch to Coder, push `feat/site-settings-api`, `gh pr create` with a body covering: what/why (runtime SEO settings), safety (new table + new endpoints only; nothing existing touched; migration additive and auto-applied by the deploy pipeline), whitelist-on-read design, merge order (this before the web PR).

---

## WEB TRAIN (branch `feat/site-seo-settings-ui`)

### Task 5: Admin — api client, hook, page, nav

**Files:**
- Create: `apps/admin/api/site-settings.api.ts`
- Create: `apps/admin/hooks/useSiteSettings.ts`
- Create: `apps/admin/app/seo-settings/page.tsx`
- Modify: `apps/admin/components/layout/sidebar.tsx` (Globe icon + entry after Blog)

- [ ] **Step 1: `site-settings.api.ts`**

```ts
import { apiClient } from "@/lib/apiClient";

export interface SiteSettings {
  gscVerification?: string;
  bingVerification?: string;
  ga4MeasurementId?: string;
  socialProfiles?: string[];
  supportEmail?: string;
  addressLocality?: string;
  addressRegion?: string;
  defaultOgImage?: string;
}

export async function getSiteSettings() {
  const { data } = await apiClient.get<{ data: SiteSettings }>("/admin/site-settings");
  return data.data;
}

export async function updateSiteSettings(payload: SiteSettings) {
  const { data } = await apiClient.put<{ data: SiteSettings }>("/admin/site-settings", payload);
  return data.data;
}
```

- [ ] **Step 2: `useSiteSettings.ts`**

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/api/site-settings.api";

export function useSiteSettings() {
  return useQuery({ queryKey: ["admin", "site-settings"], queryFn: getSiteSettings, staleTime: 30_000, retry: 1 });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: SiteSettings) => updateSiteSettings(p),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "site-settings"] }),
  });
}
```

- [ ] **Step 3: `app/seo-settings/page.tsx`** — one form, three glass-cards, mirroring the loaded settings into local state once (`useEffect` keyed on data), Save button PUTs the whole shape. Full code:

```tsx
"use client";
import { useEffect, useState } from "react";
import { Globe, Plus, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Skeleton } from "@/components/ui";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/useSiteSettings";
import { uploadBlogImage } from "@/api/blog.api";
import type { SiteSettings } from "@/api/site-settings.api";

const EMPTY: Required<Omit<SiteSettings, "socialProfiles">> & { socialProfiles: string[] } = {
  gscVerification: "",
  bingVerification: "",
  ga4MeasurementId: "",
  socialProfiles: [],
  supportEmail: "",
  addressLocality: "",
  addressRegion: "",
  defaultOgImage: "",
};

export default function SeoSettingsPage() {
  const { data, isLoading, isError } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState(EMPTY);
  const [profileDraft, setProfileDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data && !loaded) {
      setForm({ ...EMPTY, ...data, socialProfiles: data.socialProfiles ?? [] });
      setLoaded(true);
    }
  }, [data, loaded]);

  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    if (form.ga4MeasurementId && !/^G-[A-Z0-9]{4,16}$/.test(form.ga4MeasurementId)) {
      return toast.error("GA4 ID must look like G-XXXXXXXXXX");
    }
    // Send only non-empty values; the API treats absent keys as "unset".
    const payload: SiteSettings = {};
    if (form.gscVerification.trim()) payload.gscVerification = form.gscVerification.trim();
    if (form.bingVerification.trim()) payload.bingVerification = form.bingVerification.trim();
    if (form.ga4MeasurementId.trim()) payload.ga4MeasurementId = form.ga4MeasurementId.trim();
    if (form.socialProfiles.length) payload.socialProfiles = form.socialProfiles;
    if (form.supportEmail.trim()) payload.supportEmail = form.supportEmail.trim();
    if (form.addressLocality.trim()) payload.addressLocality = form.addressLocality.trim();
    if (form.addressRegion.trim()) payload.addressRegion = form.addressRegion.trim();
    if (form.defaultOgImage) payload.defaultOgImage = form.defaultOgImage;

    update.mutate(payload, {
      onSuccess: () => toast.success("Saved — the storefront picks this up within ~5 minutes"),
      onError: (e: any) => toast.error(e?.response?.data?.message || "Save failed"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (isError) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">Couldn&apos;t load settings — check the API and retry.</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Globe className="h-6 w-6 text-primary" /> SEO Settings</h1>
        <p className="text-sm text-muted-foreground">Site-wide search & AI settings. Changes go live on the storefront within about 5 minutes — no deploy needed.</p>
      </div>

      {/* Search engine codes */}
      <div className="glass-card space-y-4 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Search engine codes</h2>
        <Input label="Google Search Console verification token" value={form.gscVerification} onChange={(e) => set({ gscVerification: e.target.value })} placeholder="Paste the content value from the HTML-tag method" />
        <Input label="Bing Webmaster verification token" value={form.bingVerification} onChange={(e) => set({ bingVerification: e.target.value })} placeholder="msvalidate.01 content value" />
        <Input label="Google Analytics 4 measurement ID" value={form.ga4MeasurementId} onChange={(e) => set({ ga4MeasurementId: e.target.value.toUpperCase() })} placeholder="G-XXXXXXXXXX" />
      </div>

      {/* Brand profiles */}
      <div className="glass-card space-y-3 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Official brand profiles</h2>
        <p className="text-xs text-muted-foreground">LinkedIn, Play Store, YouTube, Instagram… These become sameAs links in the site&apos;s schema, helping Google and AI systems connect PharmaBag to its real profiles. Only add profiles you own.</p>
        <div className="space-y-2">
          {form.socialProfiles.map((url) => (
            <div key={url} className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
              <span className="truncate">{url}</span>
              <button type="button" onClick={() => set({ socialProfiles: form.socialProfiles.filter((u) => u !== url) })}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input value={profileDraft} placeholder="https://…" onChange={(e) => setProfileDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProfile(); } }} />
          <Button variant="secondary" onClick={addProfile} leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
        </div>
      </div>

      {/* Organisation */}
      <div className="glass-card space-y-4 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground">Organisation</h2>
        <Input label="Support email" value={form.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} placeholder="support@pharmabag.in" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" value={form.addressLocality} onChange={(e) => set({ addressLocality: e.target.value })} placeholder="Kolkata" />
          <Input label="State" value={form.addressRegion} onChange={(e) => set({ addressRegion: e.target.value })} placeholder="West Bengal" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Default share image (1200×630)</label>
          <p className="mb-2 text-xs text-muted-foreground">Shown when a page without its own image is shared on WhatsApp / LinkedIn / social.</p>
          {form.defaultOgImage ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.defaultOgImage} alt="Default share" className="h-16 w-28 rounded-lg border border-border object-cover" />
              <button type="button" className="text-xs font-semibold text-red-500" onClick={() => set({ defaultOgImage: "" })}>Remove</button>
            </div>
          ) : (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
              <UploadCloud className="h-4 w-4" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = "";
                if (!f) return;
                try { set({ defaultOgImage: await uploadBlogImage(f) }); }
                catch (err: any) { toast.error(err?.response?.data?.message || "Upload failed"); }
              }} />
            </label>
          )}
        </div>
      </div>

      <Button onClick={save} loading={update.isPending} disabled={update.isPending}>Save settings</Button>
    </div>
  );

  function addProfile() {
    const url = profileDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) return toast.error("Profile links must start with https://");
    if (!form.socialProfiles.includes(url)) set({ socialProfiles: [...form.socialProfiles, url] });
    setProfileDraft("");
  }
}
```

- [ ] **Step 4: Sidebar** — add `Globe` to the lucide import and `{ icon: Globe, label: "SEO Settings", href: "/seo-settings" },` after the Blog entry.

- [ ] **Step 5: tsc + commit** (`feat(admin): SEO Settings page — search codes, brand profiles, org info, default share image`)

### Task 6: Buyer — runtime consumption with env fallback

**Files:**
- Create: `apps/buyer/src/lib/seo/site-settings.ts`
- Modify: `apps/buyer/src/app/layout.tsx` (metadata → generateMetadata; GA4 block; async component)
- Modify: `apps/buyer/src/lib/seo/schema.ts` (`organizationSchema(overrides?)`)

- [ ] **Step 1: `lib/seo/site-settings.ts`**

```ts
/**
 * Runtime site-SEO settings, edited in the admin panel.
 *
 * Tolerant by contract: ANY failure returns {} and the storefront falls back
 * to env vars / code defaults — settings must never be able to take the site
 * down, and `next build` must succeed with no API reachable.
 */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.pharmabag.in/api'
).replace(/\/+$/, '');

export interface SiteSettings {
  gscVerification?: string;
  bingVerification?: string;
  ga4MeasurementId?: string;
  socialProfiles?: string[];
  supportEmail?: string;
  addressLocality?: string;
  addressRegion?: string;
  defaultOgImage?: string;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/site-settings/public`, {
      headers: { accept: 'application/json' },
      // 5 minutes is the advertised propagation delay for panel edits.
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const body = await res.json();
    const data = body?.data ?? body;
    return data && typeof data === 'object' ? (data as SiteSettings) : {};
  } catch {
    return {};
  }
}
```

- [ ] **Step 2: layout.tsx** — replace the static `export const metadata` with `export async function generateMetadata(): Promise<Metadata>` returning the SAME object, with two changes: verification prefers settings over env (`settings.gscVerification || process.env.NEXT_PUBLIC_GSC_VERIFICATION`), and `openGraph.images`/`twitter.images` prefer `settings.defaultOgImage` when present. Make `RootLayout` `async`, fetch settings once (`const settings = await fetchSiteSettings()` — Next dedupes the identical fetch across generateMetadata and the component), pass `organizationSchema({ sameAs: settings.socialProfiles, email: settings.supportEmail, addressLocality: settings.addressLocality, addressRegion: settings.addressRegion })`, and gate GA4 on `const ga4Id = settings.ga4MeasurementId || process.env.NEXT_PUBLIC_GA4_ID` (both Script tags interpolate `ga4Id`). Keep every comment; update the verification comment to mention the panel now being the primary source.

- [ ] **Step 3: schema.ts** — `organizationSchema(overrides: { sameAs?: string[]; email?: string; addressLocality?: string; addressRegion?: string } = {})`: `sameAs: (overrides.sameAs?.length ? overrides.sameAs : SOCIAL_PROFILES).length ? … : undefined`, `email: overrides.email || CONTACT.email` (both places), `addressLocality: overrides.addressLocality || CONTACT.addressLocality`, `addressRegion: overrides.addressRegion || CONTACT.addressRegion`. All other fields unchanged; no other callers break (parameter optional — verify with grep `organizationSchema(`).

- [ ] **Step 4: tsc buyer + full builds (both apps, jest-worker guard per next version) + commit**

### Task 7: Push + PR

- [ ] PowerShell: Server account, push `feat/site-seo-settings-ui` to `fork`, cross-fork PR. Body: what it does, the 5-minute propagation, env-var fallback (nothing regresses if the API is down or the row is empty), merge order (api PR first — the buyer fetch 404s harmlessly to {} until then, but the admin page needs the endpoints). No merge without the user's word.

### Post-merge live verification (the real gate)

1. `GET https://api.pharmabag.in/api/site-settings/public` → 200 `{data:{}}`.
2. Admin: Arko (or agent-guided click-path) saves a test GA4 id `G-TESTTEST01` → within ~5 min the homepage HTML contains `googletagmanager.com/gtag/js?id=G-TESTTEST01` → then clear it (field emptied, Save) → tag disappears. This proves the whole loop without touching real analytics.
3. Homepage org schema gains `sameAs` once Arko adds a profile URL.

## Self-review notes
- Whitelist enforced on READ in the service (not just the DTO) — a manually edited row cannot leak.
- `generateMetadata` + async layout keeps static rendering (revalidated fetch, no dynamic APIs) — verified against the Phase-1 lesson by checking the build's route table stays unchanged in Task 6 Step 4.
- The admin page sends only non-empty keys; PUT replaces the row — "clear a field" works by omitting it. This is deliberate (single source of truth), stated in the page's save handler.
