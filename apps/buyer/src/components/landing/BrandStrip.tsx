'use client';

import { useState } from 'react';
import BrandProductsModal from './BrandProductsModal';

export default function BrandStrip() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
  };

  return (
    <>
      <div className="flex justify-center items-center gap-4 md:gap-6 px-4 py-4 flex-wrap">
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => handleBrandClick(brand)}
            className="text-sm md:text-base font-medium text-gray-700 hover:text-sky-600 hover:font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            {brand}
          </button>
        ))}
      </div>

      {selectedBrand && (
        <BrandProductsModal
          brandName={selectedBrand}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
