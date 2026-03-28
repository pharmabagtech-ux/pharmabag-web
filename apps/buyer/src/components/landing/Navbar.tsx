'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, ShoppingCart, LogOut, ClipboardList, CreditCard, HelpCircle, ArrowRight, Heart, Bookmark, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navItems = ['Brands', 'Ethical', 'Generic', 'Surgical', 'Ayurvedic', 'OTC'];

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      window.dispatchEvent(new CustomEvent('open-login'));
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsBrandsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsBrandsMenuOpen(false);
    }, 150);
  };

  const mobileMenuLinks = [
    { href: '/products', label: 'All Products', icon: ShoppingCart },
    { href: '/orders', label: 'My Orders', icon: ClipboardList },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/payments', label: 'Payments', icon: CreditCard },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 px-2 sm:px-4">
        <div className="w-[92vw] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl backdrop-blur-xl bg-white/40 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu (Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/pharmabag_logo.png"
                alt="PharmaBag Logo"
                width={110}
                height={32}
                className="h-6 sm:h-7 w-auto"
              />
            </Link>

            {/* Center Navigation — Desktop Only */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navItems.map((item) => (
                item === 'Brands' ? (
                  <div
                    key={item}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="relative py-2"
                  >
                    <button className="text-sm font-bold text-gray-800 hover:text-sky-600 transition-colors cursor-pointer">
                      {item}
                    </button>
                  </div>
                ) : (
                  <Link
                    key={item}
                    href={`/products?category=${item.toLowerCase()}`}
                    className="text-sm font-bold text-gray-800 hover:text-sky-600 transition-colors"
                  >
                    {item}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Mobile: Cart icon always visible for authenticated users */}
              {isMounted && isAuthenticated && showUserActions && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="md:hidden p-2 text-gray-700 hover:text-sky-600 transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              )}

              {/* Desktop Action Icons */}
              {isMounted && isAuthenticated && showUserActions && (
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                <Link href="/wishlist" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <Bookmark className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Bookmarks</span>
                </Link>

                <Link href="/notifications" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Notifications</span>
                </Link>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Cart</span>
                </button>

                {/* Profile Dropdown — Desktop */}
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

              {/* Login Button */}
              {isMounted ? (
                !isAuthenticated ? (
                  <button
                    onClick={handleLoginClick}
                    className="px-3 sm:px-5 py-2 rounded-xl bg-lime-300 hover:bg-lime-400 font-bold text-gray-900 transition-all hover:shadow-[0_8px_16px_rgba(217,255,0,0.3)] shadow-md text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <span className="hidden xs:inline">Start Now</span>
                    <span className="xs:hidden">Login</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                ) : null
              ) : (
                <div className="px-4 py-2 rounded-full bg-gray-200 text-gray-400 font-bold text-sm">Loading...</div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-[91] lg:hidden flex flex-col shadow-2xl safe-bottom"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <Image src="/pharmabag_logo.png" alt="PharmaBag" width={100} height={28} className="h-6 w-auto" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Category Links */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item}
                      href={item === 'Brands' ? '/products' : `/products?category=${item.toLowerCase()}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {mobileMenuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <link.icon className="w-5 h-5 text-gray-400" />
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Menu Footer */}
              <div className="p-4 border-t border-gray-100">
                {isMounted && isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 px-1">{user?.phone}</p>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { handleLoginClick(); setIsMobileMenuOpen(false); }}
                    className="w-full py-3 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    Sign In <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BrandsMegaMenu
        isOpen={isBrandsMenuOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
