'use client';

import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  onLoginClick?: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const navItems = ['Brands', 'Ethical', 'Generic', 'Surgical', 'Ayurvedic', 'OTC'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
      <div className="max-w-6xl w-full mx-auto px-6 py-3 rounded-full backdrop-blur-xl bg-white/40 border border-white/40 shadow-xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/pharmabag_logo.png"
              alt="PharmaBag Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item}
                href="#"
                className="text-sm font-medium text-gray-800 hover:text-sky-600 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Login Button */}
          <button
            onClick={onLoginClick}
            className="px-6 py-2 rounded-full bg-lime-300 hover:bg-lime-400 font-semibold text-gray-900 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}
