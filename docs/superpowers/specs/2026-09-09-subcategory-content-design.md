# Sub-category page content and footer navigation — design

**Date:** 2026-09-09
**Status:** approved, implemented

## The ask

> "For top notch SEO, the way I have a very detailed page with a lot of text in each category page, please create similar with relevant information for sub categories also, and put it in my footer, and do all relevant SEO just like my category pages."

## What was actually true

Measured before designing, via `/api/seo/page-defaults`:

| | Category page | Sub-category page |
|---|---|---|
| Intro | 302 chars | 326 chars |
| **Body prose** | **0 chars** | 567–610 chars |
| FAQs | 4 | 3 |
| Schema blocks | 4 | 4 |

The premise was inverted. Sub-category pages already carried hand-written trade guidance from the earlier facet-copy work; **category pages had no body prose at all** and were the thinner of the two.

**The real defect was duplication.** `FORM_GUIDANCE` is keyed by dosage form alone, so `/categories/ayurvedic/tablet`, `/categories/ethical/tablet` and `/categories/generic/tablet` returned byte-identical bodies. 31 sub-category pages were backed by ~13 distinct texts, differing otherwise only by a product list — the thin/duplicate shape that gets facet pages filtered out of the index, and a sharper risk in a YMYL vertical.

**The footer never linked the catalogue.** It was a flat row of 12 links. `/brands` and `/wholesale-medicine-suppliers` were linked; `/categories` was not, and no sub-category page had any site-wide link — they were reachable only from their parent page and the sitemap.

## Decisions

**31 unique bodies, not 13 richer shared ones.** Chosen over deepening the shared per-form text, and over a hybrid. Only unique content removes the duplication, and the categories genuinely differ commercially: Ayurvedic buying is brand-led with no salt substitute, Ethical is prescriber-led under price control, Generic is where rate competition actually bites, Supplements are FSSAI-regulated consumer-pull lines.

**Category pages get the body they never had** — four entries, the trade view of how buying decisions are made in each.

**A fourth, page-specific FAQ** on every sub-category page, so the FAQ set stops being identical too.

**All 31 links in the footer, grouped by parent.** Chosen over a compact categories-only column and over a top-N subset, both of which leave most sub-category pages with no site-wide link.

## Deliberate constraints

**The footer taxonomy is a static data file.** The footer renders on every page from the root layout, and a dynamic API in a root-level shared component is exactly how the whole buyer app was forced out of static rendering once before (web#97). `locations.ts` and `molecules.ts` already work this way. Cost: a category added in the admin panel is not linked from the footer until the file is updated — the `/categories` hub link, which is always current, is in the footer for that reason.

**Links are rendered, not conditionally mounted.** On phones the lists collapse behind a toggle, but every link is in the HTML regardless of state, so a crawler that does not execute scripts still reads all 31.

**Commercial content only.** Storage, breakage, pack conventions, licensing frameworks, margin structure, movement. No indications, no dosing, no efficacy claims, no invented statistics — the standing rule for this catalogue, and it matters more here than anywhere.

## Verification

The buyer app has **no test runner**, so `apps/buyer/scripts/check-page-content.ts` executes the real default generators and asserts: every sub-category page has a body, no two of the 31 bodies are identical, each has ≥3 paragraphs and ≥4 FAQs, and all four category bodies exist and are distinct. Exits non-zero on failure so it can be wired into CI later.

Production build: `/` and `/categories` remain `○ Static`, confirming the footer change did not force dynamic rendering. New body text is present in the emitted server build, and the footer nav appears in 1,152 prerendered pages.

## Not touched

The API, the admin panel, product pages, brand/molecule/location pages, and every admin override — an admin-written body still replaces the generated one exactly as before.
