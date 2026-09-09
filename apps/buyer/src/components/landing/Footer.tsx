'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ENTITY_LINE, FOUNDED_YEAR } from '@/lib/seo/config';
import { CATALOGUE_TAXONOMY } from '@/lib/seo/data/catalogue-taxonomy';

/**
 * The site footer.
 *
 * ⚠️ Rendered ONCE, globally, by the root layout (`app/layout.tsx`).
 * Do NOT render it inside a page — the order detail page did, in all three of
 * its states, which put two identical footers on every order page (reported
 * from production). Pages render their own `Navbar`; the footer is global.
 */
export default function Footer() {
  /** Which category's dosage forms are expanded on a phone. */
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  /**
   * `href="#"` on About and Contact meant two of the site's strongest trust
   * signals pointed nowhere. Those pages now exist, so the links resolve —
   * and the policy pages (Shipping/Privacy/Terms) exist as of the round-2
   * SEO audit, so they are linked here too instead of being left out.
   */
  const footerLinks = [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'All Medicines', href: '/products' },
    // The categories hub was the one facet hub never linked from here, even
    // though /brands and /wholesale-medicine-suppliers were. It also stays
    // correct when a new category is added, which the static list above does
    // not until it is updated.
    { label: 'Categories', href: '/categories' },
    { label: 'Brands', href: '/brands' },
    { label: 'Suppliers by City', href: '/wholesale-medicine-suppliers' },
    { label: 'blog.pharmabag.in', href: '/blogs' },
    { label: 'Shipping & Delivery', href: '/shipping' },
    { label: 'Return Policy', href: '/returns' },
    { label: 'Refund Policy', href: '/refunds' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ];

  return (
    <footer className="bg-white py-4 sm:py-5 border-t border-gray-200 pb-32 lg:pb-4">
      <div className="w-full max-w-7xl mx-auto px-[4vw]">
        {/*
          Shop-by-category navigation.

          These 31 sub-category pages carry the catalogue's deepest written
          content and each has its own schema, yet nothing site-wide linked to
          them — they were reachable only from their parent category page and
          the sitemap. The `/brands` and `/wholesale-medicine-suppliers` hubs
          were already linked below; `/categories` was not linked at all.

          `<details>` rather than a JS toggle on purpose: the links are in the
          HTML either way, so a crawler that does not run scripts still sees
          every one of them, while a phone is not handed a 31-link wall.
        */}
        <nav
          aria-label="Shop by category"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 pb-6 mb-4 border-b border-gray-200"
        >
          {CATALOGUE_TAXONOMY.map((category) => (
            <div key={category.slug}>
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:underline"
                >
                  {category.name}
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setOpenCategory((current) =>
                      current === category.slug ? null : category.slug,
                    )
                  }
                  aria-expanded={openCategory === category.slug}
                  aria-label={`Show ${category.name} dosage forms`}
                  className="sm:hidden text-gray-400 text-xs px-2 py-1"
                >
                  {openCategory === category.slug ? '▴' : '▾'}
                </button>
              </div>
              {/*
                Always rendered, only visually collapsed on the smallest
                screens — a crawler that does not run scripts still reads every
                link, which is the entire point of putting them here.
              */}
              <ul
                className={`space-y-1.5 sm:block ${
                  openCategory === category.slug ? 'block' : 'hidden'
                }`}
              >
                {category.forms.map((form) => (
                  <li key={form.slug}>
                    <Link
                      href={`/categories/${category.slug}/${form.slug}`}
                      className="text-sm text-gray-600 hover:text-black hover:underline"
                    >
                      {category.name} {form.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-wrap justify-center items-center gap-x-2 md:gap-x-3 gap-y-4 text-sm md:text-base text-gray-600 font-medium tracking-wide">
          {footerLinks.map((link, index) => (
            <div key={link.label} className="flex items-center">
              <Link
                href={link.href}
                className="hover:text-black hover:underline transition-all px-1"
              >
                {link.label}
              </Link>
              {index < footerLinks.length - 1 && (
                <span className="text-gray-300 ml-2 md:ml-3 select-none text-xl leading-none">•</span>
              )}
            </div>
          ))}
        </div>

        {/*
          The trading entity, named where a buyer or a regulator expects to
          find it. PharmaBag is a brand, not a company — the company is the
          sole proprietorship Jaiswal Pharma, and an e-commerce operator has to
          identify itself.
        */}
        <p className="mt-4 text-center text-xs text-gray-500">
          &copy; {FOUNDED_YEAR}
          {new Date().getFullYear() > FOUNDED_YEAR ? `–${new Date().getFullYear()}` : ''}{' '}
          {ENTITY_LINE}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
