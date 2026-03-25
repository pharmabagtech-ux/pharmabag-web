'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List, X, Truck, ShieldCheck, Share2, Minus, Plus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/landing/Navbar';
import LoginModal from '@/components/landing/LoginModal';
import Footer from '@/components/landing/Footer';
import PremiumProductCard from '@/components/shared/PremiumProductCard';
import { SkeletonCard } from '@/components/shared/LoaderSkeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useProducts, useCategories, useManufacturers, useCities } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
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
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  
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

  const products = productsData?.data ?? [];
  const totalProducts = productsData?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / 24) || 1;

  return (
    <main className="min-h-screen bg-[#f2fcf6] relative overflow-hidden">
      {/* Vibrant Glass Mesh Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-[#e6fa64] rounded-full mix-blend-multiply filter blur-[150px] opacity-50 animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] bg-[#9cf1d4] rounded-full mix-blend-multiply filter blur-[130px] opacity-40 scroll-smooth pointer-events-none"></div>

<Navbar showUserActions={true} onLoginClick={() => setIsLoginOpen(true)} />

      <div className="pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto relative z-10 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-[260px] flex-shrink-0 space-y-6">
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
          </aside>

          {/* Product Grid Container */}
          <div className="flex-1 w-full relative">
            {/* Top Bar with Breadcrumbs and Search - SHIFTED RIGHT */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-10 mt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 flex-wrap">
                <span className="cursor-pointer hover:text-black transition-colors">Home</span>
                <ChevronRight className="w-4 h-4 opacity-30" />
                <span className="cursor-pointer hover:text-black transition-colors">Furniture</span>
                <ChevronRight className="w-4 h-4 opacity-30" />
                <div className="flex items-center gap-1 font-black text-gray-900 bg-white/60 px-4 py-2 rounded-2xl cursor-pointer ml-1 shadow-sm border border-white/40 group hover:bg-white transition-all">
                  <span className="uppercase tracking-tight">NORDIC SHELF</span>
                  <ChevronRight className="w-4 h-4 rotate-90 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">
                  {totalProducts} Products
                </span>
              </div>

              <div className="flex items-center gap-4 w-full xl:w-[520px]">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for Brands, Products or manufacturers"
                    className="w-full h-12 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl pl-6 pr-14 text-sm text-gray-900 font-bold placeholder:text-gray-400 focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all shadow-sm"
                  />
                  <button className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-gray-900 transition-colors">
                    <Search className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>
                <button className="p-3 bg-white/60 rounded-2xl hover:bg-white transition-all border border-white/60 shadow-sm group">
                  <Filter className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
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
                  className="flex flex-col items-center justify-center py-24 gap-4 bg-white/40 rounded-[40px] border border-white/60"
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
                  className="bg-white/40 rounded-[40px] border border-white/60 p-12"
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
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 gap-y-8"
                >
                  {products.map((product: any) => {
                    const image = product.image
                      || (product.images && product.images.length > 0
                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
                        : '/product_placeholder.png');

                    // Compute pricing from discount details if available
                    const dd = product.discountDetails || product.discountFormDetails;
                    let computedPtr = product.ptr;
                    let computedSellingPrice = product.sellingPrice || product.price || product.mrp || 0;
                    let computedDiscountTag = product.discountTag || product.discountMeta?.tag;

                    if (dd?.type && product.mrp && product.gstPercent != null) {
                      try {
                        const pricing = calculatePricing(product.mrp, product.gstPercent, dd);
                        const sp = getSellingPrice(pricing);
                        computedPtr = pricing.ptr;
                        computedSellingPrice = sp;
                        const effDiscount = getEffectiveDiscountPercent(product.mrp, sp);
                        if (effDiscount > 0) {
                          computedDiscountTag = computedDiscountTag || `${effDiscount}% OFF`;
                        }
                        if (pricing.get > 0) {
                          computedDiscountTag = `Buy ${pricing.buy} Get ${pricing.get}` + (effDiscount > 0 ? ` + ${effDiscount}% OFF` : '');
                        }
                      } catch {
                        // Fallback to raw product values if pricing computation fails
                      }
                    }

                    return (
                      <div key={product.id}>
                        <PremiumProductCard
                          name={product.name}
                          price={computedSellingPrice}
                          mrp={product.mrp}
                          image={image}
                          moq={product.moq || product.minimumOrderQuantity || 1}
                          ptr={computedPtr}
                          discountTag={computedDiscountTag}
                          cartQuantity={product.cartQuantity}
                          plusColor={product.plusColor}
                          rateLabel={computedPtr ? 'PTR' : (product.rateLabel || 'N. RATE')}
                          infoIcon={product.infoIcon}
                          onQuickView={() => {
                            setQuickViewProduct({
                              ...product,
                              _image: image,
                              _sellingPrice: computedSellingPrice,
                              _ptr: computedPtr,
                              _discountTag: computedDiscountTag,
                            });
                            setQuickViewQty(product.moq || product.minimumOrderQuantity || 1);
                          }}
                          onClick={() => window.location.href = `/products/${product.id}`}
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

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <motion.div
            key="quick-view-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setQuickViewProduct(null)}
          >
            {/* Glassmorphism Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[820px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50"
            >
              {/* Top Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  className="p-2.5 rounded-full bg-white/80 hover:bg-white border border-gray-100 shadow-sm transition-all hover:scale-105"
                  onClick={() => {}}
                >
                  <Share2 className="w-5 h-5 text-gray-700" strokeWidth={2} />
                </button>
                <button
                  className="p-2.5 rounded-full bg-white/80 hover:bg-white border border-gray-100 shadow-sm transition-all hover:scale-105"
                  onClick={() => setQuickViewProduct(null)}
                >
                  <X className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left: Product Image */}
                <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-l-3xl min-h-[350px]">
                  <div className="relative w-full h-[300px]">
                    <Image
                      src={quickViewProduct._image || '/product_placeholder.png'}
                      alt={quickViewProduct.name}
                      fill
                      className="object-contain drop-shadow-lg"
                      sizes="400px"
                    />
                  </div>
                </div>

                {/* Right: Product Details */}
                <div className="p-7 pt-14 flex flex-col gap-5">
                  {/* Product Name */}
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-snug pr-20">
                    {quickViewProduct.name}
                  </h2>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-bold">Expiry:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.expiryDate || quickViewProduct.expiry || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Discount:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct._discountTag || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-bold">Stock:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.stock ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Buy:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.discountDetails?.buy || quickViewProduct.discountFormDetails?.buy || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-bold">Min qty:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.moq || quickViewProduct.minimumOrderQuantity || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Get:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.discountDetails?.get || quickViewProduct.discountFormDetails?.get || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-bold">Max qty:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.maxOrderQuantity || quickViewProduct.stock || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">GST:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.gstPercent != null ? `${quickViewProduct.gstPercent}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-bold">Medicine Type:</span>
                      <span className="text-gray-700 font-medium">{quickViewProduct.medicineType || quickViewProduct.dosageForm || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-gray-500 font-bold">{quickViewProduct.manufacturer ? '' : ''}</span>
                      <span className="text-gray-700 font-bold uppercase text-xs tracking-wide">{quickViewProduct.manufacturer || ''}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-50/80 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold text-gray-500">MRP:</span>
                      <span className="text-lg font-extrabold text-gray-900">₹{quickViewProduct.mrp || quickViewProduct._sellingPrice}</span>
                    </div>
                    {quickViewProduct._ptr && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm font-bold text-blue-600">PTR:</span>
                        <span className="text-lg font-extrabold text-blue-700">₹{quickViewProduct._ptr}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold text-emerald-600">Net rate:</span>
                      <span className="text-lg font-extrabold text-emerald-700">₹{quickViewProduct._sellingPrice}</span>
                    </div>
                    {quickViewProduct.country && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm font-bold text-gray-500">Country:</span>
                        <span className="text-sm font-medium text-gray-700">{quickViewProduct.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuickViewQty((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center font-bold text-gray-900 text-base tabular-nums border-x border-gray-200">
                        {quickViewQty}
                      </span>
                      <button
                        onClick={() => setQuickViewQty((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                      <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Truck className="w-5 h-5 text-purple-500" />
                    Delivery in 4-8 days
                  </div>

                  {/* Additional Offers */}
                  <div className="border border-dashed border-gray-200 rounded-xl p-3">
                    <span className="inline-block text-[10px] font-bold text-white bg-emerald-500 px-2.5 py-0.5 rounded-lg uppercase tracking-wide mb-1.5">Additional offers</span>
                    <p className="text-xs text-gray-500 font-medium">Check available bank offers and cashback deals at checkout.</p>
                  </div>

                  {/* Custom Order */}
                  <p className="text-sm text-gray-700">
                    Have a <span className="font-bold underline underline-offset-2 cursor-pointer hover:text-gray-900">Custom Order ?</span>
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                      <Truck className="w-6 h-6 text-purple-600" />
                      Free Shipping
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none">PHARMA BAG</span>
                        <span className="text-[11px] font-black text-emerald-700 leading-none">CERTIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* View Full Page */}
                  <button
                    onClick={() => {
                      setQuickViewProduct(null);
                      window.location.href = `/products/${quickViewProduct.id}`;
                    }}
                    className="flex items-center gap-3 text-sm font-bold text-gray-700 hover:text-gray-900 group mt-1"
                  >
                    View Product Page
                    <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
