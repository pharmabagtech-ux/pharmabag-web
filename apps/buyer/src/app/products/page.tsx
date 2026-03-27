'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Search, Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List, Truck, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import Footer from '@/components/landing/Footer';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { QuickViewModal } from '@/components/products/QuickViewModal';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useProducts, useCategories, useManufacturers, useCities } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent } from '@pharmabag/utils';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [pendingCartProducts, setPendingCartProducts] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Lock body scroll when mobile filter is open
  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilters]);

  const addToCart = useAddToCart();
  const removeCartItem = useRemoveCartItem();
  const updateCartItem = useUpdateCartItem();
  const { toast } = useToast();
  const { data: cartData } = useCart();
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // Create a map of productId to cart quantity for quick lookup
  const cartQuantityMap = new Map<string, number>();
  if (cartData?.items) {
    cartData.items.forEach(item => {
      if (item.productId) {
        cartQuantityMap.set(item.productId, item.quantity);
      }
    });
  }
  
  // Real API calls with mock fallbacks (only APPROVED products are returned)
  const { data: productsData, isLoading, isError } = useProducts({
    page,
    limit: 24,
    search: debouncedSearch || undefined,
    categoryId: selectedCategory ?? undefined,
    manufacturer: selectedManufacturer ?? undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  });
  const { data: categoriesData } = useCategories();
  const { data: manufacturersData } = useManufacturers();
  const { data: citiesData } = useCities();

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];
  const manufacturers = Array.isArray(manufacturersData) ? manufacturersData : [];
  const cities = Array.isArray(citiesData) ? citiesData : [];

  let products = productsData?.data ?? [];
  const totalProducts = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / 24) || 1;

  // DEV TESTING: Add a dummy product on page 1
  if (page === 1) {
    const dummyProduct = {
      id: 'dev-dummy-test-001',
      name: 'DEV TEST: Dummy Premium Product',
      mrp: 5000,
      price: 3499,
      manufacturer: 'DevTest Labs',
      stock: 15, // Low stock for testing
      moq: 2,
      minimumOrderQuantity: 2,
      images: ['/products/pharma_bottle.png'],
      imageUrl: '/products/pharma_bottle.png',
      category: 'Test Category',
      description: 'This is a dummy product for development testing only. It will help you test cart functionality, pricing, and UI elements.',
      seller: {
        id: 'dev-seller-001',
        companyName: 'Dev Test Seller',
        rating: 4.5,
        city: 'Test City',
        state: 'Test State',
      },
      pricing: {
        buy: 2,
        get: 1,
        discountPercent: 30,
      },
      ptr: 2800,
      rateLabel: 'PTR',
      isBookmarked: false,
      cartQuantity: null,
    };
    products = [dummyProduct, ...products];
  }

  return (
    <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
      {/* Vibrant Glass Mesh Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-50 animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] bg-[#9cf1d4] rounded-full mix-blend-multiply filter blur-[130px] opacity-40 scroll-smooth pointer-events-none"></div>

<Navbar showUserActions={true} onLoginClick={() => setIsLoginOpen(true)} />

      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-[4vw] w-full mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Mobile Filter Overlay */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar Filters - Hidden on mobile, shown as drawer */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-[280px] sm:w-[300px] bg-[#f2fcf6] z-50 overflow-y-auto p-4 pt-16 space-y-6 lg:hidden shadow-2xl"
              >
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>

            {/* Filter by Price */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Filter By Price</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0] || ''}
                  onChange={(e) => { setPriceRange([Number(e.target.value) || 0, priceRange[1]]); setPage(1); }}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center text-xs text-gray-700 font-medium outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1] === 10000 ? '' : priceRange[1]}
                  onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value) || 10000]); setPage(1); }}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center text-xs text-gray-700 font-medium outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em] mb-6">Filter By</h3>
              <div className="space-y-5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div>
                  <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">New Items</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div>
                  <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">Best Selling</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div>
                  <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">Discount Items</span>
                </label>
              </div>
            </div>

            {/* Category Alternative (Since NORDIC SHELF isn't our data) */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
               <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Categories</h3>
               <div className="space-y-2 max-h-64 overflow-y-auto">
                 <button
                   onClick={() => { setSelectedCategory(null); setPage(1); }}
                   className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${!selectedCategory ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}
                 >
                   All Products
                 </button>
                 {categories.map((cat: any) => (
                   <button
                     key={cat.id}
                     onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                     className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${selectedCategory === cat.slug ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}
                   >
                     {cat.name}
                   </button>
                 ))}
               </div>
            </div>

            {/* Manufacturer Filter */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Manufacturer</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => { setSelectedManufacturer(null); setPage(1); }}
                  className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${!selectedManufacturer ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Manufacturers
                </button>
                {manufacturers.map((mfr: any) => (
                  <button
                    key={mfr.id}
                    onClick={() => { setSelectedManufacturer(mfr.name); setPage(1); }}
                    className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${selectedManufacturer === mfr.name ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {mfr.name} {mfr.productCount ? <span className="text-xs text-gray-400">({mfr.productCount})</span> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Location / City Filter */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Location</h3>
              <select
                value={selectedCity ?? ''}
                onChange={(e) => { setSelectedCity(e.target.value || null); setPage(1); }}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 font-medium focus:ring-1 focus:ring-emerald-400 outline-none"
              >
                <option value="">Any Location</option>
                {cities.map((city: any) => (
                  <option key={city.id} value={city.name}>{city.name}, {city.state}</option>
                ))}
              </select>
            </div>

            {/* Discount Type */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Discount Type</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-gray-300 group-hover:border-lime-500 transition-colors flex items-center justify-center"></div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">All</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-gray-300 group-hover:border-lime-500 transition-colors flex items-center justify-center"></div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Discount PTR Only</span>
                </label>
              </div>
            </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0 space-y-6">
            {/* Filter by Price */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Filter By Price</h3>
              <div className="flex flex-col gap-3">
                <input type="number" placeholder="Min" value={priceRange[0] || ''} onChange={(e) => { setPriceRange([Number(e.target.value) || 0, priceRange[1]]); setPage(1); }} className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center text-xs text-gray-700 font-medium outline-none focus:ring-1 focus:ring-emerald-400" />
                <input type="number" placeholder="Max" value={priceRange[1] === 10000 ? '' : priceRange[1]} onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value) || 10000]); setPage(1); }} className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-2 text-center text-xs text-gray-700 font-medium outline-none focus:ring-1 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em] mb-6">Filter By</h3>
              <div className="space-y-5">
                <label className="flex items-center gap-3 cursor-pointer group"><div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div><span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">New Items</span></label>
                <label className="flex items-center gap-3 cursor-pointer group"><div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div><span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">Best Selling</span></label>
                <label className="flex items-center gap-3 cursor-pointer group"><div className="w-4 h-4 rounded-md border-2 border-gray-200 group-hover:border-lime-400 transition-colors flex items-center justify-center bg-white"></div><span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors tracking-tight">Discount Items</span></label>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Categories</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button onClick={() => { setSelectedCategory(null); setPage(1); }} className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${!selectedCategory ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}>All Products</button>
                {categories.map((cat: any) => (<button key={cat.id} onClick={() => { setSelectedCategory(cat.slug); setPage(1); }} className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${selectedCategory === cat.slug ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}>{cat.name}</button>))}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Manufacturer</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button onClick={() => { setSelectedManufacturer(null); setPage(1); }} className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${!selectedManufacturer ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}>All Manufacturers</button>
                {manufacturers.map((mfr: any) => (<button key={mfr.id} onClick={() => { setSelectedManufacturer(mfr.name); setPage(1); }} className={`w-full text-left text-sm font-medium px-2 py-1.5 rounded transition-colors ${selectedManufacturer === mfr.name ? 'text-gray-900 bg-gray-100/50' : 'text-gray-600 hover:text-gray-900'}`}>{mfr.name} {mfr.productCount ? <span className="text-xs text-gray-400">({mfr.productCount})</span> : null}</button>))}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Location</h3>
              <select value={selectedCity ?? ''} onChange={(e) => { setSelectedCity(e.target.value || null); setPage(1); }} className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 font-medium focus:ring-1 focus:ring-emerald-400 outline-none"><option value="">Any Location</option>{cities.map((city: any) => (<option key={city.id} value={city.name}>{city.name}, {city.state}</option>))}</select>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Discount Type</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group"><div className="w-4 h-4 rounded border border-gray-300 group-hover:border-lime-500 transition-colors flex items-center justify-center"></div><span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">All</span></label>
                <label className="flex items-center gap-3 cursor-pointer group"><div className="w-4 h-4 rounded border border-gray-300 group-hover:border-lime-500 transition-colors flex items-center justify-center"></div><span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Discount PTR Only</span></label>
              </div>
            </div>
          </aside>

          {/* Product Grid Container */}
          <div className="flex-1 w-full relative">
            {/* Top Bar with Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 mt-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-gray-400 flex-wrap">
                <span className="cursor-pointer hover:text-black transition-colors">Home</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-20" />
                <span className="cursor-pointer hover:text-black transition-colors">Products</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 sm:ml-2">
                  {totalProducts} Products
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-[600px]">
                {/* Filter toggle - Universal */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="p-2 sm:px-4 sm:py-3 bg-white/60 rounded-xl sm:rounded-2xl hover:bg-white transition-all border border-white/60 shadow-sm group flex items-center gap-2"
                >
                  <Filter className="w-4 h-4 text-gray-700 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                  <span className="hidden sm:inline text-xs sm:text-sm font-bold text-gray-700">Filters</span>
                </button>
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search medicines, health products..."
                    className="w-full h-10 sm:h-[48px] bg-white/60 backdrop-blur-md border border-white/60 rounded-xl sm:rounded-2xl pl-4 sm:pl-6 pr-10 sm:pr-14 text-xs sm:text-sm text-gray-900 font-bold placeholder:text-gray-400 focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all shadow-sm"
                  />
                  <div className="absolute inset-y-0 right-3 sm:right-5 flex items-center text-gray-400">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl bg-white/20 animate-pulse" />
                  ))}
                </motion.div>
              ) : isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 sm:py-24 gap-4 bg-white/40 rounded-2xl sm:rounded-3xl border border-white/60"
                >
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                    <SlidersHorizontal className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Something went wrong</h3>
                  <button onClick={() => window.location.reload()} className="text-lime-600 font-bold hover:underline">Try reloading the page</button>
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/40 rounded-2xl sm:rounded-3xl border border-white/60 p-6 sm:p-12"
                >
                  <EmptyState
                    icon={SlidersHorizontal}
                    title="No products found"
                    description={`We couldn't find any products matching "${searchTerm}" in this category.`}
                    actionLabel="Clear filters"
                    onAction={() => {
                        setSearchTerm('');
                        setSelectedCategory(null);
                        setSelectedManufacturer(null);
                        setSelectedCity(null);
                        setPriceRange([0, 10000]);
                        setPage(1);
                    }}
                  />
                </motion.div>
              ) : (
                <div
                  key="grid"
                  className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 gap-y-4 sm:gap-y-6 md:gap-y-8"
                >
                  {products.map((product: any) => {
                    const image = product.image
                      || (product.images && product.images.length > 0
                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
                        : '/product_placeholder.png');

                    // Compute pricing from discount details if available
                    const backendTypeMap: Record<string, string> = {
                      "PTR_DISCOUNT": "ptr_discount",
                      "SAME_PRODUCT_BONUS": "same_product_bonus",
                      "PTR_PLUS_SAME_PRODUCT_BONUS": "ptr_discount_and_same_product_bonus",
                      "DIFFERENT_PRODUCT_BONUS": "different_product_bonus",
                      "PTR_PLUS_DIFFERENT_PRODUCT_BONUS": "ptr_discount_and_different_product_bonus",
                      "SPECIAL_PRICE": "special_price",
                    };
                    const mappedType = product.discountType ? backendTypeMap[product.discountType] : undefined;
                    
                    const dd = product.discountDetails || product.discountFormDetails || (mappedType ? {
                      type: mappedType,
                      ...product.discountMeta
                    } : null);

                    let computedPtr = product.ptr;
                    let computedSellingPrice = product.sellingPrice || product.ptr || product.price || product.mrp || 0;
                    let computedDiscountTag = "";
                    
                    // Rebuild exactly matching the image UI
                    if (product.discountType) {
                       const d = product.discountMeta;
                       if (product.discountType === "PTR_DISCOUNT" && (d?.discountPercent ?? 0) > 0) {
                          computedDiscountTag = `${d?.discountPercent}% Off`;
                       } else if (product.discountType === "SAME_PRODUCT_BONUS" && (d?.get ?? 0) > 0) {
                          computedDiscountTag = `(${d?.buy ?? 0}+${d?.get ?? 0}) Free`;
                       } else if (product.discountType === "PTR_PLUS_SAME_PRODUCT_BONUS") {
                          if ((d?.discountPercent ?? 0) > 0 && (d?.get ?? 0) > 0) {
                             computedDiscountTag = `${d?.discountPercent}% Off (${d?.buy ?? 0}+${d?.get ?? 0})`;
                          } else if ((d?.discountPercent ?? 0) > 0) {
                             computedDiscountTag = `${d?.discountPercent}% Off`;
                          } else if ((d?.get ?? 0) > 0) {
                             computedDiscountTag = `(${d?.buy ?? 0}+${d?.get ?? 0}) Free`;
                          }
                       } else if (product.discountType === "DIFFERENT_PRODUCT_BONUS" && (d?.get ?? 0) > 0) {
                          computedDiscountTag = `(${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''}) Free`;
                       } else if (product.discountType === "PTR_PLUS_DIFFERENT_PRODUCT_BONUS") {
                          if ((d?.discountPercent ?? 0) > 0 && (d?.get ?? 0) > 0) {
                             computedDiscountTag = `${d?.discountPercent}% Off (${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''})`;
                          } else if ((d?.discountPercent ?? 0) > 0) {
                             computedDiscountTag = `${d?.discountPercent}% Off`;
                          } else if ((d?.get ?? 0) > 0) {
                             computedDiscountTag = `(${d?.buy ?? 0}+${d?.get ?? 0} ${d?.bonusProductName || ''}) Free`;
                          }
                       } else if (product.discountType === "SPECIAL_PRICE") {
                          computedDiscountTag = `Special Price`;
                       }
                    } else if (dd?.discountPercent || dd?.buy) {
                       // Fallback for older schemas
                       if ((dd.discountPercent ?? 0) > 0 && (dd.get ?? 0) > 0) {
                           computedDiscountTag = `${dd.discountPercent}% Off (${dd.buy}+${dd.get})`;
                       } else if ((dd.discountPercent ?? 0) > 0) {
                           computedDiscountTag = `${dd.discountPercent}% Off`;
                       } else if ((dd.get ?? 0) > 0) {
                           computedDiscountTag = `(${dd.buy}+${dd.get}) Free`;
                       }
                    }

                    // Final safety - if tag is empty string, don't use it
                    if (!computedDiscountTag) {
                      computedDiscountTag = product.discountTag || product.discountMeta?.tag || "";
                    }

                    if (dd?.type && product.mrp && product.gstPercent != null) {
                      try {
                        const pricing = calculatePricing(product.mrp, product.gstPercent, dd);
                        const sp = getSellingPrice(pricing);
                        computedPtr = pricing.ptr;
                        computedSellingPrice = sp;
                      } catch {
                        // Fallback to raw product values if pricing computation fails
                      }
                    }

                    // If selling price is still 0 or invalid, fall back to MRP (no discount)
                    if (!computedSellingPrice || computedSellingPrice <= 0) {
                      computedSellingPrice = product.mrp || 0;
                    }

                    const cartItemObj = cartData?.items?.find((item: any) => item.productId === product.id);

                    const handleCartChange = (quantity: number | null) => {
                      if (quantity === null) {
                        // Remove from cart
                        if (cartItemObj) {
                          removeCartItem.mutate(cartItemObj.id, {
                            onSuccess: () => {
                              toast(`${product.name} removed from cart`, 'success');
                            },
                            onError: () => {
                              toast('Failed to remove item', 'error');
                            }
                          });
                        }
                        return;
                      }
                      
                      // Prevent duplicate requests for the same product
                      if (pendingCartProducts.has(product.id)) {
                        return;
                      }
                      
                      setPendingCartProducts(prev => new Set(prev).add(product.id));
                      const moq = product.moq || product.minimumOrderQuantity || 1;
                      
                      const cleanupPending = () => {
                        setPendingCartProducts(prev => {
                          const next = new Set(prev);
                          next.delete(product.id);
                          return next;
                        });
                      };

                      if (cartItemObj) {
                        // Product is already in cart, update absolute quantity
                        updateCartItem.mutate({ itemId: cartItemObj.id, quantity }, {
                          onSuccess: () => {
                            toast(`Quantity updated to ${quantity}`, 'success');
                            cleanupPending();
                          },
                          onError: (err: any) => {
                            toast(err?.response?.data?.message || err?.message || 'Failed to update quantity', 'error');
                            cleanupPending();
                          }
                        });
                      } else {
                        // Product not in cart, add it
                        addToCart.mutate(
                          { productId: product.id, quantity },
                          {
                            onSuccess: () => {
                              toast(`${product.name} added to cart!`, 'success');
                              cleanupPending();
                            },
                            onError: (err: any) => {
                              const status = err?.response?.status || err?.status;
                              const message = err?.response?.data?.message || err?.message || '';
                              let errorMsg = 'Failed to add to cart';
                              let isSuccess = false;
                              
                              if (status === 401 || status === 403) {
                                errorMsg = 'Please log in to add items to cart';
                              } else if (status === 429) {
                                errorMsg = 'Too many requests. Please try again in a moment';
                              } else if (status === 400) {
                                if (message.includes('already in cart')) {
                                  errorMsg = 'Product quantity has been updated in cart';
                                  isSuccess = true;
                                } else if (message.includes('Minimum order quantity')) {
                                  const match = message.match(/(\d+)/);
                                  const requiredQty = match ? match[1] : '1';
                                  errorMsg = `Minimum order quantity is ${requiredQty}. Please add at least ${requiredQty} items.`;
                                } else {
                                  errorMsg = message;
                                }
                              } else if (message) {
                                errorMsg = message;
                              }
                              
                              toast(errorMsg, isSuccess ? 'success' : 'error');
                              cleanupPending();
                            },
                          }
                        );
                      }
                    };

                    return (
                      <div key={product.id}>
                        <PremiumProductCard
                          name={product.name}
                          price={computedSellingPrice}
                          mrp={product.mrp}
                          image={image}
                          stock={product.stock ?? 999}
                          moq={product.moq || product.minimumOrderQuantity || 1}
                          ptr={computedPtr}
                          discountTag={computedDiscountTag}
                          cartQuantity={cartQuantityMap.get(product.id) ?? null}
                          plusColor={product.plusColor}
                          rateLabel={computedPtr ? 'PTR' : (product.rateLabel || 'N. RATE')}
                          infoIcon={product.infoIcon}
                          productId={product.id}
                          isLoadingCart={pendingCartProducts.has(product.id)}
                          onQuickView={() => {
                            setQuickViewProduct(product);
                          }}
                          onClick={() => window.location.href = `/products/${product.id}`}
                          onCartChange={handleCartChange}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 text-sm font-bold rounded-xl transition-all ${
                        page === pageNum
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white/60 border border-white/60 text-gray-700 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Quick View Modal - Now using separate component */}
      <QuickViewModal 
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

    </main>
  );
}
