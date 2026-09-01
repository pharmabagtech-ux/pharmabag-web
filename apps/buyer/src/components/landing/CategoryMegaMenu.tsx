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
          <div className="w-[92vw] max-h-[calc(100vh-120px)] bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-100/50 overflow-y-auto overflow-x-hidden backdrop-blur-3xl no-sb">
            <div className="flex p-8 gap-10 min-h-0">
              {/* Categories Column */}
              <div className="flex-1">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] mb-6 flex items-center gap-2 text-[#800080]">
                  Explore {category.name}
                  <span className="text-lg font-light">›</span>
                </h3>
                
                <div className="grid grid-cols-1 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[15px] font-bold text-[#800080] mb-4 flex items-center justify-between group cursor-pointer hover:text-sky-600 transition-colors border-b border-gray-100 pb-2">
                      Sub Categories
                      <span className="text-gray-400 group-hover:text-sky-600 transition-colors">›</span>
                    </h4>
                    <ul className={`grid ${subCategories.length > 10 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-8 gap-y-3`}>
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




                </div>
              </div>


            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
