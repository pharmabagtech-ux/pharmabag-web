"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  User,
  ShoppingBag,
  LogOut,
  ClipboardList,
  HelpCircle,
  ArrowRight,
  Bookmark,
  Menu,
  X,
  LifeBuoy,
  Filter,
  ChevronDown,
} from "lucide-react";

import CategoryMegaMenu from "@/components/landing/CategoryMegaMenu";
import CartDrawer from "@/components/cart/CartDrawer";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import NotificationDrawer from "@/components/notifications/NotificationDrawer";
import SearchBar from "@/components/shared/SearchBar";

import { useAuth, type Category } from "@pharmabag/api-client";
import { useCart } from "@/hooks/useCart";
import { localCart } from "@/lib/local-cart";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useProducts";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function Navbar({
  onLoginClick,
  showUserActions = false,
  onFilterClick,
}: {
  onLoginClick?: () => void;
  showUserActions?: boolean;
  onFilterClick?: () => void;
}) {
  const { isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: cartData } = useCart();
  const { data: notificationsData } = useNotifications();
  const { data: wishlistData } = useWishlist();

  const unreadNotificationCount =
    notificationsData?.unreadCount ?? 0;

  const wishlistCount =
    wishlistData?.items?.length ?? 0;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] =
    useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];

  useEffect(() => {
    setIsMounted(true);

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      };
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const isAnyDrawerOpen =
    isMobileMenuOpen ||
    isCartOpen ||
    isWishlistOpen ||
    isNotificationsOpen;

  useScrollLock(isAnyDrawerOpen);

  const handleLogout = () => {
    localCart.clear();
    queryClient.invalidateQueries({
      queryKey: ["cart"],
    });
    logout();
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed bottom-0 lg:bottom-auto lg:top-4 left-0 right-0 z-50 flex justify-center pb-2">

        <div className="relative w-[96vw] sm:w-[92vw] mx-auto px-3 sm:px-4 lg:px-8 py-2.5 lg:py-3.5 rounded-2xl bg-white shadow-xl flex items-center justify-between border border-gray-100/50">

          {/* LEFT SIDE - LOGO */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center mr-2"
            >
              <Image
                src="/pharmabag_logo.png"
                alt="logo"
                width={100}
                height={28}
                className="h-5 sm:h-7 w-auto"
              />
            </Link>
          </div>

          <div className="lg:hidden flex-1 mx-2">
            <SearchBar />
          </div>

          {/* MIDDLE - SCROLLABLE CATEGORIES */}
          <div className="hidden lg:block flex-1 min-w-0 mx-4 relative overflow-hidden group/nav">
            {/* Left Shadow Gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
            
            <div 
              ref={scrollContainerRef}
              className="flex items-center gap-5 overflow-x-auto scroll-thin whitespace-nowrap scroll-smooth py-1 px-2"
            >
              <Link 
                href="/products"
                className="text-[14px] font-bold text-gray-600 hover:text-sky-600 transition-colors tracking-tight flex-shrink-0"
              >
                All Products
              </Link>
              
              {categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="relative group py-2 flex-shrink-0"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={`/products?categoryId=${category.id}`}
                    className={`flex items-center gap-1.5 text-[14px] font-bold tracking-tight transition-colors duration-200 ${
                      activeCategory === category.id ? 'text-sky-600' : 'text-gray-600 hover:text-sky-600'
                    }`}
                  >
                    {category.name}
                  </Link>
                </div>
              ))}

              <Link 
                href="/blogs"
                className="text-[14px] font-bold text-gray-600 hover:text-sky-600 transition-colors tracking-tight flex-shrink-0"
              >
                Insights
              </Link>
            </div>

            {/* Right Shadow Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
          </div>

          {/* RIGHT SIDE ICONS */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-3 z-10 min-w-[90px]">

            {showUserActions && isMounted && (

              <div className="flex items-center gap-1 sm:gap-2">

                {/* Notification */}
                <button
                  onClick={() =>
                    setIsNotificationsOpen(true)
                  }
                  className="relative p-1.5 text-gray-700 hover:text-sky-600"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Wishlist */}
                <button
                  onClick={() =>
                    setIsWishlistOpen(true)
                  }
                  className="relative p-1.5 text-gray-700 hover:text-sky-600"
                >
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />

                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* Cart */}
                <button
                  onClick={() =>
                    setIsCartOpen(true)
                  }
                  className="p-1.5 text-gray-700 hover:text-sky-600"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

              </div>
            )}

            {/* LOGIN BUTTON */}
            {isMounted && !isAuthenticated && (
              <button
                onClick={onLoginClick}
                className="px-4 sm:px-6 lg:px-8 py-2 rounded-full bg-[#ddff85] hover:bg-[#c9f260] font-medium text-gray-900 text-sm"
              >
                Login
              </button>
            )}

            {/* FILTER ICON — moved near menu */}
            {onFilterClick && (
              <button
                onClick={onFilterClick}
                className="lg:hidden p-1.5 text-gray-700 hover:text-sky-600"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* MENU BUTTON */}
            <button
              onClick={() =>
                setIsMobileMenuOpen(
                  !isMobileMenuOpen
                )
              }
              className="lg:hidden p-1.5 text-gray-700 hover:text-gray-900 ml-1 sm:ml-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

          </div>
        </div>
      </nav>

      {/* Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() =>
          setIsNotificationsOpen(false)
        }
      />

      {/* GLOBAL MEGA MENU - Outside scroll context to prevent clipping */}
      {categories.map((category: Category) => (
        <CategoryMegaMenu
          key={`mega-${category.id}`}
          category={category}
          isOpen={activeCategory === category.id}
          onMouseEnter={() => setActiveCategory(category.id)}
          onMouseLeave={() => setActiveCategory(null)}
        />
      ))}
    </>
  );
}