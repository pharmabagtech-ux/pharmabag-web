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
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-24">
          {/* Left Section - Logo & Company Info */}
          <div className="flex items-start gap-8 max-w-2xl">
            <div className="flex-shrink-0">
              <Image 
                src="/pharmabag_logo.png" 
                alt="PharmaBag Logo" 
                width={100} 
                height={100} 
                className="w-28 h-auto"
              />
            </div>
            <div className="pt-2">
              <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-1 tracking-tight whitespace-nowrap">
                Pharma Bag
              </h3>
              <p className="text-xl md:text-2xl lg:text-3xl text-black font-normal leading-tight">
                India&apos;s Only <span className="font-bold">Trusted</span>
              </p>
              <p className="text-lg md:text-xl lg:text-2xl text-black/70 font-medium tracking-wide">
                B2b Pharma Platform
              </p>
            </div>
          </div>

          {/* Right Section - Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6 md:gap-x-16">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-lg md:text-xl font-medium text-black hover:text-sky-600 transition-colors whitespace-nowrap"
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
