'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const TRUST_HIGHLIGHTS = [
  {
    label: '0 Tolerance to Duplicacy',
    icon: (
      <Image src="/authentic_icon.png" alt="0 Tolerance" width={100} height={100} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
    )
  },
  {
    label: 'Fastest Delivery',
    icon: (
      <Image src="/shipping_icon.png" alt="Fastest Delivery" width={100} height={100} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
    )
  },
  {
    label: 'Only B2B rates',
    icon: (
      <Image src="/b2b_icon.png" alt="Only B2B Rates" width={100} height={100} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
    )
  },
  {
    label: 'Controlled Quality',
    icon: (
      <Image src="/secure_checkout_icon.png" alt="Controlled Quality" width={100} height={100} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
    )
  }
];

export default function TrustSection() {
  return (
    <div className="pt-16 mb-16 md:pt-24 pb-0 bg-transparent px-[4vw]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-16">
          {TRUST_HIGHLIGHTS.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              className="flex flex-col items-center justify-center text-center gap-6 group cursor-default"
            >
              <div className="transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                {item.icon}
              </div>
              <p className="text-sm md:text-base font-bold text-gray-700 uppercase tracking-widest px-2 leading-snug group-hover:text-black transition-colors duration-300">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
