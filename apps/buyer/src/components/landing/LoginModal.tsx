'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRUST_HIGHLIGHTS = [
  { label: 'Fastest Delivery' },
  { label: 'Controlled Qality' },
  { label: 'Only B2B rates' },
  { label: '0 Torelence 2 Diplicay' },
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-20 overflow-y-auto">
      {/* Absolute Full-Screen Glassmorphism Backdrop */}
      <div 
        className="fixed inset-0 bg-black/5 backdrop-blur-[40px] transition-opacity duration-500"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-12 md:gap-20">
        {/* Close Button - Simple X in corner */}
        <button 
          onClick={onClose}
          className="fixed top-8 right-8 p-4 text-black/80 hover:text-black transition-colors z-[110]"
        >
          <X size={32} strokeWidth={1} />
        </button>

        {/* Left Side - Branding & Trust */}
        <div className="flex-1 flex flex-col items-center text-center gap-12">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              {/* Soft glow/shadow behind logo as seen in ref */}
              <div className="absolute inset-0 bg-black/10 blur-2xl rounded-full scale-150" />
              <Image 
                src="/pharmabag_logo.png" 
                alt="PharmaBag Logo" 
                width={120} 
                height={120} 
                className="relative w-32 md:w-40 h-auto filter drop-shadow-2xl"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-black tracking-tight leading-none uppercase">Pharma Bag</h1>
              <p className="text-3xl md:text-5xl font-normal text-black tracking-tight">
                Inida&apos;s Only <span className="font-bold">Trusted</span>
              </p>
              <p className="text-xl md:text-2xl font-medium text-black/60">B2B Pharma Pklatform</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-10 mt-6 max-w-2xl px-4">
            {TRUST_HIGHLIGHTS.map((item) => (
              <p key={item.label} className="text-2xl md:text-3xl font-bold text-black whitespace-nowrap">{item.label}</p>
            ))}
          </div>
        </div>

        {/* Right Side - Form (No container) */}
        <div className="flex-1 w-full max-w-sm flex flex-col items-center">
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-black text-black mb-1">Express Login!</h2>
            <p className="text-xl md:text-2xl text-black font-medium">No Signup Required</p>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black/70 text-center">
                Phone number
              </label>
              <input 
                type="tel" 
                className="w-full h-12 md:h-14 bg-white rounded-full shadow-lg text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black/70 text-center">
                OTP
              </label>
              <input 
                type="text" 
                className="w-full h-12 md:h-14 bg-white rounded-full shadow-lg text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 outline-none transition-all"
              />
            </div>

            <button type="button" className="w-full text-center text-lg font-bold text-black/60 hover:text-black tracking-widest transition-colors">
              RESEND OTP
            </button>

            {/* App Store Badges */}
            <div className="flex gap-4 mt-8 w-full pt-4">
              <Image 
                src="/app_store_badge.png" 
                alt="Download on App Store" 
                width={160} 
                height={50} 
                className="flex-1 h-auto transition-transform hover:scale-105"
              />
              <Image 
                src="/google_play_badge.png" 
                alt="Get it on Google Play" 
                width={160} 
                height={50} 
                className="flex-1 h-auto transition-transform hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
