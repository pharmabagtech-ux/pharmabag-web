'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, ShoppingCart, LogOut, ClipboardList, CreditCard, HelpCircle, ArrowRight, Heart } from 'lucide-react';
import BrandsMegaMenu from '@/components/landing/BrandsMegaMenu';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchBar from '@/components/shared/SearchBar';
import { useAuth } from '@pharmabag/api-client';

interface NavbarProps {
  onLoginClick?: () => void;
  showUserActions?: boolean;
}

export default function Navbar({ onLoginClick, showUserActions = false }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 px-4">
        <div className="max-w-[1400px] w-full mx-auto px-4 py-2 rounded-xl backdrop-blur-xl bg-white/40 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
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


            {/* Right Side Actions */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* User Action Icons - Only show when logged in and showUserActions is true */}
              {isMounted && isAuthenticated && showUserActions && (
              <div className="hidden md:flex items-center gap-3">
                {/* Notifications */}
                <Link href="/notifications" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Notifications</span>
                </Link>

                {/* Cart */}
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute top-1 right-1 bg-lime-400 text-[9px] font-black text-gray-900 w-4 h-4 rounded-full flex items-center justify-center border border-white">2</span>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Cart</span>
                </button>

                {/* Profile with Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => {
                    if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
                    setIsProfileMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    profileTimeoutRef.current = setTimeout(() => setIsProfileMenuOpen(false), 200);
                  }}
                >
                  <button className="p-2 text-gray-700 hover:text-sky-600 transition-colors">
                    <User className="w-5 h-5" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 py-2 z-50">
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <User className="w-4 h-4" />
                        <span>View Profile</span>
                      </Link>
                      <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <ClipboardList className="w-4 h-4" />
                        <span>Order History</span>
                      </Link>
                      <Link href="/payments" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <CreditCard className="w-4 h-4" />
                        <span>Payment History</span>
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>Wishlist</span>
                      </Link>
                      <Link href="/credit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <CreditCard className="w-4 h-4" />
                        <span>Credit & EMI</span>
                      </Link>
                      <Link href="/support" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        <span>Support</span>
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Login Button - Only when not authenticated */}
              {isMounted ? (
                !isAuthenticated ? (
                  <button
                    onClick={onLoginClick}
                    className="px-5 py-2 rounded-xl bg-lime-300 hover:bg-lime-400 font-bold text-gray-900 transition-all hover:shadow-[0_8px_16px_rgba(217,255,0,0.3)] shadow-md text-sm flex items-center gap-2"
                  >
                    Start Now <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null
              ) : (
                <div className="px-5 py-2 rounded-full bg-gray-200 text-gray-400 font-bold text-sm">Loading...</div>
              )}
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
