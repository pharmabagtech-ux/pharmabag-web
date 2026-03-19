'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandsMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function BrandsMegaMenu({ isOpen, onMouseEnter, onMouseLeave }: BrandsMegaMenuProps) {
  const brandGroups = [
    {
      title: 'Top Global Brands',
      titleColor: 'text-red-600',
      subgroups: [
        {
          name: 'Multinationals',
          links: ['ABBOTT LABORATORIES', 'PFIZER LTD.', 'SANOFI', 'MSD PHARMA', 'ALLERGAN', 'ALCON']
        },
        {
          name: 'Specialized Care',
          links: ['MODI MUNDI', 'HETERO HEALTHCARE', 'INSULIN']
        }
      ]
    },
    {
      title: 'Leading Indian Giants',
      titleColor: 'text-purple-700',
      subgroups: [
        {
          name: 'Market Leaders',
          links: ['SUN PHARMACEUTICALS', 'CIPLA INDIA LTD.', 'DR REDDY\'S', 'LUPIN LTD.', 'ALKEM']
        },
        {
          name: 'Growing Portfolios',
          links: ['MANKIND PHARMA', 'ZYDUS CADILA', 'INTAS LABS.', 'GLENMARK']
        }
      ]
    },
    {
      title: 'Trusted Manufacturers',
      titleColor: 'text-purple-700',
      subgroups: [
        {
          name: 'General Medicine',
          links: ['ALEMBIC', 'ARISTO PHARMA', 'MACLEODS', 'IPCA LABS', 'AJANTA PHARMA']
        },
        {
          name: 'Others',
          links: ['U.S.V. LIMITED', 'ZUVENTUS', 'EMCURE', 'EASTINDIA PHARMA']
        }
      ]
    }
  ];

  const featuredLinks = [
    {
      title: 'New & Featured',
      links: ['New Arrivals', 'Summer Essentials', 'Immunity Boosters']
    },
    {
      title: 'Trending Now',
      links: ['Best Sellers', 'Top Rated', 'Expert Picks']
    }
  ];

  const featuredProducts = [
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png' },
    { name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png' },
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
          <div className="max-w-7xl w-full bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-100/50 overflow-hidden backdrop-blur-3xl">
            <div className="flex p-12 gap-16">
              {/* Brand Columns */}
              <div className="flex-1 grid grid-cols-3 gap-12">
                {brandGroups.map((group, idx) => (
                  <div key={idx} className="space-y-10">
                    <div>
                      <h3 className={`text-[13px] font-bold uppercase tracking-[0.1em] mb-8 flex items-center gap-2 ${group.titleColor}`}>
                        {group.title}
                        {idx === 0 && <span className="text-lg font-light">›</span>}
                      </h3>
                      <div className="space-y-10">
                        {group.subgroups.map((sub, sIdx) => (
                          <div key={sIdx}>
                            <h4 className="text-[15px] font-bold text-[#800080] mb-4 flex items-center justify-between group cursor-pointer hover:text-sky-600 transition-colors">
                              {sub.name}
                              <span className="text-gray-400 group-hover:text-sky-600 transition-colors">›</span>
                            </h4>
                            <ul className="space-y-2.5">
                              {sub.links.map((link, lIdx) => (
                                <li key={lIdx}>
                                  <a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors duration-200">
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side: Featured Products (Matches screenshot layout) */}
              <div className="w-[480px] flex gap-10">
                {/* Featured Links */}
                <div className="w-[160px] space-y-10">
                  {featuredLinks.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="text-[15px] font-bold text-[#800080] mb-5">{section.title}</h3>
                      <ul className="space-y-3.5">
                        {section.links.map((link, lIdx) => (
                          <li key={lIdx}>
                            <a href="#" className="text-[14px] text-gray-500 hover:text-sky-600 transition-colors duration-200">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 grid grid-cols-2 gap-5">
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
