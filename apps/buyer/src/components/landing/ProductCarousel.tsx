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

// Designed for exactly 8 products visible: available width is 92vw (after 4vw padding on each side)
// Each product card width = 92vw / 8 = 11.5vw (including gap)
const PRODUCTS_VISIBLE = 8;

export default function ProductCarousel({ reverse = false }: { reverse?: boolean } = {}) {
  const scrollProducts = [...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS];
  const cardWidthVw = (92 / PRODUCTS_VISIBLE); // 11.5vw per product card
  const gapPercentage = 1.5; // gap as percentage of available width
  const scrollDistance = (FEATURED_PRODUCTS.length * cardWidthVw);

  return (
    <div className="w-full h-full overflow-hidden bg-transparent mx-auto px-[4vw] flex flex-col justify-center items-center pt-4">
      <div className="relative w-full flex items-center justify-center bg-transparent">
        <motion.div 
          animate={{ x: reverse ? [-scrollDistance + '%', 0] : [0, -scrollDistance + '%'] }}
          transition={{ 
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            }
          }}
          className="flex"
          style={{ gap: `${gapPercentage}%` }}
        >
          {scrollProducts.map((product, index) => (
            <div 
              key={`${product.id}-${index}`} 
              className="flex-shrink-0"
              style={{ width: `calc(${cardWidthVw}vw - ${gapPercentage / 2}%)` }}
            >
              <ProductCard 
                name={product.name} 
                price={product.price} 
                image={product.image} 
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
