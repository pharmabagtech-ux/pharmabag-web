'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Category } from '@pharmabag/api-client';

interface PremiumCategoriesMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  categories: Category[];
}

export default function PremiumCategoriesMegaMenu({ isOpen, onMouseEnter, onMouseLeave, categories }: PremiumCategoriesMegaMenuProps) {
  // If no categories yet, show nothing or skeleton
  if (!categories || categories.length === 0) return null;

  // We can group categories for the matrix.
  // Each category is a "group" in the mega menu logic.
  // But wait, the brand menu has 3 columns. We can do the same.
  const columns = 3;
  const groups = [];
  for (let i = 0; i < categories.length; i += Math.ceil(categories.length / columns)) {
    groups.push(categories.slice(i, i + Math.ceil(categories.length / columns)));
  }

  const featuredSections = [
    {
      title: 'Quick Links',
      icon: Sparkles,
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'New Arrivals', href: '/products?sort=newest' },
        { label: 'Offers', href: '/products?filter=offers' }
      ]
    },
    {
      title: 'Top Categories',
      icon: TrendingUp,
      links: categories.slice(0, 3).map(c => ({ label: c.name, href: `/products?category=${c.id}` }))
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.99 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="fixed top-[96px] left-0 right-0 z-40 flex justify-center px-6"
        >
          <div className="w-[92vw] bg-white/80 backdrop-blur-3xl rounded-[48px] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.18)] border border-white/60 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 -z-10" />
             
            <div className="flex p-16 gap-20 relative z-10">
              {/* Category Navigation Matrix */}
              <div className="flex-1 grid grid-cols-3 gap-16">
                {groups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-12">
                    {group.map((category) => (
                      <div key={category.id} className="group/item">
                        <Link href={`/products?category=${category.id}`}>
                           <h4 className="text-[14px] font-black text-gray-900 mb-6 flex items-center justify-between group-hover/item:text-black transition-colors uppercase tracking-widest cursor-pointer">
                            {category.name}
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover/item:translate-x-1 group-hover/item:text-gray-950 transition-all" />
                          </h4>
                        </Link>
                        <ul className="grid grid-cols-1 gap-3.5">
                          {category.subCategories?.map((sub) => (
                            <li key={sub.id}>
                              <Link 
                                href={`/products?category=${category.id}&subcategory=${sub.id}`}
                                className="text-[13px] font-bold text-gray-400 hover:text-gray-950 transition-all duration-300 flex items-center gap-3"
                              >
                                <div className="w-1 h-1 rounded-full bg-gray-200 group-hover/item:bg-lime-400 transition-colors" />
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Side Content */}
              <div className="w-[300px] flex flex-col gap-12 border-l border-white/60 pl-20">
                {featuredSections.map((section, idx) => (
                  <div key={idx} className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-gray-950 rounded-2xl flex items-center justify-center text-white shadow-xl">
                          <section.icon className="w-5 h-5" />
                       </div>
                       <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{section.title}</h3>
                    </div>
                    <ul className="space-y-4">
                      {section.links.map((link, lIdx) => (
                        <li key={lIdx}>
                          <Link href={link.href} className="text-[13px] font-black text-gray-400 hover:text-gray-950 flex items-center group/link">
                            {link.label}
                            <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-950 p-6 flex items-center justify-center gap-8">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Browse through {categories.length} Categories</p>
               <div className="h-1 w-1 rounded-full bg-white/20" />
               <p className="text-[10px] font-black text-lime-400 uppercase tracking-[0.4em]">PREMIUM PHARMA NETWORK</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
