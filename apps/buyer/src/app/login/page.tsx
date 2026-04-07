'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing/Navbar';
import { useAuth } from '@pharmabag/api-client';
import { useToast } from '@/components/shared/Toast';
import ProductCarousel from '@/components/landing/ProductCarousel';

const TRUST_HIGHLIGHTS = [
  { label: 'STRICTLY AUTHENTIC', icon: <Image src="/authentic_icon.png" alt="S" width={80} height={80} className="w-14 h-14 md:w-20 md:h-20 object-contain" /> },
  { label: 'FASTEST SHIPPING', icon: <Image src="/shipping_icon.png" alt="F" width={80} height={80} className="w-14 h-14 md:w-20 md:h-20 object-contain" /> },
  { label: 'ONLY B2B PRICES', icon: <Image src="/b2b_icon.png" alt="B" width={80} height={80} className="w-14 h-14 md:w-20 md:h-20 object-contain" /> },
  { label: 'SECURE CHECKOUT', icon: <Image src="/secure_checkout_icon.png" alt="Se" width={80} height={80} className="w-14 h-14 md:w-20 md:h-20 object-contain" /> }
];

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { sendOtp, verifyOtp, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push('/products');
  }, [isAuthenticated, authLoading, router]);

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
      router.push('/products');
    } catch (e: any) { toast('Invalid OTP', 'error'); } finally { setIsLoading(false); }
  };

  if (authLoading) return <main className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></main>;

  return (
    <>
      <Navbar />

      <main className="h-screen w-screen overflow-hidden relative bg-[#f8fbfa] flex flex-col items-center">
        <div className="fixed inset-0 bg-gradient-to-b from-[#E0F7FA] to-[#B2EBF2] z-0 md:hidden" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-lime-200/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-sky-200/20 blur-[120px] rounded-full" />
        </div>

        <div className="flex-1 w-full pt-6 pb-32 sm:pt-32 sm:pb-4 px-0 flex flex-col items-center justify-start sm:justify-center relative z-10 overflow-hidden">

          {/* Badges removed per request */}
          <div className="container max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center w-full px-0">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-0 lg:gap-16 xl:gap-24 w-full h-fit px-0">

              {/* FORM SECTION (Desktop Right, Mobile Top) */}
              <motion.div initial={{ opacity: 0, scale: 0.98, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full lg:w-[45%] max-w-lg mx-auto order-1 lg:order-2 px-0 lg:px-0">
                <div className="bg-transparent md:bg-white md:backdrop-blur-3xl md:border md:border-white/60 md:rounded-[48px] p-0 sm:p-4 md:p-10 xl:p-12 md:shadow-2xl md:shadow-lime-900/5 transition-all w-full flex flex-col items-center">

                  <div className="flex flex-col items-center justify-center text-center mb-3 md:mb-10 w-full px-4">
                    <h2 className="text-[36px] md:text-[52px] font-black text-[#1A1A1A] md:text-black mb-0 tracking-tighter leading-none uppercase md:normal-case">Express Login!</h2>
                    <p className="text-[14px] md:text-xl text-[#1A1A1A] md:text-black/50 font-bold uppercase tracking-widest  md:pt-0 mt-1 md:mt-2 text-center">NO SIGNUP REQUIRED</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); step === 'phone' ? handleSendOtp() : handleVerifyOtp(); }} className="space-y-4 md:space-y-8 flex flex-col items-center w-full px-0">
                    {step === 'phone' ? (
                      <div className="space-y-2 w-full flex flex-col items-center px-6">
                        <label className="block text-[11px] md:text-xs font-bold text-[#999999] md:text-gray-400 uppercase tracking-[0.2em] text-center mb-0">PHONE NUMBER</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="00000 00000" autoFocus className="w-full h-[72px] md:h-16 bg-white md:bg-white/80 rounded-full md:rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] md:shadow-none text-[22px] md:text-2xl px-6 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none border border-white/50 font-black" />
                      </div>
                    ) : (
                      <div className="space-y-2 w-full flex flex-col items-center px-6">
                        <label className="block text-[11px] md:text-xs font-bold text-[#999999] md:text-gray-400 uppercase tracking-[0.2em] text-center mb-0">ENTER CODE</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" maxLength={6} autoFocus className="w-full h-[72px] md:h-16 bg-white md:bg-white/80 rounded-full md:rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] md:shadow-none text-[24px] md:text-2xl px-6 text-center focus:ring-4 focus:ring-lime-300 focus:bg-white outline-none border border-white/50 font-black tracking-[0.5em]" />
                      </div>
                    )}

                    <div className="w-full px-6 pt-1">
                      <button type="submit" disabled={isLoading} className="w-full h-[72px] md:h-16 bg-[#C4FF4B] md:bg-lime-300 hover:bg-[#B3F23A] md:hover:bg-lime-400 text-black md:text-gray-900 rounded-full md:rounded-2xl text-[20px] md:text-xl font-black shadow-[0_10px_25px_-5px_rgba(196,255,75,0.4)] md:shadow-xl shadow-lime-300/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="tracking-tight uppercase">{step === 'phone' ? 'Send OTP' : 'Continue'}</span>}
                      </button>

                      <div className="mt-6 flex flex-col items-center gap-4">
                        <a
                          href="https://seller.pharmabag.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 bg-white/40 hover:bg-white/60 p-4 rounded-3xl border border-white/60 transition-all hover:scale-[1.02] shadow-sm w-full"
                        >
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Business Owner?</span>
                          <span className="text-sm font-black text-gray-900 flex items-center gap-2">
                            Become a Seller <span className="text-lime-600 group-hover:translate-x-1 transition-transform">→</span>
                          </span>
                        </a>
                      </div>

                      {step === 'otp' && (
                        <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="w-full mt-4 text-[13px] md:text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors text-center uppercase tracking-widest">
                          ← Change Phone Number
                        </button>
                      )}
                    </div>

                    {/* Badges removed from desktop per request */}
                  </form>
                </div>
              </motion.div>

              {/* CONTENT SECTION (Desktop Left, Mobile Bottom) */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:flex-1 flex flex-col items-center justify-center order-2 lg:order-1 px-0 mt-3 md:mt-0">
                <div className="grid grid-cols-4 gap-0 w-full mx-auto md:mb-12 px-0 bg-transparent">
                  {TRUST_HIGHLIGHTS.map((item, idx) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="flex flex-col items-center justify-start text-center gap-1">
                      <div className="flex-shrink-0 scale-75 sm:scale-100">{item.icon}</div>
                      <p className="text-[8px] sm:text-xs font-bold text-gray-500 uppercase tracking-tight leading-none max-w-[70px]">{item.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="hidden lg:block w-full border-t border-gray-200/40 pt-10">
                  <ProductCarousel />
                </div>
              </motion.div>
            </div>
          </div>

          {/* BOTTOM CAROUSEL MOBILE */}
          <div className="lg:hidden w-full pt-1 flex-shrink-0 border-none pb-4">
            <ProductCarousel />
          </div>
        </div>
      </main>
    </>
  );
}
