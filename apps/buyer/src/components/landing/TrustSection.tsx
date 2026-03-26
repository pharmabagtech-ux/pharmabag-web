'use client';

interface TrustItem {
  title: string;
  subtitle: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    title: 'Fastest Delivery',
    subtitle: '',
  },
  {
    title: 'Controlled Quality',
    subtitle: '',
  },
  {
    title: 'Only B2B rates',
    subtitle: '',
  },
  {
    title: '0 Tolerance to Duplicacy',
    subtitle: '',
  },
];

export default function TrustSection() {
  return (
    <div className="py-16 sm:py-24 md:py-32 lg:py-40 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 md:gap-y-24 lg:gap-y-32 md:gap-x-16 lg:gap-x-24 text-center">
          {TRUST_ITEMS.map((item, index) => (
            <div
              key={index}
              className="space-y-2 sm:space-y-4 transform hover:scale-105 transition-transform duration-300"
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                {item.title}
              </h3>
              {item.subtitle && <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700">{item.subtitle}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
