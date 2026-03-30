'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Clock, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@pharmabag/api-client';

const RECENT_SEARCHES_KEY = 'pharmabag_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => getProducts({ search: debouncedQuery, limit: 5 }),
    enabled: debouncedQuery.length >= 2,
  });

  const products = results?.data ?? [];
  const recentSearches = getRecentSearches();
  const showDropdown = isFocused && (query.length > 0 || recentSearches.length > 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    setIsFocused(false);
    setQuery('');
    router.push(`/products/${productId}`);
  };

  const handleSearchSubmit = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setQuery(searchQuery);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[200px] xs:max-w-[280px] sm:max-w-md lg:max-w-none">
      <div className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-4 py-1.5 xs:py-2 rounded-full border transition-all ${
        isFocused ? 'bg-white border-lime-300 shadow-lg shadow-lime-100/50 w-full' : 'bg-white/60 border-transparent w-full'
      }`}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search products..."
          className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50"
          >
            {/* Recent Searches */}
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Recent</p>
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => { setQuery(search); handleSearchSubmit(search); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-sm font-medium text-gray-600">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {debouncedQuery.length >= 2 && (
              <div className="p-3">
                {isLoading ? (
                  <div className="px-3 py-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
                          <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-sm font-bold text-gray-400">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Products</p>
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product.id)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 font-medium">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
