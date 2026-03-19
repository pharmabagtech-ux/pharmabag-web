'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts, type Product } from '@pharmabag/api-client';

interface BrandProductsModalProps {
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BrandProductsModal({
  brandName,
  isOpen,
  onClose,
}: BrandProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBrandProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        page: 1,
        limit: 20,
        search: brandName,
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [brandName]);

  useEffect(() => {
    if (isOpen) {
      fetchBrandProducts();
    }
  }, [isOpen, fetchBrandProducts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{brandName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-gradient-to-b from-lime-50 to-lime-100 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="aspect-square flex items-center justify-center mb-3">
                    <div className="relative w-16 h-20">
                      {/* Bottle cap */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gray-300 rounded-full"></div>
                      {/* Bottle body */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-11 h-16 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-lg border border-gray-400"></div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      ₹{Math.round(product.price)}
                    </p>
                    {product.mrp && (
                      <p className="text-xs text-gray-500 line-through">
                        ₹{Math.round(product.mrp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No products found for {brandName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
