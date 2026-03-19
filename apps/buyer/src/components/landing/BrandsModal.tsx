'use client';

import { useState } from 'react';
import BrandProductsModal from './BrandProductsModal';

export default function BrandsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const brands = [
    'ABBOTT LABORATOR. (I) LTD',
    'AJANTA PHARMA LTD.',
    'ALCON',
    'ALEMBIC',
    'ALKEM',
    'ALLERGAN',
    'APEX LABORATORIES',
    'ARISTO PHARMACEUTICALS',
    'CIPLA INDIA LTD.',
    'CADILA PHARMA. LTD.',
    'DR REDDY\'S',
    'EASTINDIA PHARMA.LTD.',
    'EMCURE',
    'GLENMARK',
    'HETERO HEALTHCARE',
    'INTAS LABS. LTD.',
    'IPCA LABORATORIES LTD.',
    'J.B. CHEMICALS',
    'LUPIN LABORATORIES LTD.',
    'MACLEODS',
    'MANKIND PHARMA',
    'MODI MUNDI',
    'MSD PHARMACEYTICALS PVT.LTD',
    'PFIZER LTD.',
    'SANOFI',
    'SUN PHARMACEUTICALS LTD.',
    'U.S.V. LIMITED',
    'ZUVENTUS',
    'ZYDUS CADILA',
    'ZYDUS HEALTHCARE LTD',
    'INSULIN',
  ];

  const handleBrandClick = (brand: string) => {
    setSelectedBrand(brand);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedBrand(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-5xl max-h-[85vh] overflow-auto pointer-events-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Browse Brands</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Brands Grid */}
          <div className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleBrandClick(brand)}
                  className="p-4 bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg hover:from-lime-100 hover:to-lime-200 border border-lime-200 hover:border-lime-400 transition-all duration-200 text-center"
                >
                  <p className="text-sm font-semibold text-gray-800 line-clamp-3">
                    {brand}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedBrand && (
        <BrandProductsModal
          brandName={selectedBrand}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
        />
      )}
    </>
  );
}
