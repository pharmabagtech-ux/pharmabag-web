'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import PremiumBrandsMegaMenu from '@/components/shared/PremiumBrandsMegaMenu';
import PremiumCategoriesMegaMenu from '@/components/shared/PremiumCategoriesMegaMenu';
import CartDrawer from '@/components/cart/CartDrawer';

import { useAuth, getCategories, Category } from '@pharmabag/api-client';

interface PremiumNavbarProps {
  onLoginClick?: () => void;
}

export default function PremiumNavbar({ onLoginClick }: PremiumNavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = [
    { label: 'Brands', href: '#', type: 'menu' },
    { label: 'Categories', href: '#', type: 'category' },
    ...(categories.length > 0
      ? categories.map(c => ({
        label: c.label || c.name,
        href: `/products?category=${c.id}`,
        type: 'link',
      }))
      : []
    ),
  ];

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Fetch categories
    getCategories().then(setCategories).catch(err => console.error('Failed to fetch categories:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = (type: 'brands' | 'categories') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (type === 'brands') {
      setIsBrandsMenuOpen(true);
      setIsCategoriesMenuOpen(false);
    } else {
      setIsCategoriesMenuOpen(true);
      setIsBrandsMenuOpen(false);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsBrandsMenuOpen(false);
      setIsCategoriesMenuOpen(false);
    }, 150);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 sm:pt-4 px-2 sm:px-4 transition-all duration-300 ease-out">
        <div className={`w-[92vw] mx-auto flex items-center justify-between px-4 sm:px-6 md:px-12 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 ${scrolled
            ? 'bg-white/80 backdrop-blur-md shadow-sm border border-gray-100'
            : 'bg-white/40 backdrop-blur-xl shadow-xl border border-white/40'
          }`}>
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
            <span className="text-3xl font-black text-black tracking-tighter italic pr-2">P</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              item.type === 'menu' ? (
                <div
                  key={item.label}
                  onMouseEnter={() => handleMouseEnter('brands')}
                  onMouseLeave={handleMouseLeave}
                  className="relative cursor-pointer py-2"
                >
                  <span className="text-[14px] font-semibold text-gray-800 hover:text-black transition-colors">{item.label}</span>
                </div>
              ) : item.type === 'category' ? (
                <div
                  key={item.label}
                  onMouseEnter={() => handleMouseEnter('categories')}
                  onMouseLeave={handleMouseLeave}
                  className="relative cursor-pointer py-2"
                >
                  <span className="text-[14px] font-semibold text-gray-800 hover:text-black transition-colors">{item.label}</span>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[14px] font-semibold text-gray-800 hover:text-black transition-colors py-2"
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button className="text-black hover:text-gray-600 transition-colors">
              <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="text-black hover:text-gray-600 transition-colors"
            >
              <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            </button>

            <Link href="/profile" className="text-black hover:text-gray-600 transition-colors">
              <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>
            </Link>

            {/* Login/Logout Protocol for Auth */}
            {isMounted ? (
              !isAuthenticated ? (
                <button
                  onClick={onLoginClick}
                  className="hidden md:flex ml-2 px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 font-medium text-sm transition-all"
                >
                  Sign In
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-gray-300 pl-4">
                  <span className="text-xs font-bold text-gray-900">{user?.phone}</span>
                  <button
                    onClick={() => logout()}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    title="Logout"
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </div>
              )
            ) : (
              <div className="hidden md:flex ml-2 px-5 py-2 rounded-full bg-gray-200 text-gray-400 font-medium text-sm">Loading...</div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white/95 backdrop-blur-xl z-50 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="text-lg font-black text-black italic">P</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.type === 'menu' || item.type === 'category' ? '/products' : item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              {isMounted && (
                <div className="p-4 border-t border-gray-100">
                  {!isAuthenticated ? (
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); onLoginClick?.(); }}
                      className="w-full px-5 py-3 rounded-full bg-black text-white hover:bg-gray-800 font-medium text-sm transition-all"
                    >
                      Sign In
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{user?.phone}</span>
                      <button
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PremiumBrandsMegaMenu
        isOpen={isBrandsMenuOpen}
        onMouseEnter={() => handleMouseEnter('brands')}
        onMouseLeave={handleMouseLeave}
      />

      <PremiumCategoriesMegaMenu
        isOpen={isCategoriesMenuOpen}
        onMouseEnter={() => handleMouseEnter('categories')}
        onMouseLeave={handleMouseLeave}
        categories={categories}
      />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
