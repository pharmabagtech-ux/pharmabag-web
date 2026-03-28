'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';
import ProductCarousel from '@/components/landing/ProductCarousel';

const TRUST_HIGHLIGHTS = [
  { 
    label: 'STRICTLY AUTHENTIC',
    icon: (
      <Image src="/authentic_icon.png" alt="Strictly Authentic" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
    )
  },
  { 
    label: 'FASTEST SHIPPING',
    icon: (
      <Image src="/shipping_icon.png" alt="Fastest Shipping" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
    )
  },
  { 
    label: 'ONLY B2B PRICES',
    icon: (
      <Image src="/b2b_icon.png" alt="Only B2B Prices" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
    )
  },
  { 
    label: 'SECURE CHECKOUT',
    icon: (
      <Image src="/secure_checkout_icon.png" alt="Secure Checkout" width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
    )
  }
];

export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { sendOtp, verifyOtp } = useAuth();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-login', handleOpen);
    return () => window.removeEventListener('open-login', handleOpen);
  }, []);

  const onClose = () => setIsOpen(false);

  if (!isOpen) return null;

  const sanitizePhone = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length !== 10) {
      toast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      setStep('otp');
      toast('OTP sent successfully!', 'success');
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (otp.length !== 6) {
      toast('Please enter the 6-digit OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(cleanPhone, otp);
      toast('Login successful!', 'success');
      onClose();
      window.location.href = '/products';
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-hidden w-full h-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/Pharma_ui.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 p-3 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all z-[110]"
      >
        <X size={32} strokeWidth={2} />
      </button>

      {/* Decorative Variables */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lime-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="py-20 px-[4vw] w-full mx-auto relative z-10 flex-1 flex items-center justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 w-full">
          
          {/* Left Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl xl:max-w-4xl mx-auto lg:pr-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 lg:gap-x-8 gap-y-10 w-full">
              {TRUST_HIGHLIGHTS.map((item, idx) => (
                <motion.div 
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex flex-col items-center justify-start text-center gap-4"
                >
                  {item.icon}
                  <p className="text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-widest px-1 leading-snug">{item.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="w-full mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/60 overflow-hidden flex flex-col gap-4">
              <ProductCarousel />
              <ProductCarousel />
            </div>
          </motion.div>

          {/* Right Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto"
          >
             <div className="bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[48px] p-10 md:p-12 shadow-2xl shadow-lime-900/5">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-[52px] font-black text-black mb-2 whitespace-nowrap tracking-tight">Express Login!</h2>
                <p className="text-lg md:text-xl text-black/50 font-medium">No Signup Required</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  step === 'phone' ? handleSendOtp() : handleVerifyOtp();
                }}
                className="space-y-6"
              >
                {step === 'phone' ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
                      Phone number
                    </label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit number"
                      autoFocus
                      className="w-full h-16 bg-white/70 rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 border border-white/50"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
                      OTP
                    </label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      autoFocus
                      className="w-full h-16 bg-white/70 rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] text-xl md:text-2xl px-8 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 border border-white/50"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 bg-lime-300 hover:bg-lime-400 text-gray-900 rounded-2xl text-xl font-black shadow-xl shadow-lime-300/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <span>{step === 'phone' ? 'Send OTP' : 'Continue'}</span>
                    )}
                  </button>
                  {step === 'otp' && (
                    <button 
                      type="button" 
                      onClick={handleSendOtp}
                      className="w-full mt-6 text-center text-sm font-bold text-gray-400 hover:text-black tracking-widest transition-colors uppercase"
                    >
                      RESEND OTP
                    </button>
                  )}
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Download our App</p>
                  <div className="flex gap-4">
                    <Image 
                      src="/app_store_badge.png" 
                      alt="App Store" 
                      width={160} 
                      height={50} 
                      className="flex-1 h-auto transition-transform hover:scale-105 cursor-pointer"
                    />
                    <Image 
                      src="/google_play_badge.png" 
                      alt="Google Play" 
                      width={160} 
                      height={50} 
                      className="flex-1 h-auto transition-transform hover:scale-105 cursor-pointer"
                    />
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
