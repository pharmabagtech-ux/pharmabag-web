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
  { id: 1, name: 'manforce', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 2, name: 'saridon', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 3, name: 'calpos 50', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 4, name: 'hylogen', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 5, name: 'ozempic', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 6, name: 'gollhrny', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 7, name: 'Foliyer', price: '₹545', image: '/products/pharma_bottle.png' },
  { id: 8, name: 'Fhtture', price: '₹545', image: '/products/pharma_bottle.png' },
];

const PRODUCTS_VISIBLE = 8;

export default function ProductCarousel({ reverse = false }: { reverse?: boolean } = {}) {
  const scrollProducts = [...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS];

  return (
    <div className="w-full h-full mb-4 sm:mb-6 lg:mb-8 overflow-hidden bg-transparent mx-auto pl-[4vw] lg:pl-4 pr-[4vw] flex flex-col justify-center items-center pt-0 lg:pt-2">
      <div className="relative w-full flex items-center bg-transparent">
        <motion.div
          animate={{ x: reverse ? ['-33.33%', 0] : [0, '-33.33%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            }
          }}
          className="flex w-max gap-4 sm:gap-6"
        >
          {/* We duplicated FEATURED_PRODUCTS 3 times, so one set is 33.33% of the total width */}
          {scrollProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 w-[120px] sm:w-[130px] md:w-[150px]"
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
