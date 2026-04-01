'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Search, Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List, Truck, ShieldCheck, ArrowUpDown, Check } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { QuickViewModal } from '@/components/products/QuickViewModal';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useProducts, useCategories, useManufacturers, useCities } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/useCart';
import { useToast } from '@/components/shared/Toast';
import { calculatePricing, getSellingPrice, getEffectiveDiscountPercent } from '@pharmabag/utils';
import { useSearchParams } from 'next/navigation';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const querySearch = searchParams.get('search');
  const queryCategory = searchParams.get('category');
  const queryManufacturer = searchParams.get('manufacturer');

  const [searchTerm, setSearchTerm] = useState(querySearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(queryCategory);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(queryManufacturer);
  const [selectedCity, setSelectedCity] = useState<string | null>(searchParams.get('city'));
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [pendingCartProducts, setPendingCartProducts] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortOption, setSortOption] = useState<string>('default');
  const [filterNewItems, setFilterNewItems] = useState(false);
  const [filterBestSelling, setFilterBestSelling] = useState(false);
  const [filterDiscountItems, setFilterDiscountItems] = useState(false);
  const [discountType, setDiscountType] = useState<'all' | 'ptr_only'>('all');

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilters]);

  // Sync state with URL params
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const manufacturer = searchParams.get('manufacturer');
    const city = searchParams.get('city');

    if (search !== null) setSearchTerm(search);
    if (category !== undefined) setSelectedCategory(category);
    if (manufacturer !== undefined) setSelectedManufacturer(manufacturer);
    if (city !== undefined) setSelectedCity(city);
  }, [searchParams]);

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

  // Derive sort params from sortOption
  const sortBy = sortOption === 'price_low_high' || sortOption === 'price_high_low' ? 'price'
    : sortOption === 'newest' ? 'createdAt'
      : undefined;
  const sortOrder = sortOption === 'price_low_high' ? 'asc' as const
    : sortOption === 'price_high_low' || sortOption === 'newest' ? 'desc' as const
      : undefined;

  const { data: categoriesData } = useCategories();
  const { data: manufacturersData } = useManufacturers();
  const { data: citiesData } = useCities();

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data ?? [];
  const manufacturers = Array.isArray(manufacturersData) ? manufacturersData : [];
  const cities = Array.isArray(citiesData) ? citiesData : [];

  // Map category slug to ID for API call if needed
  const categoryObject = categories.find((c: any) => c.slug === selectedCategory || c.id === selectedCategory);
  const effectiveCategoryId = categoryObject?.id || selectedCategory;

  // Real API calls with mock fallbacks (only APPROVED products are returned)
  const { data: productsData, isLoading, isError } = useProducts({
    page,
    limit: 24,
    search: debouncedSearch || undefined,
    categoryId: effectiveCategoryId ?? undefined,
    manufacturer: selectedManufacturer ?? undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
    sortBy,
    sortOrder,
    city: selectedCity ?? undefined,
  });

  let products = productsData?.data ?? [];
  const totalProducts = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / 24) || 1;

  // Client-side filtering for checkbox filters
  if (filterNewItems) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    products = products.filter((p: any) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo);
  }
  if (filterDiscountItems) {
    products = products.filter((p: any) => p.discountType || (p.discountMeta?.discountPercent && p.discountMeta.discountPercent > 0) || (p.discountMeta?.get && p.discountMeta.get > 0));
  }
  if (discountType === 'ptr_only') {
    products = products.filter((p: any) => p.discountType === 'PTR_DISCOUNT' || p.discountType === 'PTR_PLUS_SAME_PRODUCT_BONUS' || p.discountType === 'PTR_PLUS_DIFFERENT_PRODUCT_BONUS');
  }

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

      <Navbar showUserActions={true} onLoginClick={() => setIsLoginOpen(true)} onFilterClick={() => setShowMobileFilters(true)} />

      {/* Mobile Breadcrumb Bar - Products Page Only */}
      <div className="lg:hidden fixed bottom-20 left-0 right-0 z-40 flex justify-start px-2 sm:px-4 py-2">
        <div className="w-[92vw] mx-auto ml-0 flex items-center justify-start text-[11px] font-semibold text-gray-400 gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Home</Link>
          <span className="text-gray-300">&gt;</span>
          <span className="text-gray-400">Products</span>
        </div>
      </div>

      <div className="pt-24 lg:pt-[108px] pb-6 sm:pb-20 w-[96vw] sm:w-[92vw] max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0 space-y-6">
            {/* Sort Filter - Integrated into Sidebar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Sort By</h3>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                  className="appearance-none w-full bg-gray-50/50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 font-bold focus:ring-1 focus:ring-emerald-400 outline-none cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="price_low_high">Price: Low → High</option>
                  <option value="price_high_low">Price: High → Low</option>
                  <option value="newest">Newest First</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                  <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
              </div>
            </div>
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
                <label onClick={() => { setFilterNewItems(!filterNewItems); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterNewItems ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                    {filterNewItems && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterNewItems ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>New Items</span>
                </label>
                <label onClick={() => { setFilterBestSelling(!filterBestSelling); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterBestSelling ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                    {filterBestSelling && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterBestSelling ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>Best Selling</span>
                </label>
                <label onClick={() => { setFilterDiscountItems(!filterDiscountItems); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterDiscountItems ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                    {filterDiscountItems && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterDiscountItems ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>Discount Items</span>
                </label>
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
                <label onClick={() => { setDiscountType('all'); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${discountType === 'all' ? 'border-lime-500' : 'border-gray-300 group-hover:border-lime-500'}`}>
                    {discountType === 'all' && <div className="w-2 h-2 rounded-full bg-lime-500" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${discountType === 'all' ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>All</span>
                </label>
                <label onClick={() => { setDiscountType('ptr_only'); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${discountType === 'ptr_only' ? 'border-lime-500' : 'border-gray-300 group-hover:border-lime-500'}`}>
                    {discountType === 'ptr_only' && <div className="w-2 h-2 rounded-full bg-lime-500" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${discountType === 'ptr_only' ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>Discount PTR Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Product Grid Container */}
          <div className="flex-1 w-full relative top-0 sm:-top-1 lg:-top-2">
            
            {/* Top Navigation Bar: Breadcrumbs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 lg:mb-3 w-full pl-1">
              {/* Dynamic Breadcrumbs */}
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={3} />
                <span className="text-gray-400 capitalize truncate max-w-[120px]">
                  {selectedCategory ? selectedCategory.replace(/-/g, ' ') : 'Furniture'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={3} />
                <span className="text-gray-900 uppercase truncate max-w-[150px]">
                  {searchTerm ? searchTerm : 'NORDIC SHELF'}
                </span>
              </div>

              {/* Minimal Search Bar */}
              <div className="relative w-full sm:max-w-[260px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Search products..."
                  className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-full py-2.5 pl-10 pr-4 text-[13px] font-medium text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-400 shadow-sm transition-all hover:bg-white"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      setSortOption('default');
                      setFilterNewItems(false);
                      setFilterBestSelling(false);
                      setFilterDiscountItems(false);
                      setDiscountType('all');
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
                          { 
                            productId: product.id, 
                            quantity,
                            productName: product.name,
                            price: computedSellingPrice,
                            mrp: product.mrp,
                            imageUrl: image
                          },
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 mb-6">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    className="p-2 sm:px-3 sm:py-2 text-xs font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 px-2 max-w-[90vw] sm:max-w-none no-scrollbar">
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
                        className={`w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm font-bold rounded-xl transition-all flex-shrink-0 ${page === pageNum
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-white/60 border border-white/60 text-gray-700 hover:bg-white text-[10px] sm:text-sm'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    className="p-2 sm:px-3 sm:py-2 text-xs font-bold rounded-xl bg-white/60 border border-white/60 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Mobile Filter Drawer - Moved here to show above Navbar */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[120] lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-[280px] sm:w-[320px] bg-[#f2fcf6] z-[130] overflow-y-auto p-4 pt-16 space-y-6 lg:hidden shadow-2xl safe-bottom"
            >
              <button
                onClick={() => setShowMobileFilters(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>

              {/* Sort Filter - Integrated into Sidebar */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-white/60">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-4">Sort By</h3>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                    className="appearance-none w-full bg-gray-50/50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 font-bold focus:ring-1 focus:ring-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="price_low_high">Price: Low → High</option>
                    <option value="price_high_low">Price: High → Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

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
                  <label onClick={() => { setFilterNewItems(!filterNewItems); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterNewItems ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                      {filterNewItems && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterNewItems ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>New Items</span>
                  </label>
                  <label onClick={() => { setFilterBestSelling(!filterBestSelling); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterBestSelling ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                      {filterBestSelling && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterBestSelling ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>Best Selling</span>
                  </label>
                  <label onClick={() => { setFilterDiscountItems(!filterDiscountItems); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-md border-2 transition-colors flex items-center justify-center ${filterDiscountItems ? 'bg-lime-400 border-lime-500' : 'border-gray-200 group-hover:border-lime-400 bg-white'}`}>
                      {filterDiscountItems && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[13px] font-bold transition-colors tracking-tight ${filterDiscountItems ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>Discount Items</span>
                  </label>
                </div>
              </div>

              {/* Category Filter */}
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
                  <label onClick={() => { setDiscountType('all'); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${discountType === 'all' ? 'border-lime-500' : 'border-gray-300 group-hover:border-lime-500'}`}>
                      {discountType === 'all' && <div className="w-2 h-2 rounded-full bg-lime-500" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${discountType === 'all' ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>All</span>
                  </label>
                  <label onClick={() => { setDiscountType('ptr_only'); setPage(1); }} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center ${discountType === 'ptr_only' ? 'border-lime-500' : 'border-gray-300 group-hover:border-lime-500'}`}>
                      {discountType === 'ptr_only' && <div className="w-2 h-2 rounded-full bg-lime-500" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${discountType === 'ptr_only' ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>Discount PTR Only</span>
                  </label>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal - Now using separate component */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f2fcf6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500"></div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
