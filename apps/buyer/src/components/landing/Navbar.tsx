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

  useEffect(() => {
    setIsMounted(true);
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

          {/* LEFT SIDE */}
          <div className="flex items-center gap-2 flex-1">

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

            <div className="lg:hidden flex-1">
              <SearchBar />
            </div>

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
    </>
  );
}