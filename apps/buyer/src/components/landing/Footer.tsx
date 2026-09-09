'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ENTITY_LINE, FOUNDED_YEAR } from '@/lib/seo/config';

/**
 * The site footer.
 *
 * ⚠️ Rendered ONCE, globally, by the root layout (`app/layout.tsx`).
 * Do NOT render it inside a page — the order detail page did, in all three of
 * its states, which put two identical footers on every order page (reported
 * from production). Pages render their own `Navbar`; the footer is global.
 */
export default function Footer() {
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
