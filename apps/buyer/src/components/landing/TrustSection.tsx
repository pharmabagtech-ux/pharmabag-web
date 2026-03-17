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
    <div className="py-40 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-y-32 md:gap-x-24 text-center">
          {TRUST_ITEMS.map((item, index) => (
            <div
              key={index}
              className="space-y-4 transform hover:scale-105 transition-transform duration-300"
            >
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                {item.title}
              </h3>
              {item.subtitle && <p className="text-xl md:text-2xl text-gray-700">{item.subtitle}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
