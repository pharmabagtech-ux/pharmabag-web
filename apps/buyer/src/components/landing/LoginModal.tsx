'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';
import ProductCarousel from '@/components/landing/ProductCarousel';
import { useScrollLock } from '@/hooks/useScrollLock';

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

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LoginModal({ isOpen: isOpenProp, onClose: onCloseProp }: LoginModalProps = {}) {
  const [isOpenState, setIsOpenState] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { sendOtp, verifyOtp } = useAuth();

  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState;
  const onClose = onCloseProp !== undefined ? onCloseProp : () => setIsOpenState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedPhone = sessionStorage.getItem('loginModal_phone');
    const savedStep = sessionStorage.getItem('loginModal_step') as 'phone' | 'otp';
    if (savedPhone) { setPhone(savedPhone); setStep(savedStep || 'phone'); }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (phone) { sessionStorage.setItem('loginModal_phone', phone); }
    sessionStorage.setItem('loginModal_step', step);
  }, [phone, step]);

  const handleCloseCleanup = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('loginModal_phone');
      sessionStorage.removeItem('loginModal_step');
    }
    onClose();
  };

  useEffect(() => {
    const handleOpen = () => { if (isOpenProp === undefined) setIsOpenState(true); };
    window.addEventListener('open-login', handleOpen);
    return () => window.removeEventListener('open-login', handleOpen);
  }, [isOpenProp]);

  const sanitizePhone = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.substring(2);
    return cleaned;
  };

  const handleSendOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (cleanPhone.length !== 10) { toast('Please enter 10 digits', 'error'); return; }
    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      setStep('otp');
      toast('OTP sent!', 'success');
    } catch (e: any) { toast('Failed', 'error'); } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = sanitizePhone(phone);
    if (otp.length !== 6) { toast('Enter 6-digit OTP', 'error'); return; }
    setIsLoading(true);
    try {
      await verifyOtp(cleanPhone, otp);
      toast('Login successful!', 'success');
      handleCloseCleanup();
      router.push('/products');
    } catch (e: any) { toast('Invalid OTP', 'error'); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" className="fixed  inset-0 z-[1000] h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-0 select-none">
      {/* Backgrounds */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#E0F7FA] to-[#B2EBF2] z-0 md:hidden" />
      <div className="fixed inset-0 z-0 hidden md:block" style={{ backgroundImage: "url('/Pharma_ui.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />

      {/* Close Button */}
      <button onClick={() => onClose()} className="fixed top-4 right-4 p-2 text-black hover:bg-black/10 rounded-full z-[150] bg-white shadow-xl border border-black/5">
        <X size={24} strokeWidth={3} />
      </button>

      {/* Main UI Container */}
      <div className="relative mb-10 z-10 w-full h-full flex flex-col items-center justify-start md:justify-center pt-2 pb-2 md:pt-16 md:pb-12 overflow-hidden">

        {/* TOP: Badges - Mobile Only */}
        <div className="w-full flex md:hidden justify-center  px-0  mb-1">
          <div className="flex flex-row gap-3 w-full max-w-xs justify-center">
            <Image src="/app_store_badge.png" alt="App Store" width={112} height={34} className="w-auto h-auto opacity-90" />
            <Image src="/google_play_badge.png" alt="Google Play" width={112} height={34} className="w-auto h-auto opacity-90" />
          </div>
        </div>

        <div className="container max-w-7xl mx-auto flex flex-col items-center mb-6 justify-center w-full px-0">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-16 xl:gap-24 w-full h-fit">

            {/* FORM SECTION (Desktop Right, Mobile Top) */}
            <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full lg:w-[45%] flex flex-col items-center justify-center order-1 lg:order-2 px-0 lg:px-0">
              <div className="w-full  md:max-w-lg md:bg-white/60 md:backdrop-blur-3xl md:border md:border-white/60 md:rounded-[48px] p-0 sm:p-4 md:p-10 xl:p-12 md:shadow-2xl md:shadow-lime-900/10 transition-all flex flex-col items-center">

                {/* Titles - Mobile: mb-3, Desktop: mb-10 */}
                <div className="text-center mb-3 md:mb-10 w-full">
                  <h2 className="text-[36px] md:text-[52px] font-black text-[#1A1A1A] md:text-black mb-0 tracking-tighter leading-none uppercase md:normal-case">Express Login!</h2>
                  <p className="text-[18px] md:text-xl text-[#1A1A1A] font-bold pt-3 uppercase tracking-tight md:text-black/50">NO SIGNUP REQUIRED</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); step === 'phone' ? handleSendOtp() : handleVerifyOtp(); }} className="space-y-4 md:space-y-8 flex flex-col items-center w-full px-0">
                  {step === 'phone' ? (
                    <div className="space-y-2 w-full flex flex-col items-center px-6">
                      <label className="block text-[11px] md:text-xs font-bold text-[#999999] md:text-gray-400 uppercase tracking-[0.2em] text-center">PHONE NUMBER</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="00000 00000" autoFocus className="w-full h-[72px] md:h-16 bg-white md:bg-white/80 rounded-full md:rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] md:shadow-none text-[22px] md:text-2xl px-10 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none border-none md:border md:border-white/50 font-black" />
                    </div>
                  ) : (
                    <div className="space-y-2 w-full flex flex-col items-center px-6">
                      <label className="block text-[11px] md:text-xs font-bold text-[#999999] md:text-gray-400 uppercase tracking-[0.2em] text-center">ENTER CODE</label>
                      <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" maxLength={6} autoFocus className="w-full h-[72px] md:h-16 bg-white md:bg-white/80 rounded-full md:rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] md:shadow-none text-[24px] md:text-2xl px-10 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none border-none md:border md:border-white/50 font-black tracking-[0.5em]" />
                    </div>
                  )}

                  <div className="w-full px-6">
                    <button type="submit" disabled={isLoading} className="w-full h-[72px] md:h-16 bg-[#C4FF4B] md:bg-lime-300 hover:bg-[#B3F23A] md:hover:bg-lime-400 text-black md:text-gray-900 rounded-full md:rounded-2xl text-[20px] md:text-xl font-black shadow-[0_10px_25px_-5px_rgba(196,255,75,0.4)] md:shadow-xl shadow-lime-900/10 md:shadow-lime-300/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70">
                      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="tracking-tight uppercase">{step === 'phone' ? 'Send OTP' : 'Continue'}</span>}
                    </button>
                    {step === 'otp' && (
                      <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="w-full mt-4 text-[13px] md:text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors text-center uppercase tracking-widest">
                        ← Change Phone Number
                      </button>
                    )}
                  </div>

                  {/* Desktop App Badges */}
                  {/* <div className="hidden md:block pt-8 border-t border-gray-100/50 w-full">
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Experience on our App</p>
                    <div className="flex flex-row gap-3 md:gap-4 justify-center items-center">
                      <Image src="/app_store_badge.png" alt="App Store" width={160} height={50} className="h-10 md:h-32 w-auto cursor-pointer object-contain" />
                      <Image src="/google_play_badge.png" alt="Google Play" width={160} height={50} className="h-10 md:h-32 w-auto cursor-pointer object-contain" />
                    </div>
                  </div> */}
                </form>
              </div>
            </motion.div>

            {/* CONTENT SECTION (Desktop Left, Mobile Bottom) */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-1/2 flex flex-col items-center justify-center order-2 lg:order-1 px-4 lg:px-0 mt-3 md:mt-0">
              <div className="grid grid-cols-4 gap-0 w-full mx-auto md:mb-12 px-0 bg-transparent">
                {TRUST_HIGHLIGHTS.map((item, idx) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="flex flex-col items-center justify-start text-center gap-1">
                    <div className="flex-shrink-0 scale-75 sm:scale-100">{item.icon}</div>
                    <p className="text-[8px] sm:text-xs font-bold text-[#1A1A1A] lg:text-gray-500 uppercase tracking-tight leading-none max-w-[70px]">{item.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Product Carousel only */}
              <div className="hidden lg:flex w-full mt-12 pt-10 border-t border-gray-200/60 flex-col gap-6 overflow-hidden">
                <ProductCarousel />
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM: Carousel for mobile */}
        <div className="lg:hidden w-full pt-1 flex-shrink-0 border-none">
          <ProductCarousel />
        </div>
      </div>
    </div>
  );
}
