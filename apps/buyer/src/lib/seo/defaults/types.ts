import type { Faq } from '../content';

/**
 * The generated content for one landing page.
 *
 * Every facet family produces this same shape. It exists so the words on a
 * page can be computed in one place and consumed by two callers: the page
 * itself, which renders them, and `/api/page-defaults`, which hands them to
 * the admin panel so an editor opens showing exactly what the live page says.
 *
 * Before this, the words lived as template literals inside each page file and
 * nothing outside the render could see them.
 */
export interface PageDefaults {
  /** Meta title, WITHOUT any pagination suffix — that is the page's business. */
  title: string;
  description: string;
  keywords: string[];
  /** The single visible H1. */
  h1: string;
  /** Opening paragraph above the product grid. */
  intro: string;
  faqs: Faq[];
}
