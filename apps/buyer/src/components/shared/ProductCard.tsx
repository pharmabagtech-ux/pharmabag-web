'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  onClick?: () => void;
}

export default function ProductCard({ name, price, image, onClick }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
    >
      <div className="relative w-full aspect-square mb-6 overflow-hidden rounded-2xl bg-[#f1f6ea]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4 transform group-hover:scale-110 transition-transform duration-700 ease-out"
        />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{name}</h3>
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">{price}</span>
        <button className="px-4 py-2 bg-lime-300 hover:bg-lime-400 rounded-full text-sm font-bold text-gray-900 transition-colors">
          Add
        </button>
      </div>
    </motion.div>
  );
}
