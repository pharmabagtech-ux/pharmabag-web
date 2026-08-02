import Link from 'next/link';
import type { SpecRow, Faq } from '@/lib/seo/content';

/**
 * Server-rendered content blocks.
 *
 * These are plain server components with no hooks, so their markup is in the
 * initial HTML response. That is the entire point: Bingbot, PerplexityBot,
 * ClaudeBot and GPTBot do not run JavaScript, so anything rendered only after
 * hydration does not exist as far as they are concerned.
 *
 * They are also written to be genuinely useful rather than crawler bait — a
 * spec table, real FAQs and honest cross-links help a buyer qualify a product
 * as much as they help a model summarise it. Content that exists only for
 * robots is both a policy risk and a wasted rendering budget.
 */

/** Semantic section wrapper with a proper heading level. */
export function SeoSection({
  id,
  title,
  headingLevel = 2,
  children,
  className = '',
}: {
  id?: string;
  title: string;
  headingLevel?: 2 | 3;
  children: React.ReactNode;
  className?: string;
}) {
  const Heading = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 ${className}`}
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <Heading
        id={id ? `${id}-heading` : undefined}
        className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
      >
        {title}
      </Heading>
      {children}
    </section>
  );
}

/**
 * Key-value specification table.
 *
 * A real `<table>` with `<th scope="row">` rather than a grid of divs: screen
 * readers announce the label with the value, and parsers extract clean pairs
 * instead of guessing at visual adjacency.
 */
export function SpecTable({ rows }: { rows: SpecRow[] }) {
  /**
   * Rows with no value are dropped, not rendered as an empty cell or "N/A".
   *
   * Two reasons. A blank cell reads as broken to a user, and "N/A" is worse
   * for machines — a parser will happily record the phone number as the
   * literal string "N/A". Omission is the honest representation of "not
   * stated", and it matches how `prune()` treats the same fields in JSON-LD,
   * so the visible table and the structured data always agree.
   */
  const filled = rows.filter((r) => r.value != null && String(r.value).trim());
  if (filled.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/80">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Product specifications</caption>
        <tbody>
          {filled.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 0 ? 'bg-white/60' : 'bg-slate-50/60'}
            >
              <th
                scope="row"
                className="w-2/5 border-b border-slate-100 px-4 py-3 font-semibold text-slate-600"
              >
                {row.label}
              </th>
              <td className="border-b border-slate-100 px-4 py-3 text-slate-900">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * FAQ list.
 *
 * Uses `<details>/<summary>` so it is collapsible with zero JavaScript. The
 * answer text is present in the DOM even when collapsed, so it is fully
 * crawlable — unlike a React-state accordion, whose closed answers never
 * reach a non-JS crawler at all.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white/80">
      {faqs.map((faq) => (
        <details key={faq.question} className="group px-4 py-3">
          <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none">
            <span className="inline-flex w-full items-center justify-between gap-3">
              {faq.question}
              <span
                aria-hidden="true"
                className="text-slate-400 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export interface SeoLink {
  label: string;
  href: string;
  /** Optional count shown as context, e.g. "412 products". */
  meta?: string;
}

/**
 * A block of internal links.
 *
 * Internal linking is how authority reaches deep pages. With 26,000 products
 * and a JS-rendered listing, most of the catalogue previously had no crawlable
 * path to it at all — these blocks are what actually make the long tail
 * reachable, and they give a model the related entities it needs to place a
 * page in context.
 */
export function LinkGrid({
  links,
  columns = 4,
}: {
  links: SeoLink[];
  columns?: 2 | 3 | 4;
}) {
  if (links.length === 0) return null;
  const cols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <ul className={`grid grid-cols-1 gap-2 ${cols}`}>
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 transition hover:border-teal-400 hover:bg-white hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <span className="truncate">{link.label}</span>
            {link.meta ? (
              <span className="shrink-0 text-xs text-slate-400">{link.meta}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Visible breadcrumb trail.
 *
 * Pairs with the BreadcrumbList JSON-LD. Google cross-checks the two, and a
 * visible trail that matches the markup is what earns the breadcrumb display
 * in the SERP instead of a bare URL.
 */
export function Breadcrumbs({
  crumbs,
}: {
  crumbs: { name: string; path: string }[];
}) {
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {isLast ? (
                <span aria-current="page" className="font-medium text-slate-700">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.path}
                    className="transition hover:text-teal-700 hover:underline"
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className="text-slate-300">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The lead summary paragraph.
 *
 * Deliberately the first prose on the page and deliberately self-contained:
 * this is the text most likely to be extracted as a snippet or quoted by an
 * answer engine.
 */
export function LeadSummary({ text }: { text: string }) {
  return (
    <p className="mx-auto w-full max-w-6xl px-4 text-base leading-relaxed text-slate-700 sm:px-6">
      {text}
    </p>
  );
}
