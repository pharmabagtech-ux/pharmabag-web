'use client';

import { motion } from 'framer-motion';
import ProductCard from '@/components/shared/ProductCard';

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

const FEATURED_PRODUCTS: Product[] = [
  { id: 1, name: 'Manforce 100mg', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 2, name: 'Saridon Tablet', price: '₹120', image: '/products/pharma_bottle.png' },
  { id: 3, name: 'Calpol 500', price: '₹35', image: '/products/pharma_bottle.png' },
  { id: 4, name: 'Hylogel Eye Drops', price: '₹280', image: '/products/pharma_bottle.png' },
  { id: 5, name: 'Ozempic Pen', price: '₹14,500', image: '/products/pharma_bottle.png' },
  { id: 6, name: 'Gollhrny Syrup', price: '₹155', image: '/products/pharma_bottle.png' },
  { id: 7, name: 'Foilyer Cap', price: '₹89', image: '/products/pharma_bottle.png' },
  { id: 8, name: 'Fhtture Injection', price: '₹1,200', image: '/products/pharma_bottle.png' },
];

export default function ProductCarousel() {
  // Triple products for truly smooth infinite scroll
  const scrollProducts = [...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS];

  return (
    <div className="w-full py-12 overflow-hidden bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Featured Products</h2>
          <p className="text-gray-500 font-medium mt-1">Top picks for your pharmacy</p>
        </div>
      </div>

      {/* Auto-scrolling Container using Framer Motion for better control */}
      <div className="relative">
        <motion.div 
          animate={{ x: [0, -1600] }}
          transition={{ 
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            }
          }}
          className="flex gap-8 px-6"
        >
          {scrollProducts.map((product, index) => (
            <div key={`${product.id}-${index}`} className="flex-shrink-0 w-72">
              <ProductCard 
                name={product.name} 
                price={product.price} 
                image={product.image} 
              />
            </div>
          ))}
        </motion.div>
        
        {/* Gradient overlays for smooth fading edges */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointers-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointers-events-none"></div>
      </div>
    </div>
  );
}
