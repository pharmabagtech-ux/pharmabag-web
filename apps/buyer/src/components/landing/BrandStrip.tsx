'use client';

export default function BrandStrip() {
  const brands = [
    'SPAZIO',
    'Gamarance',
    'Gasparyan',
    'Ocean',
    'Eembreque',
    'Helveior',
    'RODOND',
  ];

  return (
    <div className="flex justify-center items-center gap-10 md:gap-16 px-4 py-4 flex-wrap opacity-70">
      {brands.map((brand) => (
        <p key={brand} className="text-sm md:text-base font-medium text-gray-700">
          {brand}
        </p>
      ))}
    </div>
  );
}
