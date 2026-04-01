'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Shipping Policy', href: '#' },
    { label: 'Shop', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Blog', href: '/blogs' },
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
      </div>
    </footer>
  );
}
