'use client';

interface Product {
  id: number;
  name: string;
  price: string;
}

const FEATURED_PRODUCTS: Product[] = [
  { id: 1, name: 'manforce', price: '₹545' },
  { id: 2, name: 'saridon', price: '₹545' },
  { id: 3, name: 'calpos 50', price: '₹545' },
  { id: 4, name: 'hylogel', price: '₹545' },
  { id: 5, name: 'ozempic', price: '₹545' },
  { id: 6, name: 'gollhrny', price: '₹545' },
  { id: 7, name: 'Foilyer', price: '₹545' },
  { id: 8, name: 'Fhtture', price: '₹545' },
];

export default function ProductCarousel() {
  // Duplicate products for infinite scroll effect
  const scrollProducts = [...FEATURED_PRODUCTS, ...FEATURED_PRODUCTS];

  return (
    <div className="w-full py-4 md:py-6 overflow-hidden">
      {/* Auto-scrolling Container */}
      <div className="auto-scroll flex gap-6 md:gap-8">
        {scrollProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="flex-shrink-0 w-32 md:w-40 bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center"
          >
            {/* Product Image */}
            <div className="w-full aspect-square flex items-center justify-center mb-3">
              <div className="relative w-20 h-24 md:w-24 md:h-28">
                {/* Bottle cap */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-gray-300 rounded-full"></div>
                {/* Bottle body */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-14 h-20 md:w-16 md:h-24 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-lg border border-gray-400"></div>
              </div>
            </div>

            {/* Product Info */}
            <h3 className="text-xs md:text-sm font-semibold text-gray-800 text-center truncate w-full">
              {product.name}
            </h3>
            <p className="text-sm md:text-base font-bold text-gray-900 mt-2">{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
