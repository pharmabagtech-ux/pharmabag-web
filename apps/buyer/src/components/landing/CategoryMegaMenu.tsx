'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { type Category } from '@pharmabag/api-client';
import { ArrowRight } from 'lucide-react';

interface CategoryMegaMenuProps {
  category: Category;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function CategoryMegaMenu({ category, isOpen, onMouseEnter, onMouseLeave }: CategoryMegaMenuProps) {
  // If no subcategories, we could show a default list or just not render
  const subCategories = category.subCategories || [];
  
  // We can group subcategories into columns if there are many, or just show them
  // For the "Mega Menu" feel, let's have a featured section on the right
  const featuredProducts = [
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png' },
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="fixed top-[88px] left-0 right-0 z-40 flex justify-center px-6"
        >
          <div className="w-[92vw] bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-100/50 overflow-hidden backdrop-blur-3xl">
            <div className="flex p-12 gap-16">
              {/* Categories Column */}
              <div className="flex-1">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] mb-8 flex items-center gap-2 text-[#800080]">
                  Explore {category.name}
                  <span className="text-lg font-light">›</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[15px] font-bold text-[#800080] mb-4 flex items-center justify-between group cursor-pointer hover:text-sky-600 transition-colors">
                      Sub Categories
                      <span className="text-gray-400 group-hover:text-sky-600 transition-colors">›</span>
                    </h4>
                    <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {subCategories.map((sub) => (
                        <li key={sub.id}>
                          <Link 
                            href={`/products?categoryId=${category.id}&subCategoryId=${sub.id}`}
                            className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors duration-200"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                      {subCategories.length === 0 && (
                        <li className="text-[14px] text-gray-400 italic">No subcategories available</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[15px] font-bold text-[#800080] mb-4">Popular in {category.name}</h4>
                      <ul className="space-y-3">
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">Best Sellers</a></li>
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">New Arrivals</a></li>
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">Top Brands</a></li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[15px] font-bold text-[#800080] mb-4">Resources</h4>
                      <ul className="space-y-3">
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">Usage Guide</a></li>
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">Health Tips</a></li>
                        <li><a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors">Safety Info</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Featured (Matches Brands layout) */}
              <div className="w-[400px] flex flex-col gap-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-[15px] font-bold text-[#800080]">Featured Products</h3>
                  <Link href={`/products?categoryId=${category.id}`} className="text-[12px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  {featuredProducts.map((product, idx) => (
                    <div key={idx} className="bg-[#f1f6ea] rounded-3xl p-5 flex flex-col items-center group cursor-pointer hover:shadow-xl hover:bg-[#e9f0e1] transition-all duration-500 ease-out">
                      <div className="relative w-full aspect-[4/5] mb-4 overflow-hidden rounded-2xl">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-2 transform group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      </div>
                      <p className="text-[15px] font-bold text-gray-800 mb-1">{product.name}</p>
                      <p className="text-[14px] font-semibold text-gray-500">{product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
