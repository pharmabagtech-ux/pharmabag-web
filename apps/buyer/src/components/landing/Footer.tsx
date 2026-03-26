'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const footerLinks = [
    { label: 'Blogs', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Terms & Conditions', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Shipping Policy', href: '#' },
    { label: 'Return Policy', href: '#' },
    { label: 'Contact', href: '#' },
  ];

  return (
    <footer className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-16 lg:gap-24">
          {/* Left Section - Logo & Company Info */}
          <div className="flex items-start gap-4 sm:gap-6 md:gap-8 max-w-2xl">
            <div className="flex-shrink-0">
              <Image 
                src="/pharmabag_logo.png" 
                alt="PharmaBag Logo" 
                width={100} 
                height={100} 
                className="w-16 sm:w-20 md:w-28 h-auto"
              />
            </div>
            <div className="pt-1 sm:pt-2 min-w-0">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black mb-1 tracking-tight">
                Pharma Bag
              </h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-black font-normal leading-tight">
                India&apos;s Only <span className="font-bold">Trusted</span>
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-black/70 font-medium tracking-wide">
                B2b Pharma Platform
              </p>
            </div>
          </div>

          {/* Right Section - Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-10 md:gap-x-16 gap-y-4 sm:gap-y-6 w-full md:w-auto">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm sm:text-base md:text-lg font-medium text-black hover:text-sky-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
