'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, ShoppingCart, LogOut, ClipboardList, CreditCard, HelpCircle, ArrowRight, Heart, Bookmark, Menu, X, SlidersHorizontal, Filter, LifeBuoy } from 'lucide-react';
import BrandsMegaMenu from '@/components/landing/BrandsMegaMenu';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchBar from '@/components/shared/SearchBar';
import { useAuth } from '@pharmabag/api-client';
import { useCart } from '@/hooks/useCart';

function CartCountBadge() {
  const { data: cartData } = useCart();
  const count = cartData?.items?.length || 0;
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
      {count}
    </span>
  );
}

interface NavbarProps {
  onLoginClick?: () => void;
  onFilterClick?: () => void;
  showUserActions?: boolean;
}

export default function Navbar({ onLoginClick, onFilterClick, showUserActions = false }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { data: cartData } = useCart();
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
      <nav className="fixed bottom-0 lg:bottom-auto lg:top-4 left-0 right-0 z-40 flex justify-center pb-2 lg:pb-0 px-2 sm:px-[4vw]">
        <div className="relative w-[96vw] sm:w-[92vw] max-w-[1400px] mx-auto px-4 lg:px-8 py-2.5 lg:py-3.5 rounded-2xl bg-white shadow-xl flex items-center justify-between border border-gray-100/50">
          <div className="flex items-center justify-between w-full">
            {/* Logo — Far Left */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 z-10">
              <Image
                src="/pharmabag_logo.png"
                alt="PharmaBag Logo"
                width={100}
                height={28}
                className="h-5 sm:h-7 w-auto"
              />
            </Link>

            {/* Mobile/Tablet Search Bar — Next to Logo */}
            <div className="lg:hidden flex-1 min-w-0 max-w-[120px] xs:max-w-none">
              <SearchBar />
            </div>

            {/* Desktop Navigation Items — Centered */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-14 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
              {navItems.map((item) => (
                item === 'Brands' ? (
                  <div
                    key={item}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="relative py-2"
                  >
                    <button className="text-[15px] font-medium text-gray-700 hover:text-black transition-colors cursor-pointer">
                      {item}
                    </button>
                  </div>
                ) : (
                  <Link
                    key={item}
                    href={`/products?category=${item.toLowerCase()}`}
                    className="text-[15px] font-medium text-gray-700 hover:text-black transition-colors"
                  >
                    {item}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side Actions — Login Button and Menu Button */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 z-10">
              {/* Mobile: Cart icon */}
              {/* Mobile: Saved and Filter icon */}
              {isMounted && showUserActions && (
                <div className="lg:hidden flex items-center gap-1 sm:gap-2">
                  {isAuthenticated && (
                    <>
                      <Link
                        href="/orders"
                        className="p-1.5 text-black hover:text-sky-600 transition-colors"
                      >
                        <ClipboardList className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/payments"
                        className="p-1.5 text-black hover:text-sky-600 transition-colors"
                      >
                        <CreditCard className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/wishlist"
                        className="p-1.5 text-black hover:text-sky-600 transition-colors"
                      >
                        <Bookmark className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={onFilterClick}
                        className="p-1.5 text-black hover:text-sky-600 transition-colors"
                      >
                        <Filter className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {(isAuthenticated || (cartData?.items?.length ?? 0) > 0) && (
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="p-1.5 text-black hover:text-sky-600 transition-colors relative"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <CartCountBadge />
                    </button>
                  )}
                </div>
              )}

              {/* Desktop Icons */}
              {isMounted && showUserActions && (
                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                  {isAuthenticated && (
                    <>
                      <Link href="/wishlist" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                        <Bookmark className="w-5 h-5" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Bookmarks</span>
                      </Link>

                      <Link href="/notifications" className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Notifications</span>
                      </Link>
                    </>
                  )}

                  {(isAuthenticated || (cartData?.items?.length ?? 0) > 0) && (
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="p-2 text-gray-700 hover:text-sky-600 transition-colors relative group"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <CartCountBadge />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Cart</span>
                    </button>
                  )}

                  {/* Profile Dropdown — Desktop */}
                  {isAuthenticated && (
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
                  )}
                </div>
              )}

              {/* Login Button */}
              {isMounted ? (
                !isAuthenticated ? (
                  <button
                    onClick={handleLoginClick}
                    className="px-6 sm:px-8 py-2 lg:py-2.5 rounded-full bg-[#ddff85] hover:bg-[#c9f260] font-medium text-gray-900 transition-all text-sm sm:text-[15px] flex items-center"
                  >
                    Login
                  </button>
                ) : null
              ) : (
                <div className="px-4 py-2 rounded-full bg-gray-200 text-gray-400 font-bold text-sm">Loading...</div>
              )}

              {/* Hamburger Menu (Mobile) — Moved to Far Right */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 text-gray-700 hover:text-gray-900 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white z-[91] lg:hidden flex flex-col shadow-2xl safe-bottom"
            >
              {/* Menu Top Actions: User Info & Logout (Redesigned) */}
              {isMounted && isAuthenticated && (
                <div className="p-5 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">User Account</p>
                      <p className="text-base font-bold text-gray-900 tracking-tight">{user?.phone || user?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href="/support"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-gray-600 hover:text-sky-600 transition-colors"
                      >
                        <LifeBuoy className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-gray-600 hover:text-sky-600 transition-colors"
                      >
                        <User className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors border border-red-100/50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}

              <div className="flex-1" />

              {/* Category Links (Moved to Bottom) */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item}
                      href={item === 'Brands' ? '/products' : `/products?category=${item.toLowerCase()}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Menu Footer — Static help links if needed */}
              {!isAuthenticated && (
                <div className="p-5 border-t border-gray-100">
                  <button
                    onClick={() => { handleLoginClick(); setIsMobileMenuOpen(false); }}
                    className="w-full py-4 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl font-bold shadow-lg shadow-lime-200 transition-all flex items-center justify-center gap-2"
                  >
                    Start Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
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
