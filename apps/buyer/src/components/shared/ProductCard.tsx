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
      className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col items-center border border-gray-100"
    >
      <div className="relative w-full aspect-[4/5] mb-4 overflow-hidden bg-white flex justify-center items-center">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-1 transform group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-md"
        />
      </div>
      <h3 className="text-[14px] sm:text-[15px] font-medium text-gray-700 mb-1 truncate text-center w-full">{name}</h3>
      <p className="text-[10px] sm:text-[11px] font-bold text-gray-900 text-center tracking-wide">{price}</p>
    </motion.div>
  );
}
