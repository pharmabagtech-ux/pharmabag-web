'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, CreditCard, Package, ShoppingCart, HelpCircle } from 'lucide-react';
import BrandsMegaMenu from '@/components/landing/BrandsMegaMenu';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchBar from '@/components/shared/SearchBar';

interface NavbarProps {
  onLoginClick?: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navItems = ['Brands', 'Ethical', 'Generic', 'Surgical', 'Ayurvedic', 'OTC'];

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsBrandsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsBrandsMenuOpen(false);
    }, 150);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <div className="max-w-7xl w-full mx-auto px-6 py-3 rounded-full backdrop-blur-xl bg-white/40 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/pharmabag_logo.png"
                alt="PharmaBag Logo"
                width={110}
                height={32}
                className="h-7 w-auto"
              />
            </Link>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                item === 'Brands' ? (
                  <div
                    key={item}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="relative py-2"
                  >
                    <button
                      className="text-sm font-bold text-gray-800 hover:text-sky-600 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  </div>
                ) : (
                  <Link
                    key={item}
                    href="#"
                    className="text-sm font-bold text-gray-800 hover:text-sky-600 transition-colors"
                  >
                    {item}
                  </Link>
                )
              ))}
            </div>

            {/* Search Bar */}
            <SearchBar />

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden md:flex items-center gap-4 pr-6 border-r border-gray-200">
                <Link href="/support" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <HelpCircle className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Support</span>
                </Link>
                <Link href="/payments" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <CreditCard className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Payments</span>
                </Link>
                <Link href="/notifications" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <Bell className="w-5 h-5" />
                   <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Notifications</span>
                </Link>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute top-1 right-1 bg-lime-400 text-[9px] font-black text-gray-900 w-4 h-4 rounded-full flex items-center justify-center border border-white">2</span>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Cart</span>
                </button>
                <Link href="/profile" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <User className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Profile</span>
                </Link>
              </div>

              {/* Login Button */}
              <button
                onClick={onLoginClick}
                className="px-6 py-2.5 rounded-full bg-lime-300 hover:bg-lime-400 font-bold text-gray-900 transition-all hover:shadow-[0_8px_16px_rgba(217,255,0,0.3)] shadow-md text-sm"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      <BrandsMegaMenu
        isOpen={isBrandsMenuOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
